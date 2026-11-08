"""Rolling-origin backtest of IJO PLIS's exact Prophet config (apps/predictor/services.py train_prophet)
vs a naive last-value forecast. Data: same source and 10-year window as the app (Yahoo Finance)."""
import logging, json
import pandas as pd, yfinance as yf
from prophet import Prophet

logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
logging.getLogger("prophet").setLevel(logging.ERROR)

def load(t):
    d = yf.Ticker(t).history(start="2016-06-01", end="2026-06-01").reset_index()
    d["ds"] = pd.to_datetime(d["Date"]).dt.tz_localize(None).dt.normalize()
    return d.rename(columns={"Close": "y"})[["ds", "y"]].dropna().sort_values("ds").reset_index(drop=True)

def fit(df):
    m = Prophet(growth="linear", seasonality_mode="multiplicative", yearly_seasonality=True,
                weekly_seasonality=True, daily_seasonality=False, changepoint_prior_scale=0.05)
    m.add_country_holidays(country_name="ID")
    m.fit(df)
    return m

H = [7, 30, 90]  # calendar days, as in the app
out = {}
for t in ["^JKSE", "IDR=X"]:
    df = load(t)
    cutoffs = pd.date_range("2024-06-01", "2026-02-01", freq="2MS")  # 11 origins, last leaves 90d of truth
    rows = []
    for c in cutoffs:
        train = df[df.ds < c]
        m = fit(train)
        last = train.y.iloc[-1]
        test = df[(df.ds >= c) & (df.ds < c + pd.Timedelta(days=max(H)))]
        fc = m.predict(test[["ds"]]).set_index("ds")["yhat"]
        for _, r in test.iterrows():
            h = (r.ds - c).days + 1
            rows.append({"h": h, "y": r.y, "prophet": fc.loc[r.ds], "naive": last})
    e = pd.DataFrame(rows)
    res = {}
    for hz in H:
        s = e[e.h <= hz]
        res[hz] = {k: round(float(((s[k] - s.y).abs() / s.y).mean() * 100), 2) for k in ["prophet", "naive"]}
        res[hz].update({f"{k}_mae": round(float((s[k] - s.y).abs().mean()), 1) for k in ["prophet", "naive"]})
    out[t] = res
    print(t, json.dumps(res))
json.dump(out, open("backtest_ijo.json", "w"), indent=1)

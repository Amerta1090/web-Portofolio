"""Deterministic CV judge. Usage: judge.py <cv.pdf>
Scores 0-10 on fixed, reproducible rules (no LLM opinion)."""
import re, sys, json
import pdfplumber, textstat
import language_tool_python

pdf = sys.argv[1]
with pdfplumber.open(pdf) as d:
    pages = len(d.pages)
    text = "\n".join(p.extract_text() or "" for p in d.pages)
    words_px = sum(len(p.extract_words()) for p in d.pages)
    fonts = {c["fontname"] for p in d.pages for c in p.chars}
    images = sum(len(p.images) for p in d.pages)

flat = re.sub(r"\s+", " ", text)
low = flat.lower()
res, notes = {}, []

def score(name, val, mx, note=""):
    res[name] = (round(val, 2), mx)
    if note: notes.append(f"{name}: {note}")

# 1. ATS parse: contact fields extractable as text (2 pts)
contact = {
    "email": bool(re.search(r"[\w.]+@[\w.]+\.\w+", flat)),
    "phone": bool(re.search(r"\+?\d[\d \-]{9,}", flat)),
    "linkedin": "linkedin.com/in/" in low,
    "github": "github.com/" in low,
    "name": "abdul majid" in low,
}
score("ats_contact", 2 * sum(contact.values()) / len(contact), 2,
      ", ".join(k for k, v in contact.items() if not v) and "missing " + ", ".join(k for k, v in contact.items() if not v))

# 2. Standard section headings, in parse order (1.5)
heads = ["summary", "experience", "projects", "skills", "education"]
lines=[l.strip().lower() for l in text.splitlines()]
found = [any(l==h or (l.endswith(h) and len(l)<=len(h)+14) for l in lines) for h in heads]
score("ats_sections", 1.5 * sum(found) / len(heads), 1.5,
      "missing " + ",".join(h for h, f in zip(heads, found) if not f) if not all(found) else "")
score("ats_layout", (1 if images == 0 else 0) + (0.5 if pages <= 2 else 0), 1.5,
      f"pages={pages} images={images}")

# 3. Bullets quality (3 pts)
bullets = [b.strip() for b in re.split(r"\n\s*[•▸\-–]\s+|\n•", "\n" + text) if b.strip()][1:]
bullets = [re.sub(r"\s+", " ", b.split("\n")[0] if len(b) > 400 else b) for b in bullets]
weak = re.compile(r"^(responsible|assisted|helped|worked on|participated|involved|tasked|duties)", re.I)
pronoun = re.compile(r"\b(I|me|my|we|our)\b")
n = max(len(bullets), 1)
metric = re.compile(r"(\d[\d,.]*\s*(%|k\b|m\b|s\b|x\b|ms|gb|\+))|\b0\.\d+|\b\d{1,3}(,\d{3})+|\b(?!19|20)\d{2,4}\b|\b\d\b", re.I)
num = sum(bool(metric.search(re.sub(r"\b(19|20)\d{2}\b","",b))) for b in bullets) / n
weak_r = sum(bool(weak.match(b)) for b in bullets) / n
pron_r = sum(bool(pronoun.search(b)) for b in bullets) / n
lens = [len(b.split()) for b in bullets]
len_ok = sum(8 <= l <= 32 for l in lens) / n
score("bullet_quant", 1.2 * min(num / 0.5, 1), 1.2, f"{num:.0%} bullets carry a number (target >=50%)")
score("bullet_strength", 0.8 * (1 - weak_r) * (1 - pron_r), 0.8, f"weak={weak_r:.0%} pronoun={pron_r:.0%}")
score("bullet_length", 1.0 * len_ok, 1.0, f"{len_ok:.0%} bullets 8-32 words; n={len(bullets)}")

# 4. Language (1.5): LanguageTool errors per 100 words, excluding spelling of proper nouns
tool = language_tool_python.LanguageTool("en-US", language_tool_download_version="6.6")
matches = [m for m in tool.check(flat) if m.rule_issue_type != "misspelling"
           and m.rule_id not in ("WHITESPACE_RULE", "UPPERCASE_SENTENCE_START", "COMMA_PARENTHESIS_WHITESPACE",
                                 "EN_QUOTES", "DASH_RULE", "PUNCTUATION_PARAGRAPH_END")]
wc = len(flat.split())
rate = 100 * len(matches) / wc
score("grammar", 1.5 * max(0, 1 - rate / 2), 1.5, f"{len(matches)} issues / {wc} words: " +
      "; ".join(f"{m.rule_id}:'{flat[m.offset:m.offset+m.error_length]}'" for m in matches[:8]))

# 5. Keyword coverage for Full-Stack AI Engineer (1.5)
kw = ["python", "django", "fastapi", "react", "typescript", "postgresql", "docker", "linux", "ci/cd",
      "machine learning", "llm", "rag", "nlp", "tensorflow", "scikit-learn", "mlflow", "prometheus",
      "erp", "automation", "api", "sql", "time series", "recommend", "deploy", "monitoring", "git"]
hit = [k for k in kw if k in low]
score("keywords", 1.5 * min(len(hit) / (0.85 * len(kw)), 1), 1.5,
      "missing: " + ", ".join(k for k in kw if k not in hit))

# 6. Density / length (1)
score("length", 1.0 if pages == 1 and 380 <= wc <= 700 else 0.5 if pages <= 2 else 0, 1.0, f"{wc} words")

total = sum(v for v, _ in res.values())
mx = sum(m for _, m in res.values())
out = {"score_10": round(10 * total / mx, 2), "parts": res, "notes": notes,
       "flesch": textstat.flesch_reading_ease(flat), "fonts": sorted(fonts)[:6],
       "bullets": len(bullets)}
print(json.dumps(out, indent=1, ensure_ascii=False))

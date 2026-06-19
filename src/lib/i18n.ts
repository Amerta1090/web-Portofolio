import en from "./locales/en.json";

const locales: Record<string, Record<string, unknown>> = { en };

export type Locale = keyof typeof locales;

export function t(path: string, locale: Locale = "en"): string {
  const keys = path.split(".");
  let value: unknown = locales[locale];
  for (const key of keys) {
    if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
}

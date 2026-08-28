import { describe, it, expect } from "vitest";
import { getFaq } from "./data";

describe("getFaq", () => {
  it("returns all faq items", () => {
    const faq = getFaq();
    expect(faq.length).toBeGreaterThanOrEqual(14);
  });

  it("each item has required fields", () => {
    for (const item of getFaq()) {
      expect(item.id).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(Array.isArray(item.keywords)).toBe(true);
      expect(item.keywords.length).toBeGreaterThan(0);
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    }
  });

  it("ids are unique", () => {
    const ids = getFaq().map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("answers reference real data facts (skills count, cert count)", () => {
    const answers = getFaq()
      .map((f) => f.answer)
      .join(" ");

    expect(answers).toMatch(/Abdul Majid Ridwan Tyastonoatmaja/);
    expect(answers).toMatch(/54/);
    expect(answers).toMatch(/Tulungagung/);
    expect(answers).toMatch(/abdulmajidr708@gmail\.com/);
  });
});

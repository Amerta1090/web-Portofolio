import { describe, it, expect } from "vitest";
import { getFaq, buildFaqLd } from "./data";

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

describe("buildFaqLd", () => {
  it("returns a valid FAQPage JSON-LD shape", () => {
    const ld = buildFaqLd();
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(Array.isArray(ld.mainEntity)).toBe(true);
    expect(ld.mainEntity.length).toBe(getFaq().length);
  });

  it("maps every FAQ item to Question/AcceptedAnswer deterministically", () => {
    const ld = buildFaqLd();
    const faq = getFaq();
    ld.mainEntity.forEach((q, i) => {
      expect(q["@type"]).toBe("Question");
      expect(q.name).toBe(faq[i].question);
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
      expect(q.acceptedAnswer.text).toBe(faq[i].answer);
    });
  });

  it("is JSON-serializable (no circular refs)", () => {
    expect(() => JSON.stringify(buildFaqLd())).not.toThrow();
  });
});

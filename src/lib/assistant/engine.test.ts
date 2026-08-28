import { describe, it, expect } from "vitest";
import { respond, type AssistantResponse } from "./engine";

describe("respond — help", () => {
  it("returns help type for 'help'", () => {
    const r = respond("help");
    expect(r.type).toBe("help");
    expect(r.text).toMatch(/skill|proyek|pengalaman/i);
  });

  it("returns help for 'bantuan'", () => {
    expect(respond("bantuan").type).toBe("help");
  });
});

describe("respond — greeting", () => {
  it("detects greeting words", () => {
    for (const g of ["halo", "hello", "hi", "selamat pagi"]) {
      const r = respond(g);
      expect(r.type).toBe("greeting");
      expect(r.text).toBeTruthy();
    }
  });
});

describe("respond — special data commands", () => {
  it("whoami pulls from profile data", () => {
    const r = respond("whoami");
    expect(r.type).toBe("intent");
    expect(r.text).toMatch(/Abdul Majid Ridwan Tyastonoatmaja/);
    expect(r.text).toMatch(/AI\/ML Engineer/);
  });

  it("skill replies with categories", () => {
    const r = respond("skill");
    expect(r.type).toBe("intent");
    expect(r.text).toMatch(/Machine Learning/);
  });

  it("proyek replies with project list", () => {
    const r = respond("proyek");
    expect(r.type).toBe("intent");
    expect(r.text).toMatch(/proyek/i);
  });

  it("kontak replies with contact info", () => {
    const r = respond("kontak");
    expect(r.text).toMatch(/abdulmajidr708@gmail\.com/);
  });
});

describe("respond — FAQ intent engine", () => {
  it("maps natural language to a faq-backed intent", () => {
    const r = respond("apa skill kamu?");
    expect(r.type).toBe("intent");
    expect(r.payload?.intentId).toBeTruthy();
  });

  it("answers location question from faq", () => {
    const r = respond("di mana kamu tinggal?");
    expect(r.text).toMatch(/Tulungagung/);
  });

  it("answers contact question from faq", () => {
    const r = respond("gimana caranya kontak kamu?");
    expect(r.text).toMatch(/abdulmajidr708@gmail\.com/);
    expect(r.payload?.faqId).toBeTruthy();
  });
});

describe("respond — ELIZA fallback", () => {
  it("falls back to eliza for unknown input", () => {
    const r = respond("xyzzy plugh frobnicate");
    expect(r.type).toBe("eliza");
    // Never fabricates; the fallback asks for clarification or reflects.
    expect(r.text.length).toBeGreaterThan(0);
  });

  it("eliza never returns on topic-fabrication", () => {
    const r = respond("what is the meaning of life");
    expect(r.type).toBe("eliza");
  });

  it("empty input handled gracefully", () => {
    const r = respond("   ");
    expect(r.text.length).toBeGreaterThan(0);
  });
});

describe("respond — determinism", () => {
  it("same input yields same output", () => {
    expect(respond("halo")).toEqual(respond("halo"));
    expect(respond("apa skill kamu?")).toEqual(respond("apa skill kamu?"));
    expect(respond("xyzzy")).toEqual(respond("xyzzy"));
    expect(respond("help")).toEqual(respond("help"));
  });

  it("returns the expected response shape", () => {
    const r = respond("halo") as AssistantResponse;
    expect(["greeting", "help", "intent", "faq", "eliza"]).toContain(r.type);
    expect(typeof r.text).toBe("string");
  });
});

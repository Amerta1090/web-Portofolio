import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf-8");

/**
 * M4.8 (hapus-fetch): star history dihapus total — data 12/12 kosong,
 * runtime selalu `{}`, cost ±5 req/build tak pernah ter-cache, dan fetch
 * dekoratif bisa menggagalkan build (`process.exit(1)`). Kuncian disengaja:
 * mengembalikan fetch harus menyentuh file test ini dengan sengaja
 * (kontrak sama seperti `ml-metrics.removed.test.ts`).
 */
describe("star history removed (M4.8)", () => {
  it("src/lib/github.ts has no star-history fetch left", () => {
    const src = read("src/lib/github.ts");
    expect(src).not.toContain("fetchStarHistory");
    expect(src).not.toContain("StarHistory");
    expect(src).not.toContain("star_history");
    // Precise: the stargazers *endpoint* + starred_at aggregation. The
    // `stargazers_count` API field (star totals) legitimately stays.
    expect(src).not.toContain("stargazers?");
    expect(src).not.toContain("starred_at");
  });

  it("src/types/github.ts has no StarHistory type left", () => {
    const src = read("src/types/github.ts");
    expect(src).not.toContain("StarHistory");
    expect(src).not.toContain("star_history");
  });

  it("scripts/fetch-data.mjs has no star-history block left", () => {
    const src = read("scripts/fetch-data.mjs");
    expect(src).not.toContain("star-history-");
    expect(src).not.toContain("stargazers?");
    expect(src).not.toContain("starred_at");
    expect(src).not.toContain("star+json");
  });
});

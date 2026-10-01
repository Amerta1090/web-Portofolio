import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../data");

const schemas = {
  "profile.json": {
    required: ["name", "headline", "tagline", "location", "contact", "summary", "metrics"],
    types: {
      name: "string",
      headline: "string",
      tagline: "string",
      location: "string",
      contact: "object",
      summary: "string",
      metrics: "object",
    },
  },
  "experience.json": {
    requiredItems: ["id", "company", "role", "start_date", "highlights"],
  },
  "projects.json": {
    requiredNested: ["title", "description"],
    requiredPeriod: true,
  },
  "skills.json": {
    requiredNested: ["categories"],
  },
  "certifications.json": {
    requiredItems: ["title", "issuer"],
  },
  "faq.json": {
    requiredItems: ["id", "category", "keywords", "question", "answer"],
  },
  "capability-grammars.json": {
    grammarSymbols: ["capability", "project_blurb", "fact"],
  },
};

let errors = 0;

for (const [file, schema] of Object.entries(schemas)) {
  const path = resolve(dataDir, file);
  if (!existsSync(path)) {
    console.error(`ERROR: ${file} not found`);
    errors++;
    continue;
  }

  const raw = readFileSync(path, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error(`ERROR: ${file} is not valid JSON`);
    errors++;
    continue;
  }

  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        console.error(`ERROR: ${file} missing required field "${field}"`);
        errors++;
      }
    }
  }

  // Task 0.2.2: Assert profile.json must NOT have deprecated metrics fields
  if (file === "profile.json" && data.metrics) {
    if ("projects_shipped" in data.metrics) {
      console.error(`ERROR: ${file} metrics.projects_shipped is deprecated (use SiteFacts)`);
      errors++;
    }
    if ("certifications" in data.metrics) {
      console.error(`ERROR: ${file} metrics.certifications is deprecated (use SiteFacts)`);
      errors++;
    }
  }

  if (schema.requiredItems && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      for (const field of schema.requiredItems) {
        if (!(field in data[i])) {
          console.error(`ERROR: ${file}[${i}] missing required field "${field}"`);
          errors++;
        }
      }
    }
  }

  if (schema.requiredNested) {
    const items = data.projects || data.categories || [];
    if (!Array.isArray(items)) continue;
  }

  if (schema.requiredPeriod) {
    const items = data.projects || [];
    const token = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
    const dash = /(?:–|—|-)/;
    for (let i = 0; i < items.length; i++) {
      const period = items[i].period;
      if (typeof period !== "string") {
        console.error(`ERROR: projects.json[${i}] period must be a string`);
        errors++;
        continue;
      }
      const parts = period.split(dash).map((s) => s.trim());
      if (parts.length !== 2) {
        console.error(
          `ERROR: projects.json[${i}] period "${period}" is not "Mon YYYY – Mon YYYY"`,
        );
        errors++;
        continue;
      }
      const [start, end] = parts;
      const endOk = end === "Present" || end === "Now" || token.test(end);
      if (!token.test(start) || !endOk) {
        console.error(`ERROR: projects.json[${i}] period "${period}" has invalid month/year token`);
        errors++;
      }
    }
  }

  if (schema.grammarSymbols) {
    for (const symbol of schema.grammarSymbols) {
      const value = data[symbol];
      if (value === undefined) {
        console.error(`ERROR: ${file} missing grammar symbol "${symbol}"`);
        errors++;
        continue;
      }
      const expansions = Array.isArray(value) ? value : [value];
      const valid =
        expansions.length > 0 && expansions.every((e) => typeof e === "string" && e.length > 0);
      if (!valid) {
        console.error(
          `ERROR: ${file} symbol "${symbol}" must be a non-empty string or array of non-empty strings`,
        );
        errors++;
      }
    }
  }

}

/**
 * M0.2.3 — `testimonials.json` must not be populated.
 *
 * The task tests were fabricated identities of real politicians (PRD §3.1 C1),
 * so the JSON-LD on every page published them as `Review`s. Until Task 0.3
 * deletes the file, the gate keeps the data honest: absent or empty passes, and
 * any entry fails the build. Note this check lives *outside* the loop above on
 * purpose — `testimonials.json` is not in `schemas`, so an in-loop branch would
 * never run and would look like it was guarding something.
 */
const testimonialsPath = resolve(dataDir, "testimonials.json");
if (existsSync(testimonialsPath)) {
  const testimonials = JSON.parse(readFileSync(testimonialsPath, "utf-8"));
  if (!Array.isArray(testimonials)) {
    console.error("ERROR: testimonials.json must be an array if present");
    errors++;
  } else if (testimonials.length > 0) {
    console.error(
      `ERROR: testimonials.json holds ${testimonials.length} fabricated entr(y|ies) — it must be empty or absent`,
    );
    errors++;
  }
}

/**
 * M0.2.4 — `ml-metrics.ts` must not generate numbers with `Math.random()`.
 *
 * The project pages rendered loss curves, confusion matrices and accuracy
 * figures produced by random weights (PRD §3.1 C2). Determinism is a standing
 * rule, and this is the file where it was broken, so the gate lives with the
 * validator rather than in a test — a random number in a shipped page is a
 * build failure, not a failing assertion someone might skip.
 *
 * Absent file passes: Task 0.4 removes it, and `getMLMetrics` was already the
 * only reason it existed.
 */
const mlMetricsPath = resolve(__dirname, "../src/lib/ml-metrics.ts");
if (existsSync(mlMetricsPath)) {
  const source = readFileSync(mlMetricsPath, "utf-8");
  if (source.includes("Math.random")) {
    console.error("ERROR: src/lib/ml-metrics.ts must not contain Math.random");
    errors++;
  }
}

/**
 * M0.2.5 — counts written in prose must equal the real dataset.
 *
 * `profile.json` used to assert 18 projects and 54 certifications while the
 * datasets held 22 and 62. Those two fields are now rejected outright above, so
 * the remaining drift vector is a count typed into a sentence:
 * `capability-grammars.json` claims "22 public projects" and `faq.json` claimed
 * "Total 18 project ter.Shipping". Nothing re-derives those numbers, so nothing
 * warned when they stopped matching.
 *
 * The fix is to count the datasets and check every `<n> project(s)` /
 * `<n> certification(s)` phrase found in `data/*.json` against it. Reading the
 * claim out of the prose is what makes this a gate rather than a lint: delete a
 * project from `projects.json` and the build fails on the sentence that still
 * says 22.
 */
const realCounts = {
  projects: JSON.parse(readFileSync(resolve(dataDir, "projects.json"), "utf-8")).projects.length,
  certifications: JSON.parse(readFileSync(resolve(dataDir, "certifications.json"), "utf-8")).length,
};

/**
 * Both languages on purpose. The prose in these files is mixed, and the first
 * version of this gate only matched English — so it flagged `18 project` in
 * `faq.json` while missing `54 sertifikasi` two entries above it, which was the
 * same stale figure in the same file. A gate that only reads half the language
 * is worse than none, because it looks like coverage.
 */
const COUNT_CLAIMS = [
  { pattern: /\b(\d+)\s+(?:public\s+)?projects?\b/gi, key: "projects" },
  { pattern: /\b(\d+)\s+proyek\b/gi, key: "projects" },
  { pattern: /\b(\d+)\s+certifications?\b/gi, key: "certifications" },
  { pattern: /\b(\d+)\s+sertifikasi\b/gi, key: "certifications" },
];

for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  const source = readFileSync(resolve(dataDir, file), "utf-8");
  for (const { pattern, key } of COUNT_CLAIMS) {
    const actual = realCounts[key];
    const singular = key === "certifications" ? "certification" : "project";
    // Reported once per pattern per file with every offending number listed: the
    // same stale figure is usually typed into several answers, and three copies
    // of one problem should not read as three problems.
    const stale = [...source.matchAll(pattern)]
      .map((m) => Number(m[1]))
      .filter((claimed) => claimed !== actual);
    if (stale.length > 0) {
      console.error(
        `ERROR: ${file} claims ${stale.length} stale ${singular} count(s) ${stale.join(", ")} — the dataset holds ${actual}`,
      );
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\nFAILED: ${errors} validation error(s) found`);
  process.exit(1);
} else {
  console.log("OK: All data files validated");
}

if (errors > 0) {
  console.error(`\nFAILED: ${errors} validation error(s) found`);
  process.exit(1);
} else {
  console.log("OK: All data files validated");
}

import { existsSync, readFileSync } from "node:fs";
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

if (errors > 0) {
  console.error(`\nFAILED: ${errors} validation error(s) found`);
  process.exit(1);
} else {
  console.log("OK: All data files validated");
}

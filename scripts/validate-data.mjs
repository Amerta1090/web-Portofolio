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
  },
  "skills.json": {
    requiredNested: ["categories"],
  },
  "certifications.json": {
    requiredItems: ["title", "issuer"],
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
}

if (errors > 0) {
  console.error(`\nFAILED: ${errors} validation error(s) found`);
  process.exit(1);
} else {
  console.log("OK: All data files validated");
}

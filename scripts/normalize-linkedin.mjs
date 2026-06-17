import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../data");

function normalizeProfile(raw) {
  const info = raw.personal_information || raw;
  return {
    name: info.full_name || info.name || "",
    headline: info.headline || "",
    tagline: "",
    location: info.location?.address || info.location || "",
    timezone: "Asia/Jakarta",
    contact: {
      email: info.contact?.email || "",
      phone: info.contact?.phone || "",
      linkedin: info.contact?.linkedin
        ? `https://linkedin.com/in/${info.contact.linkedin.replace(/.*linkedin\.com\/in\//, "")}`
        : "",
      github: info.contact?.github || "",
      website: null,
    },
    summary: info.summary || "",
    metrics: {
      years_experience: 0,
      projects_shipped: 0,
      certifications: (raw.certifications || []).length,
      languages: (raw.skills?.languages || []).map((l) => l.language),
    },
    resume_url: "/resume.pdf",
  };
}

function normalizeExperience(raw) {
  const experiences = raw.experience || [];
  return experiences.map((exp, i) => ({
    id: `exp-${i}`,
    company: exp.company || "",
    role: exp.role || "",
    type: "full-time",
    start_date: parsePeriod(exp.period)[0] || "",
    end_date: parsePeriod(exp.period)[1] || null,
    location: exp.location || "",
    highlights: exp.description ? [exp.description] : [],
    technologies: [],
    url: null,
  }));
}

function parsePeriod(period) {
  if (!period) return ["", ""];
  const parts = period.split(" - ");
  return [
    parts[0]?.trim() || "",
    parts[1]
      ?.trim()
      ?.replace(/\(.*\)/, "")
      .trim() || "",
  ];
}

async function main() {
  const inputPath = resolve(dataDir, "linkedin-export.json");
  if (!existsSync(inputPath)) {
    console.log("No LinkedIn export found at data/linkedin-export.json");
    console.log("Skipping normalization — no input file.");
    return;
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf-8"));

  const profile = normalizeProfile(raw);
  writeFileSync(resolve(dataDir, "profile.json"), JSON.stringify(profile, null, 2));
  console.log("Written: data/profile.json");

  const experience = normalizeExperience(raw);
  writeFileSync(resolve(dataDir, "experience.json"), JSON.stringify(experience, null, 2));
  console.log("Written: data/experience.json");
}

main().catch(console.error);

import { matchIntent, intentsFromFaq, type IntentMatch } from "./intentEngine";
import { elizaRespond } from "./eliza";
import { getFaq, getProfile, getSkills, getProjects, getFeaturedProjects, getExperience, getCertifications } from "../data";
import type { FaqItem } from "../../types/faq";

export type ResponseType = "greeting" | "help" | "intent" | "faq" | "eliza";

export interface AssistantResponse {
  type: ResponseType;
  text: string;
  payload?: {
    intentId?: string;
    faqId?: string;
    chips?: string[];
  };
}

/** Normalize raw user input for command detection. */
function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[.!?]+$/g, "");
}

const GREETING_WORDS = ["halo", "hello", "hai", "hi", "assalamualaikum", "selamat pagi", "selamat siang", "selamat malam", "morning", "evening", "pagi", "hay"];

const GREETING_RESPONSES = [
  "Halo! 👋 Aku assistant deterministik di portofolio Abdul — tanpa LLM, tanpa backend. Tanya soal skill, proyek, pengalaman, atau ketik 'help'.",
  "Hai! Ada yang bisa kubantu? Aku paling paham soal skill, proyek, dan pengalaman di portofolio ini.",
];

const HELP_TEXT =
  "Aku bisa bantu soal:\n• Skill & stack — ketik 'skill'\n• Proyek — ketik 'proyek'\n• Pengalaman kerja — ketik 'pengalaman'\n• Sertifikasi — ketik 'sertifikasi'\n• Kontak — ketik 'kontak'\n• Lokasi — ketik 'lokasi'\n• Tentangku umum — ketik 'whoami'\nAku deterministik: tidak ada AI sungguhan, semua pola + data di bundle. Klik 'Buka Engine' untuk melihat mekanismenya.";

function buildWhoAmI(): string {
  const profile = getProfile();
  const skills = getSkills().categories.flatMap((c) => c.skills);
  const topSkills = skills
    .slice()
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 6)
    .map((s) => s.name);
  const featuredProjects = getFeaturedProjects()
    .slice(0, 3)
    .map((p) => p.title);
  const certCount = getCertifications().length;
  return [
    `Aku **${profile.name}** — ${profile.headline}.`,
    `Lokasi: ${profile.location}.`,
    `Keahlian inti: ${topSkills.join(", ")}.`,
    `Proyek unggulan: ${featuredProjects.join("; ")}.`,
    `${certCount} sertifikasi & ${getExperience().length} pengalaman kerja.`,
    "Semua data diambil dari bundle build — deterministik, no AI palsu.",
  ].join("\n");
}

function formatList(items: string[], label?: string): string {
  const body = items.map((s) => `• ${s}`).join("\n");
  return label ? `${label}\n${body}` : body;
}

function buildSkillsReply(): string {
  const cats = getSkills().categories;
  const lines = cats.map(
    (c) => `**${c.name}**: ${c.skills.map((s) => `${s.name} (${s.proficiency}/5)`).join(", ")}`,
  );
  return formatList(lines, "Kemampuan:");
}

function buildProjectsReply(): string {
  const projects = getProjects().slice(0, 8);
  return formatList(
    projects.map((p) => `${p.title}${p.featured ? " ⭐" : ""} — ${p.period}`),
    "Proyek:",
  );
}

function buildExperienceReply(): string {
  const exp = getExperience();
  return formatList(
    exp.map(
      (e) => `${e.role} @ ${e.company} (${e.start_date} – ${e.end_date || "Present"})`,
    ),
    "Pengalaman:",
  );
}

function buildCertificationsReply(): string {
  const certs = getCertifications().slice(0, 10);
  return formatList(certs.map((c) => `${c.title} — ${c.issuer}`), "Sertifikasi:");
}

function buildContactsReply(): string {
  const profile = getProfile();
  const c = profile.contact;
  return [
    "Kontak:",
    `• Email: ${c.email}`,
    `• Phone: ${c.phone}`,
    `• LinkedIn: ${c.linkedin}`,
    `• GitHub: ${c.github}`,
  ].join("\n");
}

/**
 * Handle the "whoami" / "proyek" / "skill" special commands that pull from the
 * data layer. Returns a response or null if not a special command.
 */
function handleSpecialCommand(input: string): AssistantResponse | null {
  if (/^(whoami|siapa kamu|about me|tentang saya)$/.test(input)) {
    return { type: "intent", text: buildWhoAmI() };
  }
  if (/^(skill|skills|stack|teknologi|kemampuan|keahlian)$/.test(input)) {
    return { type: "intent", text: buildSkillsReply() };
  }
  if (/^(proyek|project|projects)$/.test(input)) {
    return { type: "intent", text: buildProjectsReply() };
  }
  if (/^(pengalaman|experience|karier|karir)$/.test(input)) {
    return { type: "intent", text: buildExperienceReply() };
  }
  if (/^(sertifikasi|sertifikat|certification|certifications|sertifikat)$/.test(input)) {
    return { type: "intent", text: buildCertificationsReply() };
  }
  if (/^(kontak|contact|email|hubungi|telepon)$/.test(input)) {
    return { type: "intent", text: buildContactsReply() };
  }
  return null;
}

/**
 * Main deterministic assistant engine.
 * Order: special commands → greeting → intent → faq → eliza.
 */
export function respond(input: string): AssistantResponse {
  const normalized = normalize(input);

  if (normalized.length === 0) {
    return { type: "eliza", text: "Kamu belum mengetik apa-apa. Ada yang bisa kubantu?" };
  }

  // 1. Help command
  if (/^(help|bantuan|tolong|halp)$/.test(normalized)) {
    return { type: "help", text: HELP_TEXT };
  }

  const faq = getFaq();
  const intents = intentsFromFaq(faq);

  // 2. Special data-layer commands (exact phrased triggers, most specific first)
  const special = handleSpecialCommand(normalized);
  if (special) return special;

  // 3. Greeting
  if (GREETING_WORDS.some((w) => normalized.startsWith(w))) {
    return { type: "greeting", text: GREETING_RESPONSES[hashIndex(normalized, GREETING_RESPONSES.length)] };
  }

  // 4. Intent engine against FAQ knowledge base
  const match: IntentMatch | null = matchIntent(normalized, intents);
  if (match) {
    const item = faq.find((f) => f.id === match.intent.id);
    if (item) {
      return {
        type: "intent" as const,
        text: item.answer,
        payload: { intentId: item.id, faqId: item.id },
      };
    }
  }

  // 5. ELIZA fallback (no invented facts)
  const elizaText = elizaRespond(normalized);
  // ELIZA may echo the reflected remainder; ensure it never fabricates.
  return { type: "eliza", text: elizaText };
}

function hashIndex(str: string, max: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % max;
}

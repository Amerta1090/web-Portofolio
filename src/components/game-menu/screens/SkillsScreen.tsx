import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  Cloud,
  Code2,
  Container,
  Cpu,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import skillsData from "../../../../data/skills.json";

const ICON_CLASS = "w-[1em] h-[1em] inline-block align-middle";

const categoryIcons: Record<string, React.ReactNode> = {
  "Machine Learning & AI": <BrainCircuit className={ICON_CLASS} />,
  "Data Science & Analytics": <BarChart3 className={ICON_CLASS} />,
  "Web Development": <Code2 className={ICON_CLASS} />,
  "IoT & Embedded Systems": <Cpu className={ICON_CLASS} />,
  "DevOps & MLOps": <Container className={ICON_CLASS} />,
  "Programming Languages": <Code2 className={ICON_CLASS} />,
  "Cloud & Infrastructure": <Cloud className={ICON_CLASS} />,
  "Productivity & Automation": <Zap className={ICON_CLASS} />,
};

export const SkillsScreen: React.FC = () => {
  const data = skillsData as any;
  const categories = data?.categories || [];
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = categories[activeCategory];
  const allSkills = categories.flatMap((c: any) =>
    (c.skills || []).map((s: any) => ({ ...s, category: c.name })),
  );
  const searchedSkills = searchQuery
    ? allSkills.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const displaySkills = searchedSkills || currentCategory?.skills || [];

  return (
    <div className="w-full h-full px-16 py-8 relative overflow-y-auto">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="text-xs text-text-secondary">Abilities / Skills</span>
      </motion.div>

      <motion.div
        className="flex flex-wrap gap-1.5 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {categories.map((cat: any, idx: number) => (
          <button
            key={cat.name}
            className={`text-xs px-3 py-1.5 rounded border transition-all ${
              activeCategory === idx && !searchQuery
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-text-secondary hover:border-brand/30"
            }`}
            onClick={() => {
              setActiveCategory(idx);
              setSearchQuery("");
            }}
          >
            <span className="flex items-center gap-1">{categoryIcons[cat.name]} {cat.name}</span>
          </button>
        ))}
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
      >
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand transition-colors"
        />
      </motion.div>

      {!searchQuery && currentCategory && (
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-brand text-xl flex items-center">{categoryIcons[currentCategory.name]}</span>
          <span className="text-xl font-semibold text-text-primary">{currentCategory.name}</span>
          <span className="text-xs text-text-secondary/50">{currentCategory.skills?.length || 0} skills</span>
        </motion.div>
      )}

      {searchQuery && (
        <motion.div className="text-xs text-text-secondary/60 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Found {searchedSkills?.length || 0} result{searchedSkills?.length !== 1 ? "s" : ""} for "{searchQuery}"
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={searchQuery ? "search" : currentCategory?.name || "none"}
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {displaySkills.map((skill: any, idx: number) => (
            <motion.div
              key={skill.name + idx}
              className="border border-border rounded-lg bg-bg-secondary/30 p-4 hover:border-brand/30 transition-all group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-medium text-text-primary">{skill.name}</h3>
                <span className="text-xs text-text-secondary">Proficiency: {skill.proficiency || 0}/5</span>
              </div>
              <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((skill.proficiency || 0) / 5) * 100}%` }}
                  transition={{ delay: 0.2 + idx * 0.03, duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {searchQuery && (
                <div className="text-xs text-text-secondary/40 mt-1">{skill.category}</div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

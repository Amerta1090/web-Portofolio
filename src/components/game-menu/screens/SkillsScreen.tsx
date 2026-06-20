import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import skillsData from "../../../../data/skills.json";

const ICON_CLASS = "w-[1em] h-[1em] inline-block align-middle";

const categoryIcons: Record<string, React.ReactNode> = {
  "Machine Learning & AI": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="8,1 15,8 8,15 1,8" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  "Data Science & Analytics": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="10" width="3" height="4" />
      <rect x="6.5" y="6" width="3" height="8" />
      <rect x="11" y="2" width="3" height="12" />
    </svg>
  ),
  "Web Development": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="5" y1="3" x2="5" y2="13" />
      <line x1="11" y1="3" x2="11" y2="13" />
    </svg>
  ),
  "IoT & Embedded Systems": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  "DevOps & MLOps": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3.5" />
      <circle cx="8" cy="2" r="1" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="2" cy="8" r="1" />
      <circle cx="14" cy="8" r="1" />
    </svg>
  ),
  "Programming Languages": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="5,4 2,8 5,12" />
      <polyline points="11,4 14,8 11,12" />
    </svg>
  ),
  "Cloud & Infrastructure": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11.5 11.5a3.5 3.5 0 1 0-3-5.5 4 4 0 1 0-4.5 5.5h7.5z" />
    </svg>
  ),
  "Productivity & Automation": (
    <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="9,1 3,9 7,9 7,15 13,7 9,7" />
    </svg>
  ),
};

export const SkillsScreen: React.FC = () => {
  const data = skillsData as any;
  const categories = data?.categories || [];
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = categories[activeCategory];
  const allSkills = categories.flatMap((c: any) =>
    (c.skills || []).map((s: any) => ({ ...s, category: c.name }))
  );
  const searchedSkills = searchQuery
    ? allSkills.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const displaySkills = searchedSkills || currentCategory?.skills || [];

  return (
    <div className="w-full h-full px-16 py-8 relative overflow-y-auto">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="w-2 h-2 bg-accent pulse-ring" />
        <span className="text-xs font-mono text-accent tracking-[0.2em] uppercase">
          Abilities // Skills
        </span>
      </motion.div>

      {/* Category tabs */}
      <motion.div
        className="flex flex-wrap gap-1.5 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {categories.map((cat: any, idx: number) => (
          <button
            key={cat.name}
            className={`text-xs font-mono tracking-wider uppercase px-3 py-1.5 border transition-all ${
              activeCategory === idx && !searchQuery
                ? "border-accent bg-accent/10 text-accent"
                : "border-accent/20 text-text-secondary hover:border-accent/40"
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

      {/* Search */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
      >
        <input
          type="text"
          placeholder="SEARCH SKILLS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-accent/20 px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent transition-colors uppercase tracking-wider"
        />
      </motion.div>

      {/* Category info */}
      {!searchQuery && currentCategory && (
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-accent text-2xl flex items-center">{categoryIcons[currentCategory.name]}</span>
          <span className="text-2xl font-black uppercase tracking-tighter text-text-primary">
            {currentCategory.name}
          </span>
          <span className="text-xs font-mono text-text-secondary/40">
            {currentCategory.skills?.length || 0} skills
          </span>
        </motion.div>
      )}

      {/* Search results info */}
      {searchQuery && (
        <motion.div
          className="text-xs font-mono text-text-secondary/60 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Found {searchedSkills?.length || 0} result{searchedSkills?.length !== 1 ? "s" : ""} for "{searchQuery}"
        </motion.div>
      )}

      {/* Skills grid */}
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
              className="border border-accent/10 bg-bg-secondary/30 p-4 hover:border-accent/40 transition-all group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              whileHover={{ y: -2, borderColor: "var(--accent)" }}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
                  {skill.name}
                </h3>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                    (skill.proficiency || 0) >= 5
                      ? "border-accent text-accent"
                      : (skill.proficiency || 0) >= 3
                      ? "border-accent/40 text-accent/60"
                      : "border-accent/20 text-text-secondary/40"
                  }`}
                >
                  Lv.{skill.proficiency || 0}
                </span>
              </div>
              {/* Proficiency bar */}
              <div className="w-full h-1 bg-bg-primary overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${((skill.proficiency || 0) / 5) * 100}%` }}
                  transition={{ delay: 0.2 + idx * 0.03, duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {searchQuery && (
                <div className="text-[9px] font-mono text-text-secondary/40 mt-1 uppercase tracking-wider">
                  {skill.category}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

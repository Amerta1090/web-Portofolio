import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import certificationsData from "../../../data/certifications.json";
import experienceData from "../../../data/experience.json";
import profileData from "../../../data/profile.json";
import projectsData from "../../../data/projects.json";
import { useHaptics } from "../../lib/useHaptics";
import { SubMenuPanel } from "./SubMenuPanel";
import { ExperienceScreen } from "./screens/ExperienceScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { SkillsScreen } from "./screens/SkillsScreen";

type MenuState =
  | { type: "main_menu" }
  | { type: "sub_menu"; parentId: string; parentLabel: string }
  | { type: "screen"; screenId: string }
  | { type: "settings" }
  | { type: "exit" };

interface HistoryEntry {
  state: MenuState;
  label: string;
  id: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  screen?: string;
  href?: string;
  badge?: string | number;
}

const MAIN_ICON_CLASS = "w-6 h-6";
const SUB_ICON_CLASS = "w-4 h-4";

const PROFILE_DATA = profileData as any;
const EXPERIENCES = experienceData as any[];
const PROJECTS = (projectsData as any)?.projects || [];
const CERTS = certificationsData as any[];

const MENU_TREE: MenuItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    children: [
      {
        id: "home",
        label: "About / Bio",
        screen: "home",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
        ),
      },
      {
        id: "experience",
        label: "Experience",
        screen: "experience",
        badge: EXPERIENCES.length,
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
      {
        id: "resume",
        label: "Resume",
        href: "/resume",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    children: [
      {
        id: "projects",
        label: "Projects",
        screen: "projects",
        badge: PROJECTS.length,
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        id: "skills",
        label: "Skills",
        screen: "skills",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3 3-3 3 3 3-3 3 3 3-3 3" />
            <path d="M5 12l3-3 3 3-3 3-3-3z" />
            <path d="M19 12l-3-3-3 3 3 3 3-3z" />
          </svg>
        ),
      },
      {
        id: "certifications",
        label: "Certifications",
        screen: "certifications",
        badge: CERTS.length,
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    children: [
      {
        id: "pinned-repos",
        label: "Pinned Repos",
        href: "/github",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        id: "contributions",
        label: "Contribution Graph",
        href: "/github",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        ),
      },
      {
        id: "languages",
        label: "Language Breakdown",
        href: "/github",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        ),
      },
      {
        id: "activity",
        label: "Commit Activity",
        href: "/github",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
        <line x1="17" y1="17" x2="22" y2="17" />
      </svg>
    ),
    children: [
      {
        id: "blog",
        label: "Blog",
        href: "/blog",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
      {
        id: "timeline",
        label: "Timeline",
        href: "/timeline",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="8 5 3 12 8 19" />
          </svg>
        ),
      },
      {
        id: "gallery",
        label: "Gallery",
        href: "/projects",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      {
        id: "display-settings",
        label: "Display",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        ),
      },
      {
        id: "audio-settings",
        label: "Audio",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ),
      },
      {
        id: "controls-settings",
        label: "Controls",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6" y2="6.01" />
            <line x1="10" y1="6" x2="10" y2="6.01" />
            <line x1="14" y1="6" x2="14" y2="6.01" />
          </svg>
        ),
      },
      {
        id: "about-credits",
        label: "About / Credits",
        icon: (
          <svg
            className={SUB_ICON_CLASS}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    screen: "contact",
    icon: (
      <svg
        className={MAIN_ICON_CLASS}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

const getDepth = (state: MenuState): number => {
  switch (state.type) {
    case "main_menu":
      return 0;
    case "sub_menu":
      return 1;
    case "settings":
      return 1;
    case "screen":
      return 1;
    case "exit":
      return 0;
  }
};

const getAnimationDirection = (
  fromDepth: number,
  toDepth: number,
): "forward" | "backward" | "neutral" => {
  if (toDepth > fromDepth) return "forward";
  if (toDepth < fromDepth) return "backward";
  return "neutral";
};

const findMenuItem = (items: MenuItem[], id: string): MenuItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

/* Particles removed in Sprint 5 */

const SidebarNavItem: React.FC<{
  item: MenuItem;
  index: number;
  activeIndex: number;
  depth: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  playHoverSound: () => void;
}> = ({ item, index, activeIndex, depth, onSelect, onHover, playHoverSound }) => {
  const isActive = activeIndex === index;
  const hasChildren = !!item.children;
  const isLeaf = !item.children;

  return (
    <motion.div
      className="relative cursor-pointer group"
      onMouseEnter={() => {
        if (activeIndex !== index) {
          playHoverSound();
          onHover(index);
        }
      }}
      onClick={() => onSelect(index)}
      whileHover={{ x: 6 }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className={`py-3 px-5 border-l-2 flex items-center gap-3 transition-all duration-150 rounded-r-lg ${
          isActive
            ? "border-brand bg-brand/10 text-brand"
            : "border-transparent text-text-secondary hover:text-text-primary hover:border-brand/30"
        }`}
      >
        <span className={`flex-shrink-0 ${isActive ? "text-brand" : ""}`}>{item.icon}</span>
        <span
          className={`flex-1 text-base font-medium ${
            isActive ? "text-brand" : ""
          }`}
        >
          {item.label}
        </span>
        {hasChildren && (
          <svg
            className="w-3 h-3 text-text-secondary/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
        {isLeaf && item.href && (
          <svg
            className="w-3 h-3 text-text-secondary/30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
        {isActive && (
          <motion.div
            layoutId="sidebarIndicator"
            className="w-2 h-2 bg-brand"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
      </div>
    </motion.div>
  );
};

const Sidebar: React.FC<{
  items: MenuItem[];
  activeIndex: number;
  depth: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onClose: () => void;
  playHoverSound: () => void;
}> = ({ items, activeIndex, depth, onSelect, onHover, onClose, playHoverSound }) => {
  const shortcuts = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <motion.div
      className="w-[280px] h-full bg-bg-secondary/95 backdrop-blur-sm flex flex-col border-r border-border relative z-10"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">
          Menu
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center py-6">
        {items.map((item, idx) => (
          <div key={item.id} className="relative">
            <SidebarNavItem
              item={item}
              index={idx}
              activeIndex={activeIndex}
              depth={depth}
              onSelect={onSelect}
              onHover={onHover}
              playHoverSound={playHoverSound}
            />
            {idx < 9 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary/30 pointer-events-none">
                {shortcuts[idx]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-border">
        <button
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors"
          onClick={onClose}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Exit
        </button>
      </div>
    </motion.div>
  );
};

const HUD: React.FC<{ activeLabel: string; depth: number; totalItems: number }> = ({
  activeLabel,
  depth,
  totalItems,
}) => (
  <div className="absolute top-0 right-0 z-20 p-6 pointer-events-none">
    <div className="text-xs text-text-secondary">
      {activeLabel} &middot; {totalItems} items
    </div>
  </div>
);

const ScreenTransition: React.FC<{
  children: React.ReactNode;
  direction: number;
}> = ({ children, direction }) => (
  <motion.div
    className="absolute inset-0"
    initial={{
      opacity: 0,
      clipPath:
        direction > 0
          ? "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)"
          : "polygon(0 0, 0 0, 0 100%, 0 100%)",
    }}
    animate={{
      opacity: 1,
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
    }}
    exit={{
      opacity: 0,
      clipPath:
        direction > 0
          ? "polygon(0 0, 0 0, 0 100%, 0 100%)"
          : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
    }}
    transition={{ type: "spring", stiffness: 120, damping: 18 }}
  >
    {children}
  </motion.div>
);

const ContactScreen: React.FC = () => {
  const profile = PROFILE_DATA;
  return (
    <div className="w-full h-full flex flex-col justify-center px-16 relative overflow-hidden">
      <div className="mb-6">
        <span className="text-xs text-text-secondary">Connect / Contact</span>
      </div>
      <h2 className="text-4xl font-bold text-text-primary mb-6">
        <span className="text-brand">Get In</span>
        <br />
        <span>Touch</span>
      </h2>
      <div className="flex flex-col gap-4 max-w-md">
        <a
          href={`mailto:${profile.contact?.email}`}
          className="flex items-center gap-4 px-5 py-4 border border-border hover:border-brand/40 rounded-lg transition-colors group"
        >
          <svg
            className="w-5 h-5 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
          <span className="text-sm text-text-primary group-hover:text-brand transition-colors">
            {profile.contact?.email}
          </span>
        </a>
        <a
          href={profile.contact?.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-5 py-4 border border-border hover:border-brand/40 rounded-lg transition-colors group"
        >
          <svg
            className="w-5 h-5 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
          <span className="text-sm text-text-primary group-hover:text-brand transition-colors">
            LinkedIn
          </span>
        </a>
        <a
          href={profile.contact?.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-5 py-4 border border-border hover:border-brand/40 rounded-lg transition-colors group"
        >
          <svg
            className="w-5 h-5 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="text-sm text-text-primary group-hover:text-brand transition-colors">
            GitHub
          </span>
        </a>
      </div>
    </div>
  );
};

export const GameMenuEngine: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { playHoverSound, playSelectSound } = useHaptics();
  const [mounted, setMounted] = useState(false);

  const [menuState, setMenuState] = useState<MenuState>({ type: "main_menu" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [prevDepth, setPrevDepth] = useState(-1);

  const keyRepeatRef = useRef<number | null>(null);
  const keyRepeatTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigateTo = useCallback(
    (newState: MenuState, label: string, id: string) => {
      const fromDepth = getDepth(menuState);
      const toDepth = getDepth(newState);
      setPrevDepth(fromDepth);

      if (
        newState.type === "sub_menu" ||
        newState.type === "settings" ||
        newState.type === "screen"
      ) {
        setHistory((prev) => [...prev, { state: menuState, label, id }]);
      }

      setMenuState(newState);
      setActiveIndex(0);
      playSelectSound();
    },
    [menuState, playSelectSound],
  );

  const navigateBack = useCallback(() => {
    if (history.length === 0) {
      setMenuState({ type: "main_menu" });
      setActiveIndex(0);
      return;
    }

    const prev = history[history.length - 1];
    const fromDepth = getDepth(menuState);
    setPrevDepth(fromDepth);
    setHistory((prevH) => prevH.slice(0, -1));
    setMenuState(prev.state);
    setActiveIndex(0);
    playHoverSound();
  }, [history, menuState, playHoverSound]);

  const handleSelectMainItem = useCallback(
    (index: number) => {
      const item = MENU_TREE[index];
      if (!item) return;

      if (item.children) {
        navigateTo(
          { type: "sub_menu", parentId: item.id, parentLabel: item.label },
          item.label,
          item.id,
        );
      } else if (item.screen) {
        navigateTo({ type: "screen", screenId: item.screen }, item.label, item.id);
      } else if (item.href) {
        window.location.href = item.href;
      }
    },
    [navigateTo],
  );

  const handleSelectSubItem = useCallback(
    (index: number) => {
      if (menuState.type !== "sub_menu") return;
      const parent = MENU_TREE.find((m) => m.id === menuState.parentId);
      if (!parent?.children) return;
      const item = parent.children[index];
      if (!item) return;

      if (item.screen) {
        navigateTo({ type: "screen", screenId: item.screen }, item.label, item.id);
      } else if (item.href) {
        window.location.href = item.href;
      }
    },
    [menuState, navigateTo],
  );

  const handleHover = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const getCurrentItems = (): MenuItem[] => {
    if (menuState.type === "main_menu" || menuState.type === "sub_menu") {
      return MENU_TREE;
    }
    return [];
  };

  const getSidebarActiveIndex = (): number => {
    if (menuState.type === "main_menu") return activeIndex;
    if (menuState.type === "sub_menu") {
      const idx = MENU_TREE.findIndex((m) => m.id === menuState.parentId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const getCurrentLabel = (): string => {
    switch (menuState.type) {
      case "main_menu":
        return "Main Menu";
      case "sub_menu":
        return menuState.parentLabel;
      case "screen":
        return menuState.screenId;
      case "settings":
        return "Settings";
      default:
        return "";
    }
  };

  const getBreadcrumbs = () => {
    const crumbs: { id: string; label: string }[] = [];
    if (menuState.type === "sub_menu" || menuState.type === "screen") {
      crumbs.push({ id: "main", label: "Main Menu" });
    }
    if (menuState.type === "sub_menu") {
      crumbs.push({ id: menuState.parentId, label: menuState.parentLabel });
    }
    if (menuState.type === "screen") {
      const parent = MENU_TREE.find((m) =>
        m.children?.some((c) => c.id === menuState.screenId || c.screen === menuState.screenId),
      );
      if (parent) {
        crumbs.push({ id: parent.id, label: parent.label });
      }
      const item = findMenuItem(MENU_TREE, menuState.screenId);
      if (item) {
        crumbs.push({ id: item.id, label: item.label });
      }
    }
    return crumbs;
  };

  const currentDepth = getDepth(menuState);

  const startKeyRepeat = useCallback(
    (direction: "up" | "down", itemsLength: number, useSub: boolean) => {
      const step = () => {
        if (useSub) {
          setSubIndex((prev) => {
            if (direction === "down") return (prev + 1) % itemsLength;
            return prev === 0 ? itemsLength - 1 : prev - 1;
          });
        } else {
          setActiveIndex((prev) => {
            if (direction === "down") return (prev + 1) % itemsLength;
            return prev === 0 ? itemsLength - 1 : prev - 1;
          });
        }
        playHoverSound();
      };
      step();
      keyRepeatTimeoutRef.current = window.setTimeout(() => {
        keyRepeatRef.current = window.setInterval(step, 100);
      }, 250);
    },
    [playHoverSound],
  );

  const stopKeyRepeat = useCallback(() => {
    if (keyRepeatTimeoutRef.current !== null) {
      clearTimeout(keyRepeatTimeoutRef.current);
      keyRepeatTimeoutRef.current = null;
    }
    if (keyRepeatRef.current !== null) {
      clearInterval(keyRepeatRef.current);
      keyRepeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const mainItemsLength = MENU_TREE.length;
    const subItemsLength =
      menuState.type === "sub_menu"
        ? MENU_TREE.find((m) => m.id === menuState.parentId)?.children?.length || 0
        : 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (history.length > 0) {
          if (menuState.type === "sub_menu" || menuState.type === "screen") {
            navigateBack();
          }
        } else {
          onClose();
        }
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        stopKeyRepeat();
        const isSub = menuState.type === "sub_menu" && subItemsLength > 0;
        startKeyRepeat(
          e.key === "ArrowDown" ? "down" : "up",
          isSub ? subItemsLength : mainItemsLength,
          isSub,
        );
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (history.length > 0) {
          navigateBack();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (menuState.type === "main_menu") {
          handleSelectMainItem(activeIndex);
        } else if (menuState.type === "sub_menu") {
          const parent = MENU_TREE.find((m) => m.id === menuState.parentId);
          const item = parent?.children?.[subIndex];
          if (item?.screen) {
            handleSelectSubItem(subIndex);
          } else if (item?.href) {
            handleSelectSubItem(subIndex);
          }
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (menuState.type === "main_menu") {
          handleSelectMainItem(activeIndex);
        } else if (menuState.type === "sub_menu") {
          handleSelectSubItem(subIndex);
        }
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const num = Number.parseInt(e.key) - 1;
        if (num < mainItemsLength) {
          e.preventDefault();
          setActiveIndex(num);
          playHoverSound();
          if (menuState.type === "main_menu" || menuState.type === "sub_menu") {
            const item = MENU_TREE[num];
            if (item?.children) {
              navigateTo(
                { type: "sub_menu", parentId: item.id, parentLabel: item.label },
                item.label,
                item.id,
              );
            } else if (item?.screen) {
              navigateTo({ type: "screen", screenId: item.screen }, item.label, item.id);
            } else if (item?.href) {
              window.location.href = item.href;
            }
          }
        }
        return;
      }

      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        if (history.length > 0) navigateBack();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        stopKeyRepeat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.body.style.overflow = "auto";
      stopKeyRepeat();
    };
  }, [
    isOpen,
    menuState,
    activeIndex,
    subIndex,
    history,
    onClose,
    playHoverSound,
    playSelectSound,
    navigateBack,
    handleSelectMainItem,
    handleSelectSubItem,
    startKeyRepeat,
    stopKeyRepeat,
    navigateTo,
  ]);

  const renderScreen = () => {
    if (menuState.type !== "screen") return null;
    const animDir = currentDepth - prevDepth;

    switch (menuState.screenId) {
      case "home":
        return (
          <ScreenTransition key="home" direction={animDir}>
            <HomeScreen />
          </ScreenTransition>
        );
      case "experience":
        return (
          <ScreenTransition key="experience" direction={animDir}>
            <ExperienceScreen />
          </ScreenTransition>
        );
      case "projects":
        return (
          <ScreenTransition key="projects" direction={animDir}>
            <ProjectsScreen />
          </ScreenTransition>
        );
      case "skills":
        return (
          <ScreenTransition key="skills" direction={animDir}>
            <SkillsScreen />
          </ScreenTransition>
        );
      case "certifications":
        return (
          <ScreenTransition key="certifications" direction={animDir}>
            <div className="w-full h-full flex flex-col justify-center px-16">
              <div className="mb-6">
                <span className="text-xs text-text-secondary">Credentials / Certifications</span>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                <span className="text-brand">{CERTS.length}</span>
                <span className="ml-2">Certifications</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] pr-4">
                {CERTS.map((cert: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border bg-bg-secondary/30 rounded-lg p-4 hover:border-brand/40 transition-colors"
                  >
                    <div className="text-sm font-medium text-text-primary mb-1">
                      {cert.title}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {cert.issuer}
                      {cert.date ? ` · ${cert.date}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScreenTransition>
        );
      case "contact":
        return (
          <ScreenTransition key="contact" direction={animDir}>
            <ContactScreen />
          </ScreenTransition>
        );
      default:
        return (
          <ScreenTransition key="home" direction={animDir}>
            <HomeScreen />
          </ScreenTransition>
        );
    }
  };

  const showSidebar = menuState.type === "main_menu" || menuState.type === "sub_menu";
  const showHUD = menuState.type !== "exit";
  const showSubPanel = menuState.type === "sub_menu" || menuState.type === "screen";
  const showScreen = menuState.type === "screen";

  const currentItems = getCurrentItems();
  const subMenuItems =
    menuState.type === "sub_menu"
      ? (MENU_TREE.find((m) => m.id === menuState.parentId)?.children || []).map((c) => ({
          id: c.id,
          label: c.label,
          icon: c.icon,
          screen: c.screen,
          href: c.href,
          badge: c.badge,
        }))
      : [];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{ pointerEvents: "auto" }}
        >
          {/* Sidebar */}
          {showSidebar && (
            <Sidebar
              items={currentItems}
              activeIndex={getSidebarActiveIndex()}
              depth={currentDepth}
              onSelect={
                menuState.type === "main_menu"
                  ? handleSelectMainItem
                  : (idx: number) => {
                      setActiveIndex(idx);
                      const item = MENU_TREE[idx];
                      if (item?.children) {
                        navigateTo(
                          { type: "sub_menu", parentId: item.id, parentLabel: item.label },
                          item.label,
                          item.id,
                        );
                      } else if (item?.screen) {
                        navigateTo(
                          { type: "screen", screenId: item.screen },
                          item.label,
                          item.id,
                        );
                      } else if (item?.href) {
                        window.location.href = item.href;
                      }
                    }
              }
              onHover={(idx: number) => setActiveIndex(idx)}
              onClose={() => {
                if (history.length > 0) navigateBack();
                else onClose();
              }}
              playHoverSound={playHoverSound}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 relative bg-bg-primary overflow-hidden">
            {showHUD && (
              <HUD
                activeLabel={getCurrentLabel()}
                depth={currentDepth}
                totalItems={currentItems.length}
              />
            )}

            {/* Sub-menu panel overlay */}
            {showSubPanel && (
              <SubMenuPanel
                isOpen={menuState.type === "sub_menu"}
                title={menuState.type === "sub_menu" ? menuState.parentLabel : ""}
                breadcrumbs={getBreadcrumbs()}
                items={subMenuItems}
                activeIndex={menuState.type === "sub_menu" ? subIndex : -1}
                depth={currentDepth}
                onSelect={handleSelectSubItem}
                onHover={(idx: number) => setSubIndex(idx)}
                onBack={navigateBack}
              />
            )}

            {/* Screen content */}
            <div
              className={`absolute inset-0 transition-opacity duration-200 ${showScreen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="absolute inset-0 mt-16">
                <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};

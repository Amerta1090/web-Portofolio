import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowLeftFromLine, Award, BarChart3, ChevronRight,
  Code2, Columns3, FileText, FolderKanban, Gamepad2, Globe,
  History, House, Images, Info, LayoutGrid, Mail, Monitor,
  Settings, Star, User, Volume2,
} from "lucide-react";
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

const MAIN_ICON_SIZE = 24;
const SUB_ICON_SIZE = 16;

const PROFILE_DATA = profileData as any;
const EXPERIENCES = experienceData as any[];
const PROJECTS = (projectsData as any)?.projects || [];
const CERTS = certificationsData as any[];

const MENU_TREE: MenuItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User size={MAIN_ICON_SIZE} />,
    children: [
      {
        id: "home",
        label: "About / Bio",
        screen: "home",
        icon: <House size={SUB_ICON_SIZE} />,
      },
      {
        id: "experience",
        label: "Experience",
        screen: "experience",
        badge: EXPERIENCES.length,
        icon: <Star size={SUB_ICON_SIZE} />,
      },
      {
        id: "resume",
        label: "Resume",
        href: "/resume",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: <LayoutGrid size={MAIN_ICON_SIZE} />,
    children: [
      {
        id: "projects",
        label: "Projects",
        screen: "projects",
        badge: PROJECTS.length,
        icon: <FolderKanban size={SUB_ICON_SIZE} />,
      },
      {
        id: "skills",
        label: "Skills",
        screen: "skills",
        icon: <Code2 size={SUB_ICON_SIZE} />,
      },
      {
        id: "certifications",
        label: "Certifications",
        screen: "certifications",
        badge: CERTS.length,
        icon: <Award size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    children: [
      {
        id: "pinned-repos",
        label: "Pinned Repos",
        href: "/github",
        icon: <FolderKanban size={SUB_ICON_SIZE} />,
      },
      {
        id: "contributions",
        label: "Contribution Graph",
        href: "/github",
        icon: <BarChart3 size={SUB_ICON_SIZE} />,
      },
      {
        id: "languages",
        label: "Language Breakdown",
        href: "/github",
        icon: <Globe size={SUB_ICON_SIZE} />,
      },
      {
        id: "activity",
        label: "Commit Activity",
        href: "/github",
        icon: <Activity size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: <Columns3 size={MAIN_ICON_SIZE} />,
    children: [
      {
        id: "blog",
        label: "Blog",
        href: "/blog",
        icon: <FileText size={SUB_ICON_SIZE} />,
      },
      {
        id: "timeline",
        label: "Timeline",
        href: "/timeline",
        icon: <History size={SUB_ICON_SIZE} />,
      },
      {
        id: "gallery",
        label: "Gallery",
        href: "/projects",
        icon: <Images size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={MAIN_ICON_SIZE} />,
    children: [
      {
        id: "display-settings",
        label: "Display",
        icon: <Monitor size={SUB_ICON_SIZE} />,
      },
      {
        id: "audio-settings",
        label: "Audio",
        icon: <Volume2 size={SUB_ICON_SIZE} />,
      },
      {
        id: "controls-settings",
        label: "Controls",
        icon: <Gamepad2 size={SUB_ICON_SIZE} />,
      },
      {
        id: "about-credits",
        label: "About / Credits",
        icon: <Info size={SUB_ICON_SIZE} />,
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    screen: "contact",
    icon: <Mail size={MAIN_ICON_SIZE} />,
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
        {hasChildren && <ChevronRight size={12} className="text-text-secondary/40 shrink-0" />}
        {isLeaf && item.href && <ChevronRight size={12} className="text-text-secondary/30 shrink-0" />}
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
          <ArrowLeftFromLine size={16} />
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
          <Mail size={20} className="text-text-secondary shrink-0" />
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
          <svg className="w-5 h-5 text-text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <svg className="w-5 h-5 text-text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

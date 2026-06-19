import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "../../lib/useHaptics";
import { HomeScreen } from "./screens/HomeScreen";
import { ExperienceScreen } from "./screens/ExperienceScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { SkillsScreen } from "./screens/SkillsScreen";
import profileData from "../../../data/profile.json";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: "◆" },
  { id: "experience", label: "Experience", icon: "⚡" },
  { id: "projects", label: "Projects", icon: "■" },
  { id: "skills", label: "Skills", icon: "★" },
];

const GameMenuParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }

    let anim: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 0, 18, ${p.alpha})`;
        ctx.fill();
      });
      anim = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const SidebarNavItem: React.FC<{
  item: NavItem;
  index: number;
  activeIndex: number;
  activeTab: string;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  playHoverSound: () => void;
}> = ({ item, index, activeIndex, activeTab, onSelect, onHover, playHoverSound }) => {
  const isActive = activeIndex === index;
  const isSelected = activeTab === item.id;

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
      whileHover={{ x: 8 }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className={`py-5 px-7 border-r-4 flex items-center gap-5 transition-all duration-150 ${
          isActive || isSelected
            ? "border-accent bg-accent/10 text-accent"
            : "border-transparent text-text-secondary hover:text-text-primary hover:border-accent/30"
        }`}
      >
        <span className={`text-2xl ${isActive ? "text-accent" : ""}`}>{item.icon}</span>
        <div className="flex-1">
          <span className={`text-2xl font-black uppercase tracking-[0.15em] block leading-none ${
            isSelected ? "text-accent" : ""
          }`}>
            {item.label}
          </span>
        </div>
        {isActive && (
          <motion.div
            layoutId="sidebarIndicator"
            className="w-2 h-2 bg-accent"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
      </div>
    </motion.div>
  );
};

const Sidebar: React.FC<{
  activeIndex: number;
  activeTab: string;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onClose: () => void;
  playHoverSound: () => void;
}> = ({ activeIndex, activeTab, onSelect, onHover, onClose, playHoverSound }) => (
  <motion.div
    className="w-[280px] h-full bg-bg-secondary/95 backdrop-blur-sm flex flex-col border-r border-accent/20 relative z-10"
    initial={{ x: -280 }}
    animate={{ x: 0 }}
    exit={{ x: -280 }}
    transition={{ type: "spring", stiffness: 200, damping: 25 }}
  >
    {/* Header */}
    <div className="px-7 pt-8 pb-4 border-b border-accent/10">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-2 h-2 bg-accent pulse-ring" />
        <span className="text-xs font-mono text-accent tracking-widest uppercase">System Menu</span>
      </div>
      <h2
        className="text-4xl font-black uppercase text-accent tracking-[0.2em] p5-text-stroke"
        style={{ WebkitTextStroke: "1px #e60012" }}
      >
        NAV
      </h2>
    </div>

    {/* Nav Items */}
    <div className="flex-1 flex flex-col justify-center py-8">
      {NAV_ITEMS.map((item, idx) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          index={idx}
          activeIndex={activeIndex}
          activeTab={activeTab}
          onSelect={onSelect}
          onHover={onHover}
          playHoverSound={playHoverSound}
        />
      ))}
    </div>

    {/* Footer / Exit */}
    <div className="px-7 py-6 border-t border-accent/10">
      <button
        className="w-full flex items-center gap-3 text-sm font-mono text-text-secondary hover:text-accent transition-colors group"
        onClick={onClose}
      >
        <span className="border border-accent/30 px-2 py-0.5 text-accent text-xs group-hover:bg-accent/10 transition-colors">
          ESC
        </span>
        <span className="tracking-widest uppercase">Exit</span>
      </button>
    </div>
  </motion.div>
);

const HUD: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const profile = profileData as any;
  return (
    <div className="absolute top-0 right-0 z-20 p-6 flex items-start gap-6 pointer-events-none">
      <div className="text-right">
        <div className="text-xs font-mono text-accent tracking-widest uppercase mb-1">
          {activeTab.toUpperCase()}
        </div>
        <div className="text-[10px] font-mono text-text-secondary/50 tracking-wider">
          v1.0.0 // PORTFOLIO
        </div>
      </div>
      <div className="w-10 h-10 border border-accent/30 flex items-center justify-center">
        <div className="w-2 h-2 bg-accent pulse-ring" />
      </div>
    </div>
  );
};

const ScreenTransition: React.FC<{
  children: React.ReactNode;
  direction: number;
}> = ({ children, direction }) => (
  <motion.div
    className="absolute inset-0"
    initial={{
      opacity: 0,
      clipPath: direction > 0
        ? "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)"
        : "polygon(0 0, 0 0, 0 100%, 0 100%)",
    }}
    animate={{
      opacity: 1,
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
    }}
    exit={{
      opacity: 0,
      clipPath: direction > 0
        ? "polygon(0 0, 0 0, 0 100%, 0 100%)"
        : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
    }}
    transition={{ type: "spring", stiffness: 120, damping: 18 }}
  >
    {children}
  </motion.div>
);

export const GameMenuEngine: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [prevIndex, setPrevIndex] = useState(0);
  const { playHoverSound, playSelectSound } = useHaptics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectTab = useCallback(
    (index: number) => {
      setPrevIndex(activeIndex);
      if (activeIndex !== index) {
        playHoverSound();
        setActiveIndex(index);
      }
      playSelectSound();
      setActiveTab(NAV_ITEMS[index].id);
    },
    [activeIndex, playHoverSound, playSelectSound]
  );

  const handleHover = useCallback(
    (index: number) => {
      setActiveIndex(index);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          playHoverSound();
          const next = (prev + 1) % NAV_ITEMS.length;
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => {
          playHoverSound();
          return prev === 0 ? NAV_ITEMS.length - 1 : prev - 1;
        });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelectTab(activeIndex);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, activeIndex, onClose, handleSelectTab, playHoverSound]);

  const renderScreen = () => {
    const direction = activeIndex - prevIndex;
    switch (activeTab) {
      case "home":
        return <ScreenTransition key="home" direction={direction}><HomeScreen /></ScreenTransition>;
      case "experience":
        return <ScreenTransition key="experience" direction={direction}><ExperienceScreen /></ScreenTransition>;
      case "projects":
        return <ScreenTransition key="projects" direction={direction}><ProjectsScreen /></ScreenTransition>;
      case "skills":
        return <ScreenTransition key="skills" direction={direction}><SkillsScreen /></ScreenTransition>;
      default:
        return <ScreenTransition key="home" direction={direction}><HomeScreen /></ScreenTransition>;
    }
  };

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
          {/* Scanlines + Vignette */}
          <div className="fixed inset-0 z-0 pointer-events-none game-mode-scanlines" />
          <div
            className="fixed inset-0 z-[1] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          {/* Particles */}
          <GameMenuParticles />

          {/* Sidebar */}
          <Sidebar
            activeIndex={activeIndex}
            activeTab={activeTab}
            onSelect={handleSelectTab}
            onHover={handleHover}
            onClose={onClose}
            playHoverSound={playHoverSound}
          />

          {/* Main Content Area */}
          <div className="flex-1 relative bg-bg-primary/90 backdrop-blur-sm overflow-hidden">
            <HUD activeTab={activeTab} />
            <div className="absolute inset-0 mt-16">
              <AnimatePresence mode="wait">
                {renderScreen()}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};

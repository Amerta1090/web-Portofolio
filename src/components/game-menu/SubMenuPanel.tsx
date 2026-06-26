import { AnimatePresence, motion } from "framer-motion";
import React from "react";

interface Breadcrumb {
  id: string;
  label: string;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  screen?: string;
  href?: string;
  badge?: string | number;
}

interface SubMenuPanelProps {
  isOpen: boolean;
  title: string;
  breadcrumbs: Breadcrumb[];
  items: SubMenuItem[];
  activeIndex: number;
  depth: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBack: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 200, damping: 22 },
  }),
};

export const SubMenuPanel: React.FC<SubMenuPanelProps> = ({
  isOpen,
  title,
  breadcrumbs,
  items,
  activeIndex,
  depth,
  onSelect,
  onHover,
  onBack,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-[360px] bg-bg-secondary/95 backdrop-blur-sm border-l border-accent/20 z-20 flex flex-col"
          initial={{ x: 360 }}
          animate={{ x: 0 }}
          exit={{ x: 360 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          {/* Breadcrumb header */}
          <div className="px-6 pt-6 pb-3 border-b border-accent/10">
            <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary/50 tracking-wider mb-2">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <span className="text-accent/40">/</span>}
                  <span className={idx === breadcrumbs.length - 1 ? "text-accent/80" : ""}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-[0.15em] text-text-primary">
                {title}
              </h3>
              <span className="text-[10px] font-mono text-text-secondary/40 border border-accent/20 px-2 py-0.5">
                LV.{depth}
              </span>
            </div>
          </div>

          {/* Sub-menu items */}
          <div className="flex-1 overflow-y-auto py-4">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                className={`relative cursor-pointer mx-2 rounded-sm transition-colors ${
                  activeIndex === idx ? "bg-accent/10" : "hover:bg-accent/5"
                }`}
                custom={idx}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onMouseEnter={() => onHover(idx)}
                onClick={() => onSelect(idx)}
              >
                <div
                  className={`flex items-center gap-4 px-4 py-3.5 border-l-2 ${
                    activeIndex === idx ? "border-accent" : "border-transparent"
                  }`}
                >
                  {item.icon && (
                    <span
                      className={`flex-shrink-0 ${activeIndex === idx ? "text-accent" : "text-text-secondary"}`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span
                    className={`flex-1 text-sm font-bold uppercase tracking-wider ${
                      activeIndex === idx ? "text-accent" : "text-text-primary"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge != null && (
                    <span className="text-[10px] font-mono text-accent/60 border border-accent/20 px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                  {item.href && !item.children && (
                    <svg
                      className="w-3 h-3 text-text-secondary/40"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Back button */}
          <div className="px-6 py-4 border-t border-accent/10">
            <button
              className="flex items-center gap-3 text-sm font-mono text-text-secondary hover:text-accent transition-colors group w-full"
              onClick={onBack}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 3l-5 5 5 5" />
              </svg>
              <span className="tracking-wider uppercase text-xs">
                Back to{" "}
                {breadcrumbs.length > 1
                  ? breadcrumbs[breadcrumbs.length - 2]?.label || "Menu"
                  : "Main Menu"}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

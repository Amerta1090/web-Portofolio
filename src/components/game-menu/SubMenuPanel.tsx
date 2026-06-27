import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftFromLine, ChevronRight } from "lucide-react";
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
  hidden: { opacity: 0, x: 20 },
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
          className="absolute right-0 top-0 bottom-0 w-[320px] bg-bg-secondary/95 backdrop-blur-sm border-l border-border z-20 flex flex-col"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-text-secondary/60 mb-2">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <span className="text-text-secondary/30">&middot;</span>}
                  <span className={idx === breadcrumbs.length - 1 ? "text-text-primary" : ""}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                className={`relative cursor-pointer mx-2 rounded-lg transition-colors ${
                  activeIndex === idx ? "bg-brand/10" : "hover:bg-brand/5"
                }`}
                custom={idx}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onMouseEnter={() => onHover(idx)}
                onClick={() => onSelect(idx)}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3 ${
                    activeIndex === idx ? "text-brand" : ""
                  }`}
                >
                  {item.icon && (
                    <span className={`flex-shrink-0 ${activeIndex === idx ? "text-brand" : "text-text-secondary"}`}>
                      {item.icon}
                    </span>
                  )}
                  <span className={`flex-1 text-sm font-medium ${
                      activeIndex === idx ? "text-brand" : "text-text-primary"
                    }`}>
                    {item.label}
                  </span>
                  {item.badge != null && (
                    <span className="text-xs text-text-secondary/50 bg-bg-tertiary px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.href && <ChevronRight size={12} className="text-text-secondary/40 shrink-0" />}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-border">
            <button
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors"
              onClick={onBack}
            >
              <ArrowLeftFromLine size={16} />
              Back to {breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2]?.label || "Menu" : "Main Menu"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

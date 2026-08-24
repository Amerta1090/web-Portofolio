import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import VideoSequenceScroll from "./experiments/VideoSequenceScroll";
import FractalFlameSync from "./experiments/FractalFlameSync";
import StrangeAttractorZoo from "./experiments/StrangeAttractorZoo";
import ThreeBodyProblem from "./experiments/ThreeBodyProblem";
import { experiments } from "../lib/experiments";

function LivePreview({ id }: { id: string }) {
  return (
    <>
      {id === "watch-demo" && <VideoSequenceScroll compact />}
      {id === "fractal-flame-sync" && <FractalFlameSync compact />}
      {id === "strange-attractor" && <StrangeAttractorZoo compact />}
      {id === "three-body-problem" && <ThreeBodyProblem compact />}
    </>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function CreativeLabTeaser() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {experiments.map((exp, i) => (
          <motion.a
            key={exp.id}
            href="/gallery"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-xl transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] cursor-pointer block"
            onMouseEnter={() => setHovered(exp.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="aspect-[16/9] relative overflow-hidden bg-black/40">
              <div className="absolute inset-0">
                {hovered === exp.id ? (
                  <LivePreview id={exp.id} />
                ) : (
                  <img
                    src={exp.thumbnail}
                    alt=""
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-0 transition-opacity duration-500"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-transparent" />
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-sm text-text-primary group-hover:text-amber-400 transition-colors">
                {exp.title}
              </h3>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                {exp.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {exp.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.03] group-hover:ring-amber-500/20 transition-all duration-500 pointer-events-none" />
          </motion.a>
        ))}
      </div>

      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <a
          href="/gallery"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 hover:border-amber-500/30 transition-all group"
        >
          <Sparkles size={14} />
          <span>Explore the Creative Lab</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </motion.div>
    </div>
  );
}

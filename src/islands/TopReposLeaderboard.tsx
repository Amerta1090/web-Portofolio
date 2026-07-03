import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, GitCommit } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import RepoGlowCard from "../components/atoms/RepoGlowCard";
import MagneticButton from "./MagneticButton";
import { duration, easing, stagger } from "../lib/motion";
import type { GitHubData } from "../types/github";

interface Props {
  topRepos: GitHubData["top_repos"];
  repoActivity: GitHubData["repo_activity"];
}

export default function TopReposLeaderboard({ topRepos, repoActivity }: Props) {
  const prefersReduced = useReducedMotion();
  const [feedIndex, setFeedIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  const allCommits = repoActivity.flatMap((r) =>
    r.commits.map((c) => ({
      repo_name: r.repo_name,
      repo_url: r.repo_url,
      message: c.message,
      url: c.url,
    })),
  );

  useEffect(() => {
    if (allCommits.length === 0 || prefersReduced) return;
    const id = setInterval(() => {
      if (!isPaused.current) {
        setFeedIndex((i) => (i + 1) % allCommits.length);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [allCommits.length, prefersReduced]);

  const handleFeedMouseEnter = useCallback(() => {
    isPaused.current = true;
  }, []);

  const handleFeedMouseLeave = useCallback(() => {
    isPaused.current = false;
  }, []);

  const displayRepos = topRepos.slice(0, 6);

  return (
    <div className="space-y-10">
      {/* Leaderboard grid */}
      {displayRepos.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={
            prefersReduced
              ? undefined
              : {
                  hidden: { opacity: 1 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: stagger.relaxed,
                      delayChildren: duration.fast,
                    },
                  },
                }
          }
        >
          {displayRepos.map((repo, i) => (
            <motion.div
              key={repo.name}
              variants={
                prefersReduced
                  ? undefined
                  : {
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: duration.deliberate,
                          ease: easing["ease-out-expo"],
                        },
                      },
                    }
              }
            >
              <RepoGlowCard repo={repo} rank={i + 1} index={i} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Recent commits feed */}
      {allCommits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: duration.deliberate, ease: easing["ease-out-expo"] }}
          className="relative overflow-hidden rounded-xl border border-border/60 bg-bg-secondary/30 p-5"
          onMouseEnter={handleFeedMouseEnter}
          onMouseLeave={handleFeedMouseLeave}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono text-text-secondary/40 tracking-wider uppercase">
              Recent Activity
            </span>
            <div className="flex gap-1">
              {allCommits.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    i === Math.min(feedIndex, 4) ? "bg-brand" : "bg-text-secondary/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <div ref={feedRef} className="overflow-hidden" aria-live="polite">
            <motion.a
              key={`${feedIndex}-${allCommits[feedIndex].repo_name}`}
              href={allCommits[feedIndex].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group cursor-pointer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.normal, ease: easing["ease-out-expo"] }}
            >
              <GitCommit className="w-4 h-4 mt-0.5 shrink-0 text-text-secondary/40 group-hover:text-brand transition-colors" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-mono text-brand/70 group-hover:text-brand transition-colors">
                  {allCommits[feedIndex].repo_name}
                </span>
                <span className="text-xs text-text-secondary/60 mx-2">➜</span>
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                  {allCommits[feedIndex].message}
                </span>
              </div>
            </motion.a>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: duration.deliberate, ease: easing["ease-out-expo"] }}
      >
        <MagneticButton>
          <a
            href="/github"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-sm font-medium hover:bg-brand/20 transition-all duration-300 group"
          >
            Explore Full Universe
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </a>
        </MagneticButton>
      </motion.div>
    </div>
  );
}

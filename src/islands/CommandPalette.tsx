import { CornerDownLeft, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type SearchItem, type SearchItemType, buildSearchIndex } from "../lib/search/buildIndex";
import { type ScoredSearch, searchIndex } from "../lib/search/fuzzy";

export const PALETTE_OPEN_EVENT = "opencode:palette";

const TYPE_LABEL: Record<SearchItemType, string> = {
  person: "Profil",
  skill: "Skill",
  project: "Proyek",
  experience: "Pengalaman",
  certification: "Sertifikasi",
  page: "Halaman",
  lab: "Lab",
};

const TYPE_BADGE: Record<SearchItemType, string> = {
  person: "bg-amber-500/15 text-amber-300",
  skill: "bg-sky-500/15 text-sky-300",
  project: "bg-violet-500/15 text-violet-300",
  experience: "bg-emerald-500/15 text-emerald-300",
  certification: "bg-orange-500/15 text-orange-300",
  page: "bg-zinc-500/15 text-zinc-300",
  lab: "bg-pink-500/15 text-pink-300",
};

const CATEGORIES: Array<{ value: SearchItemType | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "person", label: "Profil" },
  { value: "skill", label: "Skill" },
  { value: "project", label: "Proyek" },
  { value: "experience", label: "Pengalaman" },
  { value: "certification", label: "Sertifikasi" },
  { value: "page", label: "Halaman" },
  { value: "lab", label: "Lab" },
];

const PLACEHOLDER = "Cari skill, proyek, lab, halaman…";

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-amber-500/30 px-0.5 text-amber-200">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function CommandPalette() {
  const items = useMemo(() => buildSearchIndex(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchItemType | "all">("all");
  const [active, setActive] = useState(0);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results: ScoredSearch<SearchItem>[] = useMemo(
    () => searchIndex(query, items, { limit: 12 }),
    [query, items],
  );

  const visible = filter === "all" ? results : results.filter((r) => r.item.type === filter);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (visible.length ? (a + 1) % visible.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (visible.length ? (a - 1 + visible.length) % visible.length : 0));
      } else if (e.key === "Enter") {
        const hit = visible[active];
        if (hit) {
          e.preventDefault();
          activate(hit.item);
        }
      } else if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, [open, visible, active]);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      prevFocusRef.current?.focus?.();
      prevFocusRef.current = null;
    }
  }, [open]);

  function handleQuery(next: string) {
    setQuery(next);
    setActive(0);
    setThinking(true);
    if (thinkingTimer.current) clearTimeout(thinkingTimer.current);
    thinkingTimer.current = setTimeout(() => setThinking(false), 160);
  }

  useEffect(() => {
    if (open) return;
    if (prevFocusRef.current) prevFocusRef.current.focus?.();
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setFilter("all");
    setThinking(false);
    if (thinkingTimer.current) clearTimeout(thinkingTimer.current);
  }

  function navigate(item: SearchItem) {
    if (item.target.startsWith("/#")) {
      const id = item.target.replace("/#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        close();
        return;
      }
      // Anchor not present on this page — fall back to the page root.
      window.location.assign("/");
      return;
    }
    window.location.assign(item.target);
  }

  function activate(item: SearchItem) {
    navigate(item);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <dialog
        ref={dialogRef}
        open
        aria-label="Command palette"
        className="m-0 block w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-bg-primary p-0 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-text-secondary" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="Cari command"
            className="w-full bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {thinking && (
            <span
              className="flex items-center gap-1 text-xs text-text-secondary"
              aria-hidden="true"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              thinking…
            </span>
          )}
          {query ? (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => handleQuery("")}
              className="rounded p-1 text-text-secondary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-secondary">
              ⌘K
            </kbd>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
          {CATEGORIES.map((c) => {
            const isActive = filter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                tabIndex={-1}
                onClick={() => setFilter(c.value)}
                aria-pressed={isActive}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {visible.length > 0 ? (
          <ul
            ref={listRef}
            aria-label="Hasil pencarian"
            className="max-h-[min(60vh,420px)] overflow-y-auto py-1"
          >
            {visible.map((r, i) => {
              const item = r.item;
              const selected = i === active;
              return (
                <li key={item.id} onMouseEnter={() => setActive(i)}>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => activate(item)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left ${
                      selected ? "bg-bg-secondary" : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE[item.type]}`}
                    >
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">
                        {highlight(item.title, query)}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {item.description}
                      </span>
                    </span>
                    {selected && (
                      <CornerDownLeft className="h-4 w-4 shrink-0 text-text-secondary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-text-secondary">
            {query
              ? "Tidak ada hasil yang cocok."
              : "Ketik untuk mencari skill, proyek, eksperimen lab, atau halaman."}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-text-secondary">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border px-1">↑↓</kbd> pilih
            </span>
            <span>
              <kbd className="rounded border border-border px-1">↵</kbd> buka
            </span>
            <span>
              <kbd className="rounded border border-border px-1">esc</kbd> tutup
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span>{visible.length} hasil</span>
          </span>
        </div>
      </dialog>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Sparkles, X, Send, RotateCcw, Cpu, Code2 } from "lucide-react";
import { useAssistantSession, type ChatMessage } from "../lib/assistant/useAssistantSession";
import { getFaq } from "../lib/data";
import { easing, duration } from "../lib/motion";

const CHIP_IDS = ["skills", "projects", "experience", "location", "contact", "certifications"];

const ENGINE_MODAL_COPY = [
  "Aku bukan AI sungguhan — 100% deterministik & berjalan di browser.",
  "Cara kerjaku:",
  "1. Intent engine — cocokkan keyword (word-boundary) dari input terhadap knowledge base FAQ, dengan bobot kata.",
  "2. ELIZA-style fallback — refleksi pronomina + pola, bukan mengarang fakta.",
  "3. Data layer — skill, proyek, pengalaman, sertifikasi diambil dari file JSON yang di-bundle saat build.",
  "Tidak ada runtime API, tidak ada LLM, tidak ada backend. Input yang sama selalu menghasilkan output yang sama.",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.fast, ease: easing["ease-out-expo"] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        role={isUser ? undefined : "status"}
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "rounded-br-sm bg-bg-secondary text-text-primary border border-border"
            : "rounded-bl-sm bg-brand text-[#0c0d0b]"
        }`}
      >
        {isUser ? msg.text : msg.text.length > 0 ? msg.text : <span className="opacity-70">…</span>}
      </div>
    </motion.div>
  );
}

export default function AssistantBot() {
  const faq = useMemo(() => getFaq(), []);
  const chips = useMemo(
    () => faq.filter((f) => CHIP_IDS.includes(f.id)).slice(0, 6),
    [faq],
  );

  const [open, setOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);
  const [input, setInput] = useState("");

  const { messages, statusText, isThinking, send, reset } = useAssistantSession();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking, statusText]);

  // Esc closes the drawer (and engine modal first if open).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (engineOpen) {
          setEngineOpen(false);
        } else {
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, engineOpen]);

  // Focus the input when the drawer opens.
  useEffect(() => {
    if (open) {
      // Slight delay so the drawer transition starts before focusing.
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setInput("");
  };

  const sendFromChip = (question: string) => {
    send(question);
  };

  const handleReset = () => {
    reset();
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        type="button"
        aria-label={open ? "Tutup assistant" : "Buka assistant detAIministic"}
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.normal, ease: easing["ease-out-back"] }}
        className="fixed bottom-5 right-5 z-[9997] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-[#0c0d0b] shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95"
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              role="dialog"
              aria-modal="false"
              aria-label="detAIministic assistant"
              className="fixed bottom-5 right-5 z-[9996] flex h-[min(560px,calc(100dvh-3.5rem))] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-2xl shadow-black/50"
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.96 }}
              transition={easing["ease-spring-gentle"]}
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-[#0c0d0b]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-text-primary">
                    detAIministic assistant
                  </p>
                  <p className="truncate text-xs text-text-secondary">deterministic · no LLM · no backend</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Reset percakapan"
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Buka engine"
                    onClick={() => setEngineOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    <Cpu className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Tutup assistant"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick-pick chips */}
              <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-4 py-2">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => sendFromChip(c.question)}
                    className="shrink-0 rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text-primary transition-colors hover:border-brand hover:text-brand"
                  >
                    {c.question}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3"
              >
                {messages.length === 0 && (
                  <p className="text-sm text-text-secondary">
                    Halo! Aku assistant deterministik di portofolio Abdul. Coba tanya skill, proyek,
                    atau pengalamannya. Ketik <code className="rounded bg-bg-secondary px-1">help</code>{" "}
                    untuk bantuan.
                  </p>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-brand px-3.5 py-2.5 text-sm text-[#0c0d0b]">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                      </span>
                      <span className="ml-2 text-xs opacity-70">{statusText ?? "Berpikir…"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya sesuatu…"
                  aria-label="Pesan ke assistant"
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                <button
                  type="submit"
                  aria-label="Kirim pesan"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-[#0c0d0b] transition-opacity disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>

            {/* Engine transparency modal */}
            <AnimatePresence>
              {engineOpen && (
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Mekanisme engine deterministik"
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setEngineOpen(false)}
                >
                  <motion.div
                    role="document"
                    className="w-full max-w-md rounded-2xl border border-border bg-bg-primary p-6 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={easing["ease-spring-snappy"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-brand" />
                      <h2 className="font-display text-base font-semibold text-text-primary">
                        Cara kerja engine
                      </h2>
                    </div>
                    <div className="space-y-2 text-sm text-text-secondary">
                      {ENGINE_MODAL_COPY.map((line) => (
                        <p key={line} className={line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") ? "pl-4" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEngineOpen(false)}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-[#0c0d0b] transition-opacity hover:opacity-90"
                      >
                        Mengerti
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

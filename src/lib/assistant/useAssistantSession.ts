import { useCallback, useEffect, useRef, useState } from "react";
import { respond, type AssistantResponse } from "./engine";

export type MessageStage = "idle" | "thinking" | "streaming" | "done";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  stage: MessageStage;
}

export interface AssistantSessionOptions {
  /** Duration (ms) of the artificial "thinking" phase. */
  thinkingDelay?: number;
  /** Delay (ms) between character reveals while streaming. */
  streamInterval?: number;
  /** When true, skip thinking + stream instantly (accessibility / tests). */
  reducedMotion?: boolean;
  /** Deterministic id generator override (defaults to a counter). */
  idFactory?: () => string;
}

let DEFAULT_ID = 0;
const defaultId = () => `msg-${++DEFAULT_ID}`;

const THINKING_STATUS = [
  "Mencocokkan intent…",
  "Menyusun jawaban…",
  "Mencari di knowledge base…",
];

/**
 * Deterministic (per input) pick of a thinking status line.
 */
function pickStatus(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return THINKING_STATUS[(hash >>> 0) % THINKING_STATUS.length];
}

/**
 * React hook owning the assistant chat session: message list plus the
 * deterministic thinking -> streaming reveal lifecycle. Pure of any DOM/UI
 * concerns; the AssistantBot island consumes its return value to render.
 */
export function useAssistantSession(options: AssistantSessionOptions = {}) {
  const {
    thinkingDelay = 350,
    streamInterval = 12,
    reducedMotion = false,
    idFactory = defaultId,
  } = options;

  const [reduced] = useState<boolean>(() => {
    if (reducedMotion) return true;
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (thinkingTimer.current) {
      clearTimeout(thinkingTimer.current);
      thinkingTimer.current = null;
    }
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Abort any in-flight thinking/stream (interrupt when user types again).
      clearTimers();

      const userId = idFactory();
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed, stage: "done" },
      ]);

      const assistantId = idFactory();
      let assistantText = "";
      try {
        const res: AssistantResponse = respond(trimmed);
        assistantText = res.text;
      } catch {
        assistantText = "Terjadi kesalahan internal — coba lagi.";
      }

      // Reserve an empty assistant message that will be filled in as we stream.
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: "", stage: "thinking" },
      ]);
      busyRef.current = true;

      const finishStreaming = () => {
        setIsThinking(false);
        setStatusText(null);
        if (reduced) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: assistantText, stage: "done" } : m)),
          );
          busyRef.current = false;
          return;
        }
        let index = 0;
        streamTimer.current = setInterval(() => {
          index += 1;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: assistantText.slice(0, index), stage: "streaming" } : m,
            ),
          );
          if (index >= assistantText.length) {
            if (streamTimer.current) clearInterval(streamTimer.current);
            streamTimer.current = null;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, stage: "done" } : m)),
            );
            busyRef.current = false;
          }
        }, streamInterval);
      };

      if (reduced) {
        finishStreaming();
        return;
      }

      setIsThinking(true);
      setStatusText(pickStatus(trimmed));
      thinkingTimer.current = setTimeout(() => {
        thinkingTimer.current = null;
        finishStreaming();
      }, thinkingDelay);
    },
    [clearTimers, idFactory, reduced, streamInterval, thinkingDelay],
  );

  const reset = useCallback(() => {
    clearTimers();
    busyRef.current = false;
    setMessages([]);
    setStatusText(null);
    setIsThinking(false);
  }, [clearTimers]);

  return { messages, statusText, isThinking, send, reset };
}

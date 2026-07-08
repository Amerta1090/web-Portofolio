import { useEffect, useCallback, useState } from "react";

interface EasterEggConfig {
  konamiCode?: boolean;
  hiddenZones?: HiddenZone[];
  consoleSecrets?: ConsoleSecret[];
  onActivate?: (name: string) => void;
}

interface HiddenZone {
  name: string;
  selector: string;
  message: string;
  effect?: () => void;
}

interface ConsoleSecret {
  trigger: string;
  response: string;
  effect?: () => void;
}

const defaultZones: HiddenZone[] = [
  {
    name: "logo",
    selector: '[class*="logo"]',
    message: "🕵️ Found me! You have sharp eyes!",
  },
  {
    name: "footer",
    selector: "footer",
    message: "Down here? You're thorough!",
  },
];

const defaultConsoleSecrets: ConsoleSecret[] = [
  {
    trigger: "opencode",
    response: "🤖 Hello, fellow developer! Try 'portfolio()' for a surprise.",
  },
  {
    trigger: "portfolio()",
    response: "🚀 Built with Astro + React + TypeScript. Stack: bun, Framer Motion, Three.js, GSAP, D3.",
  },
  {
    trigger: "konami",
    response: "↑↑↓↓←→←→BA — You found the Konami code Easter egg!",
  },
  {
    trigger: "help",
    response: "Available commands: opencode, portfolio(), konami, secret, version",
  },
  {
    trigger: "version",
    response: "Portfolio v0.1.0 — Abdul Majid Ridwan Tyastonoatmaja",
  },
  {
    trigger: "secret",
    response: "✨ You uncovered a hidden secret! The answer is 42.",
  },
];

export default function EasterEgg({
  konamiCode = true,
  hiddenZones = defaultZones,
  consoleSecrets = defaultConsoleSecrets,
  onActivate,
}: EasterEggConfig) {
  const [activatedEggs, setActivatedEggs] = useState<Set<string>>(new Set());
  const [konamiActivated, setKonamiActivated] = useState(false);

  const activate = useCallback(
    (name: string) => {
      setActivatedEggs((prev) => {
        if (prev.has(name)) return prev;
        const next = new Set(prev);
        next.add(name);
        return next;
      });
      onActivate?.(name);
    },
    [onActivate],
  );

  // Konami code detection
  useEffect(() => {
    if (!konamiCode) return;

    const konamiSequence = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    let index = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiSequence[index]) {
        index++;
        if (index === konamiSequence.length) {
          index = 0;
          setKonamiActivated(true);
          activate("konami-code");
          const toast = document.createElement("div");
          toast.className =
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] px-8 py-4 bg-amber-500/20 backdrop-blur-xl border border-amber-400/40 rounded-2xl text-amber-300 text-lg font-bold shadow-2xl shadow-amber-500/20 animate-bounce";
          toast.textContent = "🎮 KONAMI CODE ACTIVATED!";
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        }
      } else {
        index = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [konamiCode, activate]);

  // Console secrets
  useEffect(() => {
    if (consoleSecrets.length === 0) return;

    const secrets = consoleSecrets;
    const originalLog = console.log;
    const originalWarn = console.warn;

    const handler = {
      get(target: typeof console, prop: string) {
        if (prop === "log" || prop === "warn") {
          return (...args: unknown[]) => {
            const msg = args.join(" ");
            const secret = secrets.find((s) => msg.includes(s.trigger));
            if (secret) {
              originalLog(`%c${secret.response}`, "color: #f59e0b; font-weight: bold; font-size: 12px;");
              secret.effect?.();
              activate(`console-${secret.trigger}`);
            }
            Reflect.apply(originalLog, console, args);
          };
        }
        return Reflect.get(target, prop);
      },
    };

    const proxy = new Proxy(console, handler);

    (window as any).__consoleProxy = proxy;

    // Display welcome message
    originalLog(
      "%c🐣 Easter Egg Hunt!",
      "color: #f59e0b; font-size: 16px; font-weight: bold;",
    );
    originalLog(
      "%cType 'help' in the console for available commands.",
      "color: #888; font-size: 12px;",
    );

    return () => {
      delete (window as any).__consoleProxy;
    };
  }, [consoleSecrets, activate]);

  // Hidden click zones
  useEffect(() => {
    if (hiddenZones.length === 0) return;
    const activatedHidden = new Set<string>();

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      for (const zone of hiddenZones) {
        if (
          !activatedHidden.has(zone.name) &&
          target.closest(zone.selector)
        ) {
          activatedHidden.add(zone.name);
          activate(zone.name);

          const toast = document.createElement("div");
          toast.className =
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-bg-secondary/95 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl text-sm animate-in slide-in-from-bottom-4";
          toast.textContent = zone.message;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);

          zone.effect?.();
        }
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hiddenZones, activate]);

  if (activatedEggs.size === 0) return null;

  return null;
}

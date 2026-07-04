import { useEffect, useRef, useCallback } from "react";

type DroneHarmony = "amber" | "purple" | "cyan" | "pink" | "green";

const HARMONIES: Record<DroneHarmony, { base: number; interval: number }> = {
  amber: { base: 55, interval: 82.5 },
  purple: { base: 65.41, interval: 98.0 },
  cyan: { base: 73.42, interval: 110.0 },
  pink: { base: 49.0, interval: 73.5 },
  green: { base: 82.41, interval: 123.5 },
};

interface AmbientSoundProps {
  harmony?: DroneHarmony;
  enabled?: boolean;
}

export default function AmbientSound({ harmony = "amber", enabled = true }: AmbientSoundProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const startedRef = useRef(false);
  const harmonyRef = useRef(harmony);

  harmonyRef.current = harmony;

  const start = useCallback(async () => {
    if (startedRef.current || !enabled) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      const { base, interval } = HARMONIES[harmonyRef.current];

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = base;
      const g1 = ctx.createGain();
      g1.gain.value = 0.04;
      osc1.connect(g1).connect(masterGain);
      osc1.start();

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = interval;
      const g2 = ctx.createGain();
      g2.gain.value = 0.03;
      osc2.connect(g2).connect(masterGain);
      osc2.start();

      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = base * 2;
      const g3 = ctx.createGain();
      g3.gain.value = 0.02;
      osc3.connect(g3).connect(masterGain);
      osc3.start();

      oscsRef.current = [osc1, osc2, osc3];

      // Fade in
      masterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);

      // Slow LFO for breathing effect
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain as any);
      lfo.start();

      startedRef.current = true;
    } catch {
      // Audio context not available
    }
  }, [enabled]);

  // Update harmony when it changes
  useEffect(() => {
    if (!startedRef.current || !ctxRef.current) return;
    const { base, interval } = HARMONIES[harmony];
    if (oscsRef.current[0]) oscsRef.current[0].frequency.setTargetAtTime(base, ctxRef.current.currentTime, 0.5);
    if (oscsRef.current[1]) oscsRef.current[1].frequency.setTargetAtTime(interval, ctxRef.current.currentTime, 0.5);
    if (oscsRef.current[2]) oscsRef.current[2].frequency.setTargetAtTime(base * 2, ctxRef.current.currentTime, 0.5);
  }, [harmony]);

  // Start on first user interaction
  useEffect(() => {
    const handler = () => {
      start();
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", handler);
    };
    document.addEventListener("pointerdown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [start]);

  useEffect(() => {
    return () => {
      oscsRef.current.forEach((o) => {
        try { o.stop(); } catch {}
      });
      oscsRef.current = [];
      ctxRef.current?.close();
      ctxRef.current = null;
      startedRef.current = false;
    };
  }, []);

  return null;
}

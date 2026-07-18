import { useState, useRef, useEffect, useCallback } from "react";

type RoomId = 0 | 1 | 2 | 3 | 4;

interface RoomDef {
  id: RoomId;
  name: string;
  topic: string;
  icon: string;
  color: string;
}

interface Puzzle {
  question: string;
  answer: string | number;
  choices?: (string | number)[];
  hint: string;
}

interface RoomState {
  solved: boolean;
  puzzle: Puzzle;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

const ROOMS: RoomDef[] = [
  { id: 0, name: "Algebra", topic: "Linear Equations", icon: "x", color: "#f59e0b" },
  { id: 1, name: "Geometry", topic: "Shapes & Measures", icon: "\u25B3", color: "#10b981" },
  { id: 2, name: "Calculus", topic: "Derivatives", icon: "\u222B", color: "#6366f1" },
  { id: 3, name: "Number Theory", topic: "Primes & GCD", icon: "p", color: "#ec4899" },
  { id: 4, name: "Probability", topic: "Chance", icon: "%", color: "#14b8a6" },
];

const SOLVED_COLOR = "#22c55e";
const CURRENT_COLOR = "#f59e0b";
const LOCKED_COLOR = "#6b7280";
const BG_COLOR = "#0f0f11";
const CELEBRATION_COLORS = ["#f59e0b", "#22c55e", "#6366f1", "#ec4899", "#14b8a6", "#ef4444", "#ffffff"];

const ROOM_POSITIONS = [
  { x: 0.5, y: 0.2 },
  { x: 0.2, y: 0.45 },
  { x: 0.8, y: 0.45 },
  { x: 0.3, y: 0.75 },
  { x: 0.7, y: 0.75 },
];

const CORRIDORS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2],
];

const BEST_TIME_KEY = "math-escape-room-best";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

function makeChoices(answer: number, count = 4): number[] {
  const wrongs = new Set<number>();
  wrongs.add(answer);
  while (wrongs.size < count) {
    const offset = randInt(1, Math.max(10, Math.abs(answer) + 5));
    const sign = Math.random() > 0.5 ? 1 : -1;
    const w = answer + sign * offset;
    if (w > 0) wrongs.add(w);
  }
  return Array.from(wrongs).sort(() => Math.random() - 0.5);
}

function generatePuzzle(room: RoomId): Puzzle {
  switch (room) {
    case 0: {
      const a = randInt(2, 9);
      const b = randInt(1, 20);
      const x = randInt(1, 15);
      const result = a * x + b;
      const choices = makeChoices(x);
      return {
        question: `Solve: ${a}x + ${b} = ${result}`,
        answer: x,
        choices,
        hint: `Subtract ${b} from both sides: ${a}x = ${result - b}, then divide by ${a}.`,
      };
    }
    case 1: {
      const shape = randChoice(["rectangle", "triangle", "circle"] as const);
      if (shape === "rectangle") {
        const rw = randInt(3, 12);
        const rh = randInt(3, 12);
        const askArea = Math.random() > 0.5;
        const answer = askArea ? rw * rh : 2 * (rw + rh);
        const choices = makeChoices(answer);
        return {
          question: `Rectangle ${rw}\u00D7${rh}: What is the ${askArea ? "area" : "perimeter"}?`,
          answer,
          choices,
          hint: askArea ? `Area = w\u00D7h = ${rw}\u00D7${rh}` : `Perimeter = 2\u00D7(w+h) = 2\u00D7(${rw}+${rh})`,
        };
      } else if (shape === "triangle") {
        const base = randInt(4, 14);
        const ht = randInt(3, 12);
        const answer = (base * ht) / 2;
        const choices = makeChoices(answer);
        return {
          question: `Triangle: base=${base}, height=${ht}. Area?`,
          answer,
          choices,
          hint: `Area = \u00BD\u00D7base\u00D7height = \u00BD\u00D7${base}\u00D7${ht}`,
        };
      } else {
        const r = randInt(2, 8);
        const answer = Math.round(3.14 * r * r);
        const choices = makeChoices(answer);
        return {
          question: `Circle radius ${r}. Area? (\u03C0\u22483.14, round to int)`,
          answer,
          choices,
          hint: `Area = \u03C0\u00D7r\u00B2 = 3.14\u00D7${r}\u00B2 = 3.14\u00D7${r * r}`,
        };
      }
    }
    case 2: {
      const type = randChoice(["deriv", "integral"] as const);
      if (type === "deriv") {
        const a = randInt(2, 6);
        const b = randInt(1, 10);
        const answer = a;
        const choices = makeChoices(answer, 4);
        return {
          question: `Derivative of ${a}x + ${b}?`,
          answer,
          choices,
          hint: `The derivative of ax + b is just a. The constant disappears.`,
        };
      } else {
        const n = randInt(2, 5);
        const answer = n * n;
        const choices = makeChoices(answer);
        return {
          question: `What is \u222B\u2080\u02E9${n} 2x dx?`,
          answer,
          choices,
          hint: `\u222B 2x dx = x\u00B2. From 0 to ${n}: ${n}\u00B2 - 0 = ${answer}`,
        };
      }
    }
    case 3: {
      const type = randChoice(["nextPrime", "gcd", "lcm"] as const);
      if (type === "nextPrime") {
        const start = randInt(10, 50);
        let next = start + 1;
        while (!isPrime(next)) next++;
        const choices = makeChoices(next);
        return {
          question: `Next prime after ${start}?`,
          answer: next,
          choices,
          hint: `Check each number after ${start}: divisible by 2, 3, 5, 7?`,
        };
      } else if (type === "gcd") {
        const g = randInt(3, 8);
        const x = g * randInt(2, 6);
        const y = g * randInt(2, 6);
        const answer = gcd(x, y);
        const choices = makeChoices(answer);
        return {
          question: `gcd(${x}, ${y})?`,
          answer,
          choices,
          hint: `Euclidean algorithm: gcd(a,b) = gcd(b, a%b). Both are multiples of ${g}.`,
        };
      } else {
        const a = randInt(4, 12);
        const b = randInt(4, 12);
        const answer = lcm(a, b);
        const choices = makeChoices(answer);
        return {
          question: `lcm(${a}, ${b})?`,
          answer,
          choices,
          hint: `lcm(a,b) = (a\u00D7b)/gcd(a,b). gcd(${a},${b}) = ${gcd(a, b)}.`,
        };
      }
    }
    case 4: {
      const type = randChoice(["coins", "dice", "cards"] as const);
      if (type === "coins") {
        const n = randInt(2, 4);
        const total = Math.pow(2, n);
        const answer = `1/${total}`;
        const wrongAnswers = [`1/${total / 2}`, `1/${total * 2}`, `${n}/${total}`];
        const choices = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return {
          question: `${n} fair coins. P(all heads)?`,
          answer,
          choices,
          hint: `Each coin: 1/2. For ${n} flips: (1/2)^${n} = 1/${total}`,
        };
      } else if (type === "dice") {
        const sides = randChoice([6, 8, 12] as const);
        const target = randInt(2, Math.min(sides, 6));
        const answer = `${target}/${sides}`;
        const wrongAnswers = [`1/${sides}`, `${sides}/${target}`, `${target + 1}/${sides}`];
        const choices = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return {
          question: `Roll d${sides}. P(\u2264 ${target})?`,
          answer,
          choices,
          hint: `Outcomes \u2264 ${target}: 1..${target} = ${target} out of ${sides}`,
        };
      } else {
        const n = randInt(1, 3);
        const favorable = n * 4;
        const simplified = `${n}/13`;
        const wrongAnswers = [`${n}/52`, `4/52`, `${n * 2}/52`];
        const choices = [simplified, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return {
          question: `P(card is one of ${n} specific rank${n > 1 ? "s" : ""})? (deck=52)`,
          answer: simplified,
          choices,
          hint: `${n} ranks \u00D7 4 suits = ${favorable} cards / 52 = ${simplified}`,
        };
      }
    }
  }
}

function initStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.4 + 0.1,
    twinkleSpeed: Math.random() * 2 + 1,
  }));
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  w: number,
  h: number,
  time: number,
) {
  for (const s of stars) {
    const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.x));
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  }
}

function drawCorridor(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  color: string,
  time: number,
) {
  ctx.save();
  const swayX = Math.sin(time * 0.8) * 10;
  const swayY = Math.cos(time * 0.6) * 10;
  const mx = (ax + bx) / 2 + swayX;
  const my = (ay + by) / 2 + swayY;

  ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 8]);
  ctx.lineDashOffset = -time * 30;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  room: RoomDef,
  state: RoomState,
  isCurrent: boolean,
  time: number,
  roomRadius: number,
) {
  const solved = state.solved;
  const glow = solved ? SOLVED_COLOR : isCurrent ? CURRENT_COLOR : LOCKED_COLOR;
  const pulse = isCurrent ? 0.15 * Math.sin(time * 3) : 0;

  ctx.save();
  if (solved || isCurrent) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20 + Math.abs(pulse) * 30;
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, roomRadius);
  if (solved) {
    grad.addColorStop(0, "rgba(34,197,94,0.22)");
    grad.addColorStop(1, "rgba(34,197,94,0.03)");
  } else if (isCurrent) {
    grad.addColorStop(0, "rgba(245,158,11,0.22)");
    grad.addColorStop(1, "rgba(245,158,11,0.03)");
  } else {
    grad.addColorStop(0, "rgba(107,114,128,0.12)");
    grad.addColorStop(1, "rgba(107,114,128,0.02)");
  }

  ctx.beginPath();
  ctx.arc(cx, cy, roomRadius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = isCurrent ? 3 : 2;
  ctx.globalAlpha = 0.6 + Math.abs(pulse);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#e5e7eb";
  ctx.font = `bold ${Math.max(16, roomRadius * 0.35)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(room.icon, cx, cy - roomRadius * 0.22);

  ctx.fillStyle = "#d1d5db";
  ctx.font = `${Math.max(11, roomRadius * 0.2)}px system-ui, sans-serif`;
  ctx.fillText(room.name, cx, cy + roomRadius * 0.12);

  ctx.fillStyle = "#9ca3af";
  ctx.font = `${Math.max(9, roomRadius * 0.14)}px system-ui, sans-serif`;
  if (solved) {
    ctx.fillStyle = SOLVED_COLOR;
    ctx.fillText("\u2713 Solved", cx, cy + roomRadius * 0.38);
  } else {
    ctx.fillText(isCurrent ? "Enter" : "\uD83D\uDD12 Locked", cx, cy + roomRadius * 0.38);
  }
  ctx.restore();
}

function spawnCelebrationParticles(w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h / 2 + (Math.random() - 0.5) * 80,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      maxLife: 1,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      size: Math.random() * 5 + 2,
    });
  }
  return particles;
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): Particle[] {
  for (const p of particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + (1 - a) * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      vx: p.vx * 0.99,
      life: p.life - 0.007,
    }))
    .filter((p) => p.life > 0);
}

export default function MathEscapeRoom({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const [rooms, setRooms] = useState<RoomState[]>(() =>
    ROOMS.map((r) => ({ solved: false, puzzle: generatePuzzle(r.id) }))
  );
  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null);
  const [playerInput, setPlayerInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const timeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const starsRef = useRef<Star[]>(initStars(80));
  const particlesRef = useRef<Particle[]>([]);
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_TIME_KEY);
      if (stored) setBestTime(Number(stored));
    } catch { /* noop */ }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timeRef.current = 0;
    setTimeElapsed(0);
    timerRef.current = setInterval(() => {
      timeRef.current += 1;
      setTimeElapsed(timeRef.current);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const newGame = useCallback(() => {
    stopTimer();
    setRooms(ROOMS.map((r) => ({ solved: false, puzzle: generatePuzzle(r.id) })));
    setActiveRoom(null);
    setPlayerInput("");
    setShowHint(false);
    setTimeElapsed(0);
    setGameWon(false);
    setFeedback(null);
    particlesRef.current = [];
    startTimer();
  }, [startTimer, stopTimer]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const sx = (canvas.width / dpr) / rect.width;
    const sy = (canvas.height / dpr) / rect.height;
    return {
      mx: (e.clientX - rect.left) * sx,
      my: (e.clientY - rect.top) * sy,
      w: canvas.width / dpr,
      h: canvas.height / dpr,
    };
  }, []);

  const hitTestRoom = useCallback((mx: number, my: number, w: number, h: number): number | null => {
    const roomRadius = Math.min(w, h) * 0.09;
    for (let i = 0; i < ROOMS.length; i++) {
      const px = ROOM_POSITIONS[i].x * w;
      const py = ROOM_POSITIONS[i].y * h;
      const dx = mx - px;
      const dy = my - py;
      if (dx * dx + dy * dy < roomRadius * roomRadius) return i;
    }
    return null;
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameWon) return;

      if (compact) {
        const coords = getCanvasCoords(e);
        if (!coords) return;
        const idx = hitTestRoom(coords.mx, coords.my, coords.w, coords.h);
        if (idx !== null && !roomsRef.current[idx].solved) {
          setRooms((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], solved: true };
            if (next.every((r) => r.solved)) {
              setGameWon(true);
              stopTimer();
              particlesRef.current = spawnCelebrationParticles(coords.w, coords.h);
            }
            return next;
          });
        }
        return;
      }

      if (activeRoom !== null) return;
      const coords = getCanvasCoords(e);
      if (!coords) return;
      const idx = hitTestRoom(coords.mx, coords.my, coords.w, coords.h);
      if (idx !== null) {
        setActiveRoom(idx as RoomId);
        setPlayerInput("");
        setShowHint(false);
        setFeedback(null);
      }
    },
    [compact, activeRoom, gameWon, getCanvasCoords, hitTestRoom, stopTimer]
  );

  const submitAnswer = useCallback(() => {
    if (activeRoom === null || !playerInput.trim()) return;
    const room = rooms[activeRoom];
    if (room.solved) return;

    const puzzle = room.puzzle;
    const correct = String(puzzle.answer) === String(playerInput.trim());

    if (correct) {
      setFeedback("correct");
      const capturedRoom = activeRoom;
      setTimeout(() => {
        setRooms((prev) => {
          const next = [...prev];
          next[capturedRoom] = { ...next[capturedRoom], solved: true };
          if (next.every((r) => r.solved)) {
            setGameWon(true);
            stopTimer();
            const canvas = canvasRef.current;
            if (canvas) {
              const dpr = window.devicePixelRatio || 1;
              particlesRef.current = spawnCelebrationParticles(
                canvas.width / dpr,
                canvas.height / dpr
              );
            }
            try {
              const stored = localStorage.getItem(BEST_TIME_KEY);
              const current = timeRef.current;
              if (!stored || current < Number(stored)) {
                localStorage.setItem(BEST_TIME_KEY, String(current));
                setBestTime(current);
              }
            } catch { /* noop */ }
          }
          return next;
        });
        setActiveRoom(null);
        setFeedback(null);
      }, 800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [activeRoom, rooms, playerInput, stopTimer]);

  const selectChoice = useCallback((choice: string | number) => {
    setPlayerInput(String(choice));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && activeRoom !== null && !rooms[activeRoom].solved) {
        submitAnswer();
      }
      if (e.key === "Escape" && activeRoom !== null) {
        setActiveRoom(null);
        setPlayerInput("");
        setShowHint(false);
        setFeedback(null);
      }
    },
    [activeRoom, rooms, submitAnswer]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const controlH = compact ? 0 : 56;
      canvas.width = rect.width * dpr;
      canvas.height = (rect.height - controlH) * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = (rect.height - controlH) + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const animate = () => {
      if (!running) return;
      rafRef.current = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) / 1000;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);
      drawStars(ctx, starsRef.current, w, h, time);

      const roomRadius = Math.min(w, h) * 0.09;
      const currentRooms = roomsRef.current;

      if (compact) {
        for (const [a, b] of CORRIDORS) {
          const bothSolved = currentRooms[a].solved && currentRooms[b].solved;
          drawCorridor(
            ctx,
            ROOM_POSITIONS[a].x * w, ROOM_POSITIONS[a].y * h,
            ROOM_POSITIONS[b].x * w, ROOM_POSITIONS[b].y * h,
            bothSolved ? SOLVED_COLOR : "rgba(107,114,128,0.35)",
            time
          );
        }
        for (let i = 0; i < ROOMS.length; i++) {
          drawRoom(
            ctx,
            ROOM_POSITIONS[i].x * w, ROOM_POSITIONS[i].y * h,
            ROOMS[i], currentRooms[i], false, time, roomRadius
          );
        }

        if (gameWon) {
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = SOLVED_COLOR;
          ctx.shadowColor = SOLVED_COLOR;
          ctx.shadowBlur = 30;
          ctx.font = `bold ${Math.min(40, w * 0.07)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ESCAPED!", w / 2, h / 2 - 10);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#d1d5db";
          ctx.font = `${Math.min(16, w * 0.03)}px system-ui, sans-serif`;
          ctx.fillText("All rooms solved!", w / 2, h / 2 + 25);
        }
      } else {
        for (const [a, b] of CORRIDORS) {
          const bothSolved = currentRooms[a].solved && currentRooms[b].solved;
          drawCorridor(
            ctx,
            ROOM_POSITIONS[a].x * w, ROOM_POSITIONS[a].y * h,
            ROOM_POSITIONS[b].x * w, ROOM_POSITIONS[b].y * h,
            bothSolved ? SOLVED_COLOR : "rgba(107,114,128,0.35)",
            time
          );
        }
        for (let i = 0; i < ROOMS.length; i++) {
          drawRoom(
            ctx,
            ROOM_POSITIONS[i].x * w, ROOM_POSITIONS[i].y * h,
            ROOMS[i], currentRooms[i], false, time, roomRadius
          );
        }

        if (gameWon) {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = SOLVED_COLOR;
          ctx.shadowColor = SOLVED_COLOR;
          ctx.shadowBlur = 40;
          ctx.font = `bold ${Math.min(48, w * 0.08)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ESCAPED!", w / 2, h / 2 - 20);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#d1d5db";
          ctx.font = `${Math.min(20, w * 0.035)}px system-ui, sans-serif`;
          ctx.fillText(`Time: ${formatTime(timeRef.current)}`, w / 2, h / 2 + 20);
          if (bestTime !== null) {
            ctx.fillText(`Best: ${formatTime(bestTime)}`, w / 2, h / 2 + 48);
          }
        }
      }

      if (particlesRef.current.length > 0) {
        particlesRef.current = updateAndDrawParticles(ctx, particlesRef.current);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, gameWon, bestTime, formatTime]);

  const solvedCount = rooms.filter((r) => r.solved).length;
  const currentPuzzle = activeRoom !== null ? rooms[activeRoom].puzzle : null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f0f11] relative overflow-hidden flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <canvas ref={canvasRef} className="w-full flex-1 cursor-pointer" onClick={handleCanvasClick} />

      {!compact && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={newGame}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg border border-white/10 transition-colors backdrop-blur-sm"
            >
              New Game
            </button>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto">
            <span className="text-white/40 text-xs tabular-nums font-mono">
              {solvedCount}/5 solved
            </span>
            <span className="text-amber-400/80 text-xs tabular-nums font-mono">
              {formatTime(timeElapsed)}
            </span>
            {bestTime !== null && (
              <span className="text-emerald-400/60 text-xs tabular-nums font-mono">
                Best: {formatTime(bestTime)}
              </span>
            )}
          </div>
        </div>
      )}

      {!compact && !gameWon && activeRoom !== null && currentPuzzle && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setActiveRoom(null); setPlayerInput(""); setShowHint(false); setFeedback(null); }} />
          <div className="relative w-[90%] max-w-md mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: ROOMS[activeRoom].color + "22", color: ROOMS[activeRoom].color }}
                  >
                    {ROOMS[activeRoom].icon}
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold">{ROOMS[activeRoom].name}</h3>
                    <p className="text-white/40 text-[10px]">{ROOMS[activeRoom].topic}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveRoom(null); setPlayerInput(""); setShowHint(false); setFeedback(null); }}
                  className="text-white/40 hover:text-white/80 text-lg transition-colors"
                >
                  \u2715
                </button>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
                <p className="text-white text-center text-lg font-mono leading-relaxed">
                  {currentPuzzle.question}
                </p>
              </div>

              {currentPuzzle.choices && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentPuzzle.choices.map((choice, ci) => (
                    <button
                      key={ci}
                      onClick={() => selectChoice(choice)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-mono border transition-all ${
                        String(playerInput) === String(choice)
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {String(choice)}
                    </button>
                  ))}
                </div>
              )}

              {!currentPuzzle.choices && (
                <input
                  type="text"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg font-mono placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 mb-4 transition-colors"
                  autoFocus
                />
              )}

              {feedback === "correct" && (
                <div className="mb-3 py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm text-center font-medium">
                  \u2713 Correct!
                </div>
              )}
              {feedback === "wrong" && (
                <div className="mb-3 py-2 px-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center font-medium">
                  \u2717 Wrong, try again
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex-1 py-2.5 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                >
                  {showHint ? "Hide Hint" : "\uD83D\uDCA1 Hint (-5s)"}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!playerInput.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Submit
                </button>
              </div>

              {showHint && (
                <div className="mt-3 py-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
                  {currentPuzzle.hint}
                </div>
              )}

              <p className="text-white/20 text-[10px] text-center mt-3">
                Press Enter to submit \u2022 Esc to exit room
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

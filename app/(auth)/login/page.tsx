"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { toast } from "sonner";
import { signInAction } from "@/lib/actions";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const STATE_NAMES = ["TWIN ENERGY STREAMS","DNA HELIX VORTEX","COSMIC HORIZON WAVE","GLOWING SPHERE","BLACK HOLE"];
const STATE_DURATION = 9000;
const TRANSITION_DURATION = 2000;
const PARTICLE_COUNT = 400;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function computeTarget(i: number, state: number, t: number, W: number, H: number) {
  const cx = W / 2, cy = H / 2, frac = i / PARTICLE_COUNT, angle = frac * Math.PI * 2;
  if (state === 0) {
    const a = frac * Math.PI * 6 + t * 0.5;
    return { x: cx + (i % 2 === 0 ? -1 : 1) * (80 + Math.sin(a) * 40) + Math.cos(frac * Math.PI * 12) * 20, y: cy - H * 0.4 + frac * H * 0.8 + Math.sin(a * 0.7) * 30 };
  }
  if (state === 1) {
    const a = frac * Math.PI * 8 + t * 1.2 + (i % 2) * Math.PI;
    return { x: cx + Math.cos(a) * (60 + Math.sin(frac * Math.PI * 4) * 20), y: cy - H * 0.35 + frac * H * 0.7 };
  }
  if (state === 2) {
    if (i < 280) return { x: (frac * 1.4 - 0.2) * W, y: cy + Math.sin(frac * Math.PI * 5 + t * 1.5) * 80 + Math.sin(frac * Math.PI * 11 + t) * 30 };
    const seed = (i * 2654435761) >>> 0;
    return { x: seed % W, y: (seed >> 12) % H };
  }
  if (state === 3) {
    const phi = Math.acos(1 - 2 * frac), theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.3, r = Math.min(W, H) * 0.25;
    return { x: cx + Math.sin(phi) * Math.cos(theta) * r, y: cy + Math.sin(phi) * Math.sin(theta) * r * 0.55 };
  }
  const da = angle + t * (0.5 + frac * 1.5), dr = 50 + frac * Math.min(W, H) * 0.33;
  return { x: cx + Math.cos(da) * dr, y: cy + Math.sin(da) * dr * 0.28 };
}

function particleColor(i: number, state: number, t: number): [number, number, number] {
  const frac = i / PARTICLE_COUNT;
  if (state === 0) return i % 2 === 0 ? hsl(280, 1, 0.6) : hsl(30, 1, 0.65);
  if (state === 1) return hsl(200 + frac * 40, 0.9, 0.55 + frac * 0.2);
  if (state === 2) return i < 280 ? hsl(frac < 0.5 ? 220 : 0, 0.9, 0.6) : hsl(60, 0.4, 0.9);
  if (state === 3) return hsl((frac * 120 + 300 + t * 10) % 360, 0.9, 0.65);
  return hsl((frac * 60 + 20) % 360, 1, 0.55 + frac * 0.2);
}

function useParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animId = 0;
    const startTime = performance.now();

    type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; size: number };
    const particles: P[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const a = (i / PARTICLE_COUNT) * Math.PI * 2, r = 100 + Math.random() * 200;
      return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, tx: W / 2, ty: H / 2, vx: 0, vy: 0, size: 1 + Math.random() * 1.5 };
    });

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    function tick(now: number) {
      animId = requestAnimationFrame(tick);
      const elapsed = now - startTime, t = elapsed / 1000;
      const cycle = elapsed % (STATE_DURATION * STATE_NAMES.length);
      const stateFloat = cycle / STATE_DURATION;
      const stateIndex = Math.floor(stateFloat) % STATE_NAMES.length;
      const stateFrac = stateFloat - Math.floor(stateFloat);
      const transRatio = TRANSITION_DURATION / STATE_DURATION;
      const transitioning = stateFrac < transRatio;
      const tp = transitioning ? stateFrac / transRatio : 1;
      const nextState = (stateIndex + 1) % STATE_NAMES.length;

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const tA = computeTarget(i, stateIndex, t, W, H);
        const tB = computeTarget(i, nextState, t, W, H);
        p.tx = lerp(tA.x, tB.x, tp);
        p.ty = lerp(tA.y, tB.y, tp);
        const dx = p.x - mouse.current.x, dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) { const f = (80 - dist) / 80; p.vx += (dx / dist) * f * 3; p.vy += (dy / dist) * f * 3; }
        p.vx += (p.tx - p.x) * 0.05; p.vy += (p.ty - p.y) * 0.05;
        p.vx *= 0.88; p.vy *= 0.88; p.x += p.vx; p.y += p.vy;

        let cr: number, cg: number, cb: number;
        if (transitioning) {
          const [ar, ag, ab] = particleColor(i, stateIndex, t);
          const [br, bg, bb] = particleColor(i, nextState, t);
          cr = Math.round(lerp(ar, br, tp)); cg = Math.round(lerp(ag, bg, tp)); cb = Math.round(lerp(ab, bb, tp));
        } else { [cr, cg, cb] = particleColor(i, stateIndex, t); }

        ctx.shadowColor = `rgb(${cr},${cg},${cb})`; ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${(0.7 + Math.sin(t * 2 + i) * 0.15).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }

      ctx.shadowBlur = 0;
      const label = transitioning ? `${STATE_NAMES[stateIndex]} → ${STATE_NAMES[nextState]}` : STATE_NAMES[stateIndex];
      ctx.font = "11px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center"; ctx.fillText(label, W / 2, H - 18);

      if (stateIndex === 4 && !transitioning) {
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 40);
        g.addColorStop(0, "rgba(255,255,255,0.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.fill();
      }
    }
    animId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMouse); };
  }, []);

  return canvasRef;
}

export default function LoginPage() {
  const canvasRef = useParticleCanvas();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password are required."); return; }
    startTransition(async () => {
      try { await signInAction({ email, password }); }
      catch (err) { toast.error(err instanceof Error ? err.message : "Sign in failed."); }
    });
  };

  const glass: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" };
  const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 16px", width: "100%", fontSize: 14, color: "#fff", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" };

  return (
    <div className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{ position: "relative", minHeight: "100vh", width: "100%", background: "#000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space), system-ui, sans-serif" }}>
      <style>{`
        @keyframes bobbing { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:focus{border-color:#2dd4bf!important;box-shadow:0 0 0 2px rgba(45,212,191,0.2)!important;}
        @media(min-width:1024px){.stat-card{display:flex!important;}}
      `}</style>

      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Navbar */}
      <div style={{ ...glass, position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 14, padding: "10px 24px", borderRadius: 999 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "var(--font-space),sans-serif", letterSpacing: "-0.02em" }}>
          <span style={{ color: "#2dd4bf" }}>B</span>ILLBOOK
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono),monospace", letterSpacing: "0.12em" }}>GST BILLING STUDIO</span>
      </div>

      {/* Stat card left */}
      <div className="stat-card" style={{ ...glass, position: "absolute", left: "max(2rem,5vw)", bottom: "28%", borderRadius: 20, padding: "16px 24px", display: "none", flexDirection: "column", alignItems: "center", gap: 4, animation: "bobbing 4s ease-in-out infinite" }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#2dd4bf", fontFamily: "var(--font-space),sans-serif" }}>₹0</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Subscription cost</span>
      </div>

      {/* Stat card right */}
      <div className="stat-card" style={{ ...glass, position: "absolute", right: "max(2rem,5vw)", bottom: "32%", borderRadius: 20, padding: "16px 24px", display: "none", flexDirection: "column", alignItems: "center", gap: 4, animation: "bobbing 4s ease-in-out infinite 1.8s" }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#2dd4bf", fontFamily: "var(--font-space),sans-serif" }}>100%</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>GST Compliant</span>
      </div>

      {/* Login card */}
      <div style={{ ...glass, position: "relative", zIndex: 10, width: "100%", maxWidth: 400, margin: "0 16px", borderRadius: 24, padding: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#2dd4bf", fontFamily: "var(--font-mono),monospace", marginBottom: 16 }}>BILLING STUDIO</p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#fff", fontFamily: "var(--font-space),sans-serif", marginBottom: 6 }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 32 }}>Sign in to your BillBook account</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} autoComplete="email" required />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} autoComplete="current-password" required />
          </div>
          <button type="submit" disabled={pending}
            style={{ marginTop: 8, width: "100%", borderRadius: 999, padding: "12px 0", fontSize: 14, fontWeight: 600, background: "#2dd4bf", color: "#000", border: "none", cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.6 : 1, transition: "opacity 0.2s", fontFamily: "var(--font-space),sans-serif" }}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Don&apos;t have an account?{" "}
          <span style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "not-allowed" }}>Sign up</span>
        </p>
      </div>
    </div>
  );
}

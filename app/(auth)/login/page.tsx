"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { toast } from "sonner";
import { signInAction } from "@/lib/actions";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// ── particle engine ────────────────────────────────────────────────────────

const STATE_NAMES = ["TWIN ENERGY STREAMS","DNA HELIX VORTEX","COSMIC HORIZON WAVE","GLOWING SPHERE","BLACK HOLE"];
const STATE_DURATION = 9000;
const TRANSITION_DURATION = 2000;
const PARTICLE_COUNT = 500;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function computeTarget(i: number, state: number, t: number, W: number, H: number) {
  const cx = W/2, cy = H/2, frac = i/PARTICLE_COUNT, angle = frac*Math.PI*2;
  if (state === 0) {
    const a = frac*Math.PI*6 + t*0.5;
    return { x: cx+(i%2===0?-1:1)*(80+Math.sin(a)*40)+Math.cos(frac*Math.PI*12)*20, y: cy-H*0.4+frac*H*0.8+Math.sin(a*0.7)*30 };
  }
  if (state === 1) {
    const a = frac*Math.PI*8 + t*1.2 + (i%2)*Math.PI;
    return { x: cx+Math.cos(a)*(60+Math.sin(frac*Math.PI*4)*20), y: cy-H*0.35+frac*H*0.7 };
  }
  if (state === 2) {
    if (i < 280) return { x: (frac*1.4-0.2)*W, y: cy+Math.sin(frac*Math.PI*5+t*1.5)*80+Math.sin(frac*Math.PI*11+t)*30 };
    const seed = (i*2654435761)>>>0;
    return { x: seed%W, y: (seed>>12)%H };
  }
  if (state === 3) {
    const phi = Math.acos(1-2*frac), theta = Math.PI*(1+Math.sqrt(5))*i+t*0.3, r = Math.min(W,H)*0.25;
    return { x: cx+Math.sin(phi)*Math.cos(theta)*r, y: cy+Math.sin(phi)*Math.sin(theta)*r*0.55 };
  }
  const da = angle+t*(0.5+frac*1.5), dr = 50+frac*Math.min(W,H)*0.33;
  return { x: cx+Math.cos(da)*dr, y: cy+Math.sin(da)*dr*0.28 };
}

function particleColor(i: number, state: number, _t: number): [number, number, number, number] {
  const p = i / PARTICLE_COUNT;

  if (state === 0) {
    // Twin Energy Streams: saturated purple + vivid orange
    const a = 0.7 + Math.sin(p * 6) * 0.3;
    return i % 2 === 0 ? [139, 92, 246, a] : [249, 115, 22, a];
  }

  if (state === 1) {
    // DNA Helix: strand 0 = bright ice-white core, strand 1 = electric cyan
    return i % 2 === 0
      ? [224, 247, 255, 0.8 + Math.sin(p * 8) * 0.2]
      : [103, 232, 249, 0.6 + Math.sin(p * 4) * 0.3];
  }

  if (state === 2) {
    if (i < 280) {
      // Wave: deep navy (30,64,175) → vivid red (239,68,68)
      const R = Math.floor(lerp(30, 239, p));
      const G = Math.floor(lerp(64, 68, p));
      const B = Math.floor(lerp(175, 68, p));
      return [R, G, B, 0.75];
    }
    // Starfield — each star gets its own random brightness
    return [255, 255, 255, Math.random() * 0.5 + 0.1];
  }

  if (state === 3) {
    // Glowing sphere — 3 zones by Fibonacci theta angle
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const ang = Math.atan2(Math.sin(theta) * 0.55, Math.cos(theta));
    if (ang > 1)  return [236, 72, 153, 0.75];  // top: hot pink
    if (ang < -1) return [59, 130, 246, 0.75];  // bottom: electric blue
    return [124, 58, 237, 0.75];                 // mid: vivid violet
  }

  // State 4 — Black Hole: white inner ring → blue-white fading outward
  const a4 = Math.max(0.5, 0.8 - (i / PARTICLE_COUNT) * 0.5);
  return i < Math.floor(PARTICLE_COUNT * 0.12) ? [255, 255, 255, 0.9] : [191, 219, 254, a4];
}

function useParticleCanvas(canvasOpacity: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const opacityRef = useRef(canvasOpacity);

  useEffect(() => { opacityRef.current = canvasOpacity; }, [canvasOpacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let animId = 0;
    const startTime = performance.now();

    type P = { x:number; y:number; tx:number; ty:number; vx:number; vy:number; size:number };
    const particles: P[] = Array.from({ length: PARTICLE_COUNT }, (_,i) => {
      const a = (i/PARTICLE_COUNT)*Math.PI*2, r = 10+Math.random()*40;
      return { x: W/2+Math.cos(a)*r, y: H/2+Math.sin(a)*r, tx: W/2, ty: H/2, vx:0, vy:0, size:1+Math.random()*2.0 };
    });

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    function tick(now: number) {
      animId = requestAnimationFrame(tick);
      const elapsed = now - startTime, t = elapsed/1000;
      const cycle = elapsed % (STATE_DURATION*STATE_NAMES.length);
      const stateFloat = cycle/STATE_DURATION;
      const stateIndex = Math.floor(stateFloat) % STATE_NAMES.length;
      const stateFrac = stateFloat - Math.floor(stateFloat);
      const transRatio = TRANSITION_DURATION/STATE_DURATION;
      const transitioning = stateFrac < transRatio;
      const tp = transitioning ? stateFrac/transRatio : 1;
      const nextState = (stateIndex+1) % STATE_NAMES.length;

      const fade = opacityRef.current;

      ctx.fillStyle = `rgba(0,0,0,${fade < 0.1 ? 1 : 0.12})`;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const tA = computeTarget(i, stateIndex, t, W, H);
        const tB = computeTarget(i, nextState, t, W, H);
        p.tx = lerp(tA.x, tB.x, tp);
        p.ty = lerp(tA.y, tB.y, tp);

        const dx = p.x - mouse.current.x, dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80 && dist > 0) {
          const f = (80-dist)/80;
          p.vx += (dx/dist)*f*3; p.vy += (dy/dist)*f*3;
        }
        p.vx += (p.tx-p.x)*0.05; p.vy += (p.ty-p.y)*0.05;
        p.vx *= 0.88; p.vy *= 0.88;
        p.x += p.vx; p.y += p.vy;

        let cr: number, cg: number, cb: number, baseAlpha: number;
        if (transitioning) {
          const [ar,ag,ab,aa] = particleColor(i,stateIndex,t);
          const [br,bg,bb,ba] = particleColor(i,nextState,t);
          cr=Math.round(lerp(ar,br,tp)); cg=Math.round(lerp(ag,bg,tp)); cb=Math.round(lerp(ab,bb,tp));
          baseAlpha = lerp(aa, ba, tp);
        } else { [cr,cg,cb,baseAlpha] = particleColor(i,stateIndex,t); }

        const alpha = Math.max(0.5, baseAlpha) * fade;
        ctx.shadowColor = `rgb(${cr},${cg},${cb})`; ctx.shadowBlur = 7;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(2)})`;

        // Per-state particle sizes — norm maps stored [1,3] to target range
        const norm = (p.size - 1) / 2.0;
        let drawSize: number;
        if (stateIndex === 0) drawSize = 1.5 + norm * 1.0;       // 1.5–2.5
        else if (stateIndex === 1) drawSize = 1.5 + norm * 1.5;  // 1.5–3.0
        else if (stateIndex === 3) drawSize = 1.5 + norm * 1.0;  // 1.5–2.5
        else if (stateIndex === 4) drawSize = 1.0 + norm * 1.0;  // 1.0–2.0
        else drawSize = p.size;

        ctx.beginPath(); ctx.arc(p.x, p.y, drawSize, 0, Math.PI*2); ctx.fill();
      }

      ctx.shadowBlur = 0;
      const label = transitioning ? `${STATE_NAMES[stateIndex]} → ${STATE_NAMES[nextState]}` : STATE_NAMES[stateIndex];
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = `rgba(255,255,255,${(0.3*fade).toFixed(2)})`;
      ctx.textAlign = "center";
      ctx.fillText(label, W/2, H-18);

      if (stateIndex === 4 && !transitioning) {
        // Dark void center
        const void_ = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 36);
        void_.addColorStop(0, "rgba(0,0,0,0.95)");
        void_.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = void_; ctx.beginPath(); ctx.arc(W/2, H/2, 36, 0, Math.PI*2); ctx.fill();
        // Lens flare — bright white point offset to the left
        const fx = W/2 - 120, fy = H/2 - 40;
        const flare = ctx.createRadialGradient(fx, fy, 0, fx, fy, 18);
        flare.addColorStop(0, `rgba(255,255,255,${(0.9*fade).toFixed(2)})`);
        flare.addColorStop(0.3, `rgba(200,220,255,${(0.3*fade).toFixed(2)})`);
        flare.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = flare; ctx.beginPath(); ctx.arc(fx, fy, 18, 0, Math.PI*2); ctx.fill();
      }
    }

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return canvasRef;
}

// ── main component ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [canvasOpacity, setCanvasOpacity] = useState(0);

  useEffect(() => {
    // Slight delay so the browser paints the black frame first
    const t1 = setTimeout(() => {
      setMounted(true);
      // Particles fade in over 1.5s
      const start = performance.now();
      function fadeIn(now: number) {
        const progress = Math.min((now - start) / 1500, 1);
        setCanvasOpacity(progress);
        if (progress < 1) requestAnimationFrame(fadeIn);
      }
      requestAnimationFrame(fadeIn);
    }, 80);
    return () => clearTimeout(t1);
  }, []);

  const canvasRef = useParticleCanvas(canvasOpacity);

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

  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(50,100,200,0.2)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(50,100,200,0.3)",
    borderRadius: 12,
    padding: "10px 16px",
    width: "100%",
    fontSize: 14,
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000", fontFamily: "var(--font-space), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes bobbing{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:focus{border-color:rgba(100,180,255,1)!important;box-shadow:0 0 0 2px rgba(100,180,255,0.25)!important;}
      `}</style>

      {/* Canvas — full screen background */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Full-screen overlay — flex row */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", width: "100%", height: "100%" }}>

        {/* LEFT — transparent, animation shows through, hero text */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 64px" }}>
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 1.2s, transform 0.8s ease 1.2s",
            maxWidth: 520,
          }}>
            {/* Eyebrow */}
            <p style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "3px",
              color: "rgba(100,180,255,0.7)",
              marginBottom: 24,
              textTransform: "uppercase",
            }}>
              01 — Sai Shraddha Powers and Traders
            </p>

            {/* Hero heading */}
            <h1 style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}>
              GST billing<br />that feels instant
            </h1>

            {/* Sub */}
            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
              marginBottom: 40,
            }}>
              Real-time tax calculations. GSTR-1 export.<br />
              Built for Sai Shraddha Powers and Traders.
            </p>

            {/* Stat cards side by side */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ ...glass, borderRadius: 16, padding: "16px 22px", display: "flex", flexDirection: "column", gap: 4, animation: "bobbing 4s ease-in-out infinite" }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(100,200,255,1)", fontFamily: "var(--font-space), sans-serif" }}>₹0</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>Subscription cost</span>
              </div>
              <div style={{ ...glass, borderRadius: 16, padding: "16px 22px", display: "flex", flexDirection: "column", gap: 4, animation: "bobbing 4s ease-in-out infinite 1.8s" }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(100,200,255,1)", fontFamily: "var(--font-space), sans-serif" }}>100%</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>GST Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — dark panel, login form */}
        <div style={{
          width: 440,
          flexShrink: 0,
          background: "rgba(0,0,5,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(50,100,200,0.15)",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: mounted ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1) 1s",
        }}>
          <div style={{ width: 360, padding: "48px 40px" }}>

            {/* Navbar pill inside panel */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#2dd4bf,#34d399)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>B</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "var(--font-space), sans-serif" }}>
                BillBook
              </span>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "rgba(100,180,255,1)", fontFamily: "var(--font-mono), monospace", marginBottom: 14, textTransform: "uppercase" }}>
              Billing Studio
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", fontFamily: "var(--font-space), sans-serif", marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
              Sign in to your BillBook account
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={inputStyle}
                  autoComplete="email"
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                style={{
                  marginTop: 8, width: "100%", borderRadius: 999, padding: "12px 0",
                  fontSize: 14, fontWeight: 600, background: "#2dd4bf", color: "#000",
                  border: "none", cursor: pending ? "not-allowed" : "pointer",
                  opacity: pending ? 0.6 : 1, transition: "opacity 0.2s",
                  fontFamily: "var(--font-space), sans-serif",
                }}
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              Don&apos;t have an account?{" "}
              <span style={{ color: "rgba(255,255,255,0.55)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "not-allowed" }}>
                Sign up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

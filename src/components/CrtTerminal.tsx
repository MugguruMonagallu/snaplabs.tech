import React, { useEffect, useRef, useState } from 'react';

// WebGL Vertex Shader for CRT Quad
const CRT_VERTEX_SHADER = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// WebGL Fragment Shader for CRT Simulation:
// Includes barrel curvature, phosphor halation, scanlines, triad aperture grille,
// chromatic aberration, hum roll bar, cathode flicker, and glass sheen vignette.
const CRT_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uMotion;
uniform vec2 uCurve;
uniform float uScan;
uniform float uScanDepth;
uniform float uTriad;
uniform float uGrille;
uniform float uChroma;
uniform float uBar;
uniform float uFlicker;
uniform float uGrain;
uniform float uVignette;
uniform float uGain;
uniform float uHalo;
uniform vec3 uSheen;
uniform vec3 uRoom;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 o = uv.yx * uv.yx;
  uv += uv * o * uCurve;
  uv = uv * 0.5 + 0.5;
  return uv;
}

void main() {
  vec2 fuv = gl_FragCoord.xy / uRes;
  vec2 uv = curve(fuv);
  float t = uTime;

  vec2 inb = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  float inside = inb.x * inb.y;
  vec2 ed = min(uv, 1.0 - uv);
  inside *= smoothstep(0.0, 0.025, min(ed.x, ed.y));

  vec2 dir = uv - 0.5;
  float d2 = dot(dir, dir);
  vec2 ao = dir * (0.0010 + 0.0075 * d2) * uChroma;
  
  vec3 col;
  col.r = texture2D(uTex, uv + ao).r;
  col.g = texture2D(uTex, uv).g;
  col.b = texture2D(uTex, uv - ao).b;

  // Phosphor halation tap ring
  if (uHalo > 0.001) {
    float s = 0.0035;
    vec3 wide = texture2D(uTex, uv + vec2(s, 0.0)).rgb
              + texture2D(uTex, uv + vec2(-s, 0.0)).rgb
              + texture2D(uTex, uv + vec2(0.0, s)).rgb
              + texture2D(uTex, uv + vec2(0.0, -s)).rgb
              + texture2D(uTex, uv + vec2(s, s) * 0.72).rgb
              + texture2D(uTex, uv + vec2(-s, -s) * 0.72).rgb;
    col += wide * (uHalo / 6.0);
  }

  // Scanlines
  float sl = sin(uv.y * 3.14159265 * uScan + t * 4.0 * uMotion);
  col *= mix(1.0 - uScanDepth, 1.0, sl * sl);

  // Aperture Grille
  float gx = gl_FragCoord.x * (6.2831853 / max(uTriad, 1.0));
  vec3 grille = (1.0 - uGrille) + uGrille * cos(gx + vec3(0.0, 2.094, 4.188));
  col *= mix(vec3(1.0), grille, step(0.001, uGrille));
  col *= uGain;

  // Slow rolling hum bar
  float bar = fract(uv.y * 0.5 - t * 0.07 * uMotion);
  bar = smoothstep(0.0, 0.05, bar) * smoothstep(0.18, 0.05, bar);
  col += bar * uBar * uMotion;

  // Curved glass glare reflection
  float sheen = smoothstep(0.55, 0.0, distance(uv, vec2(0.50, 0.15)));
  col += sheen * 0.035 * uSheen;

  // Peripheral vignette
  float vig = smoothstep(0.98, 0.30, length((uv - 0.5) * vec2(1.05, 1.0)));
  col *= mix(1.0 - uVignette, 1.0, vig);
  col *= 1.0 - uFlicker * uMotion * sin(t * 8.0);

  // Ambient cathode room glow
  col = mix(uRoom, col, inside);

  gl_FragColor = vec4(col, 1.0);
}
`;

type SegmentStyle = 'p' | 'd' | 'a' | 'h';
interface Segment {
  t: string;
  c: SegmentStyle;
}

const segment = (t: string, c: SegmentStyle = 'p'): Segment => ({ t, c });

// SnapLabs simulated real-world telemetry log
const TELEMETRY_LOG: Segment[][] = [
  [segment("SNAPLABS TELEMETRY", "h"), segment("  v2.4.0", "d"), segment("  [ONLINE]", "a")],
  [segment("DEV TRIO: Nikhil · Prem · Sree Teja", "d")],
  [],
  [segment("01. RERA SENTINEL", "a"), segment(" [SPATIAL GIS]", "d")],
  [segment("hmda  Cadastral Survey Layer "), segment("······· ", "d"), segment("READY", "p")],
  [segment("gis0  Lake FTL 30m Buffer  "), segment("·········· ", "d"), segment("VERIFIED", "h")],
  [segment("gis0  Stormwater Stream Buffer "), segment("······ ", "d"), segment("CLEAR", "p")],
  [],
  [segment("02. FAMILY VAULT", "a"), segment(" [ZERO KNOWLEDGE]", "d")],
  [segment("keys  Client AES-256 Derivation "), segment("····· ", "d"), segment("SECURE", "h")],
  [segment("auth  Zero-Knowledge Handshake "), segment("······ ", "d"), segment("CONFIRMED", "p")],
  [segment("db00  Oracle ADB Transaction Sync "), segment("··· ", "d"), segment("LIVE", "p")],
  [],
  [segment("03. TV SHOW TRACKER", "a"), segment(" [EDGE APP]", "d")],
  [segment("bot0  Cloudflare Turnstile  "), segment("········· ", "d"), segment("ARMED", "h")],
  [segment("sess  Better Auth Edge Pool "), segment("········ ", "d"), segment("200 OK", "p")],
  [],
  [segment("SYS STATUS: ALL 3 SYSTEMS ACTIVE", "h"), segment(" ··· ", "d"), segment("ONLINE", "p")],
];

type ColorPalette = {
  p: { fill: string; glow: string };
  d: { fill: string; glow: string };
  a: { fill: string; glow: string };
  h: { fill: string; glow: string };
  background: string;
  sheen: [number, number, number];
  room: [number, number, number];
};

const PALETTES: Record<'crimson' | 'green', ColorPalette> = {
  crimson: {
    p: { fill: "#fb7185", glow: "rgba(225, 29, 72, 0.95)" },
    d: { fill: "#f472b6", glow: "rgba(225, 29, 72, 0.45)" },
    a: { fill: "#fde047", glow: "rgba(234, 179, 8, 0.95)" },
    h: { fill: "#ffffff", glow: "rgba(255, 255, 255, 0.95)" },
    background: "#09090b",
    sheen: [1.0, 0.3, 0.4],
    room: [0.035, 0.035, 0.043],
  },
  green: {
    p: { fill: "#86efac", glow: "rgba(34, 197, 94, 0.95)" },
    d: { fill: "#6ee7b7", glow: "rgba(34, 197, 94, 0.45)" },
    a: { fill: "#fde047", glow: "rgba(234, 179, 8, 0.95)" },
    h: { fill: "#ffffff", glow: "rgba(255, 255, 255, 0.95)" },
    background: "#09090b",
    sheen: [0.55, 1.0, 0.78],
    room: [0.035, 0.035, 0.043],
  },
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create CRT shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "CRT shader compilation failed");
  }
  return shader;
}

export interface CrtTerminalProps {
  className?: string;
  initialMode?: 'crimson' | 'green';
}

export default function CrtTerminal({ className = '', initialMode = 'green' }: CrtTerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'crimson' | 'green'>(initialMode);
  const modeRef = useRef<'crimson' | 'green'>(mode);
  modeRef.current = mode;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const textCanvas = document.createElement('canvas');
    const textContext = textCanvas.getContext('2d');
    if (!textContext) return;

    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;

    try {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, CRT_VERTEX_SHADER);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, CRT_FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );

      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } catch (e) {
      console.warn("CRT WebGL init failed:", e);
      return;
    }

    const uniform = (name: string) => gl.getUniformLocation(program!, name);
    const uRes = uniform('uRes');
    const uTime = uniform('uTime');
    const uMotion = uniform('uMotion');
    const uCurve = uniform('uCurve');
    const uScan = uniform('uScan');
    const uScanDepth = uniform('uScanDepth');
    const uTriad = uniform('uTriad');
    const uGrille = uniform('uGrille');
    const uChroma = uniform('uChroma');
    const uBar = uniform('uBar');
    const uFlicker = uniform('uFlicker');
    const uGrain = uniform('uGrain');
    const uVignette = uniform('uVignette');
    const uGain = uniform('uGain');
    const uHalo = uniform('uHalo');
    const uSheen = uniform('uSheen');
    const uRoom = uniform('uRoom');

    let width = 640;
    let height = 480;
    let charWidth = 8;
    let fontSize = 13;
    let lineHeight = 19;
    let startY = 32;
    let caretX = 0;
    let caretY = 0;
    let typed = 0;
    let done = false;
    let lastBlink = -1;
    let lastReveal = -1;
    let lastTextAt = 0;
    let frameId = 0;
    let isVisible = true;
    const startedAt = performance.now();

    const lineLength = (line: Segment[]) => line.reduce((acc, seg) => acc + seg.t.length, 0);
    const totalChars = TELEMETRY_LOG.reduce((acc, line) => acc + lineLength(line), 0);
    const maxChars = Math.max(...TELEMETRY_LOG.map(lineLength));

    const applyUniforms = () => {
      if (!program) return;
      gl.useProgram(program);
      const palette = PALETTES[modeRef.current];

      // Gentle curvature & crisp CRT phosphor aesthetics
      gl.uniform2f(uCurve, 0.035, 0.055);
      gl.uniform1f(uScanDepth, 0.16);
      gl.uniform1f(uGrille, 0.12);
      gl.uniform1f(uChroma, 0.20);
      gl.uniform1f(uBar, 0.025);
      gl.uniform1f(uFlicker, 0.015);
      gl.uniform1f(uGrain, 0.015);
      gl.uniform1f(uVignette, 0.55);
      gl.uniform1f(uGain, 1.25);
      gl.uniform1f(uHalo, 0.06);
      gl.uniform3f(uSheen, palette.sheen[0], palette.sheen[1], palette.sheen[2]);
      gl.uniform3f(uRoom, palette.room[0], palette.room[1], palette.room[2]);
    };

    const layout = () => {
      startY = height * 0.09;
      lineHeight = (height * 0.82) / Math.max(TELEMETRY_LOG.length, 1);
      fontSize = Math.max(9.5, Math.min(lineHeight * 0.82, (width * 0.90) / (Math.max(maxChars, 1) * 0.62)));
      textContext.font = `600 ${fontSize.toFixed(1)}px 'Geist Mono', ui-monospace, 'JetBrains Mono', monospace`;
      charWidth = textContext.measureText('M').width || fontSize * 0.6;
    };

    const drawScreen = (reveal: number) => {
      const palette = PALETTES[modeRef.current];
      textContext.setTransform(1, 0, 0, 1, 0, 0);
      textContext.fillStyle = palette.background;
      textContext.fillRect(0, 0, width, height);

      textContext.textAlign = 'left';
      textContext.textBaseline = 'top';
      textContext.font = `600 ${fontSize.toFixed(1)}px 'Geist Mono', ui-monospace, 'JetBrains Mono', monospace`;

      let remaining = reveal;
      let y = startY;
      caretX = Math.max(14, Math.floor((width - maxChars * charWidth) / 2));
      caretY = startY;

      for (const line of TELEMETRY_LOG) {
        const len = lineLength(line);
        const visibleInLine = reveal === Infinity ? Infinity : Math.min(remaining, len);
        let x = Math.max(14, Math.floor((width - maxChars * charWidth) / 2));
        let drawn = 0;

        for (const item of line) {
          let text = item.t;
          if (visibleInLine !== Infinity) {
            const left = visibleInLine - drawn;
            if (left <= 0) break;
            if (left < text.length) text = text.slice(0, left);
          }

          if (text.length > 0) {
            const color = palette[item.c];
            // Halation pass (contained subtle phosphor glow)
            textContext.fillStyle = color.fill;
            textContext.shadowColor = color.glow;
            textContext.shadowBlur = fontSize * 0.18;
            textContext.fillText(text, x, y);

            // Crisp pass
            textContext.shadowBlur = 0;
            textContext.fillText(text, x, y);
            x += charWidth * text.length;
          }
          drawn += item.t.length;
          if (visibleInLine !== Infinity && drawn >= visibleInLine) break;
        }

        caretX = x;
        caretY = y;
        if (visibleInLine !== Infinity) remaining -= visibleInLine;
        y += lineHeight;
        if (visibleInLine !== Infinity && remaining <= 0) break;
      }
    };

    const drawCursor = () => {
      const palette = PALETTES[modeRef.current];
      textContext.shadowColor = palette.p.glow;
      textContext.shadowBlur = fontSize * 0.45;
      textContext.fillStyle = palette.p.fill;
      textContext.fillRect(caretX, caretY + fontSize * 0.08, Math.max(charWidth * 0.9, 4), fontSize * 0.94);
      textContext.shadowBlur = 0;
    };

    const uploadTexture = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const cssW = Math.max(1, bounds.width);
      const cssH = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      if (textCanvas.width !== targetW || textCanvas.height !== targetH) {
        textCanvas.width = targetW;
        textCanvas.height = targetH;
        width = targetW;
        height = targetH;
        layout();
        lastReveal = -1;
        lastBlink = -1;
        lastTextAt = 0;
      }

      gl.viewport(0, 0, targetW, targetH);
      gl.uniform2f(uRes, targetW, targetH);
      gl.uniform1f(uScan, Math.max(140, Math.min(cssH * 0.42, 600)));
      gl.uniform1f(uTriad, Math.max(2.4, (3.2 * targetW) / cssW));
    };

    const render = (now: number) => {
      if (!isVisible) return;
      applyUniforms();

      // Typewriter progress
      if (!done) {
        typed += 3.2; // typing speed
        if (typed >= totalChars) {
          typed = totalChars;
          done = true;
        }
      }

      const reveal = done ? Infinity : Math.floor(typed);
      const blink = Math.floor((now - startedAt) / 450) % 2 === 0 ? 1 : 0;
      const due = !done ? now - lastTextAt > 35 : blink !== lastBlink;

      if (due || reveal !== lastReveal) {
        drawScreen(reveal);
        if (blink) drawCursor();
        lastTextAt = now;
        lastReveal = reveal;
        lastBlink = blink;
        uploadTexture();
      }

      const seconds = (now - startedAt) * 0.001;
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uMotion, 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frameId = requestAnimationFrame(render);
    };

    applyUniforms();
    resize();
    frameId = requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true;
      if (isVisible && !frameId) {
        frameId = requestAnimationFrame(render);
      } else if (!isVisible && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });
    intersectionObserver.observe(host);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative w-full aspect-square max-w-md mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#09090b] shadow-2xl p-2.5 flex flex-col justify-between ${className}`}
    >
      {/* Top Header Bar of CRT Chassis */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest select-none z-10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${mode === 'crimson' ? 'bg-[#e11d48]' : 'bg-emerald-400'} animate-pulse`} />
          <span className="text-zinc-300 font-semibold tracking-wider">CATHODE_RAY_01</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'crimson' ? 'green' : 'crimson')}
            className="px-2 py-0.5 rounded text-[9px] font-mono border border-white/10 text-zinc-400 hover:text-white hover:border-white/25 active:scale-95 transition-all"
            title="Toggle Phosphor Mode"
          >
            {mode === 'green' ? 'PHOSPHOR: GREEN' : 'PHOSPHOR: CRIMSON'}
          </button>
        </div>
      </div>

      {/* Curved CRT WebGL Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[260px] rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Bottom Telemetry Chassis Status */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between px-2 text-[10px] font-mono text-zinc-500 select-none z-10">
        <span className="text-zinc-400">FPS: 60 · V-SYNC</span>
        <span className="text-[#e11d48]">SNAPLABS INTERACTIVE</span>
      </div>
    </div>
  );
}

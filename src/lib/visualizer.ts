import type { VizMode, VizTheme } from "@/store/studio";
import { audioEngine } from "@/lib/audio-engine";

export const THEME_COLORS: Record<VizTheme, [string, string, string]> = {
  ember: ["#ffd2c2", "#e85d3a", "#4a140c"],
  ice: ["#eef9ff", "#6eb6d4", "#163a4d"],
  sage: ["#e7f5ea", "#6eaa7c", "#1c3d28"],
  porcelain: ["#ffffff", "#b8b8c2", "#3a3a42"],
  magma: ["#ffe7b0", "#ff6a2a", "#3a0e08"],
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
};

export type OverlayState = {
  camera: HTMLVideoElement | null;
  cameraLayout: "off" | "corner" | "center";
  avatarUrl: string | null;
  useAvatar: boolean;
  lowerThird: string;
  showVideo: boolean;
};

export class VisualizerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rot = 0;
  private last = 0;
  private peaks = new Float32Array(96);
  private avatarImg: HTMLImageElement | null = null;
  private avatarSrc: string | null = null;
  vizMode: VizMode = "circle";
  theme: VizTheme = "ember";
  sensitivity = 1.15;
  overlay: OverlayState = {
    camera: null,
    cameraLayout: "off",
    avatarUrl: null,
    useAvatar: false,
    lowerThird: "",
    showVideo: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas unsupported");
    this.ctx = ctx;
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private idleBands(count: number, t: number, out: Float32Array) {
    for (let i = 0; i < count; i++) {
      const breathe =
        0.22 +
        0.18 * Math.sin(t * 0.7 + i * 0.13) +
        0.1 * Math.sin(t * 1.4 + i * 0.31);
      out[i] = Math.max(0.05, breathe * (0.65 + 0.35 * Math.sin(i * 0.2)));
    }
    return out;
  }

  private palette() {
    return THEME_COLORS[this.theme];
  }

  private gradient(x0: number, y0: number, x1: number, y1: number) {
    const g = this.ctx.createLinearGradient(x0, y0, x1, y1);
    const [a, b, c] = this.palette();
    g.addColorStop(0, a);
    g.addColorStop(0.45, b);
    g.addColorStop(1, c);
    return g;
  }

  frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const ctx = this.ctx;
    ctx.fillStyle = "#08080a";
    ctx.fillRect(0, 0, w, h);

    const media = audioEngine.getMediaElement();
    if (
      this.overlay.showVideo &&
      media instanceof HTMLVideoElement &&
      media.readyState >= 2
    ) {
      ctx.globalAlpha = 0.22;
      this.coverVideo(media, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(8,8,10,0.35)";
      ctx.fillRect(0, 0, w, h);
    }

    const t = now / 1000;
    const bands = audioEngine.getBands(96);
    let energy = 0;
    for (let i = 0; i < bands.length; i++) energy += bands[i];
    energy /= bands.length;
    const live = audioEngine.source !== "idle" && energy > 0.012;
    const data = live ? bands : this.idleBands(96, t, bands);
    const gain = this.sensitivity;

    this.rot += dt * (0.08 + energy * 0.4);

    switch (this.vizMode) {
      case "bars":
        this.drawBars(w, h, data, gain);
        break;
      case "circle":
        this.drawCircle(w, h, data, gain, t);
        break;
      case "wave":
        this.drawWave(w, h, gain, t);
        break;
      case "orbit":
        this.drawOrbit(w, h, data, gain, t);
        break;
      case "bloom":
        this.drawBloom(w, h, data, gain, dt);
        break;
    }

    this.drawBroadcast(w, h);
  }

  private coverVideo(video: HTMLVideoElement, w: number, h: number) {
    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const scale = Math.max(w / vw, h / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    this.ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  private drawBars(w: number, h: number, data: Float32Array, gain: number) {
    const ctx = this.ctx;
    const n = 64;
    const gap = 3;
    const margin = w * 0.08;
    const inner = w - margin * 2;
    const bw = (inner - gap * (n - 1)) / n;
    const base = h * 0.62;
    const maxH = h * 0.42;
    ctx.fillStyle = this.gradient(0, base - maxH, 0, base);
    for (let i = 0; i < n; i++) {
      const v = Math.min(1, (data[Math.floor((i / n) * data.length)] ?? 0) * gain);
      if (v > this.peaks[i]) this.peaks[i] = v;
      else this.peaks[i] *= 0.975;
      const bh = Math.max(4, v * maxH);
      const x = margin + i * (bw + gap);
      const y = base - bh;
      roundRect(ctx, x, y, bw, bh, Math.min(4, bw / 2));
      ctx.fill();
      const py = base - this.peaks[i] * maxH - 3;
      ctx.fillRect(x, py, bw, 2);
    }
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = this.gradient(0, base, 0, h);
    for (let i = 0; i < n; i++) {
      const v = Math.min(1, (data[Math.floor((i / n) * data.length)] ?? 0) * gain);
      const bh = Math.max(4, v * maxH * 0.45);
      const x = margin + i * (bw + gap);
      roundRect(ctx, x, base + 6, bw, bh, Math.min(4, bw / 2));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawCircle(
    w: number,
    h: number,
    data: Float32Array,
    gain: number,
    t: number,
  ) {
    const ctx = this.ctx;
    const cx = w / 2;
    const cy = h / 2;
    const n = 96;
    const radius = Math.min(w, h) * 0.22;
    const maxLen = Math.min(w, h) * 0.28;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.gradient(-radius, 0, radius + maxLen, 0);
    ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const v = Math.min(1.2, (data[i] ?? 0) * gain);
      const a = (i / n) * Math.PI * 2;
      const inner = radius - 6;
      const outer = radius + 8 + v * maxLen;
      ctx.lineWidth = Math.max(2, (Math.PI * 2 * radius) / n - 2.2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();
    const [hi, mid] = this.palette();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 14, 0, Math.PI * 2);
    ctx.strokeStyle = mid;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 0.12 + 0.2 * Math.min(1, data[2] * gain);
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 28 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
    ctx.fillStyle = hi;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawWave(w: number, h: number, gain: number, t: number) {
    const ctx = this.ctx;
    const wave = audioEngine.getWaveform();
    const n = wave.length;
    const mid = h * 0.52;
    const amp = h * 0.22 * Math.max(0.35, gain);
    const idle = audioEngine.source === "idle";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const v = idle
        ? Math.sin(t * 1.4 + i * 0.018) * 0.35 + Math.sin(t * 0.6 + i * 0.04) * 0.15
        : ((wave[i] ?? 128) - 128) / 128;
      const y = mid + v * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.gradient(0, 0, w, 0);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, mid, 0, h);
    const [, b, c] = this.palette();
    fill.addColorStop(0, withAlpha(b, 0.28));
    fill.addColorStop(1, withAlpha(c, 0));
    ctx.fillStyle = fill;
    ctx.fill();
  }

  private drawOrbit(
    w: number,
    h: number,
    data: Float32Array,
    gain: number,
    t: number,
  ) {
    const ctx = this.ctx;
    const cx = w / 2;
    const cy = h / 2;
    const bands = [
      avg(data, 0, 8),
      avg(data, 8, 24),
      avg(data, 24, 48),
      avg(data, 48, 72),
      avg(data, 72, 96),
    ];
    const [hi, mid, lo] = this.palette();
    const colors = [hi, mid, lo, mid, hi];
    bands.forEach((v, i) => {
      const r = Math.min(w, h) * (0.08 + i * 0.07) + v * gain * 28;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = colors[i] ?? mid;
      ctx.globalAlpha = 0.25 + v * 0.55;
      ctx.lineWidth = 2 + v * gain * 10;
      ctx.stroke();
      const dots = 18 + i * 8;
      ctx.globalAlpha = 0.7;
      for (let d = 0; d < dots; d++) {
        const a = (d / dots) * Math.PI * 2 + t * (0.2 + i * 0.08) * (i % 2 ? -1 : 1);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6 + v * 2, 0, Math.PI * 2);
        ctx.fillStyle = hi;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  private drawBloom(
    w: number,
    h: number,
    data: Float32Array,
    gain: number,
    dt: number,
  ) {
    const ctx = this.ctx;
    const bass = avg(data, 0, 10) * gain;
    const cx = w / 2;
    const cy = h / 2;
    if (bass > 0.28 && this.particles.length < 160) {
      const burst = 6 + Math.floor(bass * 10);
      for (let i = 0; i < burst; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + bass * 180;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          size: 1.5 + Math.random() * 3,
        });
      }
    }
    const [hi, mid] = this.palette();
    ctx.globalCompositeOperation = "lighter";
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt * 0.45;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = i % 2 ? hi : mid;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    this.drawCircle(w, h, data, gain * 0.55, 0);
  }

  private drawBroadcast(w: number, h: number) {
    const o = this.overlay;
    const cam = o.camera;
    const hasCam =
      o.cameraLayout !== "off" &&
      cam &&
      cam.readyState >= 2 &&
      cam.videoWidth > 0;
    const avatar = o.useAvatar ? this.ensureAvatar(o.avatarUrl) : null;

    if (o.cameraLayout === "center" && (hasCam || avatar)) {
      const size = Math.min(w, h) * 0.42;
      this.drawRoundMedia(hasCam ? cam! : avatar!, w / 2, h / 2, size, true);
    } else if (o.cameraLayout === "corner" && (hasCam || avatar)) {
      const size = Math.min(180, Math.min(w, h) * 0.28);
      const x = w - size / 2 - 28;
      const y = h - size / 2 - 92;
      this.drawRoundMedia(hasCam ? cam! : avatar!, x, y, size, false);
    }

    if (o.lowerThird.trim()) {
      const ctx = this.ctx;
      const label = o.lowerThird.trim();
      ctx.font = "500 14px Outfit, system-ui, sans-serif";
      const tw = ctx.measureText(label).width;
      const px = 22;
      const py = h - 54;
      const bw = tw + 28;
      const bh = 34;
      ctx.fillStyle = "rgba(8,8,10,0.72)";
      roundRect(ctx, px, py, bw, bh, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(243,243,244,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#f3f3f4";
      ctx.fillText(label, px + 14, py + 22);
    }
  }

  private ensureAvatar(src: string | null) {
    if (!src) {
      this.avatarImg = null;
      this.avatarSrc = null;
      return null;
    }
    if (this.avatarSrc === src && this.avatarImg) return this.avatarImg;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    this.avatarImg = img;
    this.avatarSrc = src;
    return img;
  }

  private drawRoundMedia(
    media: CanvasImageSource,
    cx: number,
    cy: number,
    size: number,
    glow: boolean,
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#121214";
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.drawImage(media, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(243,243,244,0.35)";
    ctx.lineWidth = glow ? 2 : 1.5;
    ctx.stroke();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function avg(data: Float32Array, a: number, b: number) {
  let s = 0;
  const n = Math.max(1, b - a);
  for (let i = a; i < b && i < data.length; i++) s += data[i] ?? 0;
  return s / n;
}

function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

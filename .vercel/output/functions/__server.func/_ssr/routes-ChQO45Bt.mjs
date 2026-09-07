import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { _ as Maximize2, a as UserRound, b as Download, c as Trash2, d as Send, f as Radio, g as Mic, h as Minimize2, i as Video, l as Square, m as Pause, n as Waves, o as Upload, p as Play, r as WandSparkles, t as X, u as Sparkles, v as LoaderCircle, x as Circle, y as Image$1 } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ChQO45Bt.js
var routes_ChQO45Bt_exports = /* @__PURE__ */ __exportAll({
	component: () => Home,
	n: () => recordComposite,
	t: () => Stage
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AudioEngine = class {
	ctx = null;
	analyser = null;
	recDest = null;
	master = null;
	sourceNode = null;
	mediaEl = null;
	micStream = null;
	demoNodes = [];
	demoOsc = [];
	demoTimer = null;
	timeTimer = null;
	freq = /* @__PURE__ */ new Uint8Array(1024);
	time = /* @__PURE__ */ new Uint8Array(1024);
	smoothed = /* @__PURE__ */ new Float32Array(96);
	listeners = {};
	source = "idle";
	fileName = null;
	playing = false;
	async ensure() {
		if (this.ctx) {
			if (this.ctx.state === "suspended") await this.ctx.resume();
			return;
		}
		const ctx = new AudioContext();
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 2048;
		analyser.smoothingTimeConstant = .82;
		analyser.minDecibels = -88;
		analyser.maxDecibels = -18;
		const master = ctx.createGain();
		master.gain.value = .85;
		const recDest = ctx.createMediaStreamDestination();
		analyser.connect(master);
		master.connect(ctx.destination);
		master.connect(recDest);
		this.ctx = ctx;
		this.analyser = analyser;
		this.master = master;
		this.recDest = recDest;
		this.freq = new Uint8Array(analyser.frequencyBinCount);
		this.time = new Uint8Array(analyser.fftSize);
		this.smoothed = /* @__PURE__ */ new Float32Array(96);
	}
	async connectSource(node, hear) {
		await this.ensure();
		this.disconnectSourceOnly();
		this.sourceNode = node;
		node.connect(this.analyser);
		if (this.master) this.master.gain.value = hear ? .85 : 0;
	}
	disconnectSourceOnly() {
		if (this.sourceNode) {
			try {
				this.sourceNode.disconnect();
			} catch {}
			this.sourceNode = null;
		}
		this.stopDemoClock();
		for (const osc of this.demoOsc) try {
			osc.stop();
		} catch {}
		this.demoOsc = [];
		for (const n of this.demoNodes) try {
			n.disconnect();
		} catch {}
		this.demoNodes = [];
		if (this.micStream) {
			this.micStream.getTracks().forEach((t) => t.stop());
			this.micStream = null;
		}
		if (this.mediaEl) {
			this.mediaEl.pause();
			const src = this.mediaEl.src;
			this.mediaEl.removeAttribute("src");
			this.mediaEl.load();
			if (src.startsWith("blob:")) URL.revokeObjectURL(src);
			this.mediaEl = null;
		}
		this.stopTimeClock();
	}
	stopDemoClock() {
		if (this.demoTimer != null) {
			window.clearInterval(this.demoTimer);
			this.demoTimer = null;
		}
	}
	stopTimeClock() {
		if (this.timeTimer != null) {
			window.clearInterval(this.timeTimer);
			this.timeTimer = null;
		}
	}
	getMediaElement() {
		return this.mediaEl;
	}
	captureStream() {
		return this.recDest?.stream ?? null;
	}
	async startDemo() {
		await this.ensure();
		const ctx = this.ctx;
		this.disconnectSourceOnly();
		this.source = "demo";
		this.fileName = null;
		this.playing = true;
		const mix = ctx.createGain();
		mix.gain.value = .9;
		const bass = ctx.createOscillator();
		bass.type = "sine";
		bass.frequency.value = 55;
		const bassGain = ctx.createGain();
		bassGain.gain.value = 0;
		bass.connect(bassGain).connect(mix);
		const mid = ctx.createOscillator();
		mid.type = "triangle";
		mid.frequency.value = 220;
		const midGain = ctx.createGain();
		midGain.gain.value = .045;
		mid.connect(midGain).connect(mix);
		const high = ctx.createOscillator();
		high.type = "sine";
		high.frequency.value = 880;
		const highGain = ctx.createGain();
		highGain.gain.value = .02;
		high.connect(highGain).connect(mix);
		const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate);
		const data = noiseBuf.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		const hatGain = ctx.createGain();
		hatGain.gain.value = 0;
		const hatFilter = ctx.createBiquadFilter();
		hatFilter.type = "highpass";
		hatFilter.frequency.value = 4e3;
		hatGain.connect(hatFilter).connect(mix);
		bass.start();
		mid.start();
		high.start();
		this.demoOsc = [
			bass,
			mid,
			high
		];
		this.demoNodes = [
			mix,
			bassGain,
			midGain,
			highGain,
			hatGain,
			hatFilter
		];
		await this.connectSource(mix, true);
		const step = 60 / 108 / 2;
		let i = 0;
		const tick = () => {
			if (!this.ctx) return;
			const t = this.ctx.currentTime;
			if (i % 4 === 0 || i % 4 === 2) {
				bass.frequency.setValueAtTime(70, t);
				bass.frequency.exponentialRampToValueAtTime(42, t + .18);
				bassGain.gain.cancelScheduledValues(t);
				bassGain.gain.setValueAtTime(.9, t);
				bassGain.gain.exponentialRampToValueAtTime(.001, t + .28);
			}
			if (i % 2 === 1) {
				const src = ctx.createBufferSource();
				src.buffer = noiseBuf;
				src.connect(hatGain);
				hatGain.gain.cancelScheduledValues(t);
				hatGain.gain.setValueAtTime(.18, t);
				hatGain.gain.exponentialRampToValueAtTime(.001, t + .08);
				src.start(t);
				src.stop(t + .09);
			}
			mid.frequency.setValueAtTime(i % 8 < 4 ? 196 : 246.9, t);
			high.frequency.setValueAtTime(i % 8 < 4 ? 784 : 659.3, t);
			i += 1;
		};
		tick();
		this.demoTimer = window.setInterval(tick, step * 1e3);
		this.listeners.onSource?.("demo", null);
		this.listeners.onTime?.(0, 0, true);
	}
	async startMic() {
		await this.ensure();
		const stream = await navigator.mediaDevices.getUserMedia({ audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		} });
		this.disconnectSourceOnly();
		this.micStream = stream;
		const node = this.ctx.createMediaStreamSource(stream);
		this.source = "mic";
		this.fileName = null;
		this.playing = true;
		await this.connectSource(node, false);
		this.listeners.onSource?.("mic", null);
		this.listeners.onTime?.(0, 0, true);
	}
	async loadFile(file) {
		await this.ensure();
		this.disconnectSourceOnly();
		const url = URL.createObjectURL(file);
		const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
		el.src = url;
		el.crossOrigin = "anonymous";
		if (el instanceof HTMLVideoElement) el.playsInline = true;
		el.preload = "auto";
		await new Promise((resolve, reject) => {
			el.onloadedmetadata = () => resolve();
			el.onerror = () => reject(/* @__PURE__ */ new Error("Could not read this file"));
		});
		const node = this.ctx.createMediaElementSource(el);
		this.mediaEl = el;
		this.source = "file";
		this.fileName = file.name;
		this.playing = true;
		await this.connectSource(node, true);
		el.onended = () => {
			this.playing = false;
			this.listeners.onEnded?.();
			this.listeners.onTime?.(el.duration || 0, el.duration || 0, false);
		};
		await el.play();
		this.listeners.onSource?.("file", file.name);
		this.startProgressClock();
	}
	startProgressClock() {
		this.stopTimeClock();
		this.timeTimer = window.setInterval(() => {
			const el = this.mediaEl;
			if (!el) return;
			this.listeners.onTime?.(el.currentTime, el.duration || 0, !el.paused);
		}, 200);
	}
	async togglePlay() {
		if (this.source === "file" && this.mediaEl) {
			if (this.mediaEl.paused) {
				await this.ensure();
				await this.mediaEl.play();
				this.playing = true;
			} else {
				this.mediaEl.pause();
				this.playing = false;
			}
			this.listeners.onTime?.(this.mediaEl.currentTime, this.mediaEl.duration || 0, this.playing);
			return this.playing;
		}
		if (this.source === "demo") {
			if (this.playing) {
				await this.ctx?.suspend();
				this.playing = false;
			} else {
				await this.ctx?.resume();
				this.playing = true;
			}
			this.listeners.onTime?.(0, 0, this.playing);
			return this.playing;
		}
		if (this.source === "mic") return true;
		await this.startDemo();
		return true;
	}
	seek(ratio) {
		if (!this.mediaEl || !this.mediaEl.duration) return;
		this.mediaEl.currentTime = Math.max(0, Math.min(this.mediaEl.duration, ratio * this.mediaEl.duration));
	}
	stopToIdle() {
		this.disconnectSourceOnly();
		this.source = "idle";
		this.fileName = null;
		this.playing = false;
		this.listeners.onSource?.("idle", null);
		this.listeners.onTime?.(0, 0, false);
	}
	getBands(count = 96) {
		const out = this.smoothed.length === count ? this.smoothed : this.smoothed = new Float32Array(count);
		if (!this.analyser) return out;
		this.analyser.getByteFrequencyData(this.freq);
		const bins = this.freq;
		const n = bins.length;
		for (let i = 0; i < count; i++) {
			const t0 = i / count;
			const t1 = (i + 1) / count;
			const i0 = Math.floor(Math.pow(t0, 2.05) * (n - 1));
			const i1 = Math.max(i0 + 1, Math.floor(Math.pow(t1, 2.05) * (n - 1)));
			let sum = 0;
			for (let k = i0; k <= i1; k++) sum += bins[k] ?? 0;
			const target = sum / (i1 - i0 + 1) / 255;
			out[i] += (target - out[i]) * .22;
		}
		return out;
	}
	getWaveform() {
		if (!this.analyser) return this.time;
		this.analyser.getByteTimeDomainData(this.time);
		return this.time;
	}
	destroy() {
		this.disconnectSourceOnly();
		this.ctx?.close();
		this.ctx = null;
	}
};
var audioEngine = new AudioEngine();
var THEME_COLORS = {
	ember: [
		"#ffd2c2",
		"#e85d3a",
		"#4a140c"
	],
	ice: [
		"#eef9ff",
		"#6eb6d4",
		"#163a4d"
	],
	sage: [
		"#e7f5ea",
		"#6eaa7c",
		"#1c3d28"
	],
	porcelain: [
		"#ffffff",
		"#b8b8c2",
		"#3a3a42"
	],
	magma: [
		"#ffe7b0",
		"#ff6a2a",
		"#3a0e08"
	]
};
var VisualizerRenderer = class {
	canvas;
	ctx;
	particles = [];
	rot = 0;
	last = 0;
	peaks = /* @__PURE__ */ new Float32Array(96);
	avatarImg = null;
	avatarSrc = null;
	vizMode = "circle";
	theme = "ember";
	sensitivity = 1.15;
	overlay = {
		camera: null,
		cameraLayout: "off",
		avatarUrl: null,
		useAvatar: false,
		lowerThird: "",
		showVideo: false
	};
	constructor(canvas) {
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
	idleBands(count, t, out) {
		for (let i = 0; i < count; i++) {
			const breathe = .22 + .18 * Math.sin(t * .7 + i * .13) + .1 * Math.sin(t * 1.4 + i * .31);
			out[i] = Math.max(.05, breathe * (.65 + .35 * Math.sin(i * .2)));
		}
		return out;
	}
	palette() {
		return THEME_COLORS[this.theme];
	}
	gradient(x0, y0, x1, y1) {
		const g = this.ctx.createLinearGradient(x0, y0, x1, y1);
		const [a, b, c] = this.palette();
		g.addColorStop(0, a);
		g.addColorStop(.45, b);
		g.addColorStop(1, c);
		return g;
	}
	frame(now) {
		const dt = Math.min(.05, (now - this.last) / 1e3 || .016);
		this.last = now;
		const w = this.canvas.clientWidth;
		const h = this.canvas.clientHeight;
		const ctx = this.ctx;
		ctx.fillStyle = "#08080a";
		ctx.fillRect(0, 0, w, h);
		const media = audioEngine.getMediaElement();
		if (this.overlay.showVideo && media instanceof HTMLVideoElement && media.readyState >= 2) {
			ctx.globalAlpha = .22;
			this.coverVideo(media, w, h);
			ctx.globalAlpha = 1;
			ctx.fillStyle = "rgba(8,8,10,0.35)";
			ctx.fillRect(0, 0, w, h);
		}
		const t = now / 1e3;
		const bands = audioEngine.getBands(96);
		let energy = 0;
		for (let i = 0; i < bands.length; i++) energy += bands[i];
		energy /= bands.length;
		const data = audioEngine.source !== "idle" && energy > .012 ? bands : this.idleBands(96, t, bands);
		const gain = this.sensitivity;
		this.rot += dt * (.08 + energy * .4);
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
			case "bloom": this.drawBloom(w, h, data, gain, dt);
		}
		this.drawBroadcast(w, h);
	}
	coverVideo(video, w, h) {
		const vw = video.videoWidth || w;
		const vh = video.videoHeight || h;
		const scale = Math.max(w / vw, h / vh);
		const dw = vw * scale;
		const dh = vh * scale;
		this.ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
	}
	drawBars(w, h, data, gain) {
		const ctx = this.ctx;
		const n = 64;
		const gap = 3;
		const margin = w * .08;
		const bw = (w - margin * 2 - 189) / n;
		const base = h * .62;
		const maxH = h * .42;
		ctx.fillStyle = this.gradient(0, base - maxH, 0, base);
		for (let i = 0; i < n; i++) {
			const v = Math.min(1, (data[Math.floor(i / n * data.length)] ?? 0) * gain);
			if (v > this.peaks[i]) this.peaks[i] = v;
			else this.peaks[i] *= .975;
			const bh = Math.max(4, v * maxH);
			const x = margin + i * (bw + gap);
			roundRect(ctx, x, base - bh, bw, bh, Math.min(4, bw / 2));
			ctx.fill();
			const py = base - this.peaks[i] * maxH - 3;
			ctx.fillRect(x, py, bw, 2);
		}
		ctx.globalAlpha = .18;
		ctx.fillStyle = this.gradient(0, base, 0, h);
		for (let i = 0; i < n; i++) {
			const v = Math.min(1, (data[Math.floor(i / n * data.length)] ?? 0) * gain);
			const bh = Math.max(4, v * maxH * .45);
			roundRect(ctx, margin + i * (bw + gap), base + 6, bw, bh, Math.min(4, bw / 2));
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}
	drawCircle(w, h, data, gain, t) {
		const ctx = this.ctx;
		const cx = w / 2;
		const cy = h / 2;
		const n = 96;
		const radius = Math.min(w, h) * .22;
		const maxLen = Math.min(w, h) * .28;
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(this.rot);
		ctx.strokeStyle = this.gradient(-radius, 0, radius + maxLen, 0);
		ctx.lineCap = "round";
		for (let i = 0; i < n; i++) {
			const v = Math.min(1.2, (data[i] ?? 0) * gain);
			const a = i / n * Math.PI * 2;
			const inner = radius - 6;
			const outer = radius + 8 + v * maxLen;
			ctx.lineWidth = Math.max(2, Math.PI * 2 * radius / n - 2.2);
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
		ctx.globalAlpha = .35;
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.globalAlpha = .12 + .2 * Math.min(1, data[2] * gain);
		ctx.beginPath();
		ctx.arc(cx, cy, radius - 28 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
		ctx.fillStyle = hi;
		ctx.fill();
		ctx.globalAlpha = 1;
	}
	drawWave(w, h, gain, t) {
		const ctx = this.ctx;
		const wave = audioEngine.getWaveform();
		const n = wave.length;
		const mid = h * .52;
		const amp = h * .22 * Math.max(.35, gain);
		const idle = audioEngine.source === "idle";
		ctx.beginPath();
		for (let i = 0; i < n; i++) {
			const x = i / (n - 1) * w;
			const y = mid + (idle ? Math.sin(t * 1.4 + i * .018) * .35 + Math.sin(t * .6 + i * .04) * .15 : ((wave[i] ?? 128) - 128) / 128) * amp;
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
		fill.addColorStop(0, withAlpha(b, .28));
		fill.addColorStop(1, withAlpha(c, 0));
		ctx.fillStyle = fill;
		ctx.fill();
	}
	drawOrbit(w, h, data, gain, t) {
		const ctx = this.ctx;
		const cx = w / 2;
		const cy = h / 2;
		const bands = [
			avg(data, 0, 8),
			avg(data, 8, 24),
			avg(data, 24, 48),
			avg(data, 48, 72),
			avg(data, 72, 96)
		];
		const [hi, mid, lo] = this.palette();
		const colors = [
			hi,
			mid,
			lo,
			mid,
			hi
		];
		bands.forEach((v, i) => {
			const r = Math.min(w, h) * (.08 + i * .07) + v * gain * 28;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.strokeStyle = colors[i] ?? mid;
			ctx.globalAlpha = .25 + v * .55;
			ctx.lineWidth = 2 + v * gain * 10;
			ctx.stroke();
			const dots = 18 + i * 8;
			ctx.globalAlpha = .7;
			for (let d = 0; d < dots; d++) {
				const a = d / dots * Math.PI * 2 + t * (.2 + i * .08) * (i % 2 ? -1 : 1);
				ctx.beginPath();
				ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6 + v * 2, 0, Math.PI * 2);
				ctx.fillStyle = hi;
				ctx.fill();
			}
		});
		ctx.globalAlpha = 1;
	}
	drawBloom(w, h, data, gain, dt) {
		const ctx = this.ctx;
		const bass = avg(data, 0, 10) * gain;
		const cx = w / 2;
		const cy = h / 2;
		if (bass > .28 && this.particles.length < 160) {
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
					size: 1.5 + Math.random() * 3
				});
			}
		}
		const [hi, mid] = this.palette();
		ctx.globalCompositeOperation = "lighter";
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vx *= .985;
			p.vy *= .985;
			p.life -= dt * .45;
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
		this.drawCircle(w, h, data, gain * .55, 0);
	}
	drawBroadcast(w, h) {
		const o = this.overlay;
		const cam = o.camera;
		const hasCam = o.cameraLayout !== "off" && cam && cam.readyState >= 2 && cam.videoWidth > 0;
		const avatar = o.useAvatar ? this.ensureAvatar(o.avatarUrl) : null;
		if (o.cameraLayout === "center" && (hasCam || avatar)) {
			const size = Math.min(w, h) * .42;
			this.drawRoundMedia(hasCam ? cam : avatar, w / 2, h / 2, size, true);
		} else if (o.cameraLayout === "corner" && (hasCam || avatar)) {
			const size = Math.min(180, Math.min(w, h) * .28);
			const x = w - size / 2 - 28;
			const y = h - size / 2 - 92;
			this.drawRoundMedia(hasCam ? cam : avatar, x, y, size, false);
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
			ctx.fillText(label, 36, py + 22);
		}
	}
	ensureAvatar(src) {
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
	drawRoundMedia(media, cx, cy, size, glow) {
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
};
function roundRect(ctx, x, y, w, h, r) {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}
function avg(data, a, b) {
	let s = 0;
	const n = Math.max(1, b - a);
	for (let i = a; i < b && i < data.length; i++) s += data[i] ?? 0;
	return s / n;
}
function withAlpha(hex, a) {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
async function compressImage(file, maxSize = 768, quality = .84) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not compress image");
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", quality);
}
function downloadUrl(url, filename) {
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	a.target = "_blank";
	document.body.appendChild(a);
	a.click();
	a.remove();
}
var VIZ_MODES = [
	{
		id: "bars",
		label: "Bars"
	},
	{
		id: "circle",
		label: "Circle"
	},
	{
		id: "wave",
		label: "Wave"
	},
	{
		id: "orbit",
		label: "Orbit"
	},
	{
		id: "bloom",
		label: "Bloom"
	}
];
var VIZ_THEMES = [
	{
		id: "ember",
		label: "Ember"
	},
	{
		id: "ice",
		label: "Ice"
	},
	{
		id: "sage",
		label: "Sage"
	},
	{
		id: "porcelain",
		label: "Porcelain"
	},
	{
		id: "magma",
		label: "Magma"
	}
];
var useStudio = create()(persist((set) => ({
	mode: "visualizer",
	vizMode: "circle",
	theme: "ember",
	sensitivity: 1.15,
	source: "idle",
	fileName: null,
	duration: 0,
	currentTime: 0,
	playing: false,
	chromeVisible: true,
	photoreal: true,
	aspect: "9:16",
	outputKind: "still",
	clipSeconds: 6,
	generatePrompt: "",
	gallery: [],
	avatars: [],
	activeAvatarId: null,
	messages: [],
	lowerThird: "Live · Lumen",
	cameraLayout: "corner",
	useAvatarOnAir: false,
	setMode: (mode) => set({
		mode,
		chromeVisible: true
	}),
	setVizMode: (vizMode) => set({ vizMode }),
	setTheme: (theme) => set({ theme }),
	setSensitivity: (sensitivity) => set({ sensitivity }),
	setSource: (source, fileName = null) => set({
		source,
		fileName: source === "file" ? fileName : null
	}),
	setTransport: (partial) => set(partial),
	setChromeVisible: (chromeVisible) => set({ chromeVisible }),
	setPhotoreal: (photoreal) => set({ photoreal }),
	setAspect: (aspect) => set({ aspect }),
	setOutputKind: (outputKind) => set({ outputKind }),
	setClipSeconds: (clipSeconds) => set({ clipSeconds }),
	setGeneratePrompt: (generatePrompt) => set({ generatePrompt }),
	addMedia: (item) => set((s) => ({ gallery: [{
		...item,
		id: uid(),
		createdAt: Date.now()
	}, ...s.gallery].slice(0, 40) })),
	removeMedia: (id) => set((s) => ({ gallery: s.gallery.filter((g) => g.id !== id) })),
	addAvatar: (name, notes, refs) => set((s) => {
		const profile = {
			id: uid(),
			name,
			notes,
			refs,
			createdAt: Date.now()
		};
		return {
			avatars: [profile, ...s.avatars].slice(0, 8),
			activeAvatarId: profile.id
		};
	}),
	removeAvatar: (id) => set((s) => ({
		avatars: s.avatars.filter((a) => a.id !== id),
		activeAvatarId: s.activeAvatarId === id ? null : s.activeAvatarId
	})),
	setActiveAvatar: (activeAvatarId) => set({ activeAvatarId }),
	addMessage: (role, text) => set((s) => ({ messages: [...s.messages, {
		id: uid(),
		role,
		text,
		createdAt: Date.now()
	}].slice(-40) })),
	clearMessages: () => set({ messages: [] }),
	setLowerThird: (lowerThird) => set({ lowerThird }),
	setCameraLayout: (cameraLayout) => set({ cameraLayout }),
	setUseAvatarOnAir: (useAvatarOnAir) => set({ useAvatarOnAir })
}), {
	name: "lumen-studio",
	partialize: (s) => ({
		vizMode: s.vizMode,
		theme: s.theme,
		sensitivity: s.sensitivity,
		photoreal: s.photoreal,
		aspect: s.aspect,
		outputKind: s.outputKind,
		clipSeconds: s.clipSeconds,
		gallery: s.gallery,
		avatars: s.avatars,
		activeAvatarId: s.activeAvatarId,
		messages: s.messages,
		lowerThird: s.lowerThird,
		cameraLayout: s.cameraLayout,
		useAvatarOnAir: s.useAvatarOnAir
	})
}));
function useActiveAvatar() {
	return useStudio((s) => s.avatars.find((a) => a.id === s.activeAvatarId) ?? null);
}
function Stage({ camera, onDropFile }) {
	const canvasRef = (0, import_react.useRef)(null);
	const rendererRef = (0, import_react.useRef)(null);
	const vizMode = useStudio((s) => s.vizMode);
	const theme = useStudio((s) => s.theme);
	const sensitivity = useStudio((s) => s.sensitivity);
	const cameraLayout = useStudio((s) => s.cameraLayout);
	const lowerThird = useStudio((s) => s.lowerThird);
	const useAvatarOnAir = useStudio((s) => s.useAvatarOnAir);
	const activeAvatarId = useStudio((s) => s.activeAvatarId);
	const avatars = useStudio((s) => s.avatars);
	const source = useStudio((s) => s.source);
	const mode = useStudio((s) => s.mode);
	const avatar = avatars.find((a) => a.id === activeAvatarId);
	const overlay = {
		camera,
		cameraLayout: mode === "broadcast" ? cameraLayout : "off",
		avatarUrl: avatar?.refs[0] ?? null,
		useAvatar: mode === "broadcast" && useAvatarOnAir,
		lowerThird: mode === "broadcast" ? lowerThird : "",
		showVideo: source === "file"
	};
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const renderer = new VisualizerRenderer(canvas);
		rendererRef.current = renderer;
		renderer.resize();
		const onResize = () => renderer.resize();
		window.addEventListener("resize", onResize);
		let raf = 0;
		const loop = (now) => {
			renderer.frame(now);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const r = rendererRef.current;
		if (!r) return;
		r.vizMode = vizMode;
		r.theme = theme;
		r.sensitivity = sensitivity;
		r.overlay = overlay;
	}, [
		vizMode,
		theme,
		sensitivity,
		overlay,
		camera
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "stage",
		className: "absolute inset-0 overflow-hidden bg-bg",
		onDragOver: (e) => {
			e.preventDefault();
		},
		onDrop: (e) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (file) onDropFile(file);
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pointer-events-none absolute inset-0 opacity-40", "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]") })]
	});
}
function recordComposite(canvas) {
	const vizStream = canvas.captureStream(30);
	const audio = audioEngine.captureStream();
	const mixed = new MediaStream([...vizStream.getVideoTracks(), ...audio?.getAudioTracks() ?? []]);
	const recorder = new MediaRecorder(mixed, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm" });
	const chunks = [];
	recorder.ondataavailable = (e) => {
		if (e.data.size) chunks.push(e.data);
	};
	const done = new Promise((resolve) => {
		recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
	});
	recorder.start();
	return { stop: () => {
		if (recorder.state !== "inactive") recorder.stop();
		return done;
	} };
}
function TooltipProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Provider, {
		delayDuration: 250,
		children
	});
}
function Tooltip({ content, children, side = "top" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root3, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		asChild: true,
		children
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		side,
		sideOffset: 8,
		className: cn("z-50 rounded-sm bg-fg px-2 py-1 text-xs font-medium text-accent-fg"),
		children: content
	}) })] });
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,box-shadow,color] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50", {
	variants: {
		variant: {
			primary: "bg-fg text-accent-fg shadow-[var(--shadow-border)] hover:opacity-90",
			ghost: "bg-transparent text-fg hover:bg-raised",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:bg-raised",
			subtle: "bg-raised text-fg hover:bg-surface",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			sm: "h-9 rounded-[10px] px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-lg px-5 text-[15px]",
			icon: "size-11 rounded-md",
			"icon-sm": "size-9 rounded-[10px]"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-11 w-full touch-none items-center select-none", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-[3px] w-full grow overflow-hidden rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-fg" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg shadow-[var(--shadow-border)] outline-none transition-transform duration-150 ease-out hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent/50" })]
	});
}
function ChipGroup({ value, onChange, options, ariaLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "radiogroup",
		"aria-label": ariaLabel,
		className: "flex flex-wrap gap-1 rounded-lg bg-raised p-1",
		children: options.map((opt) => {
			const active = opt.id === value;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "radio",
				"aria-checked": active,
				onClick: () => onChange(opt.id),
				className: cn("h-8 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color,opacity] duration-150 ease-out", active ? "bg-fg text-accent-fg" : "text-muted hover:text-fg"),
				children: opt.label
			}, opt.id);
		})
	});
}
function Dock({ hidden, fullscreen, onToggleFullscreen, onPickFile }) {
	const vizMode = useStudio((s) => s.vizMode);
	const setVizMode = useStudio((s) => s.setVizMode);
	const theme = useStudio((s) => s.theme);
	const setTheme = useStudio((s) => s.setTheme);
	const sensitivity = useStudio((s) => s.sensitivity);
	const setSensitivity = useStudio((s) => s.setSensitivity);
	const source = useStudio((s) => s.source);
	const playing = useStudio((s) => s.playing);
	const fileName = useStudio((s) => s.fileName);
	const currentTime = useStudio((s) => s.currentTime);
	const duration = useStudio((s) => s.duration);
	const canPause = source === "file" || source === "demo";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-200 ease-out", hidden ? "dock-hidden" : "dock-visible"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-5xl rounded-2xl bg-surface/90 p-2 shadow-[var(--shadow-panel),var(--shadow-border)] backdrop-blur-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								content: "Microphone",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: source === "mic" ? "primary" : "ghost",
									size: "icon",
									"aria-label": "Use microphone",
									onClick: () => void audioEngine.startMic(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-4" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								content: playing && canPause ? "Pause" : "Play",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									"aria-label": playing && canPause ? "Pause" : "Play",
									onClick: () => void audioEngine.togglePlay(),
									disabled: source === "mic",
									children: playing && canPause ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 ml-px" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								content: "Upload audio or video",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: source === "file" ? "primary" : "ghost",
									size: "icon",
									"aria-label": "Upload audio or video",
									onClick: onPickFile,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: source === "demo" ? "primary" : "ghost",
								size: "sm",
								onClick: () => void audioEngine.startDemo(),
								children: "Demo"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden min-w-0 flex-1 items-center gap-3 md:flex",
						children: source === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-xs text-muted",
								children: fileName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs tabular-nums text-muted",
								children: [
									formatClock(currentTime),
									" / ",
									formatClock(duration)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								min: 0,
								max: 1,
								step: .001,
								value: [duration ? currentTime / duration : 0],
								onValueChange: ([v]) => audioEngine.seek(v ?? 0),
								className: "max-w-56",
								"aria-label": "Seek"
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex items-center gap-2 text-xs text-muted",
							children: source === "mic" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-3.5" }), " Listening"] }) : source === "demo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-3.5" }), " Demo pulse"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-3.5" }), " Idle glow"] })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-1 text-muted",
						children: [
							vizMode === "bars" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" }),
							vizMode === "circle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-3.5" }),
							vizMode === "wave" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-3.5" }),
							vizMode === "orbit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }),
							vizMode === "bloom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								content: fullscreen ? "Exit fullscreen" : "Fullscreen",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									"aria-label": fullscreen ? "Exit fullscreen" : "Fullscreen",
									onClick: onToggleFullscreen,
									children: fullscreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
								})
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-col gap-2 border-t border-border pt-2 md:flex-row md:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
						ariaLabel: "Visualizer mode",
						value: vizMode,
						onChange: setVizMode,
						options: VIZ_MODES
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
						ariaLabel: "Color theme",
						value: theme,
						onChange: setTheme,
						options: VIZ_THEMES
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex min-w-40 items-center gap-3 px-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "Sensitivity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: .4,
						max: 2.4,
						step: .02,
						value: [sensitivity],
						onValueChange: ([v]) => setSensitivity(v ?? 1),
						"aria-label": "Sensitivity"
					})]
				})]
			})]
		})
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle outline-none transition-[box-shadow] duration-150", "focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-accent/40", "disabled:opacity-40", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-28 w-full resize-y rounded-lg bg-raised px-3 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)] placeholder:text-subtle outline-none transition-[box-shadow] duration-150", "focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-accent/40", "disabled:opacity-40", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getAiStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("f55d85520203b0ca68806b32dd775d224e89e7dbf6a1371fbfe6857a9f8e3df4"));
var generateStill = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("74e4bd1692b6eb8646ef14c88cce0deeb7ed40d51037424f8eed2c607e32a3fe"));
var startClip = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("a72e56185b4e6e03f84d3e89f744053eb774d4aae32e277946ddb8ac6d699f54"));
var pollClip = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("c09f908c6f6410f2f878636627d927798425e098b2345668c86a5b9a40970442"));
var askDirector = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d6154d4cdb8153a42d7ecb369a38d180534d13f28a0b5d8e9970539124a32bb2"));
var ASPECTS = [
	{
		id: "9:16",
		label: "9:16"
	},
	{
		id: "16:9",
		label: "16:9"
	},
	{
		id: "1:1",
		label: "1:1"
	},
	{
		id: "3:4",
		label: "3:4"
	},
	{
		id: "4:3",
		label: "4:3"
	}
];
function StudioPanel({ mode, onClose, onStartCamera, cameraOn }) {
	if (mode === "visualizer") return null;
	const title = mode === "generate" ? "Generate" : mode === "avatar" ? "Avatar" : mode === "assistant" ? "Director" : "Broadcast";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("panel-enter absolute inset-x-3 top-20 z-30 flex max-h-[min(78dvh,720px)] flex-col overflow-hidden rounded-2xl bg-surface/94 shadow-[var(--shadow-panel),var(--shadow-border)] backdrop-blur-md", "md:inset-auto md:top-20 md:right-4 md:w-[380px]"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Close panel",
				onClick: onClose,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 pb-4",
			children: [
				mode === "generate" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratePanel, {}),
				mode === "avatar" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarPanel, {}),
				mode === "assistant" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantPanel, {}),
				mode === "broadcast" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BroadcastPanel, {
					onStartCamera,
					cameraOn
				})
			]
		})]
	});
}
function GeneratePanel() {
	const prompt = useStudio((s) => s.generatePrompt);
	const setPrompt = useStudio((s) => s.setGeneratePrompt);
	const aspect = useStudio((s) => s.aspect);
	const setAspect = useStudio((s) => s.setAspect);
	const outputKind = useStudio((s) => s.outputKind);
	const setOutputKind = useStudio((s) => s.setOutputKind);
	const photoreal = useStudio((s) => s.photoreal);
	const setPhotoreal = useStudio((s) => s.setPhotoreal);
	const clipSeconds = useStudio((s) => s.clipSeconds);
	const setClipSeconds = useStudio((s) => s.setClipSeconds);
	const addMedia = useStudio((s) => s.addMedia);
	const gallery = useStudio((s) => s.gallery);
	const removeMedia = useStudio((s) => s.removeMedia);
	const avatar = useActiveAvatar();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [available, setAvailable] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		getAiStatus().then((s) => setAvailable(s.available));
	}, []);
	async function run() {
		if (busy) return;
		setBusy(true);
		setStatus(outputKind === "clip" ? "Photographing, then animating…" : "Photographing…");
		try {
			const still = await generateStill({ data: {
				prompt,
				aspectRatio: aspect,
				photoreal,
				refs: avatar?.refs
			} });
			if (!still.ok) {
				toast.error(still.error);
				return;
			}
			addMedia({
				kind: "image",
				url: still.url,
				prompt,
				aspect,
				avatarId: avatar?.id
			});
			if (outputKind === "still") {
				toast.success("Still ready");
				return;
			}
			setStatus("Rendering motion…");
			const started = await startClip({ data: {
				prompt,
				aspectRatio: aspect,
				duration: clipSeconds,
				imageUrl: still.url,
				photoreal
			} });
			if (!started.ok) {
				toast.error(started.error);
				return;
			}
			const url = await waitForClip(started.requestId, setStatus);
			if (!url) return;
			addMedia({
				kind: "video",
				url,
				prompt,
				aspect,
				avatarId: avatar?.id
			});
			toast.success("Clip ready");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Generation failed");
		} finally {
			setBusy(false);
			setStatus(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: ["Photoreal stills and short clips at iPhone 17 Pro photographic quality.", avatar ? ` Using ${avatar.name} as likeness.` : ""]
			}),
			available === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: "AI is not available in this environment."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: prompt,
				onChange: (e) => setPrompt(e.target.value),
				placeholder: "A woman in a linen coat at dusk on a wet Tokyo street, neon reflected in puddles, looking just past camera…",
				rows: 5
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
				ariaLabel: "Aspect ratio",
				value: aspect,
				onChange: setAspect,
				options: ASPECTS
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
					ariaLabel: "Output",
					value: outputKind,
					onChange: setOutputKind,
					options: [{
						id: "still",
						label: "Still"
					}, {
						id: "clip",
						label: "Clip"
					}]
				}), outputKind === "clip" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
					ariaLabel: "Clip length",
					value: String(clipSeconds),
					onChange: (v) => setClipSeconds(Number(v)),
					options: [
						{
							id: "6",
							label: "6s"
						},
						{
							id: "10",
							label: "10s"
						},
						{
							id: "15",
							label: "15s"
						}
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Photoreal camera" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": photoreal,
					onClick: () => setPhotoreal(!photoreal),
					className: cn("relative h-6 w-10 rounded-full transition-colors duration-150", photoreal ? "bg-fg" : "bg-border-strong"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform duration-150", photoreal && "translate-x-4") })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => void run(),
				disabled: busy || !prompt.trim(),
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), busy ? status ?? "Working" : outputKind === "clip" ? "Make clip" : "Make still"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gallery, {
				items: gallery,
				onRemove: removeMedia,
				onAnimate: async (item) => {
					if (busy || item.kind !== "image") return;
					setBusy(true);
					setStatus("Animating still…");
					try {
						const started = await startClip({ data: {
							prompt: item.prompt || "Subtle natural motion",
							aspectRatio: item.aspect,
							duration: clipSeconds,
							imageUrl: item.url,
							photoreal
						} });
						if (!started.ok) {
							toast.error(started.error);
							return;
						}
						const url = await waitForClip(started.requestId, setStatus);
						if (!url) return;
						addMedia({
							kind: "video",
							url,
							prompt: item.prompt,
							aspect: item.aspect,
							avatarId: item.avatarId
						});
						toast.success("Clip ready");
					} finally {
						setBusy(false);
						setStatus(null);
					}
				}
			})
		]
	});
}
async function waitForClip(requestId, setStatus) {
	for (let i = 0; i < 60; i++) {
		setStatus(`Rendering motion ${i + 1}…`);
		const poll = await pollClip({ data: { requestId } });
		if (!poll.ok) {
			toast.error(poll.error);
			return null;
		}
		if (poll.status === "done") return poll.url;
		await new Promise((r) => setTimeout(r, 3e3));
	}
	toast.error("Timed out waiting for the clip.");
	return null;
}
function Gallery({ items, onRemove, onAnimate }) {
	if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-6 text-center text-sm text-muted",
		children: "Stills and clips will land here."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid grid-cols-2 gap-2",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "group relative overflow-hidden rounded-lg bg-raised",
			children: [item.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				src: item.url,
				className: "aspect-[3/4] w-full object-cover",
				muted: true,
				playsInline: true,
				loop: true,
				autoPlay: true,
				crossOrigin: "anonymous"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: item.url,
				alt: item.prompt,
				className: "aspect-[3/4] w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10",
				crossOrigin: "anonymous"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-bg/80 to-transparent p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
				children: [
					item.kind === "image" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "subtle",
						size: "icon-sm",
						"aria-label": "Animate",
						onClick: () => onAnimate(item),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "size-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "subtle",
						size: "icon-sm",
						"aria-label": "Download",
						onClick: () => downloadUrl(item.url, `lumen-${item.kind}.${item.kind === "video" ? "mp4" : "jpg"}`),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "subtle",
						size: "icon-sm",
						"aria-label": "Remove",
						onClick: () => onRemove(item.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
					})
				]
			})]
		}, item.id))
	});
}
function AvatarPanel() {
	const avatars = useStudio((s) => s.avatars);
	const addAvatar = useStudio((s) => s.addAvatar);
	const removeAvatar = useStudio((s) => s.removeAvatar);
	const activeId = useStudio((s) => s.activeAvatarId);
	const setActive = useStudio((s) => s.setActiveAvatar);
	const [name, setName] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [refs, setRefs] = (0, import_react.useState)([]);
	const inputRef = (0, import_react.useRef)(null);
	async function onFiles(files) {
		if (!files) return;
		const next = [...refs];
		for (const file of Array.from(files).slice(0, 5 - next.length)) {
			if (!file.type.startsWith("image/")) continue;
			next.push(await compressImage(file, 720, .82));
		}
		setRefs(next.slice(0, 5));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Train a likeness from 2–5 photos, then generate and animate new shots of the same person."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: name,
				onChange: (e) => setName(e.target.value),
				placeholder: "Avatar name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: notes,
				onChange: (e) => setNotes(e.target.value),
				placeholder: "Wardrobe, age, energy, typical settings",
				rows: 3
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: "image/*",
				multiple: true,
				className: "hidden",
				onChange: (e) => void onFiles(e.target.files)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => inputRef.current?.click(),
				className: "rounded-lg border border-dashed border-border-strong px-3 py-6 text-sm text-muted hover:text-fg",
				children: refs.length ? `${refs.length} of 5 photos` : "Add reference photos"
			}),
			refs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: refs.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: "",
					className: "size-14 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-fg/10"
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => {
					if (!name.trim() || refs.length < 1) {
						toast.error("Name and at least one photo are required.");
						return;
					}
					addAvatar(name.trim(), notes.trim(), refs);
					setName("");
					setNotes("");
					setRefs([]);
					toast.success("Avatar saved — generate with this likeness");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-4" }), "Save avatar"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: avatars.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex items-center gap-3 rounded-lg bg-raised p-2", a.id === activeId && "shadow-[var(--shadow-border-hover)]"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: a.refs[0],
							alt: "",
							className: "size-11 rounded-sm object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "min-w-0 flex-1 text-left",
							onClick: () => setActive(a.id === activeId ? null : a.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-sm font-medium",
								children: a.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs text-muted",
								children: a.id === activeId ? "Active likeness" : `${a.refs.length} refs`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": `Delete ${a.name}`,
							onClick: () => removeAvatar(a.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})
					]
				}, a.id))
			})
		]
	});
}
function AssistantPanel() {
	const messages = useStudio((s) => s.messages);
	const addMessage = useStudio((s) => s.addMessage);
	const setPrompt = useStudio((s) => s.setGeneratePrompt);
	const setMode = useStudio((s) => s.setMode);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);
	async function send() {
		const text = draft.trim();
		if (!text || busy) return;
		setDraft("");
		addMessage("user", text);
		setBusy(true);
		try {
			const res = await askDirector({ data: { messages: [...useStudio.getState().messages].map((m) => ({
				role: m.role,
				text: m.text
			})) } });
			if (!res.ok) {
				toast.error(res.error);
				addMessage("assistant", res.error);
				return;
			}
			addMessage("assistant", res.text);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-[52dvh] flex-col gap-3 md:h-[560px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Shot lists, prompt craft, broadcast staging. Ask, then send a prompt to Generate."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 space-y-3 overflow-y-auto",
				children: [
					messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg bg-raised p-3 text-sm text-muted",
						children: "Try: “Prompt a rainy Tokyo street portrait, 9:16, iPhone 17 Pro look.”"
					}),
					messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
						role: m.role,
						text: m.text,
						onUse: (p) => {
							setPrompt(p);
							setMode("generate");
						}
					}, m.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					send();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					placeholder: "Ask the director",
					disabled: busy
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					disabled: busy || !draft.trim(),
					"aria-label": "Send",
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
				})]
			})
		]
	});
}
function MessageBubble({ role, text, onUse }) {
	const prompts = (0, import_react.useMemo)(() => {
		const found = [];
		const re = /<prompt>([\s\S]*?)<\/prompt>/g;
		let m;
		while (m = re.exec(text)) found.push(m[1].trim());
		return found;
	}, [text]);
	const shown = text.replace(/<\/?prompt>/g, "").trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex", role === "user" ? "justify-end" : "justify-start"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed", role === "user" ? "bg-fg text-accent-fg" : "bg-raised text-fg"),
			children: [shown, prompts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: role === "user" ? "subtle" : "outline",
				size: "sm",
				className: "mt-2",
				onClick: () => onUse(p),
				children: "Use as prompt"
			}, p))]
		})
	});
}
function BroadcastPanel({ onStartCamera, cameraOn }) {
	const layout = useStudio((s) => s.cameraLayout);
	const setLayout = useStudio((s) => s.setCameraLayout);
	const lowerThird = useStudio((s) => s.lowerThird);
	const setLowerThird = useStudio((s) => s.setLowerThird);
	const useAvatarOnAir = useStudio((s) => s.useAvatarOnAir);
	const setUseAvatarOnAir = useStudio((s) => s.setUseAvatarOnAir);
	const avatar = useActiveAvatar();
	const [recording, setRecording] = (0, import_react.useState)(false);
	const recRef = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Composite camera or avatar over the visualizer. Fullscreen the stage, then go live."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: cameraOn ? "primary" : "outline",
				onClick: onStartCamera,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4" }), cameraOn ? "Camera live" : "Enable camera"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
				ariaLabel: "Talent layout",
				value: layout,
				onChange: setLayout,
				options: [
					{
						id: "off",
						label: "Viz only"
					},
					{
						id: "corner",
						label: "Corner"
					},
					{
						id: "center",
						label: "Center"
					}
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Use avatar on air ", avatar ? `(${avatar.name})` : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": useAvatarOnAir,
					onClick: () => setUseAvatarOnAir(!useAvatarOnAir),
					className: cn("relative h-6 w-10 rounded-full transition-colors duration-150", useAvatarOnAir ? "bg-fg" : "bg-border-strong"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform duration-150", useAvatarOnAir && "translate-x-4") })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: lowerThird,
				onChange: (e) => setLowerThird(e.target.value),
				placeholder: "Lower third"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: recording ? "danger" : "outline",
				onClick: async () => {
					if (recording) {
						const rec = recRef.current;
						recRef.current = null;
						setRecording(false);
						if (!rec) return;
						const blob = await rec.stop();
						downloadUrl(URL.createObjectURL(blob), "lumen-broadcast.webm");
						toast.success("Recording saved");
						return;
					}
					const canvas = document.querySelector("#stage canvas");
					if (!canvas) {
						toast.error("Visualizer is not ready.");
						return;
					}
					const { recordComposite } = await import("./stage-BnpzwHWR.mjs");
					recRef.current = recordComposite(canvas);
					setRecording(true);
					toast.message("Recording the stage");
				},
				children: recording ? "Stop recording" : "Record stage"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-subtle",
				children: "Pair with the mic source so the bars follow your voice. Drop a track if you want playback behind you."
			})
		]
	});
}
function ModeNav({ mode, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Studio modes",
		className: "flex items-center gap-1 rounded-lg bg-raised/80 p-1 shadow-[var(--shadow-border)]",
		children: [
			{
				id: "visualizer",
				label: "Viz",
				icon: WandSparkles
			},
			{
				id: "generate",
				label: "Make",
				icon: Image$1
			},
			{
				id: "avatar",
				label: "Avatar",
				icon: UserRound
			},
			{
				id: "assistant",
				label: "Director",
				icon: Send
			},
			{
				id: "broadcast",
				label: "Live",
				icon: Radio
			}
		].map((item) => {
			const Icon = item.icon;
			const active = item.id === mode;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onChange(item.id),
				className: cn("flex h-10 min-w-10 items-center gap-2 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color] duration-150", active ? "bg-fg text-accent-fg" : "text-muted hover:text-fg"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: item.label
				})]
			}, item.id);
		})
	});
}
function StudioShell() {
	const fileRef = (0, import_react.useRef)(null);
	const camRef = (0, import_react.useRef)(null);
	const hideTimer = (0, import_react.useRef)(null);
	const [cameraEl, setCameraEl] = (0, import_react.useState)(null);
	const [cameraOn, setCameraOn] = (0, import_react.useState)(false);
	const [fullscreen, setFullscreen] = (0, import_react.useState)(false);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const mode = useStudio((s) => s.mode);
	const setMode = useStudio((s) => s.setMode);
	const chromeVisible = useStudio((s) => s.chromeVisible);
	const setChromeVisible = useStudio((s) => s.setChromeVisible);
	const setSource = useStudio((s) => s.setSource);
	const setTransport = useStudio((s) => s.setTransport);
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	(0, import_react.useEffect)(() => {
		audioEngine.listeners = {
			onSource: (source, fileName) => {
				setSource(source, fileName);
				setTransport({ playing: source !== "idle" });
			},
			onTime: (currentTime, duration, playing) => {
				setTransport({
					currentTime,
					duration,
					playing
				});
			},
			onEnded: () => setTransport({ playing: false })
		};
		return () => {
			audioEngine.listeners = {};
		};
	}, [setSource, setTransport]);
	const bumpChrome = (0, import_react.useCallback)(() => {
		setChromeVisible(true);
		if (hideTimer.current) window.clearTimeout(hideTimer.current);
		if (mode !== "visualizer") return;
		hideTimer.current = window.setTimeout(() => setChromeVisible(false), 2800);
	}, [mode, setChromeVisible]);
	(0, import_react.useEffect)(() => {
		bumpChrome();
	}, [bumpChrome]);
	(0, import_react.useEffect)(() => {
		const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
		document.addEventListener("fullscreenchange", onFs);
		return () => document.removeEventListener("fullscreenchange", onFs);
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.key === " ") {
				e.preventDefault();
				audioEngine.togglePlay();
			}
			if (e.key === "f" || e.key === "F") {
				e.preventDefault();
				toggleFullscreen();
			}
			if (e.key === "1") useStudio.getState().setVizMode("bars");
			if (e.key === "2") useStudio.getState().setVizMode("circle");
			if (e.key === "3") useStudio.getState().setVizMode("wave");
			if (e.key === "4") useStudio.getState().setVizMode("orbit");
			if (e.key === "5") useStudio.getState().setVizMode("bloom");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	async function toggleFullscreen() {
		const root = document.getElementById("studio-root");
		if (!root) return;
		if (document.fullscreenElement) await document.exitFullscreen();
		else await root.requestFullscreen();
	}
	async function handleFile(file) {
		const audio = file.type.startsWith("audio/");
		const video = file.type.startsWith("video/");
		if (!audio && !video) {
			toast.error("Drop an audio or video file.");
			return;
		}
		try {
			await audioEngine.loadFile(file);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not play file");
		}
	}
	async function startCamera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});
			const el = camRef.current;
			if (!el) return;
			el.srcObject = stream;
			await el.play();
			setCameraEl(el);
			setCameraOn(true);
			if (useStudio.getState().source === "idle") audioEngine.startMic();
		} catch {
			toast.error("Camera permission was denied.");
		}
	}
	const hideDock = mode === "visualizer" && !chromeVisible;
	if (!mounted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg px-4 pt-6 text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-widest text-muted uppercase",
				children: "Studio"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl leading-none tracking-tight",
				children: "Lumen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-sm text-sm leading-relaxed text-muted",
				children: "See sound. Shape the frame. Visualizer, photoreal stills and clips, avatars, director, live broadcast."
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "studio-root",
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		onMouseMove: bumpChrome,
		onTouchStart: bumpChrome,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stage, {
				camera: cameraEl,
				onDropFile: (f) => void handleFile(f)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: camRef,
				className: "pointer-events-none absolute h-0 w-0 opacity-0",
				playsInline: true,
				muted: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: `absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] transition-[opacity,transform] duration-200 ease-out ${hideDock ? "pointer-events-none opacity-0" : "opacity-100"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-widest text-muted uppercase",
					children: "Studio"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl leading-none tracking-tight",
					children: "Lumen"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeNav, {
					mode,
					onChange: setMode
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioPanel, {
				mode,
				onClose: () => setMode("visualizer"),
				onStartCamera: () => void startCamera(),
				cameraOn
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dock, {
				hidden: hideDock,
				fullscreen,
				onToggleFullscreen: () => void toggleFullscreen(),
				onPickFile: () => fileRef.current?.click()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "audio/*,video/*",
				className: "hidden",
				onChange: (e) => {
					const file = e.target.files?.[0];
					if (file) handleFile(file);
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "top-center",
				toastOptions: { className: "!bg-surface !text-fg !border-border !shadow-[var(--shadow-border)]" }
			})
		]
	}) });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioShell, {});
}
//#endregion
export { Home as component, recordComposite as n, routes_ChQO45Bt_exports as r, Stage as t };

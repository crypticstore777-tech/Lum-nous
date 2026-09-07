export type EngineSource = "idle" | "demo" | "mic" | "file";

type Listeners = {
  onTime?: (current: number, duration: number, playing: boolean) => void;
  onEnded?: () => void;
  onSource?: (source: EngineSource, fileName: string | null) => void;
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recDest: MediaStreamAudioDestinationNode | null = null;
  private master: GainNode | null = null;
  private sourceNode: AudioNode | null = null;
  private mediaEl: HTMLMediaElement | null = null;
  private micStream: MediaStream | null = null;
  private demoNodes: AudioNode[] = [];
  private demoOsc: OscillatorNode[] = [];
  private demoTimer: number | null = null;
  private timeTimer: number | null = null;
  private freq = new Uint8Array(1024);
  private time = new Uint8Array(1024);
  private smoothed = new Float32Array(96);
  listeners: Listeners = {};
  source: EngineSource = "idle";
  fileName: string | null = null;
  playing = false;

  async ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    analyser.minDecibels = -88;
    analyser.maxDecibels = -18;
    const master = ctx.createGain();
    master.gain.value = 0.85;
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
    this.smoothed = new Float32Array(96);
  }

  private async connectSource(node: AudioNode, hear: boolean) {
    await this.ensure();
    this.disconnectSourceOnly();
    this.sourceNode = node;
    node.connect(this.analyser!);
    if (this.master) this.master.gain.value = hear ? 0.85 : 0;
  }

  private disconnectSourceOnly() {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        /* noop */
      }
      this.sourceNode = null;
    }
    this.stopDemoClock();
    for (const osc of this.demoOsc) {
      try {
        osc.stop();
      } catch {
        /* noop */
      }
    }
    this.demoOsc = [];
    for (const n of this.demoNodes) {
      try {
        n.disconnect();
      } catch {
        /* noop */
      }
    }
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

  private stopDemoClock() {
    if (this.demoTimer != null) {
      window.clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
  }

  private stopTimeClock() {
    if (this.timeTimer != null) {
      window.clearInterval(this.timeTimer);
      this.timeTimer = null;
    }
  }

  getMediaElement() {
    return this.mediaEl;
  }

  captureStream(): MediaStream | null {
    return this.recDest?.stream ?? null;
  }

  async startDemo() {
    await this.ensure();
    const ctx = this.ctx!;
    this.disconnectSourceOnly();
    this.source = "demo";
    this.fileName = null;
    this.playing = true;

    const mix = ctx.createGain();
    mix.gain.value = 0.9;

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
    midGain.gain.value = 0.045;
    mid.connect(midGain).connect(mix);

    const high = ctx.createOscillator();
    high.type = "sine";
    high.frequency.value = 880;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.02;
    high.connect(highGain).connect(mix);

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const hatGain = ctx.createGain();
    hatGain.gain.value = 0;
    const hatFilter = ctx.createBiquadFilter();
    hatFilter.type = "highpass";
    hatFilter.frequency.value = 4000;
    hatGain.connect(hatFilter).connect(mix);

    bass.start();
    mid.start();
    high.start();
    this.demoOsc = [bass, mid, high];
    this.demoNodes = [mix, bassGain, midGain, highGain, hatGain, hatFilter];
    await this.connectSource(mix, true);

    const bpm = 108;
    const step = 60 / bpm / 2;
    let i = 0;
    const tick = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const kick = i % 4 === 0 || i % 4 === 2;
      if (kick) {
        bass.frequency.setValueAtTime(70, t);
        bass.frequency.exponentialRampToValueAtTime(42, t + 0.18);
        bassGain.gain.cancelScheduledValues(t);
        bassGain.gain.setValueAtTime(0.9, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      }
      if (i % 2 === 1) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.connect(hatGain);
        hatGain.gain.cancelScheduledValues(t);
        hatGain.gain.setValueAtTime(0.18, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.start(t);
        src.stop(t + 0.09);
      }
      mid.frequency.setValueAtTime(i % 8 < 4 ? 196 : 246.9, t);
      high.frequency.setValueAtTime(i % 8 < 4 ? 784 : 659.3, t);
      i += 1;
    };
    tick();
    this.demoTimer = window.setInterval(tick, step * 1000);
    this.listeners.onSource?.("demo", null);
    this.listeners.onTime?.(0, 0, true);
  }

  async startMic() {
    await this.ensure();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.disconnectSourceOnly();
    this.micStream = stream;
    const node = this.ctx!.createMediaStreamSource(stream);
    this.source = "mic";
    this.fileName = null;
    this.playing = true;
    await this.connectSource(node, false);
    this.listeners.onSource?.("mic", null);
    this.listeners.onTime?.(0, 0, true);
  }

  async loadFile(file: File) {
    await this.ensure();
    this.disconnectSourceOnly();
    const url = URL.createObjectURL(file);
    const el = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio",
    );
    el.src = url;
    el.crossOrigin = "anonymous";
    if (el instanceof HTMLVideoElement) el.playsInline = true;
    el.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      el.onloadedmetadata = () => resolve();
      el.onerror = () => reject(new Error("Could not read this file"));
    });
    const node = this.ctx!.createMediaElementSource(el);
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

  private startProgressClock() {
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
      this.listeners.onTime?.(
        this.mediaEl.currentTime,
        this.mediaEl.duration || 0,
        this.playing,
      );
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

  seek(ratio: number) {
    if (!this.mediaEl || !this.mediaEl.duration) return;
    this.mediaEl.currentTime = Math.max(
      0,
      Math.min(this.mediaEl.duration, ratio * this.mediaEl.duration),
    );
  }

  stopToIdle() {
    this.disconnectSourceOnly();
    this.source = "idle";
    this.fileName = null;
    this.playing = false;
    this.listeners.onSource?.("idle", null);
    this.listeners.onTime?.(0, 0, false);
  }

  getBands(count = 96): Float32Array {
    const out =
      this.smoothed.length === count
        ? this.smoothed
        : (this.smoothed = new Float32Array(count));
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
      out[i] += (target - out[i]) * 0.22;
    }
    return out;
  }

  getWaveform(): Uint8Array {
    if (!this.analyser) return this.time;
    this.analyser.getByteTimeDomainData(this.time);
    return this.time;
  }

  destroy() {
    this.disconnectSourceOnly();
    this.ctx?.close();
    this.ctx = null;
  }
}

export const audioEngine = new AudioEngine();

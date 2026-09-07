import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { audioEngine } from "@/lib/audio-engine";
import { Dock } from "@/components/studio/dock";
import { ModeNav, StudioPanel } from "@/components/studio/panels";
import { Stage } from "@/components/studio/stage";
import { useStudio } from "@/store/studio";

export function StudioShell() {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | null>(null);
  const [cameraEl, setCameraEl] = useState<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  const chromeVisible = useStudio((s) => s.chromeVisible);
  const setChromeVisible = useStudio((s) => s.setChromeVisible);
  const setSource = useStudio((s) => s.setSource);
  const setTransport = useStudio((s) => s.setTransport);

  useEffect(() => {
    void useStudio.persist.rehydrate();
  }, []);

  useEffect(() => {
    audioEngine.listeners = {
      onSource: (source, fileName) => {
        setSource(source, fileName);
        setTransport({ playing: source !== "idle" });
      },
      onTime: (currentTime, duration, playing) => {
        setTransport({ currentTime, duration, playing });
      },
      onEnded: () => setTransport({ playing: false }),
    };
    return () => {
      audioEngine.listeners = {};
    };
  }, [setSource, setTransport]);

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (mode !== "visualizer") return;
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), 4200);
  }, [mode, setChromeVisible]);

  useEffect(() => {
    if (mode !== "visualizer") setChromeVisible(true);
  }, [mode, setChromeVisible]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        void audioEngine.togglePlay();
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        void toggleFullscreen();
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

  async function handleFile(file: File) {
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
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const el = camRef.current;
      if (!el) return;
      el.srcObject = stream;
      await el.play();
      setCameraEl(el);
      setCameraOn(true);
      if (useStudio.getState().source === "idle") {
        void audioEngine.startMic();
      }
    } catch {
      toast.error("Camera permission was denied.");
    }
  }

  const hideDock = mode === "visualizer" && !chromeVisible;

  return (
    <TooltipProvider>
      <div
        id="studio-root"
        className="relative h-dvh w-full overflow-hidden bg-bg text-fg"
        onMouseMove={bumpChrome}
        onTouchStart={bumpChrome}
      >
        <Stage camera={cameraEl} onDropFile={(f) => void handleFile(f)} />
        <video
          ref={camRef}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          playsInline
          muted
        />

        <header
          className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] transition-[opacity,transform] duration-200 ease-out ${
            hideDock ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">
              Studio
            </p>
            <h1 className="font-display text-3xl leading-none tracking-tight">
              Lumen
            </h1>
          </div>
          <ModeNav mode={mode} onChange={setMode} />
        </header>

        <StudioPanel
          mode={mode}
          onClose={() => setMode("visualizer")}
          onStartCamera={() => void startCamera()}
          cameraOn={cameraOn}
        />

        <Dock
          hidden={hideDock}
          fullscreen={fullscreen}
          onToggleFullscreen={() => void toggleFullscreen()}
          onPickFile={() => fileRef.current?.click()}
        />

        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className: "!bg-surface !text-fg !border-border !shadow-[var(--shadow-border)]",
          }}
        />
      </div>
    </TooltipProvider>
  );
}

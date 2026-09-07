import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audio-engine";
import { VisualizerRenderer, type OverlayState } from "@/lib/visualizer";
import { useStudio } from "@/store/studio";
import { cn } from "@/lib/utils";

export function Stage({
  camera,
  onDropFile,
}: {
  camera: HTMLVideoElement | null;
  onDropFile: (file: File) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);
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
  const overlay: OverlayState = {
    camera,
    cameraLayout: mode === "broadcast" ? cameraLayout : "off",
    avatarUrl: avatar?.refs[0] ?? null,
    useAvatar: mode === "broadcast" && useAvatarOnAir,
    lowerThird: mode === "broadcast" ? lowerThird : "",
    showVideo: source === "file",
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new VisualizerRenderer(canvas);
    rendererRef.current = renderer;
    renderer.resize();
    const onResize = () => renderer.resize();
    window.addEventListener("resize", onResize);
    let raf = 0;
    const loop = (now: number) => {
      renderer.frame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.vizMode = vizMode;
    r.theme = theme;
    r.sensitivity = sensitivity;
    r.overlay = overlay;
  }, [vizMode, theme, sensitivity, overlay, camera]);

  return (
    <div
      id="stage"
      className="absolute inset-0 overflow-hidden bg-bg"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) onDropFile(file);
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-40",
          "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]",
        )}
      />
    </div>
  );
}

export function recordComposite(canvas: HTMLCanvasElement) {
  const vizStream = canvas.captureStream(30);
  const audio = audioEngine.captureStream();
  const mixed = new MediaStream([
    ...vizStream.getVideoTracks(),
    ...(audio?.getAudioTracks() ?? []),
  ]);
  const recorder = new MediaRecorder(mixed, {
    mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm",
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });
  recorder.start();
  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
      return done;
    },
  };
}

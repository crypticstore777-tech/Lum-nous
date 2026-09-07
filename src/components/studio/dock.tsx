import {
  Circle,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Square,
  Upload,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { ChipGroup } from "@/components/ui/chips";
import { audioEngine } from "@/lib/audio-engine";
import { cn, formatClock } from "@/lib/utils";
import { useStudio, VIZ_MODES, VIZ_THEMES } from "@/store/studio";

export function Dock({
  hidden,
  fullscreen,
  onToggleFullscreen,
  onPickFile,
}: {
  hidden: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onPickFile: () => void;
}) {
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

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-200 ease-out",
        hidden ? "dock-hidden" : "dock-visible",
      )}
    >
      <div className="pointer-events-auto w-full max-w-5xl rounded-2xl bg-surface/90 p-2 shadow-[var(--shadow-panel),var(--shadow-border)] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Tooltip content="Microphone">
              <Button
                variant={source === "mic" ? "primary" : "ghost"}
                size="icon"
                aria-label="Use microphone"
                onClick={() => void audioEngine.startMic()}
              >
                <Mic className="size-4" />
              </Button>
            </Tooltip>
            <Tooltip content={playing && canPause ? "Pause" : "Play"}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={playing && canPause ? "Pause" : "Play"}
                onClick={() => void audioEngine.togglePlay()}
                disabled={source === "mic"}
              >
                {playing && canPause ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 ml-px" />
                )}
              </Button>
            </Tooltip>
            <Tooltip content="Upload audio or video">
              <Button
                variant={source === "file" ? "primary" : "ghost"}
                size="icon"
                aria-label="Upload audio or video"
                onClick={onPickFile}
              >
                <Upload className="size-4" />
              </Button>
            </Tooltip>
            <Button
              variant={source === "demo" ? "primary" : "ghost"}
              size="sm"
              onClick={() => void audioEngine.startDemo()}
            >
              Demo
            </Button>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
            {source === "file" ? (
              <>
                <span className="truncate text-xs text-muted">{fileName}</span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {formatClock(currentTime)} / {formatClock(duration)}
                </span>
                <Slider
                  min={0}
                  max={1}
                  step={0.001}
                  value={[duration ? currentTime / duration : 0]}
                  onValueChange={([v]) => audioEngine.seek(v ?? 0)}
                  className="max-w-56"
                  aria-label="Seek"
                />
              </>
            ) : (
              <span className="flex items-center gap-2 text-xs text-muted">
                {source === "mic" ? (
                  <>
                    <Mic className="size-3.5" /> Listening
                  </>
                ) : source === "demo" ? (
                  <>
                    <Waves className="size-3.5" /> Demo pulse
                  </>
                ) : (
                  <>
                    <Circle className="size-3.5" /> Idle glow
                  </>
                )}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 text-muted">
            {vizMode === "bars" && <Square className="size-3.5" />}
            {vizMode === "circle" && <Circle className="size-3.5" />}
            {vizMode === "wave" && <Waves className="size-3.5" />}
            {vizMode === "orbit" && <Sparkles className="size-3.5" />}
            {vizMode === "bloom" && <Sparkles className="size-3.5" />}
            <Tooltip content={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={onToggleFullscreen}
              >
                {fullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <ChipGroup
              ariaLabel="Visualizer mode"
              value={vizMode}
              onChange={setVizMode}
              options={VIZ_MODES}
            />
            <ChipGroup
              ariaLabel="Color theme"
              value={theme}
              onChange={setTheme}
              options={VIZ_THEMES}
            />
          </div>
          <label className="flex min-w-40 items-center gap-3 px-2">
            <span className="text-xs text-muted">Sensitivity</span>
            <Slider
              min={0.4}
              max={2.4}
              step={0.02}
              value={[sensitivity]}
              onValueChange={([v]) => setSensitivity(v ?? 1)}
              aria-label="Sensitivity"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

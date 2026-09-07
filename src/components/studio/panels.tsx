import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Radio,
  Send,
  Trash2,
  UserRound,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chips";
import { Input, Textarea } from "@/components/ui/input";
import {
  askDirector,
  generateStill,
  getAiStatus,
  pollClip,
  startClip,
} from "@/lib/ai";
import { compressImage, cn, downloadUrl } from "@/lib/utils";
import {
  useActiveAvatar,
  useStudio,
  type AspectRatio,
  type CameraLayout,
  type OutputKind,
  type StudioMode,
} from "@/store/studio";

const ASPECTS: { id: AspectRatio; label: string }[] = [
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
  { id: "1:1", label: "1:1" },
  { id: "3:4", label: "3:4" },
  { id: "4:3", label: "4:3" },
];

export function StudioPanel({
  mode,
  onClose,
  onStartCamera,
  cameraOn,
}: {
  mode: StudioMode;
  onClose: () => void;
  onStartCamera: () => void;
  cameraOn: boolean;
}) {
  if (mode === "visualizer") return null;
  const title =
    mode === "generate"
      ? "Generate"
      : mode === "avatar"
        ? "Avatar"
        : mode === "assistant"
          ? "Director"
          : "Broadcast";
  return (
    <aside
      className={cn(
        "panel-enter absolute inset-x-3 top-20 z-30 flex max-h-[min(78dvh,720px)] flex-col overflow-hidden rounded-2xl bg-surface/94 shadow-[var(--shadow-panel),var(--shadow-border)] backdrop-blur-md",
        "md:inset-auto md:top-20 md:right-4 md:w-[380px]",
      )}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close panel" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {mode === "generate" && <GeneratePanel />}
        {mode === "avatar" && <AvatarPanel />}
        {mode === "assistant" && <AssistantPanel />}
        {mode === "broadcast" && (
          <BroadcastPanel onStartCamera={onStartCamera} cameraOn={cameraOn} />
        )}
      </div>
    </aside>
  );
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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    void getAiStatus().then((s) => setAvailable(s.available));
  }, []);

  async function run() {
    if (busy) return;
    setBusy(true);
    setStatus(outputKind === "clip" ? "Photographing, then animating…" : "Photographing…");
    try {
      const still = await generateStill({
        data: {
          prompt,
          aspectRatio: aspect,
          photoreal,
          refs: avatar?.refs,
        },
      });
      if (!still.ok) {
        toast.error(still.error);
        return;
      }
      addMedia({
        kind: "image",
        url: still.url,
        prompt,
        aspect,
        avatarId: avatar?.id,
      });
      if (outputKind === "still") {
        toast.success("Still ready");
        return;
      }
      setStatus("Rendering motion…");
      const started = await startClip({
        data: {
          prompt,
          aspectRatio: aspect,
          duration: clipSeconds,
          imageUrl: still.url,
          photoreal,
        },
      });
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
        avatarId: avatar?.id,
      });
      toast.success("Clip ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Photoreal stills and short clips at iPhone 17 Pro photographic quality.
        {avatar ? ` Using ${avatar.name} as likeness.` : ""}
      </p>
      {available === false && (
        <p className="text-sm text-danger">AI is not available in this environment.</p>
      )}
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A woman in a linen coat at dusk on a wet Tokyo street, neon reflected in puddles, looking just past camera…"
        rows={5}
      />
      <ChipGroup
        ariaLabel="Aspect ratio"
        value={aspect}
        onChange={setAspect}
        options={ASPECTS}
      />
      <div className="flex items-center justify-between gap-2">
        <ChipGroup
          ariaLabel="Output"
          value={outputKind}
          onChange={setOutputKind}
          options={[
            { id: "still" as OutputKind, label: "Still" },
            { id: "clip" as OutputKind, label: "Clip" },
          ]}
        />
        {outputKind === "clip" && (
          <ChipGroup
            ariaLabel="Clip length"
            value={String(clipSeconds) as "6" | "10" | "15"}
            onChange={(v) => setClipSeconds(Number(v) as 6 | 10 | 15)}
            options={[
              { id: "6", label: "6s" },
              { id: "10", label: "10s" },
              { id: "15", label: "15s" },
            ]}
          />
        )}
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2 text-sm">
        <span>Photoreal camera</span>
        <button
          type="button"
          role="switch"
          aria-checked={photoreal}
          onClick={() => setPhotoreal(!photoreal)}
          className={cn(
            "relative h-6 w-10 rounded-full transition-colors duration-150",
            photoreal ? "bg-fg" : "bg-border-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform duration-150",
              photoreal && "translate-x-4",
            )}
          />
        </button>
      </label>
      <Button onClick={() => void run()} disabled={busy || !prompt.trim()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
        {busy ? status ?? "Working" : outputKind === "clip" ? "Make clip" : "Make still"}
      </Button>
      <Gallery
        items={gallery}
        onRemove={removeMedia}
        onAnimate={async (item) => {
          if (busy || item.kind !== "image") return;
          setBusy(true);
          setStatus("Animating still…");
          try {
            const started = await startClip({
              data: {
                prompt: item.prompt || "Subtle natural motion",
                aspectRatio: item.aspect,
                duration: clipSeconds,
                imageUrl: item.url,
                photoreal,
              },
            });
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
              avatarId: item.avatarId,
            });
            toast.success("Clip ready");
          } finally {
            setBusy(false);
            setStatus(null);
          }
        }}
      />
    </div>
  );
}

async function waitForClip(
  requestId: string,
  setStatus: (s: string) => void,
) {
  for (let i = 0; i < 60; i++) {
    setStatus(`Rendering motion ${i + 1}…`);
    const poll = await pollClip({ data: { requestId } });
    if (!poll.ok) {
      toast.error(poll.error);
      return null;
    }
    if (poll.status === "done") return poll.url;
    await new Promise((r) => setTimeout(r, 3000));
  }
  toast.error("Timed out waiting for the clip.");
  return null;
}

function Gallery({
  items,
  onRemove,
  onAnimate,
}: {
  items: ReturnType<typeof useStudio.getState>["gallery"];
  onRemove: (id: string) => void;
  onAnimate: (item: ReturnType<typeof useStudio.getState>["gallery"][number]) => void;
}) {
  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Stills and clips will land here.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <li key={item.id} className="group relative overflow-hidden rounded-lg bg-raised">
          {item.kind === "video" ? (
            <video
              src={item.url}
              className="aspect-[3/4] w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
              crossOrigin="anonymous"
            />
          ) : (
            <img
              src={item.url}
              alt={item.prompt}
              className="aspect-[3/4] w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-bg/80 to-transparent p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {item.kind === "image" && (
              <Button
                variant="subtle"
                size="icon-sm"
                aria-label="Animate"
                onClick={() => onAnimate(item)}
              >
                <Video className="size-3.5" />
              </Button>
            )}
            <Button
              variant="subtle"
              size="icon-sm"
              aria-label="Download"
              onClick={() =>
                downloadUrl(
                  item.url,
                  `lumen-${item.kind}.${item.kind === "video" ? "mp4" : "jpg"}`,
                )
              }
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              variant="subtle"
              size="icon-sm"
              aria-label="Remove"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AvatarPanel() {
  const avatars = useStudio((s) => s.avatars);
  const addAvatar = useStudio((s) => s.addAvatar);
  const removeAvatar = useStudio((s) => s.removeAvatar);
  const activeId = useStudio((s) => s.activeAvatarId);
  const setActive = useStudio((s) => s.setActiveAvatar);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next = [...refs];
    for (const file of Array.from(files).slice(0, 5 - next.length)) {
      if (!file.type.startsWith("image/")) continue;
      next.push(await compressImage(file, 720, 0.82));
    }
    setRefs(next.slice(0, 5));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Train a likeness from 2–5 photos, then generate and animate new shots of the same person.
      </p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Avatar name"
      />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Wardrobe, age, energy, typical settings"
        rows={3}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-sm text-muted hover:text-fg"
      >
        {refs.length ? `${refs.length} of 5 photos` : "Add reference photos"}
      </button>
      {refs.length > 0 && (
        <div className="flex gap-2">
          {refs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="size-14 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-fg/10"
            />
          ))}
        </div>
      )}
      <Button
        onClick={() => {
          if (!name.trim() || refs.length < 1) {
            toast.error("Name and at least one photo are required.");
            return;
          }
          addAvatar(name.trim(), notes.trim(), refs);
          setName("");
          setNotes("");
          setRefs([]);
          toast.success("Avatar saved — generate with this likeness");
        }}
      >
        <UserRound className="size-4" />
        Save avatar
      </Button>
      <ul className="flex flex-col gap-2">
        {avatars.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-raised p-2",
              a.id === activeId && "shadow-[var(--shadow-border-hover)]",
            )}
          >
            <img
              src={a.refs[0]}
              alt=""
              className="size-11 rounded-sm object-cover"
            />
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setActive(a.id === activeId ? null : a.id)}
            >
              <div className="truncate text-sm font-medium">{a.name}</div>
              <div className="truncate text-xs text-muted">
                {a.id === activeId ? "Active likeness" : `${a.refs.length} refs`}
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${a.name}`}
              onClick={() => removeAvatar(a.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssistantPanel() {
  const messages = useStudio((s) => s.messages);
  const addMessage = useStudio((s) => s.addMessage);
  const setPrompt = useStudio((s) => s.setGeneratePrompt);
  const setMode = useStudio((s) => s.setMode);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    addMessage("user", text);
    setBusy(true);
    try {
      const history = [...useStudio.getState().messages];
      const res = await askDirector({
        data: {
          messages: history.map((m) => ({ role: m.role, text: m.text })),
        },
      });
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

  return (
    <div className="flex h-[52dvh] flex-col gap-3 md:h-[560px]">
      <p className="text-sm text-muted">
        Shot lists, prompt craft, broadcast staging. Ask, then send a prompt to Generate.
      </p>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="rounded-lg bg-raised p-3 text-sm text-muted">
            Try: “Prompt a rainy Tokyo street portrait, 9:16, iPhone 17 Pro look.”
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={m.text}
            onUse={(p) => {
              setPrompt(p);
              setMode("generate");
            }}
          />
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the director"
          disabled={busy}
        />
        <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="Send">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  role,
  text,
  onUse,
}: {
  role: "user" | "assistant";
  text: string;
  onUse: (prompt: string) => void;
}) {
  const prompts = useMemo(() => {
    const found: string[] = [];
    const re = /<prompt>([\s\S]*?)<\/prompt>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) found.push(m[1]!.trim());
    return found;
  }, [text]);
  const shown = text.replace(/<\/?prompt>/g, "").trim();
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          role === "user" ? "bg-fg text-accent-fg" : "bg-raised text-fg",
        )}
      >
        {shown}
        {prompts.map((p) => (
          <Button
            key={p}
            variant={role === "user" ? "subtle" : "outline"}
            size="sm"
            className="mt-2"
            onClick={() => onUse(p)}
          >
            Use as prompt
          </Button>
        ))}
      </div>
    </div>
  );
}

function BroadcastPanel({
  onStartCamera,
  cameraOn,
}: {
  onStartCamera: () => void;
  cameraOn: boolean;
}) {
  const layout = useStudio((s) => s.cameraLayout);
  const setLayout = useStudio((s) => s.setCameraLayout);
  const lowerThird = useStudio((s) => s.lowerThird);
  const setLowerThird = useStudio((s) => s.setLowerThird);
  const useAvatarOnAir = useStudio((s) => s.useAvatarOnAir);
  const setUseAvatarOnAir = useStudio((s) => s.setUseAvatarOnAir);
  const avatar = useActiveAvatar();
  const [recording, setRecording] = useState(false);
  const recRef = useRef<{ stop: () => Promise<Blob> } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Composite camera or avatar over the visualizer. Fullscreen the stage, then go live.
      </p>
      <Button variant={cameraOn ? "primary" : "outline"} onClick={onStartCamera}>
        <Radio className="size-4" />
        {cameraOn ? "Camera live" : "Enable camera"}
      </Button>
      <ChipGroup
        ariaLabel="Talent layout"
        value={layout}
        onChange={setLayout}
        options={[
          { id: "off" as CameraLayout, label: "Viz only" },
          { id: "corner" as CameraLayout, label: "Corner" },
          { id: "center" as CameraLayout, label: "Center" },
        ]}
      />
      <label className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2 text-sm">
        <span>Use avatar on air {avatar ? `(${avatar.name})` : ""}</span>
        <button
          type="button"
          role="switch"
          aria-checked={useAvatarOnAir}
          onClick={() => setUseAvatarOnAir(!useAvatarOnAir)}
          className={cn(
            "relative h-6 w-10 rounded-full transition-colors duration-150",
            useAvatarOnAir ? "bg-fg" : "bg-border-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform duration-150",
              useAvatarOnAir && "translate-x-4",
            )}
          />
        </button>
      </label>
      <Input
        value={lowerThird}
        onChange={(e) => setLowerThird(e.target.value)}
        placeholder="Lower third"
      />
      <Button
        variant={recording ? "danger" : "outline"}
        onClick={async () => {
          if (recording) {
            const rec = recRef.current;
            recRef.current = null;
            setRecording(false);
            if (!rec) return;
            const blob = await rec.stop();
            const url = URL.createObjectURL(blob);
            downloadUrl(url, "lumen-broadcast.webm");
            toast.success("Recording saved");
            return;
          }
          const canvas = document.querySelector<HTMLCanvasElement>("#stage canvas");
          if (!canvas) {
            toast.error("Visualizer is not ready.");
            return;
          }
          const { recordComposite } = await import("@/components/studio/stage");
          recRef.current = recordComposite(canvas);
          setRecording(true);
          toast.message("Recording the stage");
        }}
      >
        {recording ? "Stop recording" : "Record stage"}
      </Button>
      <p className="text-xs leading-relaxed text-subtle">
        Pair with the mic source so the bars follow your voice. Drop a track if you want playback behind you.
      </p>
    </div>
  );
}

export function ModeNav({
  mode,
  onChange,
}: {
  mode: StudioMode;
  onChange: (mode: StudioMode) => void;
}) {
  const items: { id: StudioMode; label: string; icon: typeof ImageIcon }[] = [
    { id: "visualizer", label: "Viz", icon: WandSparkles },
    { id: "generate", label: "Make", icon: ImageIcon },
    { id: "avatar", label: "Avatar", icon: UserRound },
    { id: "assistant", label: "Director", icon: Send },
    { id: "broadcast", label: "Live", icon: Radio },
  ];
  return (
    <nav
      aria-label="Studio modes"
      className="flex items-center gap-1 rounded-lg bg-raised/80 p-1 shadow-[var(--shadow-border)]"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex h-10 min-w-10 items-center gap-2 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color] duration-150",
              active ? "bg-fg text-accent-fg" : "text-muted hover:text-fg",
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

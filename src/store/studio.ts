import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";

export type StudioMode =
  | "visualizer"
  | "generate"
  | "avatar"
  | "assistant"
  | "broadcast";

export type VizMode = "bars" | "circle" | "wave" | "orbit" | "bloom";
export type VizTheme = "ember" | "ice" | "sage" | "porcelain" | "magma";
export type AudioSource = "idle" | "demo" | "mic" | "file";
export type AspectRatio = "9:16" | "16:9" | "1:1" | "3:4" | "4:3";
export type OutputKind = "still" | "clip";
export type CameraLayout = "off" | "corner" | "center";

export type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  prompt: string;
  aspect: AspectRatio;
  createdAt: number;
  avatarId?: string;
};

export type AvatarProfile = {
  id: string;
  name: string;
  notes: string;
  refs: string[];
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

type StudioState = {
  mode: StudioMode;
  vizMode: VizMode;
  theme: VizTheme;
  sensitivity: number;
  source: AudioSource;
  fileName: string | null;
  duration: number;
  currentTime: number;
  playing: boolean;
  chromeVisible: boolean;
  photoreal: boolean;
  aspect: AspectRatio;
  outputKind: OutputKind;
  clipSeconds: 6 | 10 | 15;
  generatePrompt: string;
  gallery: MediaItem[];
  avatars: AvatarProfile[];
  activeAvatarId: string | null;
  messages: ChatMessage[];
  lowerThird: string;
  cameraLayout: CameraLayout;
  useAvatarOnAir: boolean;

  setMode: (mode: StudioMode) => void;
  setVizMode: (vizMode: VizMode) => void;
  setTheme: (theme: VizTheme) => void;
  setSensitivity: (sensitivity: number) => void;
  setSource: (source: AudioSource, fileName?: string | null) => void;
  setTransport: (partial: {
    playing?: boolean;
    duration?: number;
    currentTime?: number;
  }) => void;
  setChromeVisible: (visible: boolean) => void;
  setPhotoreal: (photoreal: boolean) => void;
  setAspect: (aspect: AspectRatio) => void;
  setOutputKind: (kind: OutputKind) => void;
  setClipSeconds: (seconds: 6 | 10 | 15) => void;
  setGeneratePrompt: (prompt: string) => void;
  addMedia: (item: Omit<MediaItem, "id" | "createdAt">) => void;
  removeMedia: (id: string) => void;
  addAvatar: (name: string, notes: string, refs: string[]) => void;
  removeAvatar: (id: string) => void;
  setActiveAvatar: (id: string | null) => void;
  addMessage: (role: "user" | "assistant", text: string) => void;
  clearMessages: () => void;
  setLowerThird: (value: string) => void;
  setCameraLayout: (layout: CameraLayout) => void;
  setUseAvatarOnAir: (value: boolean) => void;
};

export const VIZ_MODES: { id: VizMode; label: string }[] = [
  { id: "bars", label: "Bars" },
  { id: "circle", label: "Circle" },
  { id: "wave", label: "Wave" },
  { id: "orbit", label: "Orbit" },
  { id: "bloom", label: "Bloom" },
];

export const VIZ_THEMES: { id: VizTheme; label: string }[] = [
  { id: "ember", label: "Ember" },
  { id: "ice", label: "Ice" },
  { id: "sage", label: "Sage" },
  { id: "porcelain", label: "Porcelain" },
  { id: "magma", label: "Magma" },
];

export const useStudio = create<StudioState>()(
  persist(
    (set) => ({
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

      setMode: (mode) => set({ mode, chromeVisible: true }),
      setVizMode: (vizMode) => set({ vizMode }),
      setTheme: (theme) => set({ theme }),
      setSensitivity: (sensitivity) => set({ sensitivity }),
      setSource: (source, fileName = null) =>
        set({
          source,
          fileName: source === "file" ? fileName : null,
        }),
      setTransport: (partial) => set(partial),
      setChromeVisible: (chromeVisible) => set({ chromeVisible }),
      setPhotoreal: (photoreal) => set({ photoreal }),
      setAspect: (aspect) => set({ aspect }),
      setOutputKind: (outputKind) => set({ outputKind }),
      setClipSeconds: (clipSeconds) => set({ clipSeconds }),
      setGeneratePrompt: (generatePrompt) => set({ generatePrompt }),
      addMedia: (item) =>
        set((s) => ({
          gallery: [
            { ...item, id: uid(), createdAt: Date.now() },
            ...s.gallery,
          ].slice(0, 40),
        })),
      removeMedia: (id) =>
        set((s) => ({ gallery: s.gallery.filter((g) => g.id !== id) })),
      addAvatar: (name, notes, refs) =>
        set((s) => {
          const profile: AvatarProfile = {
            id: uid(),
            name,
            notes,
            refs,
            createdAt: Date.now(),
          };
          return {
            avatars: [profile, ...s.avatars].slice(0, 8),
            activeAvatarId: profile.id,
          };
        }),
      removeAvatar: (id) =>
        set((s) => ({
          avatars: s.avatars.filter((a) => a.id !== id),
          activeAvatarId: s.activeAvatarId === id ? null : s.activeAvatarId,
        })),
      setActiveAvatar: (activeAvatarId) => set({ activeAvatarId }),
      addMessage: (role, text) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: uid(), role, text, createdAt: Date.now() },
          ].slice(-40),
        })),
      clearMessages: () => set({ messages: [] }),
      setLowerThird: (lowerThird) => set({ lowerThird }),
      setCameraLayout: (cameraLayout) => set({ cameraLayout }),
      setUseAvatarOnAir: (useAvatarOnAir) => set({ useAvatarOnAir }),
    }),
    {
      name: "lumen-studio",
      skipHydration: true,
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
        useAvatarOnAir: s.useAvatarOnAir,
      }),
    },
  ),
);

export function useActiveAvatar() {
  return useStudio((s) => s.avatars.find((a) => a.id === s.activeAvatarId) ?? null);
}

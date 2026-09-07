import { createServerFn } from "@tanstack/react-start";

const IMAGE_MODEL = "grok-imagine-image-2.0";
const VIDEO_MODEL = "grok-imagine-video-1.5";
const VIDEO_TEXT_MODEL = "grok-imagine-video";
const CHAT_MODEL = "grok-4.5";

type ImageResult =
  | { ok: true; url: string; prompt: string }
  | { ok: false; error: string };

type VideoStart =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

type VideoPoll =
  | { ok: true; status: "pending" }
  | { ok: true; status: "done"; url: string }
  | { ok: false; error: string };

type ChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

function key() {
  return process.env.XAI_API_KEY;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key()}`,
  };
}

function apiError(status: number, body: string) {
  if (status === 400) return "The request was rejected. Try a different prompt.";
  if (status === 401 || status === 403) return "AI is not available right now.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  return `Generation failed (${status}). ${body.slice(0, 180)}`;
}

function photorealize(prompt: string, photoreal: boolean) {
  const trimmed = prompt.trim().slice(0, 1800);
  if (!photoreal) return trimmed;
  return [
    "Photoreal still photograph, captured on iPhone 17 Pro, 48MP Fusion camera, 24mm equivalent,",
    "natural computational photography, accurate color science, real skin texture and fabric detail,",
    "optical bokeh, available light, documentary realism, no CGI, no illustration, no plastic skin.",
    trimmed,
  ].join(" ");
}

export const getAiStatus = createServerFn({ method: "GET" }).handler(
  async () => ({ available: Boolean(key()) }),
);

export const generateStill = createServerFn({ method: "POST" })
  .validator(
    (input: {
      prompt: string;
      aspectRatio: string;
      photoreal: boolean;
      refs?: string[];
    }) => input,
  )
  .handler(async ({ data }): Promise<ImageResult> => {
    if (!key()) return { ok: false, error: "AI is not available in this environment." };
    const prompt = photorealize(data.prompt, data.photoreal);
    if (prompt.length < 3) return { ok: false, error: "Write a prompt first." };

    const refs = (data.refs ?? []).filter((r) => r.startsWith("data:") || r.startsWith("http")).slice(0, 5);
    const body: Record<string, unknown> = {
      model: IMAGE_MODEL,
      prompt: refs.length
        ? `${prompt}. Keep the same person and likeness as the reference photos.`
        : prompt,
      n: 1,
      aspect_ratio: data.aspectRatio,
      resolution: "2k",
      quality: "high",
      response_format: "url",
    };
    if (refs.length === 1) {
      body.image = { url: refs[0], type: "image_url" };
    } else if (refs.length > 1) {
      body.images = refs.map((url) => ({ url, type: "image_url" }));
    }

    const endpoint =
      refs.length > 0
        ? "https://api.x.ai/v1/images/edits"
        : "https://api.x.ai/v1/images/generations";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      if (refs.length && res.status >= 400) {
        const fallback = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt: `${prompt}. Portrait of the described person.`,
            n: 1,
            aspect_ratio: data.aspectRatio,
            resolution: "2k",
            quality: "high",
            response_format: "url",
          }),
        });
        if (!fallback.ok) {
          return { ok: false, error: apiError(res.status, text) };
        }
        const fb = (await fallback.json()) as { data?: { url?: string }[] };
        const url = fb.data?.[0]?.url;
        if (!url) return { ok: false, error: "No image returned." };
        return { ok: true, url, prompt };
      }
      return { ok: false, error: apiError(res.status, text) };
    }
    const json = (await res.json()) as { data?: { url?: string }[] };
    const url = json.data?.[0]?.url;
    if (!url) return { ok: false, error: "No image returned." };
    return { ok: true, url, prompt };
  });

export const startClip = createServerFn({ method: "POST" })
  .validator(
    (input: {
      prompt: string;
      aspectRatio: string;
      duration: number;
      imageUrl?: string;
      photoreal: boolean;
    }) => input,
  )
  .handler(async ({ data }): Promise<VideoStart> => {
    if (!key()) return { ok: false, error: "AI is not available in this environment." };
    const prompt = data.photoreal
      ? `Photoreal motion, iPhone 17 Pro video, natural handheld micro-movement, real physics. ${data.prompt.trim()}`
      : data.prompt.trim();
    if (prompt.length < 3) return { ok: false, error: "Write a prompt first." };
    const duration = Math.min(15, Math.max(6, Math.round(data.duration)));
    const body: Record<string, unknown> = {
      model: data.imageUrl ? VIDEO_MODEL : VIDEO_TEXT_MODEL,
      prompt,
      duration,
      aspect_ratio: data.aspectRatio,
      resolution: "720p",
    };
    if (data.imageUrl) body.image = { url: data.imageUrl };

    const res = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: apiError(res.status, text) };
    }
    const json = (await res.json()) as { request_id?: string };
    if (!json.request_id) return { ok: false, error: "No job id returned." };
    return { ok: true, requestId: json.request_id };
  });

export const pollClip = createServerFn({ method: "POST" })
  .validator((input: { requestId: string }) => input)
  .handler(async ({ data }): Promise<VideoPoll> => {
    if (!key()) return { ok: false, error: "AI is not available in this environment." };
    const id = encodeURIComponent(data.requestId);
    const res = await fetch(`https://api.x.ai/v1/videos/${id}`, {
      headers: { Authorization: `Bearer ${key()}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: apiError(res.status, text) };
    }
    const json = (await res.json()) as {
      status?: string;
      video?: { url?: string };
      url?: string;
    };
    if (json.status === "failed" || json.status === "expired") {
      return { ok: false, error: `Clip ${json.status}.` };
    }
    const url = json.video?.url ?? json.url;
    if (json.status === "done" && url) return { ok: true, status: "done", url };
    return { ok: true, status: "pending" };
  });

export const askDirector = createServerFn({ method: "POST" })
  .validator(
    (input: {
      messages: { role: "user" | "assistant"; text: string }[];
    }) => input,
  )
  .handler(async ({ data }): Promise<ChatResult> => {
    if (!key()) return { ok: false, error: "AI is not available in this environment." };
    const history = data.messages.slice(-16).map((m) => ({
      role: m.role,
      content: m.text.slice(0, 4000),
    }));
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 700,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are Lumen's studio director. Help with photoreal image and video prompts, shot lists, avatar looks, live broadcast staging, and audio-reactive visualizer direction. Prefer iPhone 17 Pro photographic language: 24mm, natural computational photography, real texture, available light. Keep replies concise. When you propose a ready-to-run prompt, wrap it in <prompt>...</prompt>. Never produce sexual content involving minors.",
          },
          ...history,
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: apiError(res.status, text) };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false, error: "Empty reply." };
    return { ok: true, text };
  });

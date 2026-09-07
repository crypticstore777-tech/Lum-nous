import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-TjHltZ4E.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var IMAGE_MODEL = "grok-imagine-image-2.0";
var VIDEO_MODEL = "grok-imagine-video-1.5";
var VIDEO_TEXT_MODEL = "grok-imagine-video";
var CHAT_MODEL = "grok-4.5";
function key() {
	return process.env.XAI_API_KEY;
}
function authHeaders() {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${key()}`
	};
}
function apiError(status, body) {
	if (status === 400) return "The request was rejected. Try a different prompt.";
	if (status === 401 || status === 403) return "AI is not available right now.";
	if (status === 429) return "Too many requests. Wait a moment and try again.";
	return `Generation failed (${status}). ${body.slice(0, 180)}`;
}
function photorealize(prompt, photoreal) {
	const trimmed = prompt.trim().slice(0, 1800);
	if (!photoreal) return trimmed;
	return [
		"Photoreal still photograph, captured on iPhone 17 Pro, 48MP Fusion camera, 24mm equivalent,",
		"natural computational photography, accurate color science, real skin texture and fabric detail,",
		"optical bokeh, available light, documentary realism, no CGI, no illustration, no plastic skin.",
		trimmed
	].join(" ");
}
var getAiStatus_createServerFn_handler = createServerRpc({
	id: "f55d85520203b0ca68806b32dd775d224e89e7dbf6a1371fbfe6857a9f8e3df4",
	name: "getAiStatus",
	filename: "src/lib/ai.ts"
}, (opts) => getAiStatus.__executeServer(opts));
var getAiStatus = createServerFn({ method: "GET" }).handler(getAiStatus_createServerFn_handler, async () => ({ available: Boolean(key()) }));
var generateStill_createServerFn_handler = createServerRpc({
	id: "74e4bd1692b6eb8646ef14c88cce0deeb7ed40d51037424f8eed2c607e32a3fe",
	name: "generateStill",
	filename: "src/lib/ai.ts"
}, (opts) => generateStill.__executeServer(opts));
var generateStill = createServerFn({ method: "POST" }).validator((input) => input).handler(generateStill_createServerFn_handler, async ({ data }) => {
	if (!key()) return {
		ok: false,
		error: "AI is not available in this environment."
	};
	const prompt = photorealize(data.prompt, data.photoreal);
	if (prompt.length < 3) return {
		ok: false,
		error: "Write a prompt first."
	};
	const refs = (data.refs ?? []).filter((r) => r.startsWith("data:") || r.startsWith("http")).slice(0, 5);
	const body = {
		model: IMAGE_MODEL,
		prompt: refs.length ? `${prompt}. Keep the same person and likeness as the reference photos.` : prompt,
		n: 1,
		aspect_ratio: data.aspectRatio,
		resolution: "2k",
		quality: "high",
		response_format: "url"
	};
	if (refs.length === 1) body.image = {
		url: refs[0],
		type: "image_url"
	};
	else if (refs.length > 1) body.images = refs.map((url) => ({
		url,
		type: "image_url"
	}));
	const endpoint = refs.length > 0 ? "https://api.x.ai/v1/images/edits" : "https://api.x.ai/v1/images/generations";
	const res = await fetch(endpoint, {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify(body)
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
					response_format: "url"
				})
			});
			if (!fallback.ok) return {
				ok: false,
				error: apiError(res.status, text)
			};
			const url = (await fallback.json()).data?.[0]?.url;
			if (!url) return {
				ok: false,
				error: "No image returned."
			};
			return {
				ok: true,
				url,
				prompt
			};
		}
		return {
			ok: false,
			error: apiError(res.status, text)
		};
	}
	const url = (await res.json()).data?.[0]?.url;
	if (!url) return {
		ok: false,
		error: "No image returned."
	};
	return {
		ok: true,
		url,
		prompt
	};
});
var startClip_createServerFn_handler = createServerRpc({
	id: "a72e56185b4e6e03f84d3e89f744053eb774d4aae32e277946ddb8ac6d699f54",
	name: "startClip",
	filename: "src/lib/ai.ts"
}, (opts) => startClip.__executeServer(opts));
var startClip = createServerFn({ method: "POST" }).validator((input) => input).handler(startClip_createServerFn_handler, async ({ data }) => {
	if (!key()) return {
		ok: false,
		error: "AI is not available in this environment."
	};
	const prompt = data.photoreal ? `Photoreal motion, iPhone 17 Pro video, natural handheld micro-movement, real physics. ${data.prompt.trim()}` : data.prompt.trim();
	if (prompt.length < 3) return {
		ok: false,
		error: "Write a prompt first."
	};
	const duration = Math.min(15, Math.max(6, Math.round(data.duration)));
	const body = {
		model: data.imageUrl ? VIDEO_MODEL : VIDEO_TEXT_MODEL,
		prompt,
		duration,
		aspect_ratio: data.aspectRatio,
		resolution: "720p"
	};
	if (data.imageUrl) body.image = { url: data.imageUrl };
	const res = await fetch("https://api.x.ai/v1/videos/generations", {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		return {
			ok: false,
			error: apiError(res.status, text)
		};
	}
	const json = await res.json();
	if (!json.request_id) return {
		ok: false,
		error: "No job id returned."
	};
	return {
		ok: true,
		requestId: json.request_id
	};
});
var pollClip_createServerFn_handler = createServerRpc({
	id: "c09f908c6f6410f2f878636627d927798425e098b2345668c86a5b9a40970442",
	name: "pollClip",
	filename: "src/lib/ai.ts"
}, (opts) => pollClip.__executeServer(opts));
var pollClip = createServerFn({ method: "POST" }).validator((input) => input).handler(pollClip_createServerFn_handler, async ({ data }) => {
	if (!key()) return {
		ok: false,
		error: "AI is not available in this environment."
	};
	const id = encodeURIComponent(data.requestId);
	const res = await fetch(`https://api.x.ai/v1/videos/${id}`, { headers: { Authorization: `Bearer ${key()}` } });
	if (!res.ok) {
		const text = await res.text();
		return {
			ok: false,
			error: apiError(res.status, text)
		};
	}
	const json = await res.json();
	if (json.status === "failed" || json.status === "expired") return {
		ok: false,
		error: `Clip ${json.status}.`
	};
	const url = json.video?.url ?? json.url;
	if (json.status === "done" && url) return {
		ok: true,
		status: "done",
		url
	};
	return {
		ok: true,
		status: "pending"
	};
});
var askDirector_createServerFn_handler = createServerRpc({
	id: "d6154d4cdb8153a42d7ecb369a38d180534d13f28a0b5d8e9970539124a32bb2",
	name: "askDirector",
	filename: "src/lib/ai.ts"
}, (opts) => askDirector.__executeServer(opts));
var askDirector = createServerFn({ method: "POST" }).validator((input) => input).handler(askDirector_createServerFn_handler, async ({ data }) => {
	if (!key()) return {
		ok: false,
		error: "AI is not available in this environment."
	};
	const history = data.messages.slice(-16).map((m) => ({
		role: m.role,
		content: m.text.slice(0, 4e3)
	}));
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify({
			model: CHAT_MODEL,
			max_tokens: 700,
			temperature: .7,
			messages: [{
				role: "system",
				content: "You are Lumen's studio director. Help with photoreal image and video prompts, shot lists, avatar looks, live broadcast staging, and audio-reactive visualizer direction. Prefer iPhone 17 Pro photographic language: 24mm, natural computational photography, real texture, available light. Keep replies concise. When you propose a ready-to-run prompt, wrap it in <prompt>...</prompt>. Never produce sexual content involving minors."
			}, ...history]
		})
	});
	if (!res.ok) {
		const text = await res.text();
		return {
			ok: false,
			error: apiError(res.status, text)
		};
	}
	const text = (await res.json()).choices?.[0]?.message?.content ?? "";
	if (!text) return {
		ok: false,
		error: "Empty reply."
	};
	return {
		ok: true,
		text
	};
});
//#endregion
export { askDirector_createServerFn_handler, generateStill_createServerFn_handler, getAiStatus_createServerFn_handler, pollClip_createServerFn_handler, startClip_createServerFn_handler };

// ── n8n Webhook Endpoints ──────────────────────────────────────────────────
const N8N_DESCRIPTION   = 'https://n8n.intelligens.app/webhook/description';
const N8N_IMAGE         = 'https://n8n.intelligens.app/webhook/image';
const N8N_VIDEO         = 'https://n8n.intelligens.app/webhook/video';
const N8N_VIDEO_STATUS  = 'https://n8n.intelligens.app/webhook/video-status';
const N8N_PUBLISH       = 'https://n8n.intelligens.app/webhook/publish';

// ── Response parser (port of backend/parser.py) ────────────────────────────
function parseWebhookResponse(raw: unknown): Record<string, unknown> {
  let payload = raw;

  if (Array.isArray(payload) && payload.length > 0) payload = payload[0];

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    payload = p.output ?? p.body ?? p.data ?? p;
  }

  if (typeof payload === 'string') {
    try { return parseWebhookResponse(JSON.parse(payload)); } catch { /* non-JSON string */ }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  return payload as Record<string, unknown>;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getVal(obj: Record<string, unknown>, keys: string[], defaultVal?: unknown): unknown {
  if (!obj || typeof obj !== 'object') return defaultVal;
  const normKeys = keys.map(norm);
  for (const [k, v] of Object.entries(obj)) {
    if (normKeys.includes(norm(k))) return v;
  }
  return defaultVal;
}

function resolveImageUrl(output: Record<string, unknown>, raw: Record<string, unknown>): string | undefined {
  let url = getVal(output, ['image_url', 'image url', 'imageUrl', 'image', 'secure_url', 'url'],
              getVal(raw,    ['image_url', 'image url', 'imageUrl', 'image', 'secure_url', 'url'])) as unknown;
  if (Array.isArray(url) && url.length > 0) url = url[0];
  if (url && typeof url === 'object') {
    const u = url as Record<string, unknown>;
    url = u.secure_url ?? u.url ?? String(url);
  }
  return typeof url === 'string' ? url : undefined;
}

async function callN8n(
  url: string,
  body: FormData | Record<string, unknown>,
): Promise<[Record<string, unknown>, Record<string, unknown>]> {
  const res = body instanceof FormData
    ? await fetch(url, { method: 'POST', body })
    : await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`n8n error ${res.status}: ${text}`);
  }

  const text = await res.text();
  let raw: unknown = {};
  if (text.trim()) {
    try { raw = JSON.parse(text); } catch {
      throw new Error(`n8n returned invalid JSON: ${text.slice(0, 200)}`);
    }
  }
  const rawDict: Record<string, unknown> = Array.isArray(raw) ? (raw[0] ?? {}) : ((raw as Record<string, unknown>) ?? {});
  return [parseWebhookResponse(raw), rawDict];
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface DescriptionResponse {
  product_name: string;
  description: string;
  unique_key: string;
  image_url?: string;
}

export interface ImageResponse {
  image_url: string;
  unique_key: string;
}

export interface VideoResponse {
  status?: string;
  video_url?: string;
  unique_key: string;
}

export async function generateDescription(data: {
  product_name?: string;
  description?: string;
  image_base64?: string | null;
  file_name?: string | null;
  unique_key?: string;
}): Promise<DescriptionResponse> {
  let body: FormData | Record<string, unknown>;

  if (data.image_base64) {
    const [prefix, encoded] = data.image_base64.includes(',')
      ? data.image_base64.split(',', 2)
      : ['', data.image_base64];
    const mimeType = prefix.startsWith('data:')
      ? prefix.split(';')[0].replace('data:', '')
      : 'image/jpeg';
    const bytes = atob(encoded);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mimeType });

    const fd = new FormData();
    fd.append('workflow', 'description');
    fd.append('product_name', data.product_name ?? '');
    fd.append('description', data.description ?? '');
    fd.append('unique_key', data.unique_key ?? '');
    fd.append('image_base64', data.image_base64);
    fd.append('file_name', data.file_name ?? 'uploaded_image.jpg');
    fd.append('file', blob, data.file_name ?? 'uploaded_image.jpg');
    body = fd;
  } else {
    body = {
      workflow: 'description',
      product_name: data.product_name ?? '',
      description: data.description ?? '',
      unique_key: data.unique_key ?? '',
    };
  }

  const [output, rawDict] = await callN8n(N8N_DESCRIPTION, body);

  const uniqueKey = (getVal(output, ['unique_key', 'unique key', 'uniqueKey'],
                     getVal(rawDict, ['unique_key', 'unique key'], data.unique_key)) ?? data.unique_key ?? crypto.randomUUID()) as string;

  return {
    product_name: (getVal(output, ['title', 'product_name', 'product name', 'name'], data.product_name) ?? data.product_name ?? '') as string,
    description:  (getVal(output, ['description', 'enhanced_description', 'enhanced description', 'content', 'desc'], data.description) ?? data.description ?? '') as string,
    unique_key:   uniqueKey,
    image_url:    resolveImageUrl(output, rawDict),
  };
}

export async function generateImage(data: {
  product_name: string;
  description: string;
  unique_key: string;
}): Promise<ImageResponse> {
  const [output, rawDict] = await callN8n(N8N_IMAGE, {
    workflow: 'photo',
    product_name: data.product_name,
    description: data.description,
    unique_key: data.unique_key,
  });

  const imageUrl = resolveImageUrl(output, rawDict);
  const uniqueKey = (getVal(output, ['unique_key', 'unique key', 'uniqueKey'],
                     getVal(rawDict, ['unique_key', 'unique key'], data.unique_key)) ?? data.unique_key) as string;

  if (!imageUrl) throw new Error('No image URL returned from n8n');
  return { image_url: imageUrl, unique_key: uniqueKey };
}

export async function generateVideo(data: {
  product_name: string;
  description: string;
  image_url?: string | null;
  unique_key: string;
}): Promise<VideoResponse> {
  await callN8n(N8N_VIDEO, {
    workflow: 'video',
    product_name: data.product_name,
    description: data.description,
    image_url: data.image_url ?? '',
    unique_key: data.unique_key,
  });

  return { status: 'processing', unique_key: data.unique_key };
}

export async function checkVideoStatus(uniqueKey: string): Promise<VideoResponse> {
  const res = await fetch(`${N8N_VIDEO_STATUS}?unique_key=${encodeURIComponent(uniqueKey)}`);
  if (!res.ok) return { status: 'processing', unique_key: uniqueKey };
  const raw = await res.json();
  const rawDict: Record<string, unknown> = Array.isArray(raw) ? (raw[0] ?? {}) : (raw ?? {});
  const output = parseWebhookResponse(raw);
  const status = (getVal(output, ['status'], getVal(rawDict, ['status'], 'processing')) ?? 'processing') as string;
  const videoUrl = (getVal(output, ['video_url', 'video url', 'videoUrl', 'url'],
                    getVal(rawDict, ['video_url', 'video url', 'videoUrl', 'url']))) as string | undefined;
  return { status, video_url: videoUrl, unique_key: uniqueKey };
}

export async function publish(data: {
  product_name: string;
  description: string;
  image_url?: string | null;
  video_url?: string | null;
  unique_key: string;
}): Promise<void> {
  await callN8n(N8N_PUBLISH, {
    workflow: 'publish',
    product_name: data.product_name,
    description: data.description,
    image_url: data.image_url ?? '',
    video_url: data.video_url ?? '',
    unique_key: data.unique_key,
  });
}

export function proxyImageUrl(url: string): string {
  return typeof url === 'string' ? url : '';
}

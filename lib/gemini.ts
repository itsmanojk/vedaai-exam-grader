// Thin wrapper around the Gemini "generateContent" REST endpoint.
// We call the REST API directly (rather than pulling in the SDK) so the
// server route has exactly one network dependency and one failure mode to
// reason about.

const DEFAULT_MODEL = "gemini-2.5-flash";

export interface InlineImage {
  mimeType: string;
  data: string; // base64, no data: prefix
}

interface GenerateJsonArgs {
  systemInstruction: string;
  prompt: string;
  images?: { label: string; image: InlineImage }[];
  responseSchema: unknown;
}

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls Gemini with a text + (optional) image prompt and asks it to return
 * JSON conforming to `responseSchema`. Throws GeminiConfigError if no API
 * key is configured, and GeminiRequestError for anything the API itself
 * rejects (bad key, quota, etc.) so the route can surface a clear message.
 */
export async function generateJson<T>({
  systemInstruction,
  prompt,
  images = [],
  responseSchema,
}: GenerateJsonArgs): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not set. Add it to your environment (see .env.example)."
    );
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const parts: Record<string, unknown>[] = [];
  for (const { label, image } of images) {
    if (label) parts.push({ text: label });
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  parts.push({ text: prompt });

  const body = {
    systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GeminiRequestError(
      `Gemini API request failed (${res.status}): ${text.slice(0, 500)}`,
      res.status
    );
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");

  if (!text) {
    const blockReason = json?.promptFeedback?.blockReason;
    throw new GeminiRequestError(
      blockReason
        ? `Gemini declined to respond (${blockReason}).`
        : "Gemini returned an empty response."
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiRequestError("Gemini returned a response that wasn't valid JSON.");
  }
}

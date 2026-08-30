import type { NormalizedBox } from "./types";

interface GeminiBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

/** Converts Gemini's [ymin,xmin,ymax,xmax] (0-1000) box to a 0-1 x/y/w/h box, clamped to bounds. */
export function fromGeminiBox(box: GeminiBox): NormalizedBox {
  const clamp = (n: number) => Math.min(1, Math.max(0, n / 1000));
  const x = clamp(box.xmin);
  const y = clamp(box.ymin);
  const w = Math.max(0, clamp(box.xmax) - x);
  const h = Math.max(0, clamp(box.ymax) - y);
  return { x, y, w, h };
}

export function makeQuestionId(number: string, subpart?: string): string {
  const base = `q${number}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  return subpart ? `${base}${subpart.toLowerCase().replace(/[^a-z0-9]/g, "")}` : base;
}

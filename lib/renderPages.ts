import type { PageImage } from "./types";

// pdf.js is only ever used in the browser (it touches the DOM/canvas), so it's
// dynamically imported inside this function rather than at module scope —
// that keeps it out of the server bundle entirely.
async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjs;
}

// Optimized dimensions & compression quality to keep Base64 payloads under Vercel's 4.5MB limit
const MAX_DIMENSION = 1400; 
const JPEG_QUALITY = 0.70;

function canvasToPageImage(canvas: HTMLCanvasElement, index: number): PageImage {
  return {
    index,
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    width: canvas.width,
    height: canvas.height,
  };
}

async function renderPdfToPages(file: File): Promise<PageImage[]> {
  const pdfjs = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: PageImage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale: Math.max(scale, 0.5) });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context while rendering PDF");

    // Fill white background before drawing
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    pages.push(canvasToPageImage(canvas, pages.length));
  }

  return pages;
}

async function renderImageFile(file: File, startIndex: number): Promise<PageImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Could not decode image ${file.name}`));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context while reading image");

  // Fill white background before drawing transparent images
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvasToPageImage(canvas, startIndex);
}

/**
 * Turns an uploaded file (or set of files) into an ordered array of page
 * images. PDFs are expanded into one entry per page; each image file becomes
 * a single page. This lets both "one PDF" and "several photographed pages"
 * uploads represent a multi-page document the same way downstream.
 */
export async function renderFilesToPages(files: File[]): Promise<PageImage[]> {
  const pages: PageImage[] = [];
  for (const file of files) {
    if (file.type === "application/pdf") {
      const pdfPages = await renderPdfToPages(file);
      for (const p of pdfPages) pages.push({ ...p, index: pages.length });
    } else if (file.type.startsWith("image/")) {
      const page = await renderImageFile(file, pages.length);
      pages.push(page);
    } else {
      throw new Error(`Unsupported file type: ${file.name} (${file.type || "unknown"})`);
    }
  }
  return pages;
}

export function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Malformed data URL");
  return { mimeType: match[1], data: match[2] };
}
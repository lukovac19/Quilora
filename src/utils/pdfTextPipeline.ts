import { pdfjs } from 'react-pdf';
import { createWorker, type Worker } from 'tesseract.js';

/** Same pdfjs instance as react-pdf so worker + API versions always match. */
const distVersion = typeof pdfjs.version === 'string' ? pdfjs.version : '5.6.205';
const PDFJS_UNPKG = `https://unpkg.com/pdfjs-dist@${distVersion}`;

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}

const MIN_CHARS_BEFORE_OCR = 12;
const MIN_ALNUM_RATIO = 0.04;

function textLooksEmpty(text: string): boolean {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length < MIN_CHARS_BEFORE_OCR) return true;
  const alnum = trimmed.replace(/[^0-9A-Za-z]/g, '').length;
  return alnum / Math.max(trimmed.length, 1) < MIN_ALNUM_RATIO;
}

function joinTextContentItems(items: readonly unknown[]): string {
  let out = '';
  for (const raw of items) {
    const item = raw as { str?: string; hasEOL?: boolean };
    if (typeof item.str === 'string') out += item.str;
    if (item.hasEOL) out += '\n';
  }
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function ocrPageCanvas(page: pdfjs.PDFPageProxy, signal: AbortSignal, getWorker: () => Promise<Worker>): Promise<string> {
  if (signal.aborted) return '';
  const scale = 2.35;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return '';
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const renderTask = page.render({ canvasContext: ctx, viewport });
  await renderTask.promise;
  if (signal.aborted) return '';
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas);
  return (data.text || '').replace(/\s+/g, ' ').trim();
}

export type PdfExtractProgress = {
  onProgress?: (fraction: number) => void;
  onPageText?: (pageNum: number, text: string) => void;
  signal?: AbortSignal;
};

/**
 * Extracts text per page using PDF.js; runs Tesseract OCR when a page has little or no selectable text.
 */
export async function extractPdfWithOcrProgress(
  data: ArrayBuffer,
  { onProgress, onPageText, signal }: PdfExtractProgress = {},
): Promise<{ map: Record<number, string>; title: string | null; numPages: number }> {
  const map: Record<number, string> = {};
  let title: string | null = null;
  let ocrWorker: Worker | null = null;
  const getOcrWorker = async () => {
    if (!ocrWorker) ocrWorker = await createWorker('eng', 1, { logger: () => undefined });
    return ocrWorker;
  };
  try {
    const pdf = await pdfjs
      .getDocument({
        data,
        cMapUrl: `${PDFJS_UNPKG}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${PDFJS_UNPKG}/standard_fonts/`,
      })
      .promise;
    const meta = (await pdf.getMetadata().catch(() => null)) as { info?: { Title?: string } } | null;
    title = typeof meta?.info?.Title === 'string' && meta.info.Title.trim() ? meta.info.Title.trim() : null;
    const numPages = pdf.numPages || 0;
    onProgress?.(0);
    if (numPages === 0) return { map, title, numPages: 0 };

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (signal?.aborted) break;
      const page = await pdf.getPage(pageNum);
      let text = '';
      try {
        const textContent = await page.getTextContent({ includeMarkedContent: false });
        text = joinTextContentItems(textContent.items as unknown[]);
      } catch {
        text = '';
      }
      if (textLooksEmpty(text)) {
        try {
          const ocrText = await ocrPageCanvas(page, signal ?? new AbortController().signal, getOcrWorker);
          if (ocrText.length > text.trim().length) text = ocrText;
        } catch {
          /* keep PDF text if any */
        }
      }
      map[pageNum] = text;
      onPageText?.(pageNum, map[pageNum]);
      onProgress?.(pageNum / numPages);
      if (pageNum % 2 === 0) await new Promise((r) => window.setTimeout(r, 0));
    }
  } catch {
    /* caller may still use partial map */
  } finally {
    await ocrWorker?.terminate().catch(() => undefined);
  }
  const numPages = Object.keys(map).length;
  return { map, title, numPages };
}

import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPagesViewerProps {
  url: string;
  className?: string;
  scale?: number;
}

/**
 * Renders a PDF as a list of images (one image per page) for viewing.
 * Download remains a normal PDF via the existing download flow.
 */
export function PdfPagesViewer({ url, className = '', scale = 1.8 }: PdfPagesViewerProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const cacheKey = useMemo(() => `pdfimg:${url}`, [url]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState('loading');

      // small in-memory session cache to avoid re-rendering on back/forward
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) {
            if (!cancelled) {
              setPages(parsed);
              setState('ready');
            }
            return;
          }
        } catch {}
      }

      try {
        const res = await fetch(url, { cache: 'force-cache' });
        const buf = await res.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;

        const out: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          // Convert to image (PNG). You can switch to JPEG for smaller size.
          out.push(canvas.toDataURL('image/png'));
        }

        if (!cancelled) {
          setPages(out);
          setState('ready');
          try { sessionStorage.setItem(cacheKey, JSON.stringify(out)); } catch {}
        }
      } catch (e) {
        if (!cancelled) setState('error');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [url, scale, cacheKey]);

  if (state === 'loading') {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${className}`}>
        <LoadingSpinner text="جار التحميل..." />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={`p-6 text-sm text-muted-foreground ${className}`}>
        تعذر عرض ملف PDF داخل الصفحة.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
      {pages.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`page_${idx + 1}`}
          className="w-full h-auto rounded-xl"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

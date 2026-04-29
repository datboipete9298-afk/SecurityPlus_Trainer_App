import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { extractPdfTextFromFile, isLikelyScanOnlyPdf } from "../lib/extractPdfText";
import { deletePdf, loadAllPdfs, putPdf, type StoredPdfTextRecord } from "../lib/pdfLibraryDb";

const SCAN_ONLY_MESSAGE =
  "This PDF does not contain readable text. It may be a scanned image PDF. Try a text-based PDF or OCR it first.";

const PRIVACY_LINE = "PDFs stay on this device. Text is extracted in your browser and saved locally.";

export { PRIVACY_LINE };

type PdfLibraryContextValue = {
  pdfs: StoredPdfTextRecord[];
  loading: boolean;
  importing: boolean;
  importError: string | null;
  totalChars: number;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removePdf: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const PdfLibraryContext = createContext<PdfLibraryContextValue | null>(null);

export function PdfLibraryProvider({ children }: { children: ReactNode }) {
  const [pdfs, setPdfs] = useState<StoredPdfTextRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadAllPdfs();
      list.sort((a, b) => b.addedAt - a.addedAt);
      setPdfs(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
      if (arr.length === 0) return;
      setImporting(true);
      setImportError(null);
      try {
        const errors: string[] = [];
        for (const file of arr) {
          const extracted = await extractPdfTextFromFile(file);
          if (isLikelyScanOnlyPdf(extracted.pages)) {
            errors.push(`"${file.name}": ${SCAN_ONLY_MESSAGE}`);
            continue;
          }
          const rec: StoredPdfTextRecord = {
            id: crypto.randomUUID(),
            fileName: extracted.fileName,
            addedAt: Date.now(),
            pages: extracted.pages,
            fullText: extracted.fullText,
          };
          await putPdf(rec);
        }
        await refresh();
        if (errors.length) setImportError(errors.join("\n"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not read PDF";
        setImportError(msg);
      } finally {
        setImporting(false);
      }
    },
    [refresh],
  );

  const removePdf = useCallback(
    async (id: string) => {
      await deletePdf(id);
      await refresh();
    },
    [refresh],
  );

  const totalChars = useMemo(() => pdfs.reduce((n, p) => n + p.fullText.length, 0), [pdfs]);

  const value = useMemo(
    () => ({
      pdfs,
      loading,
      importing,
      importError,
      totalChars,
      addFiles,
      removePdf,
      refresh,
    }),
    [pdfs, loading, importing, importError, totalChars, addFiles, removePdf, refresh],
  );

  return <PdfLibraryContext.Provider value={value}>{children}</PdfLibraryContext.Provider>;
}

export function usePdfLibrary(): PdfLibraryContextValue {
  const ctx = useContext(PdfLibraryContext);
  if (!ctx) throw new Error("usePdfLibrary must be used within PdfLibraryProvider");
  return ctx;
}

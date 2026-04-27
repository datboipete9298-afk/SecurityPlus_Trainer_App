/**
 * Optional edition-specific page hints. Leave empty unless you map your PDF edition.
 * When present, LocalPdfOpenButton can append #page=N for viewers that honor it.
 */
export type PdfPageMapEntry = {
  pdfId: string;
  lessonId: string;
  startPage: number;
  endPage: number;
  searchPhrase: string;
};

export const PDF_PAGE_MAP: PdfPageMapEntry[] = [];

export function getPdfPageMapEntry(pdfId: string, lessonId: string): PdfPageMapEntry | undefined {
  return PDF_PAGE_MAP.find((e) => e.pdfId === pdfId && e.lessonId === lessonId);
}

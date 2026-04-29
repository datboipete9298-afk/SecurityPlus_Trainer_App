/** Router state for pre-filling a Brain Book line from Search → lesson. */
export type PdfNotePrefillRoot = {
  sptPdfNotePrefill?: {
    line: string;
    fileName?: string;
    page?: number;
    snippet?: string;
  };
};

export function pdfNoteLineFromHit(searchQuery: string, snippet: string): string {
  const term = searchQuery.trim().replace(/\s+/g, " ") || "this idea";
  const tail = snippet.replace(/\s+/g, " ").trim().slice(0, 100);
  return `${term} = ${tail || "one plain-English takeaway from your PDF"}`;
}

function tokenSet(text: string): Set<string> {
  const raw = text.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  return new Set(raw.split(/\s+/).filter((w) => w.length > 2));
}

/** True if any meaningful token appears in both answer and (note or snippet). */
export function noteUnderstandingOverlap(answer: string, userNote: string, pdfSnippet: string): boolean {
  const a = tokenSet(answer);
  const ref = tokenSet(`${userNote} ${pdfSnippet}`);
  for (const t of a) {
    if (ref.has(t)) return true;
  }
  return false;
}

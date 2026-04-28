# PDF Guide System Master Audit

## Flow inventory

`/pdf-setup` → verify `pdfFileVerifier` → IndexedDB blobs via `localPdfStore` → metadata in persisted state (`pdfLibrary.localFileMeta`) → reconcile on load + cross-tab broadcast.

`/pdf-guides` → select registry entry → `/pdf-guides/:pdfId` section list → `/pdf-guides/:pdfId/:lessonId` (`PdfLessonGuidePage`) with highlight + note panels + checkpoints + AI context.

## Strengths

- **Never ships copyrighted PDFs** — legal boundary clear.
- **Verifier** resists wrong book / low confidence path with user confirmation.
- **Progress section** explains backup excludes binaries.
- **Local object URL** open path with IDB guard messages.

## Edge cases

| Case | Behavior | Risk |
|------|----------|------|
| Wrong PDF | Rejected or low-confidence modal | User frustration — copy mostly good |
| Renamed file | Aliases + matcher | Edge rename → manual confirm |
| Duplicate filename | Last write wins in IDB? | rare collision — low |
| Large PDF | `MAX_PDF_BYTES` guard | OK |
| Corrupted file | verify step fails | Error row |
| IndexedDB blocked | Banner + LocalPdfOpenButton error | OK |
| Mobile picker | Explicit “Choose files” copy | ✅ |
| PDF missing mid-session | `hasRequiredPdf` gates | Deep link fallback `?need=` → ✅ clarified title banner |
| Other tab clears IDB | `subscribePdfStorageChanged` reconcile | race — rare glitch |
| Clear browser data | Total loss PDF + state | disclaimers ✅ |

---

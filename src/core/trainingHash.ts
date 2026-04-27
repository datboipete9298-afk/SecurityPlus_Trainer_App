/** Deterministic variation per lesson (no RNG — stable across reloads). */
export function hashLessonId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pick<T>(arr: readonly T[], lessonId: string, salt: string): T {
  const h = hashLessonId(lessonId + salt);
  return arr[h % arr.length]!;
}

export function pickN<T>(arr: readonly T[], lessonId: string, salt: string, n: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let h = hashLessonId(lessonId + salt);
  while (out.length < Math.min(n, arr.length)) {
    const i = h % arr.length;
    h = Math.imul(h, 31) + 1;
    if (used.has(i)) continue;
    used.add(i);
    out.push(arr[i]!);
  }
  return out;
}

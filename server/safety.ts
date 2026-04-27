const MAX_USER_Q = 4000;
const BLOCK = [/bypass\s+captcha/i, /ddos\s+how/i, /exploit\s+.*\s+for\s+me/i];

export function sanitizeUserQuestion(q: string | undefined): { ok: boolean; text: string; reason?: string } {
  if (q == null || q.trim() === "") return { ok: true, text: "" };
  const t = q.trim();
  if (t.length > MAX_USER_Q) return { ok: false, text: "", reason: "Question too long" };
  for (const re of BLOCK) {
    if (re.test(t)) return { ok: false, text: "", reason: "Request not allowed" };
  }
  return { ok: true, text: t };
}

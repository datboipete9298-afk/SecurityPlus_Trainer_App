# Privacy + trust audit

## Data storage

- **Progress, notes, quiz stats, flashcards:** `localStorage` on device — **no account required**.  
- **Exam drafts:** `sessionStorage` — ephemeral by design.  
- **AI traffic:** When enabled, user text + structured context goes to **your server** → OpenAI — not “anonymous cloud sync of progress.”

## Export / import

- Export is **explicit download** — good.  
- Import **replaces** local state after confirmation — must stay scary-colored; Progress page warns.  
- **Lesson author import** is separate route — still a confusion vector; mitigated by copy + Progress note (this pass).

## API keys

- **OpenAI key** belongs server-side — matches implementation.  
- Client only has **`VITE_AI_API_BASE`** — not a secret; OK.

## Secrets in frontend

- **No OpenAI key in bundle** observed in intended setup — keep `.env` out of git.

## Friend usage without login

- **Pro:** zero PII collection by default.  
- **Con:** no recovery if they lose phone — **backup copy is the security model.**

## Disclaimers

- Readiness + exam disclaimers exist in multiple surfaces — **keep them near the number**.  
- PBQ “not official” — present; reinforce near first PBQ pass/fail.

## Trust score

**86/100** — Local-first is trustworthy; main hazard is **user accidentally clearing storage** or **mis-importing JSON**.

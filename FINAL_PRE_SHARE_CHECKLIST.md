# Final Pre-Share Checklist (Maintainer)

Gate before calling the app “release quality” for strangers or students.

## Build & validation

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm run validate:data
npm run validate:feedback
npm run validate:training
npm run validate:videos
npm run validate:ai
npm run validate:ai-integration
npm run build
```

- [ ] All commands exit **0**
- [ ] `dist/` deployed (or previewed with `npm run preview`)

## Legal / ethical copy

- [ ] Practice content labeled **personal study** / **not affiliated** where appropriate
- [ ] YouTube / Messer attribution present where required by your terms

## Security

- [ ] No API keys in repo or client env (only `VITE_*` for public base URL)
- [ ] `.env` in `.gitignore` (verify)

## UX critical paths

- [ ] New user: `/` → `/start-here` → can reach dashboard
- [ ] `HomeGate` does not loop
- [ ] Wildcard routes land safely
- [ ] Progress **export** produces valid JSON re-importable

## Performance sanity

- [ ] First load acceptable on 4G
- [ ] No console errors on happy path

## Documentation

- [ ] `README.md` points to active path + deploy docs
- [ ] `ACTIVE_PROJECT_PATH.md` matches reality
- [ ] Top-notch docs present: `TOP_NOTCH_SYSTEM_MAP.md`, `TOP_NOTCH_AUDIT_REPORT.md`

## After share

- [ ] Note **date** and **commit** you deployed
- [ ] Collect 3 friend pain points → file issues in `TOP_NOTCH_IMPROVEMENT_PLAN.md`

---

**Definition of done:** A distracted phone user can complete **Start here → one lesson chunk → three quiz questions** without asking you for help.

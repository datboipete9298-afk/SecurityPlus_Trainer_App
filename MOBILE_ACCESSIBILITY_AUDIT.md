# Mobile + Accessibility Audit

## Responsive layout

| Width | Observation |
|-------|---------------|
| 375px phone | Sidebar off-canvas; `MobileStickyContinue` pins primary continuity |
| Tablet | lg grid splits Dashboard |
| Desktop | Fixed sidebar |

Touch targets:** Nav links use **`min-h-[44px]`** in Layout.

Sticky/focus:**

- Skip-to-content link to `#main-content`
- ESC closes nav drawer

Contrast:** Dark theme — not machine-verified WCAG-AA for every amber note in this audit pass.

Semantics:** Heading hierarchy relies on PageHeader (`h1` pattern) — spot-check routes for duplicate `h1`.

Screen readers:

- Several icon toggles labeled; training lab controls partly rely on adjacent text — **PBQ/order interactions should have manual VoiceOver sweep**.

_PBRunner / Quiz tap targets_: generally explicit `min-h` — verify regressions quarterly.

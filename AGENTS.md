## Skills

Use the repo-local [`typescript-standards`](.agents/skills/typescript-standards/SKILL.md) skill for shared TypeScript, TSX, React, and application-logic work in this repository.
Use the repo-local [`commit-message-standards`](.agents/skills/commit-message-standards/SKILL.md) skill when generating commit messages for this repository.
Use the repo-local [`pnpm-scripts`](.agents/skills/pnpm-scripts/SKILL.md) skill when running shared `pnpm` scripts in this repository.

# brescianifoto — Concert Photography Portfolio

## Project
A portfolio website for a concert photographer, named **brescianifoto**. The site's only job is to get out of the way of the photography — full-color, high-energy live-music images are the content; the UI is a quiet, neutral shell around them.

## Stack notes
- Build styling with **Tailwind CSS**.
- Use CSS variables for all design tokens (colors, etc.) rather than hardcoding values in Tailwind config or classes. The variables themselves haven't been created yet — when they are, wire Tailwind's theme to reference them (e.g. `background: 'var(--void)'`) rather than duplicating hex values.

## Direction
Cinematic, editorial, premium, immersive, emotional — but restrained. Bold condensed sans headlines, mono metadata tags (venue / date / camera / lens), generous negative space, sharp corners, no decorative color. Think: the ten seconds after the lights drop and before the crowd starts moving.

## Color palette — 5 neutrals, no accent color
The palette is deliberately colorless because the photography supplies all the color. Do not introduce an accent/brand color.

| Token | Hex | Role |
|---|---|---|
| `--void` | `#131417` | Primary dark background |
| `--ink` | `#1B1C20` | Elevated surfaces — cards, nav, modals |
| `--bone` | `#F2ECDD` | Primary text on dark; the one "filled" UI color (CTAs, active states) |
| `--paper` | `#E6DCC2` | Secondary light surface; headline highlight word; light-mode background (bio/press pages) |
| `--fog` | `#A39A85` | Secondary text on dark, labels, borders |
| `--fog-dim` | `#726C5C` | Tertiary text, mono metadata |
| `--line` | `rgba(242,238,221,0.14)` | Hairline borders / dividers |

Default mode is dark (void background, bone text). A light mode (paper/bone background, void text) is available for bio, press, and print-order pages.

## Typography
Two type families only.

- **Archivo** — headings AND body. Weights 400/500 (body), 700 (labels/tags), 800/900 (headlines). Headings are uppercase, tight letter-spacing (-0.01 to -0.02em). Labels/eyebrows are uppercase with wide tracking (+0.06 to +0.22em).
- **IBM Plex Mono** — reserved exclusively for metadata: venue, date, camera, lens, image counts, timestamps. Weights 400/500. This is a signature detail — don't use mono anywhere else.

Both are free on Google Fonts.

### Type scale
| Role | Family / weight | Size | Notes |
|---|---|---|---|
| H1 | Archivo 900 | 72–96px (clamp down to ~48px mobile) | line-height 0.92–0.98, uppercase |
| H2 | Archivo 800 | 32–40px | uppercase |
| H3 | Archivo 700 | 18–22px | uppercase, card/gallery titles |
| Eyebrow/label | Archivo 700 | 11px | uppercase, +0.22em tracking |
| Body | Archivo 400 | 15–17px | line-height 1.6, sentence case, color `--fog` on dark |
| Caption/meta | IBM Plex Mono 400 | 11–13px | color `--fog-dim`, e.g. `RED ROCKS AMPHITHEATRE — 09.14.2025 — SONY A7S III / 85MM` |

## Spacing
8px base unit: `4, 8, 16, 24, 32, 48, 64, 96, 128`. Tight values for UI chrome (buttons, cards); wide values (96–128) between page sections — the rhythm lives between sections, not inside components.

## Border radius
Sharp by default. `0` on images, cards, and section containers. `2px` on buttons/inputs/tags. `999px` (full) only on circular icon buttons and pills.

## Image handling
**Show photos as shot — no forced grayscale, duotone, or color treatment.** The photographer's own color grading carries the emotion; the UI must not filter or reinterpret it. Default crop ratios: 4:5 portrait for pit/artist shots, 16:9 for wide stage/crowd shots. No rounded corners on images. A very subtle fixed film-grain overlay (4–6% opacity, blend-mode overlay) may sit across the whole page as a constant texture, but never on top of/altering individual photos' color.

## UI patterns
- Buttons: one filled style (bone fill, void text) for the single primary CTA per page (e.g. "Book a Shoot"); everything else is a ghost/outline button (transparent, `--line` border, bone text).
- Circular icon buttons (48px, full radius, hairline border) for arrows/nav controls.
- Links: underline in `--paper`, no color change on hover — weight/underline only.
- Nav: minimal, uppercase, wide tracking, hairline border, no fill.
- Cards: hairline border, 0 radius, mono metadata row under the title (date · image count · camera).

## Motion
Restrained and orchestrated, not scattered:
- Page load: slow Ken Burns drift on hero image (scale 1.0 → 1.04 over 6–8s), headline fades up after.
- Scroll: gallery items fade + rise ~16px on entry, staggered ~60ms, easing `cubic-bezier(0.22,1,0.36,1)`.
- Hover: images scale to ~1.03, captions slide up slightly. Buttons invert fill/border only — no shadow, no bounce.
- Page transitions: short cross-fade through void (~240ms), never a slide/wipe.
- Respect `prefers-reduced-motion` — drop scale/Ken Burns effects, keep static states.

## Tone of voice (copy)
Plain, active, specific. Describe what's real about the shoot (venue, date, gear) rather than selling with adjectives. Metadata tags do a lot of the storytelling work, so keep prose captions short.

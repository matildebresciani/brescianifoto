## Skills

Use the repo-local [`typescript-standards`](.agents/skills/typescript-standards/SKILL.md) skill for shared TypeScript, TSX, React, and application-logic work in this repository.
Use the repo-local [`commit-message-standards`](.agents/skills/commit-message-standards/SKILL.md) skill when generating commit messages for this repository.
Use the repo-local [`pnpm-scripts`](.agents/skills/pnpm-scripts/SKILL.md) skill when running shared `pnpm` scripts in this repository.

# brescianifoto — Concert Photography Portfolio

## Project
A portfolio website for a concert photographer, named **brescianifoto**. The site's only job is to get out of the way of the photography — full-color, high-energy live-music images are the content; the UI is a quiet, neutral shell around them.

## Stack notes
- Build styling with **Tailwind CSS**.
- Use CSS variables for all design tokens (colors, etc.) rather than hardcoding values in Tailwind config or classes. Wire Tailwind's theme to reference the existing variables (e.g. `background: 'var(--void)'`) rather than duplicating hex values.

## Direction
Cinematic, editorial, premium, immersive, emotional — but restrained. Tall serif statements, bold sans supporting headings, mono metadata tags (venue / date / camera / lens), generous negative space, sharp corners, no decorative color. Think: the ten seconds after the lights drop and before the crowd starts moving.

## Color palette — neutrals, no accent color
The palette is deliberately colorless because the photography supplies all the color. Do not introduce an accent/brand color.

| Token | Hex | Role |
|---|---|---|
| `--void` | `#151611` | Primary text and filled buttons |
| `--ink` | `#25261F` | Hover and pressed surfaces |
| `--bone` | `#FAFFEF` | Main background; text on filled buttons |
| `--paper` | `#F0F3E6` | Secondary surface |
| `--fog` | `#55584C` | Body and secondary text |
| `--fog-dim` | `#737769` | Metadata on bone surfaces |
| `--line` | `rgba(21,22,17,0.18)` | Hairline borders / dividers |

Default mode is light: bone background, void text, and paper secondary surfaces. Use the existing semantic variables for component colors.

## Typography
Three font families with distinct roles. All frontend text must use fluid sizing: `clamp()` with rem bounds and a rem-plus-vw preferred value, interpolating between 320px and 1440px. Use the shared CSS variables and typography roles instead of fixed sizes or breakpoint font-size jumps.

- **Instrument Serif 400** — hero statements and page titles. Always uppercase via CSS. Tight tracking and line-height around 0.97. Hero statements use `.statement`; page titles use `h1` / `.heading-1`.
- **Archivo 400/500/700/900** — all regular copy, supporting headings, cards, navigation, buttons, labels, tags, forms, descriptive image captions, and footer contact/legal text. Preserve the written case (`text-transform: none`); do not force uppercase, lowercase, or capitalize. The wordmark retains its authored lowercase `brescianifoto`.
- **IBM Plex Mono 400/500** — photographic metadata only: venue, date, camera, lens, counts, timestamps, and publication dates. Always uppercase via CSS, including direct `font-mono` usage. Use `.metadata` or the compatible `.caption` class. Ordinary prose captions use Archivo.

Load all three through `next/font/google` with dedicated loader variables. Keep semantic aliases separate from loader variables and map Tailwind font utilities through `@theme inline` without self-referencing declarations. Do not rewrite CMS content to enforce case or sizing.

| Role | Font / weight | Fluid size | Token / class |
|---|---|---|---|
| Hero statement | Instrument Serif 400 | 48–112px | `--text-statement` / `.statement` |
| Page title | Instrument Serif 400 | 40–72px | `--text-title` / `.heading-1` |
| Main section heading | Archivo 900 | 28–40px | `--text-heading-2` / `.heading-2` |
| Card / smaller heading | Archivo 700 | 18–22px | `--text-heading-3` / `.heading-3` |
| Supporting heading | Archivo 700 | 16–20px | `--text-heading-4` / `.heading-4` |
| Small heading | Archivo 700 | 15–18px / 14–16px | `.heading-5` / `.heading-6` |
| Introduction | Archivo 400/500 | 17–19px | `--text-intro` / `.body-lg` |
| Body | Archivo 400 | 15–17px | `--text-body` / `.body-md` |
| Short caption / supporting copy | Archivo 400 | 14–16px | `--text-small` / `.body-sm` |
| UI / footer details | Archivo 500/700 | 12–14px | `--text-ui` / `.ui-text`, `.eyebrow`, `.body-xs` |
| Metadata | IBM Plex Mono 400/500 | 11–13px | `--text-metadata` / `.metadata`, `.caption` |
| Wordmark | Archivo 900 | 22–24px; footer 24–32px | `--logo-font-size`, `--logo-font-size-footer` |

Sans headings use line-height around 1.15; body text uses 1.6; UI and metadata use 1.4. Let long titles wrap instead of truncating them. On paper surfaces, use the existing `--fog` tone for small metadata to maintain contrast.

Rich text uses shared frontend roles while retaining semantic headings, lists, links, bold, and italic. Do not add inline font-size editor controls; ignore legacy inline font-size declarations when rendering the frontend. Keep page zoom enabled.

## Spacing
8px base unit: `4, 8, 16, 24, 32, 48, 64, 96, 128`. Tight values for UI chrome (buttons, cards); wide values (96–128) between page sections — the rhythm lives between sections, not inside components.

## Border radius
Sharp by default. `0` on images, cards, and section containers. `2px` on buttons/inputs/tags. `999px` (full) only on circular icon buttons and pills.

## Image handling
**Show photos as shot — no forced grayscale, duotone, or color treatment.** The photographer's own color grading carries the emotion; the UI must not filter or reinterpret it. Default crop ratios: 4:5 portrait for pit/artist shots, 16:9 for wide stage/crowd shots. No rounded corners on images. A very subtle fixed film-grain overlay (4–6% opacity, blend-mode overlay) may sit across the whole page as a constant texture, but never on top of/altering individual photos' color.

## UI patterns
- Buttons: one filled style (void fill, bone text) for the single primary CTA per page (e.g. "Book a Shoot"); everything else is a ghost/outline button (transparent, `--line` border, `--fg-base` text).
- Circular icon buttons (48px, full radius, hairline border) for arrows/nav controls.
- Links: underline in `--fg-base`, no color change on hover — weight/underline only.
- Nav: minimal, written case, modest tracking, hairline border, no fill.
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

# Handoff: Competitions Page + Image Submission Flow

## Overview
This document covers two interconnected features for the NVPC member portal:
1. **Competitions Page** — the member's view of the current and past competitions
2. **Image Submission Flow** — the 3-step modal wizard for submitting an image

These are part of the Focal Point platform — a Next.js + MUI application. Implement using the existing MUI theme system, `next/font/google` font variables, and the CSS custom property system defined in `design-tokens.md`.

## About the Design Files
The `.html` files in this bundle are **interactive HTML/React prototypes — design references only**. Do not ship them directly. Recreate these designs in the existing Next.js + MUI codebase using established patterns.

## Fidelity
**High-fidelity.** Match colors, typography, spacing, interactions, and motion as closely as MUI allows. Use `sx` props and `theme.components` overrides where MUI defaults conflict.

---

## Typography (member portal)

| Element | Font | Size | Weight |
|---|---|---|---|
| Page title, competition name | Lora | 26–28px | 700 |
| Section headings | Lora | 18px | 700 |
| Large stat numerals | Lora | 38px | 700 |
| All body copy, labels, nav, buttons | Nunito | 13–15px | 500–700 |
| Caps labels / overlines | Nunito | 11px | 700, `letter-spacing: 0.07em`, uppercase |
| Badge/pill text | Nunito | 12px | 700, `letter-spacing: 0.03em`, uppercase |

**Add Nunito to `app/layout.tsx`:**
```tsx
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400','500','600','700'],
  variable: '--font-nunito'
})
```

---

## Color Tokens (member portal)

### Light mode
```
--surface-0: #F4F4F4   page base
--surface-1: #EAEAEA   cards/panels
--surface-2: #FFFFFF   raised elements
--text-primary:   #1A1A1A   14.5:1 ✓
--text-secondary: #595959   5.4:1 ✓  ← pushed from #696969 for accessibility
--text-tertiary:  #888888
--action-primary: #1A6FC4
--border-default: rgba(0,0,0,0.13)
--border-subtle:  rgba(0,0,0,0.07)
```

### Dark mode
```
--surface-0: #141414
--surface-1: #1E1E1E
--surface-2: #292929
--surface-3: #333333
--text-primary:   #E8E8E8
--text-secondary: #A0A0A0
--text-tertiary:  #737373
--text-disabled:  #525252
--action-primary: #4A90D4
--border-default: rgba(255,255,255,0.12)
--border-subtle:  rgba(255,255,255,0.07)
```

### Status colors
```
success:    #2E7D32   bg: #EDFAF0   text: #174A1A
success-dk: bg: #0E2410   text: #97C459
warning:    #A67C00   bg: #FFFBE6   text: #6B5000
warning-dk: bg: #3A2E00   text: #FAD84A
error:      #D32F2F   bg: #FDEEEE   text: #7A1515
error-dk:   bg: #3D1212   text: #F09595
```

### Phase tint system (competition header)
The competition header changes background tint + left border based on submission phase:

| Phase | Condition | Dark bg | Light bg | Border color |
|---|---|---|---|---|
| Open | >7 days remaining | `rgba(46,125,50,0.10)` | `rgba(46,125,50,0.07)` | `#97C459` / `#2E7D32` |
| Closing soon | ≤7 days remaining | `rgba(166,124,0,0.12)` | `rgba(166,124,0,0.07)` | `#FAD84A` / `#A67C00` |
| Judging / closed | After deadline | `rgba(255,255,255,0.025)` | `rgba(0,0,0,0.02)` | `transparent` |

Left border is always `3px solid [color]` applied to the header div. Use CSS transition `background 0.3s, border-color 0.3s`.

---

## Competitions Page

### Route
`/competitions` — member-facing, authenticated

### Page layout
```
<Nav/>                          54px sticky
<main overflow-y: auto>
  <div max-width: 960px margin: auto padding: 28px 36px 48px>
    <CurrentCompetitionBlock/>
    <PreviousCompetitionsBlock/>
  </div>
</main>
```

---

### CurrentCompetitionBlock

Outer card: `border-radius: 14px`, `border: 1px solid border-default`, surface-1 bg (dark) / surface-2 (light), `box-shadow: 0 2px 12px rgba(0,0,0,0.07)` light only. `overflow: hidden`.

#### Competition header strip
`padding: 24px 28px 20px`, `border-bottom: 1px solid border-default`
`display: flex, align-items: flex-start, justify-content: space-between, gap: 16px, flex-wrap: wrap`
Background + left border per phase tint table above.

**Left side:**
- Overline: Nunito 11px/700 uppercase `letter-spacing: 0.07em` text-tertiary — "Current Competition"
- Title: Lora 26px/700 `letter-spacing: -0.02em` — competition name e.g. "April 2026 — Open, Nature & Monochrome"
- Meta row (flex, gap 18px, flex-wrap):
  - Clock icon + deadline text — "Submissions close **May 15, 2026**" (normal) OR "May 15, 2026 · **6 days left**" in warning color when ≤7 days
  - Calendar icon + "Meeting **May 28, 2026 · 7:30 PM**"
  - Users icon + "Judge **Carol W.**"

**Right side (flex-col, align-end, gap 10px):**
- Status pill (see badge spec below)
- When open/warning: primary "Submit an image" button with upload icon
- When judging: muted text "Results on [meeting date]"

**Status pills by phase:**
```
Open:          bg: successBg    color: successText  label: "Submissions open"
Closing soon:  bg: warningBg    color: warningText  label: "Closing soon"
Judging:       bg: warningBg    color: warningText  label: "Judging in progress"
```
Pill: `border-radius: 9999px`, Nunito 12px/700, uppercase, `letter-spacing: 0.03em`.

#### Two-column lower section
`display: grid, grid-template-columns: 1fr 340px`

**Left — My Submissions** (`padding: 22px 28px, border-right: 1px solid border-default`):

Header row: "MY SUBMISSIONS" caps label + "N of 5 max" right-aligned.

Image grid — dynamic column count based on item count:
```js
const total = submissions.length + (phase !== 'judging' ? 1 : 0); // +1 for add slot
const cols = total <= 3 ? total : total <= 4 ? 2 : 3;
grid-template-columns: repeat(cols, 1fr)
```
This prevents orphaned single cards on bottom rows.

**Photo card:**
- `border-radius: 10px`, surface-2 (dark) / surface-1 (light) bg, `border: 1px solid border-subtle`
- Image area: `padding-top: 68%` aspect ratio. Category badge: top-left, `rgba(0,0,0,0.65)` bg, white Nunito 10px/700
- Footer `padding: 8px 10px`:
  - Image name: Nunito 12px/600, `-webkit-line-clamp: 2`, `min-height: 2.4em`
  - "Submitted" pill below
- "Add entry" slot (when open): `border: 2px dashed border-default`, `min-height: 155px`, centered upload icon + "Add entry" text, `opacity: 0.6`. Clicking opens submit modal.

**Right — Club Stats** (`padding: 22px 24px`):

Two large stats side by side (separated by 1px divider):
- Total images: Lora 38px/700 + "total images" Nunito 13px text-secondary below
- Members entered: same treatment

Horizontal bar chart — "By category":
- One row per category: `grid-template-columns: 72px 1fr 38px`
- Label (text-secondary, right-aligned), bar (surface-3 bg, action-primary fill, `height: 12px, border-radius: 9999px`), count (Lora 13px/700)
- Bar fill width = `count / total * 100%`

Footer line: Nunito 12px text-tertiary — "Submission deadline: [date] · N days remaining"

---

### PreviousCompetitionsBlock

Header: "Previous Competitions" Lora 18px/700 + "2025–26 Season" right-aligned text-tertiary.

Card: same card style as above, `overflow: hidden`.

**Table header row** (`padding: 10px 22px`, surface-2/surface-1 bg, `border-bottom`):
Columns: `grid-template-columns: 1fr 90px 140px 120px 130px`
Headers: Competition · Images · Meeting · Judge · (empty — Results button col)
Nunito 11px/700 uppercase `letter-spacing: 0.06em` text-tertiary.

**Data rows** (`padding: 13px 22px`):
- Competition: Nunito 14px/600 text-primary + member count Nunito 12px text-tertiary below
- Images: Lora 15px/700 text-primary, center-aligned
- Meeting: Nunito 13px text-secondary
- Judge: Nunito 13px text-secondary
- Results: outlined button — `border: 1px solid border-default`, `border-radius: 7px`, `padding: 5px 12px`, action-primary text + right-arrow icon, Nunito 13px/600

Rows separated by `border-bottom: 1px solid border-subtle` (not the last row).

---

## Image Submission Modal

### Trigger
"Submit an image" button on the competition header, or the "Add entry" dashed slot card.

### Modal specs
- Backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.70), backdrop-filter: blur(3px)`
- **Center with flexbox** — DO NOT use `transform: translate(-50%,-50%)`. Use `display: flex, align-items: center, justify-content: center` on the backdrop div, and let the modal sit naturally inside it. (Using transform conflicts with entry animations.)
- Modal: `max-width: 720px, width: 100%, border-radius: 18px, max-height: calc(100vh - 48px), overflow: hidden, display: flex, flex-direction: column`
- Entry animation: `scale(0.97) → scale(1)` + `opacity: 0 → 1` over 180ms ease

### Modal header (sticky)
`padding: 22px 28px 0`, `border-bottom: 1px solid border-default`, `flex-shrink: 0`
- Overline: "April 2026 Competition" Nunito 11px/700 caps text-tertiary
- Title: "Submit an image" Lora 22px/700
- Close × button: 34×34px rounded square, surface-2 bg

### Stepper (appears after source is chosen)
3 steps: Source → Upload/Library → Confirm
- Step indicators: 28px circles, `border: 2px solid`. Done = filled action-primary + checkmark. Active = filled action-primary + white number. Inactive = surface-3 bg + border-default.
- Connecting lines: `height: 2px`. Done segment = action-primary. Pending = border-default.
- Labels: Nunito 11px below each circle.

### Modal body (scrollable flex: 1)
`padding: 22px 28px`

#### Step 0 — Choose Source
Two option buttons, full width, `padding: 20px 22px, border-radius: 12px, border: 2px solid border-default`.
On hover: border changes to action-primary + faint action-primary bg tint.
Each has a 50×50px icon container (surface-3 bg) + title (Nunito 16px/700) + description (Nunito 14px text-secondary) + right chevron.

#### Step 1a — Upload
- Drop zone: `border: 2px dashed border-default`, `border-radius: 12px`. Active drag: action-primary border + tint bg.
- Shows image preview if file selected (`max-height: 220px, object-fit: cover, border-radius: 8px`)
- Title field: labeled "Image title *", Nunito input, `padding: 9px 13px, border-radius: 8px, border: 1.5px solid border-default`. On focus: action-primary border.
- Helper text below: Nunito 12px text-tertiary
- Category buttons: 3 pill-shaped buttons (Open / Nature / Monochrome). Active = action-primary filled. Inactive = surface-2 bg + border-default.

#### Step 1b — Library
**Search + sort bar:**
- Search input: full-width, left-padded for search icon (34px left padding), `border-radius: 8px`
- Sort dropdown: `appearance: none` with custom chevron bg-image, right of search

**Image grid:**
- `display: grid, grid-template-columns: repeat(4, 1fr), gap: 10px`
- `max-height: 340px, overflow-y: auto` — scrollable
- Filtered + sorted in real-time from search/sort state

**Thumbnail card:**
- `border: 2px solid border-default`, `border-radius: 9px`
- Selected state: `border-color: action-primary` + `box-shadow: 0 0 0 3px rgba(action-primary, 0.22)`
- Image area: `padding-top: 70%`, relative
- Zoom button: top-right, 24×24px, `rgba(0,0,0,0.60)` bg, appears on hover
- Checkmark circle: top-left, 20px, action-primary filled, appears when selected
- Category badge: bottom-left, dark pill overlay
- Footer: image name, Nunito 11px/600, 2-line clamp, `min-height: 2.3em`

**Category selector** (slides in after image selected):
- Animated entry (`fadeUp 0.2s ease`)
- Horizontal rule separator
- Mini thumbnail + truncated name as confirmation
- Same 3 category buttons as upload step

#### Step 2 — Confirm
- Large image preview: `padding-top: 38%` aspect ratio
- Detail rows: `grid-template-columns: 130px 1fr`, label text-tertiary / value Nunito 14px/600
- Info callout: action-primary tinted bg + border, Nunito 14px text-secondary

### Modal footer (sticky)
`padding: 14px 28px`, `border-top: 1px solid border-default`, `flex-shrink: 0`
- Back button: outlined, Nunito 15px/500 + left chevron
- Continue/Submit button: action-primary filled, Nunito 15px/700. **Disabled until step is complete** (grayed out, `cursor: default`, no shadow). Enabled: action-primary + shadow.

### Validation rules
| Step | Required to continue |
|---|---|
| Step 0 | Source selected |
| Step 1 (upload) | Image selected + title non-empty + category selected |
| Step 1 (library) | Image selected + category selected |
| Step 2 | Always enabled (review only) |

### Success state
After submit, modal transitions to success overlay:
- Same backdrop
- 420px max-width card, centered via flexbox (same pattern as modal)
- Large checkmark circle: 72px, success color, `animation: scale(0.7)→scale(1.08)→scale(1)` spring
- "Image submitted!" Lora 22px/700
- Body text Nunito 15px text-secondary
- "Return to competition" primary button

---

## Lightbox (zoom from library)
- Fixed overlay, `z-index: 2000` (above modal)
- Click backdrop to close, Esc key to close
- Image: `max-height: 400px, object-fit: cover, width: 100%`
- Footer: image name Lora 15px/700 + category · date · "Press Esc to close" Nunito 13px text-tertiary
- Close × button: top-right of image, `rgba(0,0,0,0.65)` bg

---

## State Management Notes

The competition phase (`open` | `warning` | `judging`) should be derived from dates, not stored as UI state:
```ts
const daysUntilDeadline = differenceInDays(parseISO(competition.submissionDeadline), new Date());
const phase = daysUntilDeadline < 0 ? 'judging'
            : daysUntilDeadline <= 7 ? 'warning'
            : 'open';
```

The submit modal should reset its internal state (step, source, selections) on close.

Library images shown in the modal should be filtered server-side or client-side to exclude any already submitted to the current competition.

---

## Accessibility Notes
- All body text minimum 14px
- Secondary text `#595959` minimum (5.4:1 on white) — do not use `#696969`
- Submission category buttons must be keyboard-navigable and have clear focus rings
- Modal must trap focus when open
- Close button must be reachable at `Tab` position 1 in modal
- "Closing soon" and phase changes must not rely on color alone — the text label changes too

---

## Assets & Icons
Icons: Lucide-style stroke SVGs, `stroke-width: 1.5`, round caps/joins. Use `@mui/icons-material` equivalents or `lucide-react`.

Specific icons used:
- Upload cloud (`CloudUpload`)
- Image (`Image`)
- Search (`Search`)
- Sort (`FilterList` or `Sort`)
- Zoom in (`ZoomIn`)
- Check (`Check`)
- Close (`Close`)
- ChevronLeft/Right/Down/Up
- Calendar (`CalendarToday`)
- Clock (`Schedule`)
- Users (`Group`)
- Trophy (`EmojiEvents`)

Aperture brand mark: custom SVG — 6 lines inside a circle. See `Focal Point Prototype.html` for the exact path data.

---

## Files in This Package

| File | Description |
|---|---|
| `README.md` | This document |
| `Competitions Page.html` | Interactive prototype — competitions page with all 3 phases |
| `Competition Results.html` | Interactive prototype — results view (My Results + All Results tabs) |
| `Submit Image Flow.html` | Earlier version of the submission modal (superseded by modal built into Competitions Page) |
| `Focal Point Prototype.html` | Full member + judging + admin prototype for full design context |

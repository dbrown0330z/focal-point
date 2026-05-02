# Design Tokens

## Fonts

Fonts are loaded via `next/font/google` in `app/layout.tsx`, which injects optimised CSS variables on `<html>`:

```tsx
const lora  = Lora({ subsets: ['latin'], weight: ['400','500','700'], style: ['normal','italic'], variable: '--font-lora' })
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-inter' })
```

`--font-primary` defaults to Lora for the main app. The admin area uses the MUI `adminTheme` which sets `fontFamily` directly to `var(--font-inter, 'Inter', system-ui, sans-serif)`.

| Token | Value | Notes |
|---|---|---|
| `--font-primary` | `var(--font-lora)` → Lora | Main app body and headings (serif) |
| `--font-inter` | Inter | Admin area — set via MUI adminTheme |
| `--font-code` | `'JetBrains Mono', 'Menlo', monospace` | Code, tokens, IDs (`--font-mono` in Tailwind) |

---

## Neutral Gray Ramp (9-stop, warm neutral)

| Token | Hex | Swatch |
|---|---|---|
| `--gray-50` | `#F9F9F9` | Near white |
| `--gray-100` | `#F0F0F0` | |
| `--gray-200` | `#E0E0E0` | |
| `--gray-300` | `#C4C4C4` | |
| `--gray-400` | `#A0A0A0` | Mid |
| `--gray-500` | `#737373` | |
| `--gray-600` | `#525252` | |
| `--gray-700` | `#333333` | |
| `--gray-800` | `#1A1A1A` | Near black |

---

## Surface Colors

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--surface-0` | `#F5F5F5` | Page base |
| `--surface-1` | `#ECECEC` | Cards, panels |
| `--surface-2` | `#FFFFFF` | Raised / active elements |

### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--surface-0` | `#141414` | Page base |
| `--surface-1` | `#1E1E1E` | Cards, panels |
| `--surface-2` | `#292929` | Raised / active elements |

---

## Text Colors

### Light Mode

| Token | Hex | Contrast | Usage |
|---|---|---|---|
| `--text-primary` | `#1A1A1A` | 14.5:1 on surface-0 ✓ | Body, headings |
| `--text-secondary` | `#696969` | 4.54:1 on surface-0 ✓ | Subheadings, labels — max lightness at AA |
| `--text-tertiary` | `#737373` | 4.6:1 on surface-2 ✓ | UI chrome, large text only |
| `--text-disabled` | `#A0A0A0` | — | Disabled states |
| `--text-hint` | `#A8A8A8` | 2.8:1 — non-AA decorative | Placeholder text, field hints |

### Dark Mode

| Token | Hex | Contrast | Usage |
|---|---|---|---|
| `--text-primary` | `#E8E8E8` | 12.8:1 on surface-1 ✓ | Body, headings |
| `--text-secondary` | `#9E9E9E` | 4.6:1 on surface-1 ✓ | Subheadings, labels |
| `--text-tertiary` | `#737373` | — | UI chrome only |
| `--text-disabled` | `#525252` | — | Disabled states |
| `--text-hint` | `#5E5E5E` | Non-AA decorative | Placeholder text, field hints |

> **Note:** `--text-hint` is intentionally below AA. WCAG 2.2 explicitly exempts inactive UI components and placeholder text from contrast requirements. Never use this token for required readable content.

---

## Action Colors

### Light Mode

| Token | Hex | Notes |
|---|---|---|
| `--action-primary` | `#1A6FC4` | Bright blue · 4.6:1 on white ✓ |
| `--action-primary-hover` | `#155AA3` | |
| `--action-primary-shadow` | `0 2px 6px rgba(26,111,196,0.35), 0 1px 2px rgba(0,0,0,0.12)` | Primary button drop shadow |
| `--action-primary-shadow-hover` | `0 3px 10px rgba(26,111,196,0.40), 0 1px 3px rgba(0,0,0,0.15)` | Lifted on hover |
| `--action-secondary` | `#5A7A96` | Blue-gray, desaturated · ghost/outline buttons |
| `--action-secondary-hover` | `#4A6880` | |
| `--action-focus-ring` | `0 0 0 3px rgba(26, 111, 196, 0.18)` | Keyboard focus |

### Dark Mode

| Token | Hex | Notes |
|---|---|---|
| `--action-primary` | `#4A90D4` | Lighter blue for dark surfaces |
| `--action-primary-hover` | `#5FA0E0` | |
| `--action-primary-shadow` | `0 2px 6px rgba(74,144,212,0.40), 0 1px 2px rgba(0,0,0,0.25)` | |
| `--action-secondary` | `#6EA8D8` | Lightened for dark backgrounds |
| `--action-secondary-hover` | `#82B8E2` | |

---

## Button Specification

| Property | Value |
|---|---|
| `--btn-radius` | `8px` |
| `--btn-padding` | `9px 20px` |
| `--btn-font-size` | `14px` |
| `--btn-font-weight` | `500` |
| `--btn-min-height` | `36px` |

**Primary button:** `background: --action-primary` · `color: white` · `box-shadow: --action-primary-shadow` · `border-radius: --btn-radius`

**Secondary button:** `background: transparent` · `border: 1.5px solid --action-secondary` · `color: --action-secondary` · `border-radius: --btn-radius` · no shadow

---

## Input / Field Specification

| Property | Value |
|---|---|
| `--input-radius` | `8px` |
| `--input-border` | `1px solid #C4C4C4` |
| `--input-border-focus` | `1px solid --action-primary` |
| `--input-padding` | `8px 12px` |
| `--input-height` | `36px` |
| `--input-placeholder` | `--text-hint` (non-AA decorative) |

---

## Status Colors

| Token | Hex | Background | Text | Contrast |
|---|---|---|---|---|
| `--status-error` | `#D32F2F` | `#FDEEEE` | `#7A1515` | 5.1:1 ✓ |
| `--status-warning` | `#A67C00` | `#FFFBE6` | `#6B5000` | 4.7:1 ✓ |
| `--status-success` | `#2E7D32` | `#EDFAF0` | `#174A1A` | 5.4:1 ✓ |

### Dark Mode Overrides

| Token | Hex | Background | Text |
|---|---|---|---|
| `--status-error` | `#D32F2F` | `#3D1212` | `#F09595` |
| `--status-warning` | `#D4A800` | `#3A2E00` | `#FAD84A` |
| `--status-success` | `#2E7D32` | `#122412` | `#97C459` |

---

## Spot Colors (6)

For chips, badges, chart series, and callouts. Use the color at 10% opacity for chip/badge backgrounds.

| Token | Hex | Usage |
|---|---|---|
| `--spot-purple` | `#6C47D4` | Info chips, charts |
| `--spot-teal` | `#0097A7` | Data series, tags |
| `--spot-orange` | `#E65100` | Warning badges, highlights |
| `--spot-pink` | `#AD1457` | Categorical data, alerts |
| `--spot-green` | `#00796B` | Lifecycle / positive indicators |
| `--spot-gold` | `#7B6B38` | EOL signals, caution |

All meet AA 4.5:1 minimum on white surfaces.

---

## Borders

### Light Mode

| Token | Value |
|---|---|
| `--border-subtle` | `rgba(0,0,0,0.08)` |
| `--border-default` | `rgba(0,0,0,0.14)` |
| `--border-strong` | `rgba(0,0,0,0.22)` |

### Dark Mode

| Token | Value |
|---|---|
| `--border-subtle` | `rgba(255,255,255,0.07)` |
| `--border-default` | `rgba(255,255,255,0.12)` |
| `--border-strong` | `rgba(255,255,255,0.20)` |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `2px` | Subtle rounding, table cells |
| `--radius-sm` | `4px` | Chips, small badges |
| `--radius-md` | `8px` | Buttons, inputs, cards |
| `--radius-lg` | `12px` | Panels, modals, large cards |
| `--radius-xl` | `16px` | Large containers |
| `--radius-pill` | `9999px` | Tags, status badges |

---

## Spacing (4px base unit)

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon gaps, tight inline |
| `--space-2` | `8px` | Tag gaps, compact lists |
| `--space-3` | `12px` | Form field gaps, chip rows |
| `--space-4` | `16px` | Card padding, section items |
| `--space-6` | `24px` | Panel padding, row gaps |
| `--space-8` | `32px` | Section breaks, group spacing |
| `--space-12` | `48px` | Top-level page sections |
| `--space-16` | `64px` | Page top padding, hero areas |

### Component Spacing Rules

| Component | Rule |
|---|---|
| Button | `8px` top/bottom · `20px` left/right · `36px` min-height |
| Input / Select | `8px` top/bottom · `12px` left/right · `36px` height |
| Card | `20px` padding all sides · `16px` between internal rows |
| Table row | `10px` top/bottom · `12px` left/right · `44px` min-height |
| Page content area | `24px` horizontal · `32px` top · `1280px` max-width centered |
| Modal / Dialog | `24px` padding · `32px` between header and body |
| Mobile (< 768px) | `16px` horizontal page margin · `44px` min touch target |

---

## Typography

| Token | Value |
|---|---|
| `--text-page-title-size` | `28px` |
| `--text-page-title-weight` | `700` |
| `--text-page-title-ls` | `-0.02em` |
| `--text-h1-size` | `22px` |
| `--text-h1-weight` | `700` |
| `--text-h1-ls` | `-0.015em` |
| `--text-h2-size` | `18px` |
| `--text-h2-weight` | `600` |
| `--text-h2-ls` | `-0.01em` |
| `--text-h3-size` | `15px` |
| `--text-h3-weight` | `600` |
| `--text-large-size` | `16px` |
| `--text-normal-size` | `14px` (default body) |
| `--text-small-size` | `12px` |
| `--text-label-size` | `11px` |
| `--text-body-line-height` | `1.6` |
| `--text-heading-line-height` | `1.3` |

### Additional Scales

| Name | Size | Weight | Letter Spacing | Color |
|---|---|---|---|---|
| `label` | `11px` | `600` | `0.04em` uppercase | `--text-secondary` |
| `caption` | `12px` | `500` | `0` | `--text-primary` |
| `code` | `12px` | `400` | `0` | `--font-mono` family |

---

## Admin Stylesheet

Light mode only. Cool gray palette + Inter. Markedly distinct from the main app — users know they are not in the app here.

### Admin Cool Gray Ramp

| Token | Hex |
|---|---|
| `--admin-gray-50` | `#F7F8FA` |
| `--admin-gray-100` | `#EDF0F5` |
| `--admin-gray-200` | `#D8DDE7` |
| `--admin-gray-300` | `#B0BACA` |
| `--admin-gray-400` | `#7E8EA3` |
| `--admin-gray-500` | `#5A6C82` |
| `--admin-gray-600` | `#3E5066` |
| `--admin-gray-700` | `#26374C` |
| `--admin-gray-800` | `#131F2E` |

### Admin Surfaces and Text

| Token | Hex | Contrast | Usage |
|---|---|---|---|
| `--surface-0` | `#F7F8FA` | — | Page base |
| `--surface-1` | `#EDF0F5` | — | Cards, panels |
| `--surface-2` | `#FFFFFF` | — | Raised elements |
| `--text-primary` | `#131F2E` | 13.2:1 on surface-0 ✓ | Body, headings |
| `--text-secondary` | `#5A6C82` | 5.1:1 on surface-0 ✓ | Labels, subheadings |
| `--text-tertiary` | `#7E8EA3` | — | UI chrome only |
| `--text-hint` | `#A8B4C0` | Non-AA decorative | Cool-tinted placeholder, field hints |

### Admin Action Colors

| Token | Hex | Notes |
|---|---|---|
| `--action-primary` | `#1E4D8C` | Deep navy — distinct from app's bright blue |
| `--action-primary-hover` | `#163A6B` | |
| `--action-primary-shadow` | `0 2px 6px rgba(30,77,140,0.30), 0 1px 2px rgba(0,0,0,0.10)` | |
| `--action-secondary` | `#4A6880` | |
| `--action-secondary-hover` | `#3A5468` | |

### Admin Button and Input Overrides

| Token | Value | Notes |
|---|---|---|
| `--btn-radius` | `6px` | Slightly tighter than app |
| `--input-radius` | `6px` | Matches button |

### Admin Navigation

| Token | Hex | Usage |
|---|---|---|
| `--admin-nav-bg` | `#26374C` | Sidebar background |
| `--admin-nav-text` | `#F7F8FA` | Active nav item |
| `--admin-nav-text-muted` | `#7E8EA3` | Inactive nav items |
| `--admin-nav-active-bg` | `#1E4D8C` | Active item highlight |

### Admin Borders

| Token | Value |
|---|---|
| `--border-subtle` | `#D8DDE7` |
| `--border-default` | `#B0BACA` |

> All other tokens (spacing, radius scale, type scale) inherit from `:root` — no overrides needed.

---

## Full CSS Custom Properties

```css
/* Fonts loaded via next/font/google — variables set on <html> by Next.js */

:root {

  /* Fonts */
  --font-primary: var(--font-lora, 'Lora', Georgia, serif);   /* set by next/font */
  --font-code:    'JetBrains Mono', 'Menlo', monospace;

  /* Gray Ramp */
  --gray-50:  #F9F9F9;
  --gray-100: #F0F0F0;
  --gray-200: #E0E0E0;
  --gray-300: #C4C4C4;
  --gray-400: #A0A0A0;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #333333;
  --gray-800: #1A1A1A;

  /* Surfaces (Light) */
  --surface-0: #F5F5F5;
  --surface-1: #ECECEC;
  --surface-2: #FFFFFF;

  /* Text (Light) */
  --text-primary:   #1A1A1A; /* 14.5:1 on surface-0 ✓ */
  --text-secondary: #696969; /* 4.54:1 — max lightness at AA */
  --text-tertiary:  #737373; /* UI chrome only, large text */
  --text-disabled:  #A0A0A0;
  --text-hint:      #A8A8A8; /* non-AA decorative — placeholder/hint only */

  /* Action Colors */
  --action-primary:               #1A6FC4;
  --action-primary-hover:         #155AA3;
  --action-primary-shadow:        0 2px 6px rgba(26,111,196,0.35), 0 1px 2px rgba(0,0,0,0.12);
  --action-primary-shadow-hover:  0 3px 10px rgba(26,111,196,0.40), 0 1px 3px rgba(0,0,0,0.15);
  --action-secondary:             #5A7A96;
  --action-secondary-hover:       #4A6880;
  --action-focus-ring:            0 0 0 3px rgba(26, 111, 196, 0.18);

  /* Button */
  --btn-radius:      8px;
  --btn-padding:     9px 20px;
  --btn-font-size:   14px;
  --btn-font-weight: 500;
  --btn-min-height:  36px;

  /* Input */
  --input-radius:       8px;
  --input-border:       1px solid #C4C4C4;
  --input-border-focus: 1px solid var(--action-primary);
  --input-padding:      8px 12px;
  --input-height:       36px;

  /* Status Colors */
  --status-error:        #D32F2F;
  --status-error-bg:     #FDEEEE;
  --status-error-text:   #7A1515;
  --status-warning:      #A67C00;
  --status-warning-bg:   #FFFBE6;
  --status-warning-text: #6B5000;
  --status-success:      #2E7D32;
  --status-success-bg:   #EDFAF0;
  --status-success-text: #174A1A;

  /* Spot Colors */
  --spot-purple: #6C47D4;
  --spot-teal:   #0097A7;
  --spot-orange: #E65100;
  --spot-pink:   #AD1457;
  --spot-green:  #00796B;
  --spot-gold:   #7B6B38;

  /* Borders */
  --border-subtle:  rgba(0,0,0,0.08);
  --border-default: rgba(0,0,0,0.14);
  --border-strong:  rgba(0,0,0,0.22);

  /* Border Radius */
  --radius-xs:   2px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-pill: 9999px;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Typography */
  --text-page-title-size:     28px;
  --text-page-title-weight:   700;
  --text-page-title-ls:       -0.02em;
  --text-h1-size:             22px;
  --text-h1-weight:           700;
  --text-h1-ls:               -0.015em;
  --text-h2-size:             18px;
  --text-h2-weight:           600;
  --text-h2-ls:               -0.01em;
  --text-h3-size:             15px;
  --text-h3-weight:           600;
  --text-large-size:          16px;
  --text-normal-size:         14px;
  --text-small-size:          12px;
  --text-label-size:          11px;
  --text-body-line-height:    1.6;
  --text-heading-line-height: 1.3;

}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-0: #141414;
    --surface-1: #1E1E1E;
    --surface-2: #292929;

    --text-primary:   #E8E8E8; /* 12.8:1 ✓ */
    --text-secondary: #9E9E9E; /* 4.6:1 on surface-1 ✓ */
    --text-tertiary:  #737373;
    --text-disabled:  #525252;
    --text-hint:      #5E5E5E;

    --action-primary:              #4A90D4;
    --action-primary-hover:        #5FA0E0;
    --action-primary-shadow:       0 2px 6px rgba(74,144,212,0.40), 0 1px 2px rgba(0,0,0,0.25);
    --action-secondary:            #6EA8D8;
    --action-secondary-hover:      #82B8E2;

    --status-warning:      #D4A800;
    --status-warning-bg:   #3A2E00;
    --status-warning-text: #FAD84A;
    --status-error-bg:     #3D1212;
    --status-error-text:   #F09595;
    --status-success-bg:   #122412;
    --status-success-text: #97C459;

    --border-subtle:  rgba(255,255,255,0.07);
    --border-default: rgba(255,255,255,0.12);
    --border-strong:  rgba(255,255,255,0.20);
  }
}

/* Admin Context — font set via MUI adminTheme, not CSS custom property */
.admin-context {

  --admin-gray-50:  #F7F8FA;
  --admin-gray-100: #EDF0F5;
  --admin-gray-200: #D8DDE7;
  --admin-gray-300: #B0BACA;
  --admin-gray-400: #7E8EA3;
  --admin-gray-500: #5A6C82;
  --admin-gray-600: #3E5066;
  --admin-gray-700: #26374C;
  --admin-gray-800: #131F2E;

  --surface-0: #F7F8FA;
  --surface-1: #EDF0F5;
  --surface-2: #FFFFFF;

  --text-primary:   #131F2E;
  --text-secondary: #5A6C82; /* 5.1:1 on admin surface-0 ✓ */
  --text-tertiary:  #7E8EA3;
  --text-hint:      #A8B4C0;

  --action-primary:               #1E4D8C;
  --action-primary-hover:         #163A6B;
  --action-primary-shadow:        0 2px 6px rgba(30,77,140,0.30), 0 1px 2px rgba(0,0,0,0.10);
  --action-secondary:             #4A6880;
  --action-secondary-hover:       #3A5468;

  --btn-radius:   6px;
  --input-radius: 6px;

  --admin-nav-bg:          #26374C;
  --admin-nav-text:        #F7F8FA;
  --admin-nav-text-muted:  #7E8EA3;
  --admin-nav-active-bg:   #1E4D8C;

  --border-subtle:  #D8DDE7;
  --border-default: #B0BACA;
}
```
## Usage Note
When writing components, use these CSS custom properties rather than hardcoded values.
Respect light/dark mode by referencing surface and text tokens — never hardcode #fff or #000.
Admin components must use the .admin-context class scope.

---

## Semantic Tokens

These tokens represent UI decisions, not just palette values. Always use these rather than reaching for a raw color.

### Interactive Controls

| Token | Value | Usage |
|---|---|---|
| `--toggle-selected` | `#556070` | Selected item in segmented controls, icon toggles |
| `--toggle-selected-hover` | `#455060` | Hover state on selected toggle item |

**Rule:** Blue (`--action-primary`) is for buttons and links only. Toggles and filter controls use `--toggle-selected`.

### Status Badges

| Token | Value | Usage |
|---|---|---|
| `--badge-available-bg` | `rgba(85,96,112,0.10)` | Background of "Available" image badge |
| `--badge-available-border` | `rgba(85,96,112,0.28)` | Border of "Available" image badge |
| `--badge-available-text` | `#556070` | Text of "Available" image badge |

"Submitted" badge uses the existing `--status-success-bg` / `--status-success-text` tokens.

### Calendar Event Types

| Token | Resolves to | Event type |
|---|---|---|
| `--event-competition` / `--event-competition-bg` | `--action-primary` | Competition events |
| `--event-meeting` / `--event-meeting-bg` | `--spot-teal` | Regular meetings |
| `--event-board` / `--event-board-bg` | `--spot-purple` | Board meetings |
| `--event-fieldtrip` / `--event-fieldtrip-bg` | `--spot-orange` | Field trips |
| `--event-other` / `--event-other-bg` | `#5A6C82` | Other events |

Submission deadline events (`submission_open`, `submission_closed`) use the `--status-success-*` and `--status-error-*` tokens.

### Competition Submission Phase

Applied to the left border and background tint of the open-competition card header.

| Token | Value | Usage |
|---|---|---|
| `--phase-open-bg` | `rgba(46,125,50,0.07)` | Card bg tint when submissions are open |
| `--phase-open-border` | `#2E7D32` | Left accent border (open) |
| `--phase-warning-bg` | `rgba(166,124,0,0.07)` | Card bg tint when deadline is close |
| `--phase-warning-border` | `#A67C00` | Left accent border (warning) |

### Judgment Rating Buckets

Used in the judge portal triage view. Light and dark variants both defined; dark overrides apply under `.dark`.

| Token group | Strong | Maybe | Weak |
|---|---|---|---|
| `--judgment-*` (color) | `#0F6E56` | `#854F0B` | `#A32D2D` |
| `--judgment-*-bg` | `rgba(15,110,86,0.12)` | `rgba(133,79,11,0.12)` | `rgba(163,45,45,0.12)` |
| `--judgment-*-border` | `rgba(15,110,86,0.55)` | `rgba(133,79,11,0.55)` | `rgba(163,45,45,0.55)` |

Flag (purple): `--judgment-flag` / `--judgment-flag-bg` / `--judgment-flag-border`

> **Note:** The judge portal currently uses MUI JS-based theme switching rather than the `.dark` CSS class, so dark token overrides in `globals.css` apply to the member/admin portals. If the judge portal is ever migrated to CSS-class-based theming, the `BUCKET_DARK` JS object in `JudgingClient.tsx` can be removed.

### Spot Colors

For chips, badges, chart series, and event type indicators. Use at 10% opacity for backgrounds.

| Token | Hex |
|---|---|
| `--spot-purple` | `#6C47D4` |
| `--spot-teal` | `#0097A7` |
| `--spot-orange` | `#E65100` |
| `--spot-pink` | `#AD1457` |
| `--spot-green` | `#00796B` |
| `--spot-gold` | `#7B6B38` |
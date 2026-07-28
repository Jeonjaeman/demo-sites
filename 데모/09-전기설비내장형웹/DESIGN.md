# VoltGuard Console Design System

## 0. Research Log

- Embedded refs: IBM, ClickHouse, Nvidia shortlisted; `image-to-code-skill` + IBM selected because squared controls, tonal hierarchy, precise status semantics, and an engineering grid fit an embedded electrical console.
- Lazyweb: 4 queries, 32 results, 6 screens viewed (Enode, Databricks, Netdata, Nectar, Overview Energy, Chameleon); retained a persistent left rail, unmistakable selected rows, compact KPI strip, one dominant time-series plot, and sparse semantic colors.
- Image drafts: `.omx/evidence/electrical-dashboard/reference/concept-a-light.png`, `concept-b-dark.png`, `concept-c-hybrid.png`; `concept-c-hybrid.png` is the reference-fidelity contract.
- UI/UX database: time series uses a line chart; phase comparison uses labeled horizontal bars; multiple series differ by stroke pattern as well as color; charts expose a text summary/table fallback.
- Skipped lanes: Higgsfield is not callable in this environment; the built-in image generation path produced the three UI concepts instead.

## 1. Atmosphere & Identity

VoltGuard is a daylight-readable field console: graphite equipment chrome wraps a calm, light data surface. It feels engineered, local, and dependable rather than futuristic. Its signature is the **cobalt signal rail**: the active navigation edge, focus ring, selected time range, and primary chart line share one disciplined cobalt signal so the user's current context is always obvious.

The screen is for an operator standing in front of a 19-inch 1280×1024 LCD, not for a marketing scroll. Information density is productive but never cramped. Status uses words and symbols in addition to color. Decorative imagery, glass, glow, rounded card collections, and fake complexity are prohibited.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Chrome/primary | `--color-chrome-900` | `#111820` | Top bar and sidebar |
| Chrome/secondary | `--color-chrome-800` | `#1B2630` | Sidebar grouped surface |
| Chrome/hover | `--color-chrome-700` | `#263746` | Dark-surface hover |
| Canvas | `--color-canvas` | `#EEF1F4` | Application work area |
| Surface | `--color-surface` | `#FFFFFF` | Panels and controls |
| Surface/subtle | `--color-surface-subtle` | `#F6F8FA` | Table rows and empty states |
| Surface/pressed | `--color-surface-pressed` | `#E7EEF7` | Pressed/selected light controls |
| Text/primary | `--color-text-900` | `#17212B` | Headings and values |
| Text/secondary | `--color-text-600` | `#52606D` | Labels and descriptions |
| Text/muted | `--color-text-500` | `#697782` | Metadata only |
| Text/on-dark | `--color-text-on-dark` | `#F4F7FA` | Primary chrome text |
| Text/on-dark-muted | `--color-text-on-dark-muted` | `#B9C4CD` | Secondary chrome text |
| Border | `--color-border` | `#C7D0D8` | Panel and table rules |
| Border/subtle | `--color-border-subtle` | `#DCE2E7` | Internal separators |
| Signal/primary | `--color-signal-600` | `#0F62FE` | Active state, focus, primary series |
| Signal/hover | `--color-signal-700` | `#0043CE` | Interactive hover |
| Signal/tint | `--color-signal-100` | `#E5F0FF` | Selected light surface |
| Data/secondary | `--color-data-cyan` | `#007D95` | Secondary series with dashed stroke |
| Success | `--color-success` | `#198038` | Normal/online plus text/icon |
| Warning | `--color-warning` | `#B25E09` | Caution plus text/icon |
| Danger | `--color-danger` | `#DA1E28` | Alarm plus text/icon |
| Offline | `--color-offline` | `#5C6F7B` | Local/offline mode badge |

Rules:

- Cobalt is the only general interactive accent. Cyan is data-only.
- Green, amber, and red appear only with a status word or icon.
- Every text/background pair must meet WCAG 2.2 AA: 4.5:1 body and 3:1 large text/UI graphics.
- Component CSS may use only these variables or derived opacity via `color-mix()`; raw color values belong only in the token declaration.

### Menu theme files

The active main menu loads one local theme file through `#menu-theme`; each file changes only scoped semantic tokens:

- `assets/css/theme-overview.css`: cobalt active rail, operational overview.
- `assets/css/theme-power.css`: cobalt + cyan data emphasis, power trend screens.
- `assets/css/theme-equipment.css`: steel + success emphasis, equipment states.
- `assets/css/theme-alarms.css`: amber/red emphasis, alarm history.

## 3. Typography

No network or bundled font is required. The Korean-first system stack avoids FOIT and remains editable on Ubuntu/Windows:

- Primary: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Malgun Gothic", sans-serif`
- Mono/data: `"SFMono-Regular", Consolas, "Liberation Mono", monospace`

| Role | Size | Weight | Line height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Display | 32px | 500 | 1.25 | -0.02em | Empty-state/page statement |
| H1 | 24px | 600 | 1.34 | -0.015em | Screen title |
| H2 | 18px | 600 | 1.4 | 0 | Panel title |
| H3 | 16px | 600 | 1.45 | 0 | Table/group title |
| Body | 15px | 400 | 1.55 | 0 | Default UI text |
| Body/sm | 14px | 400 | 1.5 | 0.01em | Navigation and rows |
| Caption | 12px | 500 | 1.45 | 0.02em | Metadata |
| Data/lg | 30px | 500 | 1.15 | -0.02em | Primary metric value |
| Data | 16px | 500 | 1.35 | 0 | Chart/table data |

Rules:

- Numeric UI uses `font-variant-numeric: tabular-nums`.
- Korean phrases use `word-break: keep-all`; controls never wrap.
- At 200% zoom the layout reflows; text is never clipped or reduced below 12px.

## 4. Spacing & Layout

### Base unit

All spacing derives from 4px; primary rhythm uses 8px.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | 4px | Icon/internal micro gap |
| `--space-2` | 8px | Inline group |
| `--space-3` | 12px | Compact control padding |
| `--space-4` | 16px | Panel padding |
| `--space-5` | 20px | Screen gutter, mobile |
| `--space-6` | 24px | Desktop screen gutter |
| `--space-8` | 32px | Group separation |
| `--space-10` | 40px | Empty-state rhythm |
| `--space-12` | 48px | Major separation |

### Target frame and grid

- Primary target: 1280×1024.
- Top bar: 56px. Desktop sidebar: 240px. Content viewport: 1040×968.
- Content: 12-column grid, 16px gaps, 24px desktop gutter.
- Major grid at target: KPI strip (6 equal cells), chart area (8 columns) + phase panel (4 columns), equipment table (8) + status summary (4), alarm strip (12).
- Breakpoints: mobile 0–639, tablet 640–1023, desktop 1024+.
- Mobile: sidebar becomes a modal drawer; content is one column; KPI cells form a 2-column grid; tables scroll inside labeled regions only when columns cannot collapse.
- Tablet: sidebar becomes 72px icon rail with labels available in drawer; main chart spans full width.
- No horizontal page overflow at 375px. Use `min-height: 100dvh`.

## 5. Components

### AppHeader
- **Structure**: menu toggle, product name, local/offline badge, clock, operator label.
- **States**: menu expanded/collapsed, online-local, focus.
- **Accessibility**: landmark `header`; icon buttons have visible labels; 44×44px minimum.
- **Motion**: drawer trigger uses 150ms opacity/background only.

### SidebarNavigation
- **Structure**: main menu button followed by owned submenu group.
- **Variants**: overview, power, equipment, alarms.
- **States**: default, hover, active main, active submenu, expanded, collapsed, focus.
- **Accessibility**: `nav` label; buttons announce `aria-expanded`; current page uses `aria-current="page"`; Escape closes drawer.
- **Motion**: submenu disclosure uses opacity/transform on an always-reserved region; no layout-jank animation.

### StatusBadge
- **Variants**: normal, caution, alarm, local/offline.
- **States**: static only.
- **Accessibility**: icon + text + color; never color alone.

### MetricCell
- **Structure**: label, value/unit, status/meta.
- **Variants**: standard, emphasized, warning.
- **Accessibility**: descriptive `aria-label`; tabular figures.

### Panel
- **Structure**: header/title/actions, body, optional footer.
- **Variants**: chart, table, status, empty.
- **Depth**: surface + 1px token border; 0px radius; no shadow.

### SegmentedControl
- **Structure**: one `button` per range.
- **States**: default, hover, selected, focus, disabled.
- **Accessibility**: `role="group"`; selected button uses `aria-pressed`.

### LocalChart
- **Structure**: semantic heading/summary, canvas, HTML tooltip, legend buttons, accessible data table.
- **Variants**: line, horizontal bars, empty, malformed-data error.
- **States**: default, point hover/focus, series hidden, loading, empty, error.
- **Accessibility**: canvas has text summary; data table is available through a toggle; series differ by solid/dashed strokes; tooltip values are mirrored in an `aria-live` region.
- **Motion**: initial draw and range change are 220ms opacity transitions; reduced motion renders immediately.

### DataTable
- **States**: default, striped row, warning row, empty.
- **Accessibility**: real `table`, caption, scoped headers, no color-only status.

### EmptyStage
- **Structure**: current menu title, concise future-content message, optional implementation boundary note.
- **Accessibility**: meaningful heading; no decorative animation.

### Toast
- **States**: success, info, warning.
- **Accessibility**: `aria-live="polite"`; never steals focus; manually dismissible.

## 6. Motion & Interaction

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `--motion-micro` | 120ms | ease-out | Press/hover feedback |
| `--motion-standard` | 220ms | ease-in-out | Content/theme transition |
| `--motion-emphasis` | 320ms | cubic-bezier(0.16, 1, 0.3, 1) | Mobile drawer |

Rules:

- Motion explains context change only: drawer location, menu selection, chart range change.
- Animate `transform`, `opacity`, or `filter` only.
- `prefers-reduced-motion: reduce` disables interpolation and smooth scrolling.
- Browser history mirrors menu selection; Back restores prior menu/submenu.
- A selection updates the screen title and active states in the same frame.

## 7. Depth & Surface

Strategy: **tonal shift + borders**.

- Chrome uses two graphite levels; work area uses canvas, surface, and subtle surface.
- Panels are separated by 1px rules and background zoning, not shadows.
- Floating mobile drawer alone may use `--shadow-overlay: 0 8px 32px rgba(0,0,0,.28)`.
- Radius is 0px for panels/buttons and 2px for small controls. Status badges may use 999px only when the shape communicates a compact mode/state.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA; 4.5:1 text contrast, 3:1 large text and UI graphics.
- Complete keyboard path: skip link → header → primary navigation → content controls → data table.
- Visible 2px focus ring with 2px offset on every interactive element.
- Minimum target size 44×44px; 8px separation.
- Supports reduced motion, 200% zoom, 375px width, Korean text, and no-pointer operation.
- Local/offline state is persistent and plainly worded.
- Charts have a text summary and table fallback.

### Inclusive personas

- **현장 운전원**: stands at a 19-inch panel, may use touch with gloves; needs state and alarm recognition in under three seconds.
- **유지보수 엔지니어**: uses keyboard and exported values; needs precise labels, deterministic data, and clear future PHP/MariaDB seams.
- **저시력·확대 사용자**: uses 200% zoom or high contrast; must retain navigation and chart summaries without clipping.
- **상황적 제약 사용자**: works in bright light or during an alarm; must not rely on subtle color or motion.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| Prototype data is deterministic JavaScript, not MariaDB | `assets/js/mock-db.js` | User explicitly constrained this prototype to pure HTML/CSS/JS | Production phase: replace the adapter with PHP/MariaDB endpoint |
| System fonts vary slightly by OS | Global typography | Closed-network portability is more important than bundled font fidelity | Production phase: optionally bundle licensed Noto Sans KR locally |


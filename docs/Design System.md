# Design System — Cyberpunk Executive

## Design direction

**Cyberpunk Executive**: a calm, premium command center with restrained futuristic energy. It should feel like sophisticated mission-control software—not a gamer overlay and not an RGB light show.

## Principles

- Matte dark foundations with intentional contrast.
- Neon is a signal, not decoration.
- Information density stays calm through hierarchy, spacing, and progressive disclosure.
- Motion communicates state changes; it never distracts.
- Accessibility and legibility outrank aesthetic novelty.

## Core palette

| Token | Hex | Use |
| --- | --- | --- |
| `bg.canvas` | `#080A0F` | Application background |
| `bg.surface` | `#11141C` | Primary cards and panels |
| `bg.elevated` | `#191E29` | Menus, hover surfaces, dialogs |
| `border.subtle` | `#2A3140` | Card and divider borders |
| `text.primary` | `#F4F7FB` | Main text |
| `text.muted` | `#98A2B3` | Supporting text |
| `accent.cyan` | `#42E8F4` | Primary action, active status, focus |
| `accent.violet` | `#A77BFF` | Secondary emphasis and AI surfaces |
| `status.success` | `#62E6A7` | Completed/connected status |
| `status.warning` | `#F7C65B` | Needs attention |
| `status.danger` | `#FF6E88` | Error/destructive state |

Use accent colors sparingly on controls, data highlights, and live states. Avoid large neon backgrounds.

## Typography

- **Primary:** Inter (or system fallback) for body, numbers, tables, and controls.
- **Display:** Space Grotesk for page titles and major metric labels.
- Base body size: 14–16px; standard line-height: 1.5.
- Prefer tabular numerals for analytics and timers.

## Layout and spacing

- Desktop layout: fixed left rail, top context bar, responsive content canvas.
- Content max width: 1440px; page padding: 24px desktop.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px.
- Card radius: 12px; modal radius: 16px; controls radius: 8px.
- Use a 12-column dashboard grid with 16–24px gaps.

## Components

### Navigation rail

Icon plus label navigation for Mission Control, Streaming, Analytics, Content, Automations, AI Workspace, and Settings. Show a quiet cyan active indicator.

### Cards

Dark surface, 1px subtle border, optional soft shadow. Cards should have one primary purpose, an understandable title, and an obvious next action if interactive.

### Buttons

- **Primary:** cyan fill or bright cyan outline for one key action per region.
- **Secondary:** elevated dark surface with subtle border.
- **Quiet:** text/icon for low-risk actions.
- **Danger:** red only for confirmed destructive actions.

### Status

Use an icon, short label, and color; do not rely on color alone. Examples: `● OBS connected`, `! Needs review`, `× Connection failed`.

### Command palette

Available via `Ctrl/Cmd + K`. It should be fast, keyboard-first, and able to search pages, actions, sessions, and content items.

## Motion

- 150–220ms for hover and state transitions.
- 250–350ms for panels and route transitions.
- Use a subtle cyan pulse only for live/recording status.
- Respect reduced-motion preferences.

## Focus modes (future-ready)

Streaming, Content, Analytics, and Planning modes may tailor the workspace to one job. Version 1 establishes the visual system but does not require fully reshaped layouts.

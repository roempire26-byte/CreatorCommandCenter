# Sprint 1 — Desktop Foundation

## Objective

Deliver a locally runnable desktop application shell that makes the Creator Command Center tangible: the cyberpunk-executive design system, core navigation, command palette, and Mission Control dashboard using believable local mock data.

## Scope

- Electron + TypeScript project setup within `app/`.
- React application shell with left navigation and top context bar.
- Routes/screens for Mission Control, Streaming, Analytics, Content, Automations, AI Workspace, and Settings.
- Mission Control dashboard with mock stream status, goals, recent session, tasks, and an activity feed.
- Reusable tokens and base components following the Design System.
- Command palette that navigates to screens and exposes placeholder actions.
- Empty states and integration-status placeholders.
- Basic README instructions for running the app locally.

## Explicitly excluded

- Real OBS actions or WebSocket connections.
- External platform APIs or credentials.
- Database persistence.
- AI API calls.
- Real publishing, automation execution, or user authentication.

## Acceptance criteria

- App launches locally on Windows without external accounts.
- Navigation works across all seven screens.
- Mission Control matches the documented dark visual direction and is responsive at 1280px+.
- `Ctrl/Cmd + K` opens the command palette; selecting a page navigates there.
- Mock data clearly differentiates live, disconnected, warning, and completed states.
- No secrets, tokens, or vendor-specific API code are introduced.
- Errors and empty states use plain-language copy.

## Recommended implementation sequence

1. Initialize the desktop shell and development scripts.
2. Create tokens, typography, page layout, navigation, and shared components.
3. Build Mission Control with static mock data.
4. Add remaining route shells and empty states.
5. Add the command palette and keyboard shortcut.
6. Verify visual consistency, keyboard navigation, and basic responsive behavior.

## Deliverables

- Runnable source under `app/`.
- Updated root README with local run instructions.
- A short `app/README.md` explaining the chosen tooling and project scripts.
- Screenshot(s) or mockup(s) saved under `assets/mockups/` if generated during implementation.

## Definition of done

The product owner can open the desktop app, understand the intended daily workflow, navigate every planned module, and give visual feedback before real integrations are added.

## Handoff prompt for an implementation assistant

> Read `README.md` and all files in `docs/`, especially `Architecture.md`, `Design System.md`, and `Sprint 1.md`. Implement only Sprint 1. Create a Windows-runnable Electron + TypeScript desktop app in `app/` with React UI, the specified seven routes, an accessible `Ctrl/Cmd + K` command palette, and Mission Control mock data. Follow the Cyberpunk Executive system exactly; do not add external integrations, credentials, databases, or real automation. Update the README with precise run steps and verify the app launches.

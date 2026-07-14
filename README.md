# AIS Home Bubbles

A [Power Apps Code App](https://learn.microsoft.com/power-apps/developer/code-apps/overview)
(Vite + React + TypeScript) that recreates the AIS CRM home page — the
"Your new CRM **SOAP**" landing page with soap bubbles drifting upward behind the
content. Each bubble holds a person's profile photo pulled live from the
SharePoint **PH_Users** list (`Email` + Base64 `Photo` columns).

## Stack
- Vite + React 19 + TypeScript
- `@microsoft/power-apps` SDK + `@microsoft/power-apps-vite` plugin
- Data source: SharePoint Online connector → `PH_Users` list

## Local development
```bash
npm install
npm run dev
```
`npm run dev` prints a **Local Play** URL (`apps.powerapps.com/play/e/.../a/local?...`).
Open that URL in a browser signed in to Power Platform — the bubbles only populate
through the Local Play host (plain `localhost:5173` shows the page with no data).

## Build & publish
```bash
npm run build
pac code push
```
Publishing requires the environment to have Code Apps enabled and each end user to
hold a Power Apps Premium license.

## Configuration
Tuning knobs live in the `CONFIG` block at the top of [`src/App.tsx`](src/App.tsx):
`maxUsers`, bubble size/speed, and `activeOnly` (only show users where
`AccountEnabled !== false`).

## Embedding in a model-driven (Dynamics) app
Surface the published app inside Dynamics via an HTML web resource that
full-screen-iframes the app URL with `?hideNavBar=true`, then add that web
resource to a dashboard and set it as the app's home page.

## Notes
- `src/generated/**` and `.power/**` are produced by `pac code add-data-source`
  and required at build time — do not delete them.
- The "View Accounts" / "Open Guides" buttons are currently cosmetic.

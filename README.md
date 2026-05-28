# PLATAFORMArq — Project Management Demo

A fully functional, single-file demo of **PLATAFORMArq**, a project management tool built for architecture firms. No login, no backend, no external dependencies — everything runs in the browser.

**Live demo:** [saramscruz.github.io/plataformarq-demo](https://saramscruz.github.io/plataformarq-demo/)

---

## What it does

PLATAFORMArq helps architecture offices track projects from first sketch to occupancy licence. The demo includes 18 fictional projects covering the full lifecycle:

| Module | Features |
|--------|----------|
| **Projects** | Table view grouped by status, coordinator, collaborator, or priority |
| **Detail panel** | Full project info, phase, deadlines, municipal references, communication history |
| **Dashboard** | KPIs — active projects, urgent deadlines, pending items by coordinator |
| **Deadlines** | Overdue and upcoming deadline tracker |
| **Financial** | Fees adjudicated vs. collected, outstanding balances per project |

### Status workflow
`Ativo (Em curso)` → `Ativo (Em espera)` → `Pendente: Aguarda Cliente / Entidades` → `Suspenso` → `Concluído`

### Project phases
Analysis → Existing Survey → Preliminary Study → Licensing → Execution → Submitted → Under Construction → Occupancy Licence

---

## Demo specifics

- **No password required** — the app opens directly
- **Fictional data** — 18 demo projects with realistic Portuguese architecture context (clients, municipalities, processes, fees)
- **Read-only writes** — any save/edit action shows a "Demo mode" toast instead of persisting
- All data is hardcoded in `index.html`; no Google Sheets, no Apps Script, no API keys

---

## Tech

Single HTML file (~200 KB). No frameworks, no build step.

- Vanilla JS (ES2020)
- CSS custom properties for theming
- Roboto & Roboto Condensed (Google Fonts)

---

## Deploy

GitHub Pages serves `index.html` from the `main` branch root.

To run locally, just open `index.html` in a browser — no server needed.

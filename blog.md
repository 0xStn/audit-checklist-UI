# Solodit Audit Checklist — Local Explorer & Notes

This repository already includes the raw checklist (`checklist.json`). To make the data easier to use during audits, a local Vue (Vite) explorer was added under `ui/`. It lets you:

- Filter by **category names at any depth** (top-level and subcategories)
- Search by **question**, **description**, **remediation**, and **category path**
- Filter by **tags** (where present)
- Sort by **category**, **question**, or **ID**

The goal is to keep the UI **simple, auditable, and safe**:

- **No HTML injection**: all fields render as plain text (no `v-html`).
- **Safe links**: reference links only allow `http://` or `https://` and open with `rel="noopener noreferrer"`.
- **No external API calls**: data is loaded locally from `checklist.json`.

## Structure

- `ui/`: Vue + Vite app for interactive browsing.
- `checklist.json`: canonical checklist data used by the UI.

## Local usage

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`

The UI will load the root `checklist.json` directly, so any updates to the data will be reflected after a dev server restart.

## Why a local UI?

Auditing is a context-heavy task. A local UI keeps the checklist close to the codebase, without relying on external services, while still allowing fast filtering and exploration. The interface also mirrors how auditors think: broad top-level categories first, then deeper, targeted checks.

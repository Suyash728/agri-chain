# AGENTS.md

This file is the entry point for any AI coding agent working in this repository
(opencode, or any other agent driving **gpt-oss-20b** or **gemma-4-12b** through
Ollama). Read this file first, every session, before touching any code.

## 0. You have no memory of previous sessions

The model running you does not remember earlier conversations, and this repo is
the *only* place project context lives. That means:

1. **Read `MEMORY.md` first, in full, before doing anything else.** It is the
   running log of what has already been built, what decisions were made, and
   what broke last time. Treat it as more current than your own training
   knowledge about this project — you have none, it has all of it.
2. **After finishing any task or phase, append a new entry to `MEMORY.md`**
   before ending the session. Never skip this. If you stop partway through a
   task, write down exactly where you stopped and why.
3. Never delete or rewrite old `MEMORY.md` entries. Append only.

## 1. Read order

Read these in this order before writing code:

1. `MEMORY.md` — what has already happened (see above)
2. `PRD.md` — what we are building and why, essential vs optional features
3. `ARCHITECTURE.md` — how the pieces fit together, exact tech stack, file layout
4. `RULES.md` — hard constraints on how you write code in this repo
5. `PLAN.md` — the phased build plan (essential tier = first 2 weeks)
6. `TASKS.md` — the actual checklist, one task at a time, with DONE WHEN checks

`docs/proposal/KisanChain_Project_Context.md` is the original, longer project
brief the above five files were distilled from. Only open it if `PRD.md` or
`ARCHITECTURE.md` doesn't answer your question — it's long and written for a
different audience (the project guide), not for you.

## 2. The frontend already exists — do not recreate it

**`design/` is a finished, working React application.** It was generated with
Google Stitch and hand-refined, and it already contains every screen for every
role (Farmer, Logistics Partner, Dark Store, Consumer), fully styled, with
mock data wired in. Run it yourself before assuming anything about it:

```bash
cd design
npm install
npm run dev
```

**Your job regarding the frontend is *wiring*, never *creation*.** Concretely:

- Do **not** generate new components, new pages, new layouts, or new views.
- Do **not** install a UI library, a router, a CSS framework, or a state
  management library. It doesn't need any of them.
- Do **not** touch colors, spacing, fonts, or any Tailwind class that affects
  appearance. The full design system is documented in `design/DESIGN.md` — if
  a change you're making would require editing anything in that file, stop,
  you're doing the wrong task.
- **Do** replace an `import { x } from './data/mockData'` (or
  `./data/consumerData`) with a `fetch()` call to the backend, as long as the
  fetched JSON has the *exact same shape* as the mock data it replaces. This
  is the only kind of frontend change in scope for the essential build. See
  `ARCHITECTURE.md` §"The API contract is `mockData.js`" for exactly how this
  works — there is no separate API spec to design, the shape already exists.
- If a task genuinely requires a new UI element that isn't in `design/`
  anywhere, stop and add it to `MEMORY.md` as an open question rather than
  building it yourself.

## 3. How to work, given the model you're running on

gpt-oss-20b and gemma-4-12b are small, capable, but not infallible models with
limited context. Work in a way that keeps you reliable:

- **One task from `TASKS.md` at a time.** Never start the next task until the
  current one's "DONE WHEN" check passes. Run the check yourself — don't
  assume.
- **Prefer editing one file at a time** over sweeping multi-file rewrites. If
  a task seems to require touching more than 2–3 files, it's probably too big
  — split it and note the split in `MEMORY.md`.
- **Copy exact commands from `TASKS.md` and `ARCHITECTURE.md` rather than
  inventing your own.** If a command in those files is wrong, fix the file
  itself as part of your task, then use the corrected version.
- **Never invent a library, package, or API that isn't named in
  `ARCHITECTURE.md` or `RULES.md`.** If you're not sure a package exists or
  what its API looks like, that uncertainty is a signal to use something
  already on the approved list instead of guessing.
- **When stuck for more than one real attempt, stop and write the blocker
  into `MEMORY.md`** instead of working around it silently. A wrong workaround
  compounds; a written blocker gets fixed by a human or the next session.

## 4. Commit discipline

- One `TASKS.md` task = one commit. Small, reversible steps.
- Commit message format: `[phase] short description` — e.g.
  `[contracts] add registerBatch function and test`.
- Never commit `.env`, `node_modules/`, `__pycache__/`, `*.db`, or Hardhat's
  `artifacts/`/`cache/` directories. Check `.gitignore` covers these before
  your first commit of a session; add missing entries if not.

## 5. What "done" means for the essential build

The two-week essential build (see `PLAN.md`) is done when the check described
in `PRD.md` §"Essential-tier success criteria" passes — a single script run
that proves one batch of produce goes from farmer registration to a consumer
scanning its QR code and seeing a real, on-chain-backed journey and price
trail, with one deliberately bad sensor reading shown being caught and
quarantined instead of recorded. Nothing past that point is required for
"essential" to be considered complete.

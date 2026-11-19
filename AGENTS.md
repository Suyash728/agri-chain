# AGENTS.md

Entry point for AI coding agents other than Claude Code (which loads `CLAUDE.md` automatically).

**Read [`CLAUDE.md`](CLAUDE.md) first.** It is the single, full guide: architecture, firmware protocol, backend, current focus, commands and open issues. Then:

1. [`RULES.md`](RULES.md): the hard constraints. Never break them.
2. [`MEMORY.md`](MEMORY.md): the dated log of decisions. Add an entry when you make a decision a later agent would need to know.
3. [`reports/CODEBASE_AUDIT_2026-11-18.md`](reports/CODEBASE_AUDIT_2026-11-18.md): verified results and open defects.

Working rules:
- **One change at a time.** Verify it (tests, build, or a run) before claiming success.
- **Never run tests or the backend against the real `.env`**, which points at Supabase and a live chain. Use the isolated recipe in `CLAUDE.md` §13.3.
- **Keep the docs true.** If your change makes `CLAUDE.md` wrong, update it in the same commit.
- **Commits** use `[scope] description`. Never commit `.env`, `node_modules/`, `.venv/` or `*.db`.

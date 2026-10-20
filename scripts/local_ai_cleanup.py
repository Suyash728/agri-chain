#!/usr/bin/env python3
"""
local_ai_cleanup.py — KisanChain / agri-chain source code cleanup orchestrator.

Starts Ollama (gpt-oss-agent-64k), then dispatches headless OpenCode (oc-run)
tasks file-by-file to remove template/placeholder values, dead code, unused
imports, commented-out stubs, unresolved TODOs, and leftover mock data imports.
Changes are applied automatically. A full git diff summary is printed at the end.

Run from repo root:
    python3 scripts/local_ai_cleanup.py [--dry-run] [--domain DOMAIN]

Options:
    --dry-run        Report issues but do NOT apply edits (OpenCode plan mode).
    --domain DOMAIN  One of: frontend, backend, trust-layer, contracts, all (default: all)
"""

import argparse
import subprocess
import sys
import time
import json
import os
import re
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REPO_ROOT = Path("/home/suyash/Projects/agri-chain")
OC_RUN    = "/home/suyash/.local/bin/oc-run"   # headless opencode wrapper
OLLAMA_SVC = "ollama"                            # systemd --user service name
OLLAMA_URL = "http://127.0.0.1:11434/api/version"

# Per-file timeout (seconds). gpt-oss-20b @ 64k ctx on RTX 5060 Ti.
TIMEOUT_PER_FILE = 180

# Files to scan per domain. Paths are relative to REPO_ROOT.
SCAN_TARGETS = {
    "frontend": sorted(
        [str(p.relative_to(REPO_ROOT)) for p in (REPO_ROOT / "design/src").rglob("*.jsx")]
        + [str(p.relative_to(REPO_ROOT)) for p in (REPO_ROOT / "design/src").rglob("*.js")
           if ".venv" not in str(p) and "node_modules" not in str(p)]
    ),
    "backend": [
        str(p.relative_to(REPO_ROOT))
        for p in (REPO_ROOT / "backend").glob("*.py")
    ] + [
        str(p.relative_to(REPO_ROOT))
        for p in (REPO_ROOT / "backend/scripts").glob("*.py")
    ],
    "trust-layer": [
        str(p.relative_to(REPO_ROOT))
        for p in (REPO_ROOT / "trust-layer").rglob("*.py")
        if ".venv" not in str(p)
    ],
    "contracts": [
        str(p.relative_to(REPO_ROOT))
        for p in (REPO_ROOT / "contracts/contracts").glob("*.sol")
    ],
}

# The exact instruction given to gpt-oss for each file.
# Keep it precise — the 20B model performs best with clear, narrow tasks.
CLEANUP_PROMPT_TEMPLATE = """You are cleaning up {filepath} in the KisanChain / agri-chain project.

Read the FULL contents of {filepath} now.

Then apply ALL of the following corrections IN ONE PASS — do not stop after the first issue:

1. HARDCODED PLACEHOLDERS — Replace any remaining template/placeholder strings that are
   NOT coming from live API data or props. Examples to remove or fix:
   • "Lorem ipsum", "John Doe", "Jane Doe", "User Name", "example@email.com"
   • "$0", "₹0", "0 kg", "N/A", "--", "Loading...", "undefined" rendered as a literal UI value
   • Any date string hardcoded like "Jan 1, 2024" that should be derived from data
   If a placeholder is a loading/fallback state that is correct (e.g. shown while fetch is pending),
   leave it — but add a comment `// fallback-ok` so it is clearly intentional.

2. DEAD CODE — Remove any unreachable code:
   • Functions defined but never called anywhere in the file
   • Variables declared but never read
   • Constants defined but never referenced

3. COMMENTED-OUT CODE BLOCKS — Remove stale commented-out code (old implementations, debug
   console.log statements, commented import lines). Do NOT remove JSDoc/documentation comments.

4. UNUSED IMPORTS — Remove any import statement whose imported symbol is not referenced in the
   file body. For React files, keep the `React` import only if JSX is present without an
   automatic JSX transform (check if `React.createElement` is explicitly called).

5. TODO / FIXME / HACK comments that are resolved — If a TODO comment describes something that
   is clearly already implemented in the same file, remove the TODO comment. Leave TODOs that
   describe genuinely missing work.

6. MOCK DATA LEFTOVERS — If the file still imports from `./data/mockData` or
   `./data/consumerData` AND those imports are actively used as a fallback instead of live
   fetch() calls, replace the static import with an equivalent fetch() to the backend at
   `http://localhost:8000`. Match the exact same data shape. If the import is already unused,
   just remove it.

STRICT CONSTRAINTS — you must NOT:
• Change any Tailwind CSS class, color, spacing, or layout token.
• Add or remove any React component, prop, or page/route.
• Change any function signature, API endpoint path, or response shape.
• Introduce any new npm package or Python import that is not already in the file.
• Change any smart contract ABI, function selector, or event signature.

After applying all corrections, verify the file still passes a basic syntax check
(no unclosed JSX tags, no missing closing braces, no stray commas in Python).

Apply the changes directly to {filepath} now.
"""

DRY_RUN_PROMPT_TEMPLATE = """You are auditing {filepath} in the KisanChain / agri-chain project (READ-ONLY — do NOT edit any file).

Read the FULL contents of {filepath}.

Report ALL of the following issues found (list each with line number and a one-line description):

1. Hardcoded placeholder strings (Lorem ipsum, "N/A", "$0", "₹0", hardcoded dates, etc.)
2. Dead / unreachable functions or variables
3. Commented-out code blocks (not JSDoc/documentation)
4. Unused import statements
5. Resolved TODO/FIXME comments
6. Mock data imports (./data/mockData or ./data/consumerData) still used as UI data source

Output format — one line per issue:
  [LINE] [TYPE] description
  e.g.:  42  PLACEHOLDER  "₹0" hardcoded, should come from earnings API
         17  UNUSED_IMPORT  `useState` imported but never used

If the file has NO issues, output exactly: CLEAN
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def run(cmd: list[str], cwd: Path = REPO_ROOT, timeout: int = 30) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout
    )


def log(msg: str, color: str = ""):
    COLORS = {"green": "\033[92m", "yellow": "\033[93m", "red": "\033[91m", "cyan": "\033[96m", "": ""}
    RESET  = "\033[0m"
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{COLORS[color]}[{ts}] {msg}{RESET}", flush=True)


def ensure_ollama_running() -> bool:
    """Start Ollama via systemd --user if not already active."""
    log("Checking Ollama status...", "cyan")
    r = run(["systemctl", "--user", "is-active", OLLAMA_SVC])
    if r.returncode == 0:
        log("Ollama is already running.", "green")
        return True

    log("Starting Ollama (systemctl --user start ollama)...", "yellow")
    r = run(["systemctl", "--user", "start", OLLAMA_SVC], timeout=15)
    if r.returncode != 0:
        log(f"Failed to start Ollama: {r.stderr}", "red")
        return False

    # Wait up to 30s for the API to become available
    import urllib.request
    for _ in range(30):
        try:
            urllib.request.urlopen(OLLAMA_URL, timeout=2)
            log("Ollama API is up.", "green")
            return True
        except Exception:
            time.sleep(1)
    log("Ollama did not respond within 30s.", "red")
    return False


def get_file_diff(filepath: str) -> str:
    """Return the git diff for a single file (empty string if no changes)."""
    r = run(["git", "diff", "--", filepath])
    return r.stdout.strip()


def oc_run_task(filepath: str, prompt: str, dry_run: bool) -> dict:
    """
    Run a headless OpenCode task for a single file.
    Returns a dict with keys: file, status, diff, output, error.
    """
    result = {"file": filepath, "status": "unknown", "diff": "", "output": "", "error": ""}

    if dry_run:
        # In dry-run mode we still call oc-run but only with the audit prompt
        # (no file edits will happen because the prompt instructs READ-ONLY).
        pass  # fall through to common oc-run call

    abs_path = REPO_ROOT / filepath
    if not abs_path.exists():
        result["status"] = "skip"
        result["error"] = "file not found"
        return result

    log(f"  → {'Auditing' if dry_run else 'Cleaning'} {filepath}", "cyan")

    try:
        env = os.environ.copy()
        env["PWD"] = str(REPO_ROOT)

        proc = subprocess.run(
            [OC_RUN, prompt],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=TIMEOUT_PER_FILE,
            env=env,
        )
        result["output"] = proc.stdout
        result["error"]  = proc.stderr

        if not dry_run:
            diff = get_file_diff(filepath)
            result["diff"] = diff
            result["status"] = "changed" if diff else "clean"
        else:
            # Parse the model's audit output
            out = proc.stdout
            result["status"] = "clean" if "CLEAN" in out.upper() else "issues"

    except subprocess.TimeoutExpired:
        result["status"] = "timeout"
        result["error"]  = f"Exceeded {TIMEOUT_PER_FILE}s timeout"
    except Exception as exc:
        result["status"] = "error"
        result["error"]  = str(exc)

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Local AI code cleanup for agri-chain")
    parser.add_argument("--dry-run", action="store_true", help="Audit only, do not edit files")
    parser.add_argument(
        "--domain",
        choices=["frontend", "backend", "trust-layer", "contracts", "all"],
        default="all",
        help="Which domain to scan (default: all)",
    )
    args = parser.parse_args()

    # Build file list
    if args.domain == "all":
        files = []
        for domain_files in SCAN_TARGETS.values():
            files.extend(domain_files)
    else:
        files = SCAN_TARGETS[args.domain]

    files = sorted(set(files))
    log(f"{'DRY-RUN AUDIT' if args.dry_run else 'CLEANUP'} — {len(files)} files across domain '{args.domain}'", "green")

    # Ensure Ollama is running
    if not ensure_ollama_running():
        log("Cannot proceed without Ollama. Exiting.", "red")
        sys.exit(1)

    # Stage: capture baseline diff state
    baseline_diff = run(["git", "diff", "--name-only"]).stdout.strip()
    if baseline_diff and not args.dry_run:
        log(f"WARNING: {len(baseline_diff.splitlines())} files already have uncommitted changes. "
            "They will be included in the summary.", "yellow")

    # Process files
    results = []
    changed_count = 0
    clean_count   = 0
    error_count   = 0
    issue_count   = 0

    for i, filepath in enumerate(files, 1):
        log(f"[{i}/{len(files)}] {filepath}")
        template = DRY_RUN_PROMPT_TEMPLATE if args.dry_run else CLEANUP_PROMPT_TEMPLATE
        prompt = template.format(filepath=filepath)
        res = oc_run_task(filepath, prompt, dry_run=args.dry_run)
        results.append(res)

        if res["status"] == "changed":
            changed_count += 1
            log(f"     ✓ Changed ({len(res['diff'].splitlines())} diff lines)", "green")
        elif res["status"] == "clean":
            clean_count += 1
        elif res["status"] in ("timeout", "error", "skip"):
            error_count += 1
            log(f"     ✗ {res['status'].upper()}: {res['error']}", "red")
        elif res["status"] == "issues":
            issue_count += 1
            log(f"     ⚠ Issues found", "yellow")

    # ---------------------------------------------------------------------------
    # Summary report
    # ---------------------------------------------------------------------------
    report_path = REPO_ROOT / "scripts" / "cleanup_report.md"
    timestamp   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(report_path, "w") as f:
        f.write(f"# Local AI Cleanup Report\n\n")
        f.write(f"**Run at:** {timestamp}  \n")
        f.write(f"**Mode:** {'Dry-run (audit only)' if args.dry_run else 'Apply changes'}  \n")
        f.write(f"**Domain:** {args.domain}  \n")
        f.write(f"**Model:** gpt-oss-agent-64k (Ollama local)  \n\n")

        f.write(f"## Summary\n\n")
        f.write(f"| Metric | Count |\n|---|---|\n")
        f.write(f"| Files scanned | {len(files)} |\n")
        if args.dry_run:
            f.write(f"| Files with issues | {issue_count} |\n")
            f.write(f"| Clean files | {clean_count} |\n")
        else:
            f.write(f"| Files changed | {changed_count} |\n")
            f.write(f"| Files already clean | {clean_count} |\n")
        f.write(f"| Errors / timeouts | {error_count} |\n\n")

        if args.dry_run:
            f.write("## Issues Found (Audit)\n\n")
            for res in results:
                if res["status"] == "issues":
                    f.write(f"### `{res['file']}`\n\n```\n{res['output'][:2000]}\n```\n\n")
        else:
            # Full git diff summary
            final_diff = run(["git", "diff", "--stat"]).stdout.strip()
            f.write("## Git Diff Summary\n\n```\n")
            f.write(final_diff if final_diff else "No changes.")
            f.write("\n```\n\n")

            f.write("## Changed Files\n\n")
            for res in results:
                if res["status"] == "changed":
                    f.write(f"### `{res['file']}`\n\n```diff\n{res['diff'][:3000]}\n```\n\n")

        f.write("## Errors & Skips\n\n")
        for res in results:
            if res["status"] in ("timeout", "error", "skip"):
                f.write(f"- **{res['file']}** — {res['status']}: {res['error']}\n")

    log(f"\nReport written to: {report_path}", "green")
    log(f"Files scanned: {len(files)}", "green")
    if args.dry_run:
        log(f"Issues found: {issue_count}  Clean: {clean_count}  Errors: {error_count}", "yellow")
    else:
        log(f"Changed: {changed_count}  Clean: {clean_count}  Errors: {error_count}", "green")

        # Stage all changes and show status
        if changed_count > 0:
            log("\nStaging changes for review (git add -A)...", "cyan")
            run(["git", "add", "-A"])
            diff_stat = run(["git", "diff", "--cached", "--stat"]).stdout.strip()
            log(f"\nGit staged diff:\n{diff_stat}", "cyan")
            log("\nReview with `git diff --cached` before committing.", "yellow")


if __name__ == "__main__":
    main()

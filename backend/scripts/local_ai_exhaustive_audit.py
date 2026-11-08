#!/usr/bin/env python3
"""
Local AI Exhaustive Audit Runner for AgriChain
Uses local vLLM Qwen3-VL-8B-Thinking on http://127.0.0.1:8001/v1/chat/completions.
Executes:
  1. Documentation & Rules Ingestion
  2. Line-by-Line Code Review across Backend Routers, Smart Contracts, & Frontend
  3. Multimodal Screenshot Audit across all 4 supply chain roles
  4. Generates decision matrix & detailed user questions
"""

import os
import json
import base64
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE_DIR = Path("/home/suyash/Projects/agri-chain")
API_URL = "http://127.0.0.1:8001/v1/chat/completions"
MODEL_ID = "/home/suyash/AI/models/qwen3-vl-8b-thinking-nvfp4"

def query_local_llm(prompt: str, system_prompt: str = "", max_tokens: int = 1500) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.2
    }

    req = urllib.request.Request(
        API_URL,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload).encode("utf-8")
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - t0
            usage = data.get("usage", {})
            content = data["choices"][0]["message"]["content"]
            print(f"  [LLM] OK ({elapsed:.1f}s, prompt_tokens={usage.get('prompt_tokens')}, comp_tokens={usage.get('completion_tokens')})")
            return content
    except Exception as e:
        print(f"  [LLM ERROR]: {e}")
        return f"Error querying local model: {e}"

def query_local_vision(prompt: str, image_path: Path, max_tokens: int = 1200) -> str:
    if not image_path.exists():
        return f"File not found: {image_path}"
    
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
            ]
        }
    ]

    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.2
    }

    req = urllib.request.Request(
        API_URL,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload).encode("utf-8")
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - t0
            usage = data.get("usage", {})
            content = data["choices"][0]["message"]["content"]
            print(f"  [Vision] OK ({elapsed:.1f}s, prompt_tokens={usage.get('prompt_tokens')}, comp_tokens={usage.get('completion_tokens')})")
            return content
    except Exception as e:
        print(f"  [Vision ERROR]: {e}")
        return f"Error querying local vision model: {e}"

def main():
    print("=== STARTING EXHAUSTIVE LOCAL AI AUDIT OF AGRICHAIN ===")
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": MODEL_ID,
        "docs_understanding": {},
        "code_reviews": {},
        "screenshot_audits": {},
        "key_questions": []
    }

    # 1. READ & INGEST CORE DOCS
    doc_files = [
        "RULES.md",
        "PRD.md",
        "ARCHITECTURE.md",
        "frontend/DESIGN.md",
        "AgriChain_Project_Context.md"
    ]
    
    print("\n--- Phase 1: Ingesting Project Documentation ---")
    combined_docs_summary = []
    for doc in doc_files:
        p = BASE_DIR / doc
        if not p.exists():
            p = BASE_DIR / "docs" / "proposal" / doc
        if not p.exists():
            continue
        print(f"Reading {p.name}...")
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()[:12000] # First 12k chars
        
        prompt = (
            f"You are the lead AI auditor for AgriChain. Read the following documentation file '{doc}' carefully.\n"
            f"Extract: 1) Core invariants and hard constraints, 2) Lifecycle rules for batches across all roles "
            f"(Farmer, Logistics, Dark Store, Consumer), 3) Financial & telemetry requirements, 4) Potential failure points.\n\n"
            f"DOCUMENT CONTENT:\n{content}\n\n"
            f"Provide a rigorous, structured analytical summary."
        )
        summary = query_local_llm(prompt, system_prompt="You are an expert blockchain and distributed systems auditor.", max_tokens=1000)
        results["docs_understanding"][doc] = summary
        combined_docs_summary.append(f"### Key Invariants from {doc}:\n{summary[:500]}...")

    # 2. LINE-BY-LINE CODE REVIEWS
    print("\n--- Phase 2: Exhaustive Code Review by Local AI ---")
    code_files_to_review = [
        ("contracts/contracts/AgriTrustEscrow.sol", "Smart Contract: Custody & Escrow Financial Invariants"),
        ("contracts/contracts/BatchNFT.sol", "Smart Contract: ERC721 Batch State Machine"),
        ("backend/routers/farmer.py", "FastAPI Router: Farmer Produce Intake, AI Trust Score & Batch Minting"),
        ("backend/routers/logistics.py", "FastAPI Router: Logistics Pickup, Transit Telemetry & Handover"),
        ("backend/routers/darkstore.py", "FastAPI Router: Dark Store Inbound GRN, FEFO Allocation & Quality Gate"),
        ("backend/routers/consumer.py", "FastAPI Router: Consumer Provenance, Journey Verification & QR Scan"),
        ("backend/routers/telemetry.py", "FastAPI Router: IoT Sensor Ingestion & Automated Circuit Breaker"),
        ("frontend/src/Farmer/BatchCreation.jsx", "React Frontend: Farmer Batch Creation Form & MetaMask TX"),
        ("frontend/src/Logistics/Transportation.jsx", "React Frontend: Logistics Route & In-Transit Telemetry"),
        ("frontend/src/DarkStore/DarkStoreInboundGRN.jsx", "React Frontend: Dark Store Intake & Quarantining"),
        ("frontend/src/Consumer/ConsumerProvenanceJourney.jsx", "React Frontend: Consumer Trust & Fair Share Journey")
    ]

    for rel_path, role_desc in code_files_to_review:
        p = BASE_DIR / rel_path
        if not p.exists():
            print(f"File {rel_path} not found, skipping...")
            continue
        print(f"Reviewing {rel_path} ({role_desc})...")
        with open(p, "r", encoding="utf-8") as f:
            code_text = f.read()[:14000] # First 14k chars
        
        prompt = (
            f"Perform an exhaustive line-by-line security, design, and logic audit of this file: '{rel_path}' ({role_desc}).\n"
            f"Project Rules:\n"
            f"- Integer paise for money (NO floating point math, 1 INR = 100 paise).\n"
            f"- Integer deci-celsius for temperature (e.g. 40 = 4.0°C).\n"
            f"- Monotonic custody transfer: Farmer -> Logistics -> Dark Store -> Consumer.\n"
            f"- Circuit breaker must reject compromised batches.\n"
            f"- Zero template/dummy code; all workflows must function end-to-end.\n\n"
            f"FILE CONTENT:\n```\n{code_text}\n```\n\n"
            f"Inspect and report:\n"
            f"1. Concrete code defects or edge-case vulnerabilities.\n"
            f"2. Any remaining template/mock artifacts or hardcoded bypasses.\n"
            f"3. Compliance with integer monetary & temperature standards.\n"
            f"4. Actionable line-by-line refactoring recommendations."
        )
        review_output = query_local_llm(prompt, system_prompt="You are an uncompromising smart contract and backend code auditor.", max_tokens=1200)
        results["code_reviews"][rel_path] = review_output

    # 3. MULTIMODAL SCREENSHOT AUDIT
    print("\n--- Phase 3: Multimodal UI Inspection by Local Vision LLM ---")
    screenshots_to_inspect = [
        ("01_farmer_dashboard.png", "Farmer Dashboard Overview with Live Metrics & Batch Feed"),
        ("02_farmer_my_crops.png", "Farmer Crop Registration & Batch Management"),
        ("03_farmer_ai_trust.png", "Farmer AI Trust Score & Quality Analysis"),
        ("04_logistics_dashboard.png", "Logistics Active Dispatches & Vehicle Allocation"),
        ("05_logistics_available_produce.png", "Logistics Available Batches for Pickup"),
        ("06_logistics_transportation.png", "Logistics In-Transit Real-Time IoT Telemetry & Map"),
        ("07_darkstore_dashboard.png", "Dark Store Overview & FEFO Inventory Alerts"),
        ("08_darkstore_inbound_grn.png", "Dark Store Goods Receipt Note (GRN) & Thermal Breach Check"),
        ("09_darkstore_inventory.png", "Dark Store Warehouse Rack Storage & Shelf Life"),
        ("10_consumer_marketplace.png", "Consumer Fresh Produce Marketplace & Fair Price Journey"),
        ("11_consumer_provenance_journey.png", "Consumer Blockchain Provenance Journey & Escrow Breakdown"),
        ("12_admin_governance.png", "Admin Governance, Smart Contract Controls & System Circuit Breaker")
    ]

    for fname, desc in screenshots_to_inspect:
        p = BASE_DIR / "reports" / "screenshots" / fname
        if not p.exists():
            p = BASE_DIR / "screenshots" / fname
        if not p.exists():
            print(f"Screenshot {fname} not found, skipping...")
            continue
        print(f"Vision analyzing {fname} ({desc})...")
        prompt = (
            f"You are the senior multimodal UX/UI auditor for AgriChain.\n"
            f"Critically analyze this UI screenshot: '{fname}' ({desc}).\n"
            f"Assess the following:\n"
            f"1. Visual Polish & Design System: Does it match the earthy luxury aesthetic (warm cream background #FAF7F0, rich dark slate #2D2620, olive accents #556B2F, refined typography)?\n"
            f"2. Data Integrity: Are real dynamic data values shown (batch IDs, weights, INR amounts, telemetry temps, GPS coordinates) or placeholder/mock 'Lorem Ipsum' / generic 'dummy' text?\n"
            f"3. Usability & Role Fidelity: Can a real user in this role execute their step smoothly?\n"
            f"4. Specific visual defects, clipping, overlapping text, or missing feedback states."
        )
        vision_output = query_local_vision(prompt, p, max_tokens=1000)
        results["screenshot_audits"][fname] = vision_output

    # 4. GENERATE STRATEGIC QUESTIONS FOR THE USER
    print("\n--- Phase 4: Formulating Key Strategic Questions for User Alignment ---")
    question_prompt = (
        "Based on your exhaustive review of AgriChain's docs, code, and UI screenshots, identify 3-5 critical architectural "
        "and UX design decisions that require explicit alignment from the project owner/examiner before making major modifications.\n"
        "Focus on:\n"
        "1. Manual batch workflow nuances between Logistics pickup and Dark Store intake.\n"
        "2. Handling of quarantined batches in consumer search/catalog views.\n"
        "3. Real EVM gas optimization vs UI feedback during batch minting.\n"
        "Format as distinct, actionable questions with recommended choices."
    )
    questions_output = query_local_llm(question_prompt, system_prompt="You are the lead architect formulating user alignment questions.", max_tokens=1000)
    results["key_questions"] = questions_output

    # SAVE RAW JSON
    json_path = BASE_DIR / "reports" / "local_ai_raw_audit_results.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nRaw results saved to {json_path}")

    # GENERATE MARKDOWN REPORT
    md_path = BASE_DIR / "reports" / "LOCAL_AI_EXHAUSTIVE_INSPECTION_REPORT.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# AgriChain: Local AI Exhaustive Inspection & Refactoring Report\n\n")
        f.write(f"**Generated by Local AI Model**: `{MODEL_ID}`\n")
        f.write(f"**Execution Timestamp**: `{results['timestamp']}`\n\n")
        f.write("---\n\n")
        
        f.write("## 1. Documentation & Core Rule Ingestion Analysis\n\n")
        for doc, summary in results["docs_understanding"].items():
            f.write(f"### {doc}\n\n{summary}\n\n")
        
        f.write("---\n\n")
        f.write("## 2. Line-by-Line Code Review Findings\n\n")
        for path, review in results["code_reviews"].items():
            f.write(f"### File: `{path}`\n\n{review}\n\n")
            
        f.write("---\n\n")
        f.write("## 3. Multimodal UI Screenshot Audits (Qwen3-VL-8B-Thinking)\n\n")
        for fname, audit in results["screenshot_audits"].items():
            f.write(f"### Screenshot: `{fname}`\n\n{audit}\n\n")

        f.write("---\n\n")
        f.write("## 4. Key Questions & Design Decisions for User\n\n")
        f.write(f"{results['key_questions']}\n\n")

    print(f"Markdown report saved to {md_path}")
    print("=== AUDIT EXECUTION COMPLETE ===")

if __name__ == "__main__":
    main()

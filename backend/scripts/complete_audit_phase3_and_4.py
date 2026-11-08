#!/usr/bin/env python3
"""
Complete Phase 3 (Remaining Screenshots 06-12) & Phase 4 (Strategic Questions)
Using local vLLM Qwen3-VL-8B-Thinking on http://127.0.0.1:8001
"""

import os
import json
import base64
import time
import urllib.request
from pathlib import Path
from PIL import Image
import io

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
            print(f"  [LLM] OK ({elapsed:.1f}s, prompt_tokens={usage.get('prompt_tokens')}, comp_tokens={usage.get('completion_tokens')})", flush=True)
            return content
    except Exception as e:
        print(f"  [LLM ERROR]: {e}", flush=True)
        return f"Error querying local model: {e}"

def query_local_vision(prompt: str, image_path: Path, max_tokens: int = 1000) -> str:
    if not image_path.exists():
        return f"File not found: {image_path}"
    
    # Resize image to max dimension 1024 to guarantee safe VRAM headroom
    img = Image.open(image_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    max_dim = max(img.size)
    if max_dim > 1024:
        scale = 1024 / max_dim
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
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
            print(f"  [Vision] OK ({elapsed:.1f}s, prompt_tokens={usage.get('prompt_tokens')}, comp_tokens={usage.get('completion_tokens')})", flush=True)
            return content
    except Exception as e:
        print(f"  [Vision ERROR]: {e}", flush=True)
        return f"Error querying local vision model: {e}"

def main():
    print("=== COMPLETING LOCAL AI VISION AUDIT (06-12) & STRATEGIC QUESTIONS ===", flush=True)
    json_path = BASE_DIR / "reports" / "local_ai_raw_audit_results.json"
    with open(json_path, "r", encoding="utf-8") as f:
        results = json.load(f)

    remaining_screenshots = [
        ("06_logistics_transportation.png", "Logistics In-Transit Real-Time IoT Telemetry & Map"),
        ("07_darkstore_dashboard.png", "Dark Store Overview & FEFO Inventory Alerts"),
        ("08_darkstore_inbound_grn.png", "Dark Store Goods Receipt Note (GRN) & Thermal Breach Check"),
        ("09_darkstore_inventory.png", "Dark Store Warehouse Rack Storage & Shelf Life"),
        ("10_consumer_marketplace.png", "Consumer Fresh Produce Marketplace & Fair Price Journey"),
        ("11_consumer_provenance_journey.png", "Consumer Blockchain Provenance Journey & Escrow Breakdown"),
        ("12_admin_governance.png", "Admin Governance, Smart Contract Controls & System Circuit Breaker")
    ]

    for fname, desc in remaining_screenshots:
        p = BASE_DIR / "reports" / "screenshots" / fname
        if not p.exists():
            p = BASE_DIR / "screenshots" / fname
        print(f"Vision analyzing {fname} ({desc})...", flush=True)
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

    print("\n--- Formulating Key Strategic Questions for User Alignment ---", flush=True)
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

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    md_path = BASE_DIR / "reports" / "LOCAL_AI_EXHAUSTIVE_INSPECTION_REPORT.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# AgriChain: Local AI Exhaustive Inspection & Refactoring Report\n\n")
        f.write(f"**Generated by Local AI Model**: `{MODEL_ID}`\n")
        f.write(f"**Execution Timestamp**: `{time.strftime('%Y-%m-%d %H:%M:%S')}`\n\n")
        f.write("---\n\n")
        
        f.write("## 1. Documentation & Core Rule Ingestion Analysis\n\n")
        for doc, summary in results.get("docs_understanding", {}).items():
            f.write(f"### {doc}\n\n{summary}\n\n")
        
        f.write("---\n\n")
        f.write("## 2. Line-by-Line Code Review Findings\n\n")
        for path, review in results.get("code_reviews", {}).items():
            f.write(f"### File: `{path}`\n\n{review}\n\n")
            
        f.write("---\n\n")
        f.write("## 3. Multimodal UI Screenshot Audits (Qwen3-VL-8B-Thinking)\n\n")
        for fname, audit in results.get("screenshot_audits", {}).items():
            f.write(f"### Screenshot: `{fname}`\n\n{audit}\n\n")

        f.write("---\n\n")
        f.write("## 4. Key Questions & Design Decisions for User\n\n")
        f.write(f"{results.get('key_questions', '')}\n\n")

    print(f"Report updated at {md_path}", flush=True)
    print("=== ALL PHASES COMPLETE ===", flush=True)

if __name__ == "__main__":
    main()

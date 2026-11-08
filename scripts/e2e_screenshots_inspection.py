#!/usr/bin/env python3
"""
E2E UI & Visual Fidelity Inspection Script for AgriChain.
Captures screenshots across Farmer, Logistics, Dark Store, Consumer, and Admin portals.
"""
import os
import time
import pathlib
from playwright.sync_api import sync_playwright

OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "reports" / "screenshots"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VIEWS_TO_TEST = [
    ("01_farmer_dashboard", "http://localhost:3000/?role=farmer&tab=dashboard"),
    ("02_farmer_my_crops", "http://localhost:3000/?role=farmer&tab=crops"),
    ("03_farmer_ai_trust", "http://localhost:3000/?role=farmer&tab=ai-trust"),
    ("04_logistics_dashboard", "http://localhost:3000/?role=logistics&tab=dashboard"),
    ("05_logistics_available_produce", "http://localhost:3000/?role=logistics&tab=available"),
    ("06_logistics_transportation", "http://localhost:3000/?role=logistics&tab=transportation"),
    ("07_darkstore_dashboard", "http://localhost:3000/?role=darkstore&tab=dashboard"),
    ("08_darkstore_inbound_grn", "http://localhost:3000/?role=darkstore&tab=inbound"),
    ("09_darkstore_inventory", "http://localhost:3000/?role=darkstore&tab=inventory"),
    ("10_consumer_marketplace", "http://localhost:3000/?role=consumer&tab=home"),
    ("11_consumer_provenance_journey", "http://localhost:3000/?role=consumer&tab=journey"),
    ("12_admin_governance", "http://localhost:3000/?role=admin&tab=all"),
]

def run():
    print("===============================================================")
    print("      AGRICHAIN E2E PLAYWRIGHT SCREENSHOT INSPECTION           ")
    print("===============================================================\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        for name, url in VIEWS_TO_TEST:
            print(f"[*] Navigating to {name}: {url}")
            page.goto(url, wait_until="networkidle")

            # Click splash screen if present
            try:
                splash = page.locator("text=Nurturing from soil to plate").first
                if splash.is_visible(timeout=1000):
                    page.locator("body").click()
                    time.sleep(0.5)
            except Exception:
                pass

            page.wait_for_timeout(1500)

            screenshot_path = OUTPUT_DIR / f"{name}.png"
            page.screenshot(path=str(screenshot_path), full_page=True)
            print(f"  [SAVED] {screenshot_path.name}")

        browser.close()

    print("\n[OK] All screenshots captured successfully!")
    if console_errors:
        print(f"[!] Warning: {len(console_errors)} console errors detected:")
        for err in console_errors[:5]:
            print(f"    - {err}")
    else:
        print("[PASS] 0 Console Errors detected across all role dashboards!")

if __name__ == "__main__":
    run()

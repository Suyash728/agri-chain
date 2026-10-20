import sys
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    ("Mobile Small (iPhone SE)", 375, 667),
    ("Mobile Landscape (iPhone SE)", 667, 375),
    ("Mobile Standard (iPhone 13/14)", 390, 844),
    ("Mobile Standard Landscape", 844, 390),
    ("Mobile Large (Pixel 7 / Galaxy)", 412, 915),
    ("Tablet Portrait (iPad Mini/9th Gen)", 768, 1024),
    ("Tablet Landscape (iPad)", 1024, 768),
    ("Tablet Air Portrait", 820, 1180),
    ("Desktop Standard", 1280, 800),
    ("Desktop Full HD", 1920, 1080),
    ("Desktop 2K QHD", 2560, 1440),
]

ROLES = [
    ("Farmer", "Farmer"),
    ("Logistics", "Logistics Partner"),
    ("Dark Store", "Dark Store"),
    ("Consumer", "Consumer"),
    ("Admin", "Admin"),
]

def run_tests():
    total_tests = 0
    failed_tests = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for vp_name, width, height in VIEWPORTS:
            print(f"\n=======================================================")
            print(f"VIEWPORT: {vp_name} [{width}x{height}]")
            print(f"=======================================================")
            
            context = browser.new_context(viewport={"width": width, "height": height})
            # Route external fonts/trackers to prevent hanging in offline environments
            context.route("**/*googleapis.com/**", lambda r: r.abort())
            context.route("**/*gstatic.com/**", lambda r: r.abort())
            page = context.new_page()
            page.goto("http://127.0.0.1:3000", wait_until="commit")
            page.wait_for_selector("button:has-text('Farmer')", timeout=5000)

            for role_key, role_label in ROLES:
                total_tests += 1
                btn = page.locator(f"button:has-text('{role_label}')").first
                btn.click()
                page.wait_for_timeout(250)

                sw = page.evaluate("document.documentElement.scrollWidth")
                cw = page.evaluate("document.documentElement.clientWidth")
                diff = sw - cw

                if diff > 0:
                    failed_tests += 1
                    print(f"  [X] {role_key:<12} -> FAIL (scrollWidth={sw}, clientWidth={cw}, overflow={diff}px)")
                    # Inspect culprits
                    culprits = page.evaluate('''() => {
                        const elements = [];
                        const docWidth = document.documentElement.clientWidth;
                        document.querySelectorAll('*').forEach(el => {
                            const rect = el.getBoundingClientRect();
                            if (rect.right > docWidth + 1) {
                                elements.push({
                                    tag: el.tagName,
                                    cls: (el.className || '').toString().slice(0, 45),
                                    text: (el.innerText || '').slice(0, 25),
                                    right: Math.round(rect.right),
                                    width: Math.round(rect.width)
                                });
                            }
                        });
                        return elements.slice(0, 5);
                    }''')
                    for c in culprits:
                        print(f"      Culprit: {c}")
                else:
                    print(f"  [✓] {role_key:<12} -> PASS ({sw}px == {cw}px, zero overflow)")

            context.close()
        
        browser.close()

    print(f"\n-------------------------------------------------------")
    print(f"AUDIT SUMMARY: {total_tests - failed_tests}/{total_tests} passed ({failed_tests} failed).")
    if failed_tests > 0:
        sys.exit(1)
    else:
        print("ALL VIEWPORTS AND ROLES ARE 100% RESPONSIVE AND ZERO OVERFLOW!")

if __name__ == "__main__":
    run_tests()

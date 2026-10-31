# scripts/verify_report_text.py
import docx

def verify_doc(docx_path):
    doc = docx.Document(docx_path)
    
    hardware_keywords = [
        "esp32", "dht22", "neo-6m", "hardware-injected", "hardware injected",
        "push-button", "push button", "breadboard", "physical microcontroller",
        "hardware microcontroller", "hardware disconnect", "hardware fault",
        "hardware specification"
    ]
    
    findings = []
    
    # Check paragraphs
    for p_idx, p in enumerate(doc.paragraphs):
        text_lower = p.text.lower()
        for kw in hardware_keywords:
            if kw in text_lower:
                findings.append(f"Paragraph {p_idx} matched '{kw}': {p.text[:100]}...")
                
    # Check tables
    for t_idx, table in enumerate(doc.tables):
        for r_idx, row in enumerate(table.rows):
            for c_idx, cell in enumerate(row.cells):
                cell_lower = cell.text.lower()
                for kw in hardware_keywords:
                    if kw in cell_lower:
                        findings.append(f"Table {t_idx} [R{r_idx}, C{c_idx}] matched '{kw}': {cell.text[:100]}...")
                        
    print("=" * 60)
    print(f"VERIFYING DOCX: {docx_path}")
    print("=" * 60)
    print(f"Total Paragraphs: {len(doc.paragraphs)}")
    print(f"Total Tables    : {len(doc.tables)}")
    print(f"Hardware Keyword Hits: {len(findings)}")
    for f in findings:
        print("  ->", f)
        
    # Also check for "simulation" or "simulated" mentions
    sim_hits = sum(1 for p in doc.paragraphs if "simulat" in p.text.lower())
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if "simulat" in cell.text.lower():
                    sim_hits += 1
    print(f"Simulation/Simulated Mentions: {sim_hits}")
    print("=" * 60)
    return len(findings)

if __name__ == "__main__":
    import sys
    res1 = verify_doc("BE_GRP_08_FINAL_REPORT_2026.docx")
    res2 = verify_doc("Final_BE_Report_AgriChain.docx")
    if res1 == 0 and res2 == 0:
        print("[SUCCESS] Zero hardware references found! Report is 100% simulation-based.")
        sys.exit(0)
    else:
        print("[FAILURE] Hardware references still found.")
        sys.exit(1)

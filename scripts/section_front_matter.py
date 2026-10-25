# scripts/section_front_matter.py
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from scripts.report_helpers import add_h1, add_para, add_styled_table, set_cell_background, set_table_borders
import scripts.report_data as rd

def build_front_matter(doc):
    # 1. COVER PAGE
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(36)
    p_title.paragraph_format.space_after = Pt(12)
    p_title.paragraph_format.left_indent = Inches(0)
    p_title.paragraph_format.right_indent = Inches(0)
    r_t = p_title.add_run(f'"{rd.TITLE}"')
    r_t.font.name = "Georgia"
    r_t.font.size = Pt(17)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(16, 42, 77)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(6)
    p_sub.paragraph_format.space_after = Pt(4)
    p_sub.paragraph_format.left_indent = Inches(0)
    p_sub.paragraph_format.right_indent = Inches(0)
    r_sub = p_sub.add_run("MAJOR PROJECT REPORT")
    r_sub.font.name = "Georgia"
    r_sub.font.size = Pt(13)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(30, 30, 30)

    p_sub2 = doc.add_paragraph()
    p_sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub2.paragraph_format.space_before = Pt(2)
    p_sub2.paragraph_format.space_after = Pt(14)
    p_sub2.paragraph_format.left_indent = Inches(0)
    p_sub2.paragraph_format.right_indent = Inches(0)
    r_sub2 = p_sub2.add_run(
        "Submitted in partial fulfillment of the requirements for the degree of\n"
        "BACHELOR OF ENGINEERING\n"
        f"in Artificial Intelligence and Data Science"
    )
    r_sub2.font.name = "Georgia"
    r_sub2.font.size = Pt(11)
    r_sub2.font.italic = True
    r_sub2.font.color.rgb = RGBColor(70, 70, 70)

    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_before = Pt(4)
    p_by.paragraph_format.space_after = Pt(4)
    p_by.paragraph_format.left_indent = Inches(0)
    p_by.paragraph_format.right_indent = Inches(0)
    r_by = p_by.add_run("by")
    r_by.font.name = "Georgia"
    r_by.font.size = Pt(11)
    r_by.font.italic = True

    # 2x2 Student Table on Cover Page
    stud_table = doc.add_table(rows=2, cols=2)
    stud_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    stud_pairs = [rd.STUDENTS[0:2], rd.STUDENTS[2:4]]
    for r_idx, pair in enumerate(stud_pairs):
        for c_idx, s in enumerate(pair):
            cell = stud_table.rows[r_idx].cells[c_idx]
            cell.text = f"{s['name']}\n({s['id']})"
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(4)
                for r in p.runs:
                    r.font.name = "Georgia"
                    r.font.size = Pt(11)
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(20, 20, 20)
            cell.width = Inches(3.0)

    p_gui = doc.add_paragraph()
    p_gui.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_gui.paragraph_format.space_before = Pt(14)
    p_gui.paragraph_format.space_after = Pt(2)
    p_gui.paragraph_format.left_indent = Inches(0)
    p_gui.paragraph_format.right_indent = Inches(0)
    r_g1 = p_gui.add_run("Under the Guidance of\n")
    r_g1.font.name = "Georgia"
    r_g1.font.size = Pt(11)
    r_g1.font.italic = True
    r_g2 = p_gui.add_run(rd.GUIDE)
    r_g2.font.name = "Georgia"
    r_g2.font.size = Pt(12)
    r_g2.font.bold = True
    r_g2.font.color.rgb = RGBColor(16, 42, 77)

    # College Logo
    logo_path = "extracted_docx_images/image_10_image2.jpg"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(8)
        p_logo.paragraph_format.space_after = Pt(8)
        p_logo.paragraph_format.left_indent = Inches(0)
        p_logo.paragraph_format.right_indent = Inches(0)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.2))

    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(2)
    p_col.paragraph_format.space_after = Pt(2)
    p_col.paragraph_format.left_indent = Inches(0)
    p_col.paragraph_format.right_indent = Inches(0)
    r_col = p_col.add_run(
        f"TPCT's {rd.COLLEGE}, Nerul, Navi Mumbai\n"
        f"An Autonomous Institute Affiliated to Mumbai University\n"
        f"{rd.DEPARTMENT}\n"
        f"Academic Year {rd.ACADEMIC_YEAR}"
    )
    r_col.font.name = "Georgia"
    r_col.font.size = Pt(10.5)
    r_col.font.bold = True
    r_col.font.color.rgb = RGBColor(30, 30, 30)

    doc.add_page_break()

    # 2. APPROVAL SHEET
    add_h1(doc, "Approval Sheet")
    add_para(
        doc,
        f'This Major Project Report entitled "{rd.TITLE}" submitted by the students listed below is approved '
        f'for the degree of Bachelor of Engineering in Artificial Intelligence and Data Science, Academic Year {rd.ACADEMIC_YEAR}.'
    )
    
    tbl_app = doc.add_table(rows=5, cols=2)
    tbl_app.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_app)
    tbl_app.rows[0].cells[0].text = "Name of Student"
    tbl_app.rows[0].cells[1].text = "Student ID"
    set_cell_background(tbl_app.rows[0].cells[0], "1E3A2F")
    set_cell_background(tbl_app.rows[0].cells[1], "1E3A2F")
    for c in tbl_app.rows[0].cells:
        for p in c.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = "Georgia"
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
    for i, s in enumerate(rd.STUDENTS):
        row = tbl_app.rows[i+1]
        row.cells[0].text = s["name"]
        row.cells[1].text = s["id"]
        for c in row.cells:
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.name = "Georgia"
                    r.font.size = Pt(10.5)

    add_para(doc, "\nExaminers:")
    add_para(doc, "1. ____________________________________          2. ____________________________________\n   (Internal Examiner)                                                 (External Examiner)")
    add_para(doc, "\nApprovals:")
    add_para(
        doc,
        f"______________________                                              ______________________\n"
        f"({rd.GUIDE})                                                          ({rd.COORDINATOR})\n"
        f"Project Guide                                                                Project Coordinator\n\n\n"
        f"______________________                                              ______________________\n"
        f"({rd.HOD})                                                        ({rd.PRINCIPAL})\n"
        f"Head of Department                                                     Principal"
    )
    add_para(doc, f"Date: ____________________\nPlace: {rd.COLLEGE}, Nerul, Navi Mumbai")
    doc.add_page_break()

    # 3. CERTIFICATE
    add_h1(doc, "CERTIFICATE")
    add_para(
        doc,
        f'This is to certify that the project entitled "{rd.TITLE}" is a bonafide work carried out by '
        f"Doctor UmerKhan JunaidKhan (TU8S2425008), Kerkar Suyash Satish (TU8S2425003), Esaf Shanum Shakil (TU8S2425004), "
        f"and Patil Rutuja Sanjeev (TU8S2425006) in partial fulfillment of the requirements for the award of the degree of "
        f"Bachelor of Engineering in Artificial Intelligence and Data Science at TPCT's {rd.COLLEGE}, Nerul (W), Navi Mumbai, "
        f"affiliated to Mumbai University, during the academic year {rd.ACADEMIC_YEAR}."
    )
    add_para(
        doc,
        "To the best of our knowledge, this work has not been submitted to any other university or institution "
        "for the award of any other degree or diploma."
    )
    add_para(
        doc,
        f"\n\n______________________                                              ______________________\n"
        f"({rd.GUIDE})                                                          ({rd.COORDINATOR})\n"
        f"Project Guide                                                                Project Coordinator\n\n\n"
        f"______________________                                              ______________________\n"
        f"({rd.HOD})                                                        ({rd.PRINCIPAL})\n"
        f"Head of Department                                                     Principal"
    )
    add_para(doc, f"\nDate: ____________________\nPlace: {rd.COLLEGE}, Nerul, Navi Mumbai")
    doc.add_page_break()

    # 4. DECLARATION
    add_h1(doc, "Declaration")
    add_para(
        doc,
        f'We declare that this written submission entitled "{rd.TITLE}" represents our own ideas in our own words. '
        "Where the ideas or words of others have been included, we have adequately cited and referenced the original sources."
    )
    add_para(
        doc,
        "We also declare that we have adhered to all principles of academic honesty and integrity and have not "
        "misrepresented or fabricated any idea, data, fact, or source in our submission. We understand that any "
        "violation of the above will be cause for disciplinary action by the Institute and can also evoke penal action "
        "from the sources which have thus not been properly cited or from whom proper permission has not been taken when needed."
    )
    add_para(doc, "\n")
    tbl_dec = doc.add_table(rows=2, cols=2)
    tbl_dec.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, pair in enumerate(stud_pairs):
        for c_idx, s in enumerate(pair):
            cell = tbl_dec.rows[r_idx].cells[c_idx]
            cell.text = f"___________________________\n{s['name']}\n({s['id']})\n"
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_after = Pt(6)
                for r in p.runs:
                    r.font.name = "Georgia"
                    r.font.size = Pt(11)
            cell.width = Inches(3.0)

    add_para(doc, f"Date: ____________________\nPlace: {rd.COLLEGE}, Nerul, Navi Mumbai")
    doc.add_page_break()

    # 5. ACKNOWLEDGEMENT
    add_h1(doc, "Acknowledgement")
    add_para(
        doc,
        f"We express our deepest gratitude to our Project Guide, {rd.GUIDE}, for her invaluable guidance, patient mentoring, "
        "and persistent encouragement throughout the conceptualization, system development, and experimental validation of this project. "
        "Her profound insights into decentralized architectures and machine learning evaluation have been instrumental in our progress."
    )
    add_para(
        doc,
        f"We extend our sincere thanks to {rd.COORDINATOR}, BE Project Coordinator, for her systematic planning, "
        "timely review schedules, and constructive critiques during every milestone evaluation."
    )
    add_para(
        doc,
        f"We are immensely grateful to {rd.HOD}, Head of the {rd.DEPARTMENT}, and {rd.PRINCIPAL}, Principal of {rd.COLLEGE}, "
        "for granting access to college computing facilities, specialized research laboratories, and creating a vibrant academic atmosphere."
    )
    add_para(
        doc,
        "Lastly, we convey our heartfelt appreciation to our fellow classmates, laboratory staff, and our parents and families "
        "whose unwavering moral and emotional support fueled our dedication to successfully accomplish this engineering project."
    )
    add_para(doc, "\n")
    for s in rd.STUDENTS:
        add_para(doc, f"{s['name']} ({s['id']})", space_after=2)

    doc.add_page_break()

    # 6. ABSTRACT
    add_h1(doc, "Abstract")
    add_para(
        doc,
        "Modern agricultural supply chains suffer from severe information asymmetry, post-harvest produce deterioration, "
        "and non-transparent price realization for primary producers. While blockchain technology provides immutable provenance "
        "and smart contracts can enforce operational policies, existing agricultural implementations are vulnerable to the "
        "critical 'Garbage In, Garbage Out' dilemma: corrupt, manipulated, or failing IoT telemetry streams directly into the distributed "
        "ledger without validation. Furthermore, monolithic smart contracts incur prohibitive gas costs, off-chain storage repositories "
        "lack cryptographic tamper evidence, and intermediaries conceal cumulative profit margins from farmers and consumers."
    )
    add_para(
        doc,
        "This project proposes a unified, decentralized 5-tier architecture integrating the Internet of Things (IoT), an AI-driven "
        "Trust Layer, modular EVM smart contracts, dual-engine persistence with tamper-evident cryptographic hash chains, and a responsive "
        "multi-role React 18 interface. Environmental conditions (temperature, humidity, location) during storage and transit are captured "
        "via IoT sensor tracking and processed through an off-chain AI validation pipeline. The pipeline executes physical plausibility "
        "analysis, dynamic crop policy boundary checks, 11-dimensional feature extraction, unsupervised Isolation Forest anomaly detection, "
        "and SHA-256 event fingerprinting to isolate suspicious telemetry into a tamper-evident quarantine hash-chain before it can contaminate the ledger."
    )
    add_para(
        doc,
        "Validated telemetry is securely anchored to modular smart contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor, "
        "PolicyConfig) deployed on Polygon Amoy. A single-slot packed condition recording mechanism achieves a 52.71% gas reduction "
        "under batched oracle updates (N=20). Off-chain quality lab certificates are pinned to IPFS with cryptographic Content Identifiers "
        "(CIDs) anchored on-chain. Consumers scan batch QR codes to inspect the complete farm-to-fork journey, dynamic freshness grades, "
        "verified reviews, and an authentic price trail establishing a fair 50.0% farmer revenue share. Evaluated across 1,000 synthetic "
        "and hardware-injected fault sequence trials, the AI Trust Layer achieved an overall F1-score of 97.22% with 100% recall across "
        "all seven fault profiles, verifying an accountable, cost-efficient, and fraud-resistant agricultural supply chain platform."
    )
    add_para(doc, "Keywords: Agricultural Supply Chain, Blockchain Traceability, IoT Cold Chain, AI Trust Layer, Isolation Forest Anomaly Detection, Modular Smart Contracts, Gas Optimization, Fair Price Trail, Tamper-Evident Quarantine Hash Chain.", italic=True)
    doc.add_page_break()

    # 7. TABLE OF CONTENTS
    add_h1(doc, "Table of Contents")
    toc_items = [
        ("Approval Sheet", "ii"),
        ("Certificate", "iii"),
        ("Declaration", "iv"),
        ("Acknowledgement", "v"),
        ("Abstract", "vi"),
        ("List of Figures", "ix"),
        ("List of Tables", "x"),
        ("List of Abbreviations", "xi"),
        ("Chapter 1: Introduction", "12"),
        ("    1.1 Introduction and Agricultural Context", "12"),
        ("    1.2 Aim and Motivation of the Project", "13"),
        ("    1.3 Scope of the Project", "14"),
        ("    1.4 Significant Contributions", "14"),
        ("    1.5 Organization of the Report", "15"),
        ("Chapter 2: Literature Review", "16"),
        ("    2.1 Blockchain-Based Supply Chain Traceability", "16"),
        ("    2.2 AI and Machine Learning for Anomaly Detection", "17"),
        ("    2.3 IoT-Blockchain Security and Hardware Integration", "18"),
        ("    2.4 Domain-Specific Agricultural Supply Chain Studies", "19"),
        ("    2.5 Comparative Analysis of Existing Systems", "20"),
        ("    2.6 Critical Analysis of Existing Research", "20"),
        ("    2.7 Identified Research Gaps", "21"),
        ("Chapter 3: Problem Statement and System Requirements", "21"),
        ("    3.1 Problem Statement", "21"),
        ("    3.2 System Objectives", "22"),
        ("    3.3 Functional Requirements", "23"),
        ("    3.4 Non-Functional Requirements", "24"),
        ("    3.5 Target Stakeholder Profiles and Personas", "24"),
        ("Chapter 4: Proposed Methodology and System Design", "25"),
        ("    4.1 System Overview and 5-Tier Architecture", "25"),
        ("    4.2 Operational Flowchart of Proposed Methodology", "26"),
        ("    4.3 Data Flow Analysis (DFD Level 0 and Level 1)", "27"),
        ("    4.4 Database Design and Entity-Relationship Modeling", "29"),
        ("    4.5 Use Case Analysis and Role Governance", "31"),
        ("    4.6 AI-Based Trust Layer Pipeline", "32"),
        ("    4.7 Modular Smart Contracts and Circuit Breakers", "33"),
        ("    4.8 Dual Persistence and Decentralized Document Pinning", "34"),
        ("    4.9 Software and Hardware Specifications", "34"),
        ("    4.10 Dynamic Crop Policy Engine", "34"),
        ("    4.11 Project Timeline and Scheduling", "34"),
        ("Chapter 5: Results and Discussion", "36"),
        ("    5.1 AI Trust Layer Performance Evaluation", "36"),
        ("    5.2 Telemetry Fault Detection and Quarantine Isolation", "37"),
        ("    5.3 Automated Testing and Capstone System Verification", "37"),
        ("    5.4 Smart-Contract Gas Optimization Benchmarking", "38"),
        ("    5.5 Multi-Role Platform Dashboards and Traceability", "38"),
        ("    5.6 Overall Discussion and Research Validation", "44"),
        ("Chapter 6: Conclusions and Future Scope", "46"),
        ("    6.1 Conclusion", "46"),
        ("    6.2 Future Scope", "46"),
        ("Appendices", "48"),
        ("    Appendix I: System Operational Workflow and State Machine", "48"),
        ("    Appendix II: AI Trust Layer Verdict Rules and Anomaly Taxonomy", "49"),
        ("Bibliography / References", "50")
    ]
    for title, pg in toc_items:
        p_toc = doc.add_paragraph()
        p_toc.paragraph_format.space_before = Pt(1)
        p_toc.paragraph_format.space_after = Pt(2)
        p_toc.paragraph_format.line_spacing = 1.15
        p_toc.paragraph_format.left_indent = Inches(0)
        p_toc.paragraph_format.right_indent = Inches(0)
        r_t = p_toc.add_run(title)
        r_t.font.name = "Georgia"
        r_t.font.size = Pt(11)
        r_t.font.bold = True if title.startswith("Chapter") or title in ["Abstract", "Bibliography / References"] else False

        r_dots = p_toc.add_run(" " + "." * max(2, (80 - len(title) * 2)) + " ")
        r_dots.font.name = "Georgia"
        r_dots.font.size = Pt(10)
        r_dots.font.color.rgb = RGBColor(140, 140, 140)

        r_p = p_toc.add_run(pg)
        r_p.font.name = "Georgia"
        r_p.font.size = Pt(11)
        r_p.font.bold = True if title.startswith("Chapter") else False

    doc.add_page_break()

    # 8. LIST OF FIGURES
    add_h1(doc, "List of Figures")
    figures_list = [
        ("Figure 4.1", "Four-Tier System Architecture of the AgriChain Platform", "25"),
        ("Figure 4.2", "Operational Flowchart of the Proposed Methodology", "26"),
        ("Figure 4.3", "Data Flow Diagram (DFD) Level 0: Context Diagram", "28"),
        ("Figure 4.4", "Data Flow Diagram (DFD) Level 1: Complete System Data Flow", "29"),
        ("Figure 4.5", "Entity-Relationship Diagram (ERD) of AgriChain Relational and On-Chain Schema", "30"),
        ("Figure 4.6", "Use Case Diagram for AgriChain Multi-Stakeholder Ecosystem", "31"),
        ("Figure 4.7", "Project Timeline and Implementation Gantt Chart", "35"),
        ("Figure 5.1", "Confusion Matrix of the AI-Based Anomaly Detection Model", "36"),
        ("Figure 5.2", "AI-Based Telemetry Anomaly Detection and Quarantine Isolation", "37"),
        ("Figure 5.3", "Farmer Dashboard for Agricultural Product and Batch Registration", "39"),
        ("Figure 5.4", "Logistics Dashboard for Product Dispatch and Tracking", "40"),
        ("Figure 5.5", "Logistics Interface for Product Movement and Custody Updates", "40"),
        ("Figure 5.6", "AI Trust Layer for IoT Telemetry Validation and Checkpoints", "41"),
        ("Figure 5.7", "Dark-Store Dashboard for Product Receiving and Inventory Management", "42"),
        ("Figure 5.8", "Administrative Dashboard for Supply Chain Governance and Circuit Breakers", "42"),
        ("Figure 5.9", "Consumer Interface for QR-Based Product Traceability", "43"),
        ("Figure 5.10", "Farm-to-Fork Product Journey with Cumulative Price Breakdown", "43"),
        ("Figure 5.11", "Digital Validation Certificate for Product Provenance", "44")
    ]
    for num, title, pg in figures_list:
        p_fig = doc.add_paragraph()
        p_fig.paragraph_format.space_before = Pt(1)
        p_fig.paragraph_format.space_after = Pt(2)
        p_fig.paragraph_format.left_indent = Inches(0)
        p_fig.paragraph_format.right_indent = Inches(0)
        r_n = p_fig.add_run(f"{num}: {title}")
        r_n.font.name = "Georgia"
        r_n.font.size = Pt(11)
        r_d = p_fig.add_run(" " + "." * max(2, (80 - (len(num) + len(title)))) + " ")
        r_d.font.name = "Georgia"
        r_d.font.color.rgb = RGBColor(140, 140, 140)
        r_p = p_fig.add_run(pg)
        r_p.font.name = "Georgia"
        r_p.font.size = Pt(11)

    doc.add_page_break()

    # 9. LIST OF TABLES
    add_h1(doc, "List of Tables")
    tables_list = [
        ("Table 1.1", "List of Abbreviations", "xi"),
        ("Table 2.1", "Literature Survey: Blockchain-Based Supply Chain Traceability", "17"),
        ("Table 2.2", "Literature Survey: AI and Machine Learning for Anomaly Detection", "18"),
        ("Table 2.3", "Literature Survey: IoT and Blockchain Security Integration", "19"),
        ("Table 2.4", "Literature Survey: Domain-Specific Agricultural Supply Chain Studies", "20"),
        ("Table 2.5", "Comparative Analysis: Existing Systems vs. Proposed AgriChain System", "20"),
        ("Table 4.1", "Software and Hardware Requirements Specification", "34"),
        ("Table 4.2", "Crop Policy Reference Thresholds for Cold Chain Monitoring", "34"),
        ("Table 5.1", "Recorded Performance Metrics of the AI Trust Layer", "36"),
        ("Table 5.2", "Recorded End-to-End System Verification Outcomes (PRD Section 6 Suite)", "38"),
        ("Table 5.3", "Recorded Gas Consumption for Individual vs. Batched Condition Writes", "38"),
        ("Table 5.4", "Multi-Stage Fair Price Distribution Across Supply Chain Actors", "43")
    ]
    for num, title, pg in tables_list:
        p_tbl = doc.add_paragraph()
        p_tbl.paragraph_format.space_before = Pt(1)
        p_tbl.paragraph_format.space_after = Pt(2)
        p_tbl.paragraph_format.left_indent = Inches(0)
        p_tbl.paragraph_format.right_indent = Inches(0)
        r_n = p_tbl.add_run(f"{num}: {title}")
        r_n.font.name = "Georgia"
        r_n.font.size = Pt(11)
        r_d = p_tbl.add_run(" " + "." * max(2, (80 - (len(num) + len(title)))) + " ")
        r_d.font.name = "Georgia"
        r_d.font.color.rgb = RGBColor(140, 140, 140)
        r_p = p_tbl.add_run(pg)
        r_p.font.name = "Georgia"
        r_p.font.size = Pt(11)

    doc.add_page_break()

    # 10. LIST OF ABBREVIATIONS
    add_h1(doc, "List of Abbreviations")
    add_styled_table(
        doc,
        ["Abbreviation", "Full Description / Meaning"],
        rd.ABBREVIATIONS,
        col_widths=[1.8, 4.47],
        caption="Table 1.1: List of Abbreviations"
    )
    doc.add_page_break()

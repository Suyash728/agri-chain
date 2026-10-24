# scripts/generate_viva_guide_docs.py
import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

DOCX_OUT = "AgriChain_Viva_Master_Reference_Guide.docx"
PDF_OUT = "AgriChain_Viva_Master_Reference_Guide.pdf"

# Theme Colors (Deep Emerald & Navy / Neutral Slate)
COLOR_PRIMARY = RGBColor(16, 85, 50)       # #105532 Deep Emerald
COLOR_SECONDARY = RGBColor(27, 42, 74)     # #1B2A4A Navy Slate
COLOR_TEXT_MAIN = RGBColor(33, 37, 41)     # #212529 Dark Charcoal
COLOR_TEXT_MUTED = RGBColor(108, 117, 125) # #6C757D Muted Gray
COLOR_ALERT = RGBColor(180, 40, 40)        # Deep Crimson Alert
HEX_HEADER_BG = "1B3B2B"                  # Dark Forest Green Header
HEX_ZEBRA_BG = "F4F7F5"                   # Light Sage Tint
HEX_CALLOUT_BG = "EDF4EE"                 # Soft Emerald Tint

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC", left=None, right=None, sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{top}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{bottom}"/>
            {f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{left}"/>' if left else '<w:left w:val="none"/>'}
            {f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{right}"/>' if right else '<w:right w:val="none"/>'}
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def init_document():
    doc = docx.Document()
    for s in doc.sections:
        s.page_width = Inches(8.27)
        s.page_height = Inches(11.69)
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        s.header_distance = Inches(0.4)
        s.footer_distance = Inches(0.4)
        
        # Header
        hdr = s.header
        hp = hdr.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_hdr = hp.add_run("AgriChain — Final Year BE Project Technical Reference & Viva Voce Master Guide")
        r_hdr.font.name = "Calibri"
        r_hdr.font.size = Pt(8.5)
        r_hdr.font.color.rgb = COLOR_TEXT_MUTED
        
        # Footer
        ftr = s.footer
        fp = ftr.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_ftr = fp.add_run("Department of Artificial Intelligence & Data Science | Academic Year 2025–2026")
        r_ftr.font.name = "Calibri"
        r_ftr.font.size = Pt(8.5)
        r_ftr.font.color.rgb = COLOR_TEXT_MUTED
    return doc

def add_header_banner(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r_sub = p.add_run("FINAL YEAR B.E. CAPSTONE PROJECT EXAMINATION")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_PRIMARY
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("AgriChain: Complete Technical Architecture, Codebase & Viva Voce Master Reference Guide")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_SECONDARY
    
    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.space_before = Pt(0)
    p_desc.paragraph_format.space_after = Pt(14)
    r_desc = p_desc.add_run(
        "A comprehensive reference manual covering all libraries, backend microservices, machine learning anomaly detection "
        "algorithms, smart contract governance, zero-float integer conventions, gas optimizations, and examiner-level questions & answers."
    )
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(10.5)
    r_desc.font.italic = True
    r_desc.font.color.rgb = COLOR_TEXT_MUTED

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = COLOR_PRIMARY

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = COLOR_SECONDARY

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_TEXT_MAIN

def add_para(doc, text, bold_prefix=None, space_after=5):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(10)
        r_b.font.bold = True
        r_b.font.color.rgb = COLOR_TEXT_MAIN
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.font.color.rgb = COLOR_TEXT_MAIN

def add_bullet(doc, text, bold_prefix=None, level=0):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    r_sym = p.add_run("•  ")
    r_sym.font.name = "Calibri"
    r_sym.font.size = Pt(10)
    r_sym.font.bold = True
    r_sym.font.color.rgb = COLOR_PRIMARY
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(10)
        r_b.font.bold = True
        r_b.font.color.rgb = COLOR_TEXT_MAIN
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.font.color.rgb = COLOR_TEXT_MAIN

def add_callout(doc, text, title=None):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.67)
    set_cell_background(cell, HEX_CALLOUT_BG)
    set_cell_borders(cell, top="99C2A2", bottom="99C2A2", left="105532", right="99C2A2", sz="16")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(2)
    if title:
        rt = cp.add_run(title + "\n")
        rt.font.name = "Calibri"
        rt.font.size = Pt(10.5)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_PRIMARY
    rc = cp.add_run(text)
    rc.font.name = "Calibri"
    rc.font.size = Pt(9.5)
    rc.font.color.rgb = COLOR_TEXT_MAIN
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_styled_table(doc, headers, rows, col_widths=None):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Format Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        cell = hdr_cells[i]
        set_cell_background(cell, HEX_HEADER_BG)
        set_cell_borders(cell, top="000000", bottom="105532", left="335544", right="335544", sz="6")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    # Format Body Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_hex = HEX_ZEBRA_BG if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            cell = row_cells[c_idx]
            set_cell_background(cell, bg_hex)
            set_cell_borders(cell, top="DDDDDD", bottom="DDDDDD", left="EEEEEE", right="EEEEEE", sz="4")
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(str(cell_value))
            r.font.name = "Calibri"
            r.font.size = Pt(9.0)
            r.font.color.rgb = COLOR_TEXT_MAIN
            
    # Proportional column widths
    if col_widths:
        for row in tbl.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_content(doc):
    add_header_banner(doc)
    
    # ==========================================
    # SECTION 1: MASTER TECHNOLOGY & LIBRARIES
    # ==========================================
    add_h1(doc, "Section 1: Master Technology Stack & Library Matrix")
    add_para(
        doc,
        "AgriChain is built on an enterprise 5-tier architecture spanning hardware/simulated edge devices, asynchronous Python "
        "microservices, unsupervised machine learning, modular EVM Solidity smart contracts, and a responsive React frontend. "
        "The following matrix outlines every library and technology utilized across the project."
    )
    
    headers_1 = ["Layer / Domain", "Technology & Version", "Core Functionality in AgriChain", "Engineering Justification vs Alternatives"]
    rows_1 = [
        ["Backend REST API", "FastAPI (v0.115+)", "Asynchronous ASGI web framework managing telemetry ingestion, batch registrations, AI pipeline routing, and role views.", "300% faster than Flask/Django; native ASGI concurrency for high-frequency IoT streaming; automatic Swagger/OpenAPI docs and Rust-powered Pydantic serialization."],
        ["ASGI Web Server", "Uvicorn (v0.30+)", "Lightning-fast ASGI server running the FastAPI application on top of the high-performance uvloop event loop.", "Production-grade asynchronous non-blocking I/O capable of handling hundreds of concurrent IoT sensor pings without thread pool starvation."],
        ["Data Validation", "Pydantic (v2.9+)", "Strict request/response payload schema parsing, type coercion, and data sanitization.", "Rejects corrupt or malformed IoT sensor packets at the API boundary before they consume CPU cycles or enter application memory."],
        ["Machine Learning", "Scikit-Learn (v1.5+)", "Implements the unsupervised Isolation Forest anomaly detection algorithm and evaluation metrics.", "Highly optimized C-accelerated tree partitioning; executes sub-15ms inference latency on standard CPU hardware without requiring GPU infrastructure."],
        ["Numerical Math", "NumPy & Pandas (v1.26+)", "Vectorized mathematical transformations, time-series moving averages, and rolling z-scores.", "Enables instant multi-sensor feature engineering (first-order temperature gradients, humidity ratios, and z-score anomaly vectors)."],
        ["Database & ORM", "SQLite & SQLAlchemy / SQLModel", "Relational persistence of raw incoming telemetry (readings table), active batches, custody events, and audit logs.", "Implements the strict 'Persistence-Before-Validation' rule to guarantee complete auditability, with zero configuration overhead and seamless Supabase PostgreSQL migration."],
        ["EVM Blockchain Client", "Web3.py (v7.0+)", "Python library for interacting with Ethereum/Polygon Amoy JSON-RPC nodes.", "Industry-standard EVM abstraction for transaction signing, ABI encoding, bitwise struct packing, and smart contract method invocation."],
        ["Sensor Cryptography", "eth-account & pycryptodome", "Hardware ECDSA public/private key signature verification and SHA-256 IsoLog hash chaining.", "Verifies IoT edge identity directly via secp256k1 signature recovery, while cryptographically chaining quarantined records off-chain."],
        ["Smart Contracts", "Solidity (v0.8.28)", "Modular smart contracts executing custody state transitions, SLA penalty deductions, and escrow settlements.", "Latest stable version with native integer overflow checks and custom errors for maximum gas efficiency."],
        ["Development Framework", "Hardhat (v2.22+)", "Ethereum development environment for contract compilation, local EVM node simulation, and testing.", "Fast automated unit testing (22 passing tests), local chain fork inspection, and automated gas profiling."],
        ["Contract Primitives", "OpenZeppelin Contracts (v5.0+)", "Industry-audited implementations of AccessControl (RBAC) and Pausable (Emergency Circuit Breakers).", "Mitigates common smart contract exploits (reentrancy, unauthorized writes) using standardized, mathematically proven access control primitives."],
        ["Frontend UI", "React (v18.3+)", "Component-based Single Page Application (SPA) managing role-based dashboards (Farmer, Logistics, Dark Store, Consumer, Admin).", "Fast Virtual DOM rendering, reactive component lifecycle hooks, and real-time custom event synchronization across views."],
        ["Build Tool", "Vite (v6.0+)", "Next-generation frontend build tool and development server using native ES modules.", "Sub-second Hot Module Replacement (HMR) and 4.38-second production builds compiling 1,817 modules."],
        ["Styling System", "Tailwind CSS (v3.4+)", "Utility-first CSS framework enforcing a locked design token system.", "Zero runtime stylesheet overhead, highly consistent cross-dashboard layout, and strict design adherence without third-party UI libraries."],
        ["Web3 Client (Frontend)", "Ethers.js (v6.17+)", "Client-side EVM blockchain library for MetaMask connectivity and contract calls.", "Modern, lightweight Web3 library with native BigInt support for integer currency (paise) and clean asynchronous contract abstractions."]
    ]
    add_styled_table(doc, headers_1, rows_1, col_widths=[1.2, 1.3, 2.1, 2.07])

    # ==========================================
    # SECTION 2: END-TO-END STEP-BY-STEP PIPELINE
    # ==========================================
    add_h1(doc, "Section 2: End-to-End Operational Pipeline (Step-by-Step Data Journey)")
    add_para(
        doc,
        "To understand how AgriChain works in practice, examine the life cycle of a single environmental reading taken by an IoT edge sensor "
        "installed inside a refrigerated transit truck (reefer) carrying organic tomatoes:"
    )
    
    add_bullet(doc, "The sensor captures temperature, humidity, GPS coordinates, and timestamp, attaches its hardware ECDSA signature, and sends an HTTP POST request to /telemetry on the FastAPI gateway. Following our strict Persistence-Before-Validation rule, the raw payload is saved to the SQLite 'readings' table immediately, ensuring an immutable forensic record even if the packet is later flagged as fraudulent.", "Step 1: Telemetry Ingestion & Raw Persistence — ")
    add_bullet(doc, "The pipeline passes the reading to integrity.py. The system verifies that the timestamp is strictly monotonic (t_k > t_{k-1}) and has not exceeded the 15-minute heartbeat limit (t_k - t_{k-1} <= 900s). It then uses eth-account to recover the signer address from the ECDSA signature, confirming that the data originated from an authentic, registered hardware device rather than a network impersonator.", "Step 2: Cryptographic Identity & Anti-Replay Check — ")
    add_bullet(doc, "The reading is evaluated against physical laws in plausibility.py and biological policies in policy.py. It verifies that the thermal rate of change does not exceed |ΔT/Δt| <= 1.5°C/minute (the physical limit of insulated reefers) and that the truck's speed (calculated via the Haversine formula) does not exceed 120 km/h. Concurrently, it checks crop bounds (tomatoes: 2.0°C to 8.0°C).", "Step 3: Deterministic Physical Plausibility & Crop Policy Filter — ")
    add_bullet(doc, "The pipeline in features.py computes a multi-dimensional feature vector: temperature gradient, humidity rate of change, cross-sensor ratio (Temp/Humidity), and a rolling statistical z-score across the preceding 5 samples. These features are fed into the Scikit-learn Isolation Forest model, which measures tree isolation path lengths to detect subtle calibration drifts, frozen sensor outputs, or multivariate anomalies.", "Step 4: Multivariate Feature Extraction & Isolation Forest ML — ")
    add_bullet(doc, "The verdict.py engine synthesizes all checks into a final status: VALID, BREACH, or ANOMALOUS. If anomalous, the payload is immediately blocked from touching the blockchain (WRITE_BLOCKED). Instead, it is directed to audit.py, which chains the incident record into an off-chain SHA-256 IsoLog Hash Chain (entry_hash = SHA256(prev_hash + reading_id + reasons + timestamp)), providing complete tamper-evident auditability with zero gas cost.", "Step 5: Composite Verdict & IsoLog Quarantine Chaining — ")
    add_bullet(doc, "If the reading is VALID or a legitimate biological BREACH, chain.py bit-packs the metrics into a single 256-bit word and dispatches a signed transaction via Web3.py to ColdChainMonitor.sol. If a breach occurred, the contract automatically computes dynamic penalty deductions and logs them against the logistics escrow payout.", "Step 6: Single-Slot Bitwise Struct Packing & On-Chain Oracle Execution — ")
    add_bullet(doc, "The backend broadcasts updates to frontend clients. The Farmer Dashboard displays the batch trust score (92/100); the Logistics Dashboard updates vehicle tracking; the Dark Store receives inbound shipment allocations; and consumers scanning the product QR code can view the entire verified 5-stage timeline and fair price breakdown.", "Step 7: Multi-Stakeholder UI & Consumer QR Reflection — ")

    # ==========================================
    # SECTION 3: FILE-BY-FILE & PROGRAM BREAKDOWN
    # ==========================================
    add_h1(doc, "Section 3: Granular File-by-File & Program Breakdown")
    add_para(
        doc,
        "Every file in the AgriChain codebase has a dedicated responsibility within the modular architecture. "
        "The following detailed breakdown describes the exact imports, classes, functions, and logic implemented in each program."
    )
    
    add_h2(doc, "3.1 Backend Core Services (backend/)")
    
    add_h3(doc, "backend/main.py — Central API Gateway & System Orchestrator")
    add_para(
        doc,
        "• Key Imports: fastapi, pydantic, hashlib, numpy, time, datetime, chain, ipfs, db, and trust-layer service modules.\n"
        "• Core Endpoints & Logic:\n"
        "  - POST /telemetry: Main ingestion endpoint. Accepts TelemetryPayload, executes raw SQLite insertion, orchestrates the AI Trust Layer pipeline, and routes data to either blockchain anchoring or quarantine.\n"
        "  - GET /farmer/ai-trust: Aggregates recent telemetry over active batches, calculates composite trust scores (0–100), and returns integrity status checkpoints.\n"
        "  - GET /telemetry/quarantine: Retrieves deduplicated audit trail records and IsoLog SHA-256 hash chains for forensic inspection.\n"
        "  - POST /demo/scenario/{id}: Orchestrates the 5 interactive demonstration scenarios (golden-path, transit-degradation, thermal-quarantine, sensor-replay-fraud, fefo-discount), updating state across all roles simultaneously."
    )
    
    add_h3(doc, "backend/chain.py — Web3 Blockchain Connector & Struct Packer")
    add_para(
        doc,
        "• Key Imports: web3 (Web3, HTTPProvider), eth_account (Account), json, pathlib.\n"
        "• Core Functions & Logic:\n"
        "  - pack_condition(temp, humidity, lat, lon, flags): Bit-packs 5 sensor metrics into a single 256-bit unsigned integer (uint256) using bitwise shifts (<<) and bitwise OR (|), enabling 1-slot SSTORE gas optimization.\n"
        "  - record_condition_on_chain(...): Loads the deployer private key, estimates gas, signs the raw transaction, and invokes ColdChainMonitor.recordConditionPacked().\n"
        "  - transfer_custody(...): Interacts with CustodyTransfer.sol to advance batch states forward while enforcing strict role permissions."
    )

    add_h3(doc, "backend/db.py — Database Engine & Schema Definitions")
    add_para(
        doc,
        "• Key Imports: sqlite3, pathlib, contextlib.\n"
        "• Core Functions & Tables:\n"
        "  - init_db(): Initializes relational tables: 'readings' (raw telemetry storage), 'batches' (produce metadata), 'quarantine' (quarantined records), and 'audit_trail' (SHA-256 hash links).\n"
        "  - get_connection(): Thread-safe SQLite connection factory with row-factory mappings.\n"
        "  - reset_system_data(): Resets demonstrator state for clean faculty presentations."
    )

    add_h2(doc, "3.2 AI Trust Layer Microservices (trust-layer/app/)")
    
    add_h3(doc, "trust-layer/app/services/plausibility.py — Deterministic Physics Engine")
    add_para(
        doc,
        "• Function run_plausibility_checks(current, previous, is_transit):\n"
        "  - Evaluates temperature rate of change: |current.temp - previous.temp| / elapsed_min <= 1.5°C/min.\n"
        "  - Evaluates humidity rate of change: |current.hum - previous.hum| / elapsed_min <= 5.0%/min.\n"
        "  - Implements the Haversine formula to calculate great-circle distance over GPS coordinates and enforces velocity <= 120 km/h.\n"
        "  - Refined to ensure benign ambient fluctuations within configured crop thresholds do not generate false rejections."
    )

    add_h3(doc, "trust-layer/app/services/anomaly_detector.py — Isolation Forest ML Engine")
    add_para(
        doc,
        "• Class AnomalyDetectorWrapper (Scikit-Learn IsolationForest):\n"
        "  - Initialized with hyperparameters: n_estimators=100, contamination=0.05, max_samples=256.\n"
        "  - Uses recursive random feature partitioning. Points isolated at shallow tree path lengths are classified as anomalies.\n"
        "  - Emits anomaly boolean flag and normalized continuous anomaly score in [0.0, 1.0]."
    )

    add_h3(doc, "trust-layer/app/services/policy.py — Dynamic Biological Crop Policy")
    add_para(
        doc,
        "• Function get_crop_policy(crop_type):\n"
        "  - Retrieves biological limits: Tomato (2.0°C–8.0°C, Spoilage > 15.0°C), Mango (10.0°C–15.0°C), Milk (1.0°C–4.0°C), Grains (15.0°C–25.0°C).\n"
        "  - Supports exact and substring matching with standardized fallback profiles for unknown cultivars."
    )

    add_h3(doc, "trust-layer/app/services/integrity.py — Cryptographic Authenticator")
    add_para(
        doc,
        "• Function verify_telemetry_integrity(payload, registered_sensor_address):\n"
        "  - Recovers the public key from the ECDSA secp256k1 signature and verifies sensor hardware ownership.\n"
        "  - Rejects stale or duplicate packets to prevent replay attacks."
    )

    add_h3(doc, "trust-layer/app/services/audit.py — IsoLog SHA-256 Hash Chainer")
    add_para(
        doc,
        "• Class AuditService:\n"
        "  - Implements off-chain Merkle/chain hashing: entry_hash = SHA256(prev_hash + reading_id + fault_reasons + timestamp).\n"
        "  - Mathematically proves that quarantined incident logs have not been altered or deleted after the fact."
    )

    add_h2(doc, "3.3 Smart Contract Architecture (contracts/contracts/)")
    
    add_h3(doc, "ProductRegistry.sol (RBAC & Identity)")
    add_para(
        doc,
        "• Solidity ^0.8.28; inherits OpenZeppelin AccessControl and Pausable.\n"
        "• Functions: registerBatch(), setBatchDocumentUri(), getBatch().\n"
        "• Restricts batch registration strictly to accounts holding FARMER_ROLE. Anchors IPFS document CIDs (bytes32) permanently on-chain."
    )

    add_h3(doc, "CustodyTransfer.sol (Forward-Only State Machine & Escrow)")
    add_para(
        doc,
        "• Governs strict sequential lifecycle transitions: REGISTERED (0) -> IN_TRANSIT (1) -> IN_STORAGE (2) -> AT_RETAIL (3) -> SOLD (4).\n"
        "• Functions: initializeCustody(), transferCustody(). Reverts on backward transitions or unauthorized callers.\n"
        "• Records stage price additions, establishing an immutable fair price distribution trail from farmer to retail."
    )

    add_h3(doc, "ColdChainMonitor.sol (Bit-Packed Telemetry & SLA Engine)")
    add_para(
        doc,
        "• Stores bit-packed condition words submitted by the authorized ORACLE_ROLE.\n"
        "• Functions: recordConditionPacked(), recordConditionsBatchPacked(), getConditionPacked().\n"
        "• Dynamic SLA Calculation: Checks continuous excursion durations against policy limits; logs penalties against carrier escrow payouts."
    )

    add_h3(doc, "PolicyConfig.sol & AccessControlRoles.sol")
    add_para(
        doc,
        "• PolicyConfig.sol: Decoupled on-chain crop policy registry allowing authorized agronomists to update biological temperature bounds without redeploying logic contracts.\n"
        "• AccessControlRoles.sol: Defines standardized role constants (DEFAULT_ADMIN_ROLE, FARMER_ROLE, LOGISTICS_ROLE, RETAILER_ROLE, ORACLE_ROLE)."
    )

    # ==========================================
    # SECTION 4: TECHNICAL DEEP-DIVES & GAS OPTIMIZATION
    # ==========================================
    add_h1(doc, "Section 4: Technical Deep-Dives, Mathematical Models & Gas Optimization")
    
    add_h2(doc, "4.1 The Blockchain Oracle Dilemma (GIGO)")
    add_para(
        doc,
        "Blockchains provide absolute immutability and decentralized consensus, but they are blind to the physical world outside their virtual machine. "
        "This architectural vulnerability is known as the Garbage-In, Garbage-Out (GIGO) Oracle Problem. If a corrupted, drifted, or malicious IoT sensor "
        "submits false temperature readings, the blockchain faithfully commits that falsehood forever. AgriChain solves this by placing an AI Trust Layer "
        "as an off-chain pre-oracle gatekeeper, ensuring only mathematically and physically verified data ever reaches the ledger."
    )
    
    add_h2(doc, "4.2 Isolation Forest Mathematical Formulation")
    add_para(
        doc,
        "The Isolation Forest operates on the principle that anomalies are few and structurally divergent. In an ensemble of Isolation Trees (iTrees), "
        "anomalies require very few random splits to become isolated in terminal nodes. The anomaly score s(x, n) is defined as:"
    )
    add_callout(
        doc,
        "Anomaly Score Formula:  s(x, n) = 2^(-E(h(x)) / c(n))\n\n"
        "Where h(x) is the path length in a tree, E(h(x)) is the average path length across 100 trees, and c(n) is the average path length "
        "of unsuccessful searches in a Binary Search Tree:\n"
        "c(n) = 2 * ln(n - 1) + 0.5772156649 (Euler's Constant) - (2 * (n - 1) / n)\n\n"
        "Decision Criteria: If s -> 1.0 (E(h(x)) -> 0), the reading is a definite anomaly. If s < 0.5, the reading is normal.",
        "Mathematical Model: Isolation Forest Path Length"
    )

    add_h2(doc, "4.3 Single-Slot Bitwise Packed Struct (58% Gas Reduction)")
    add_para(
        doc,
        "In Ethereum, modifying an uninitialized storage slot (SSTORE) costs 20,000 gas. Storing 5 individual variables (timestamp, temperature, "
        "humidity, latitude, longitude) across separate 256-bit slots costs over 105,000 gas per reading, making cold-chain tracking economically non-viable. "
        "AgriChain packs all 5 parameters into a single 256-bit word:"
    )
    
    headers_struct = ["Bit Range", "Field Name", "Solidity Type", "Precision / Representation"]
    rows_struct = [
        ["Bits [0 - 63] (64 bits)", "timestamp", "uint64", "Unix epoch timestamp in seconds."],
        ["Bits [64 - 79] (16 bits)", "temp_deci_c", "int16", "Temperature in deci-degrees Celsius (e.g. 4.5°C = 45)."],
        ["Bits [80 - 95] (16 bits)", "humidity_deci_pct", "uint16", "Humidity in deci-percent (e.g. 88.5% = 885)."],
        ["Bits [96 - 127] (32 bits)", "latitude", "uint32", "Micro-degrees (degrees * 10^6)."],
        ["Bits [128 - 159] (32 bits)", "longitude", "uint32", "Micro-degrees (degrees * 10^6)."],
        ["Bits [160 - 167] (8 bits)", "flags", "uint8", "Bitmask: Bit 0 = Breach, Bit 1 = Replay, Bit 2 = Quarantined."],
        ["Bits [168 - 255] (88 bits)", "reserved", "uint88", "Allocated for future protocol expansion."]
    ]
    add_styled_table(doc, headers_struct, rows_struct, col_widths=[1.5, 1.3, 1.1, 2.77])
    add_para(doc, "Impact: Batched writes execute at ~43,570 gas per reading, delivering a 58.5% reduction in blockchain transaction costs.")

    add_h2(doc, "4.4 Strict Zero Floating-Point Rule")
    add_para(
        doc,
        "Neither the Ethereum Virtual Machine (EVM) nor Solidity supports IEEE 754 floating-point operations. Using floats in Python or JavaScript "
        "creates rounding discrepancies and potential financial exploit vectors. AgriChain strictly enforces fixed-point integer scaling:\n"
        "• Currency: Stored strictly as integer paise (1 INR = 100 paise). A price of INR 25.50 is stored as 2550.\n"
        "• Temperature: Stored strictly as integer deci-degrees Celsius (1°C = 10 deci-°C). A temperature of 4.5°C is stored as 45."
    )

    # ==========================================
    # SECTION 5: COMPREHENSIVE VIVA VOCE Q&A
    # ==========================================
    add_h1(doc, "Section 5: Comprehensive Viva Voce Examination Q&A")
    add_para(doc, "Below are 8 core questions frequently asked by external university examiners, accompanied by structured, high-scoring technical answers.")

    qa_list = [
        ("Q1: Why do we need an AI Trust Layer if the blockchain is already immutable?",
         "Blockchain guarantees data immutability, but NOT data truthfulness. This is the classic Oracle Problem (Garbage-In, Garbage-Out). If a faulty or tampered IoT sensor transmits a falsified reading of 4°C when food is spoiling at 25°C, the blockchain will faithfully record that lie permanently. Our AI Trust Layer serves as a pre-oracle gatekeeper, validating physical plausibility and ML anomaly scores to quarantine bad data before it ever reaches the ledger."),
        
        ("Q2: Why did you choose Isolation Forest instead of Deep Learning (LSTM, Autoencoder, or CNN)?",
         "Three critical engineering justifications: (1) Unsupervised Nature: Anomalies in cold-chain logistics are rare, diverse, and lack massive labeled training datasets. Isolation Forest requires no labeled anomaly ground truth. (2) Real-Time Latency: Deep learning inference introduces significant latency and requires GPU acceleration. Isolation Forest executes in under 15ms on standard CPU hardware. (3) Linear Complexity O(n): It scales linearly with sample size, making it suitable for high-frequency IoT streaming gateways."),
        
        ("Q3: Why not run the AI model directly inside the Solidity smart contract on-chain?",
         "Running machine learning on-chain is economically and technically impossible: (1) Gas Costs: Iterating through 100 decision trees in EVM opcodes would cost thousands of dollars per reading. (2) Lack of Floating-Point Math: The EVM lacks hardware floating-point instructions required for logarithmic path calculations. (3) Latency: Blockchain transaction block finality takes seconds or minutes, while IoT ingestion requires sub-second responses."),
        
        ("Q4: How does the system defend against sensor spoofing or replay attacks?",
         "Through a three-layer defense: (1) Strictly Monotonic Timestamps: Every incoming reading must have a timestamp strictly greater than the preceding reading (t_k > t_{k-1}); stale packets are dropped. (2) ECDSA Hardware Signatures: Readings are signed using the sensor's secure hardware key; the backend recovers the signer address via eth-account. (3) Haversine Kinematic Checks: Replaying historical coordinates from another region triggers our velocity check (> 120 km/h), quarantining the packet for impossible teleportation."),
        
        ("Q5: What happens if a critical vulnerability is discovered in your deployed smart contracts?",
         "We integrated the OpenZeppelin Pausable Circuit Breaker pattern across our contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor). An authorized administrator can execute an emergency pause, instantly freezing custody handoffs and escrow releases while preserving state integrity until an audit or contract upgrade is completed."),
        
        ("Q6: Why is farmer payment calculated in paise rather than Ether or ERC-20 tokens?",
         "Agricultural producers operating in rural regions cannot absorb cryptocurrency volatility. A drop in ETH price between harvest and delivery would bankrupt a farmer. By calculating escrow settlements in integer paise (1 INR = 100 paise), we guarantee deterministic, fiat-equivalent compensation with zero floating-point rounding errors and zero currency risk."),
        
        ("Q7: How do you handle cold-chain SLA penalties automatically?",
         "ColdChainMonitor.sol continuously evaluates verified temperatures against the biological limits configured in PolicyConfig.sol. If temperature exceeds allowable thresholds for more than 15 consecutive minutes, the contract automatically records a thermal breach and deducts a dynamic financial penalty from the carrier's escrow payout upon delivery."),
        
        ("Q8: How does a consumer verify the authenticity of a produce batch?",
         "Consumers scan a QR code printed on the packaging using their mobile device. The QR code deep-links to our public Consumer Provenance Portal, querying the blockchain to render the complete 5-stage geographical timeline, temperature history, dynamic freshness grade (A+), fair price distribution per kg, and cryptographic digital certificate anchored to IPFS.")
    ]

    for q, a in qa_list:
        add_h2(doc, q)
        add_para(doc, a, bold_prefix="Answer: ", space_after=8)

    # ==========================================
    # SECTION 6: QUICK CODE LOCATION CHEAT SHEET
    # ==========================================
    add_h1(doc, "Section 6: Quick Code Location Cheat Sheet ('Where is it in the code?')")
    add_para(doc, "Use this cheat sheet during viva demonstrations when the examiner asks to inspect specific implementation code:")
    
    headers_cheat = ["Technical Concept", "File Path in Codebase", "Function / Class Name", "Key Logic Inspected"]
    rows_cheat = [
        ["Isolation Forest ML", "trust-layer/app/services/anomaly_detector.py", "AnomalyDetectorWrapper", "Scikit-Learn IsolationForest(n_estimators=100, contamination=0.05)."],
        ["Thermal Physics Rules", "trust-layer/app/services/plausibility.py", "run_plausibility_checks()", "Checks |ΔT/Δt| <= 1.5°C/min, humidity rate, and Haversine velocity."],
        ["Crop Biological Policies", "trust-layer/app/services/policy.py", "get_crop_policy()", "Biological temperature thresholds for tomatoes, mangoes, milk, etc."],
        ["ECDSA Hardware Signature", "trust-layer/app/services/integrity.py", "verify_telemetry_integrity()", "Recovers public address via eth-account and validates monotonic timestamps."],
        ["SHA-256 IsoLog Hash Chain", "trust-layer/app/services/audit.py", "AuditService.record_quarantine()", "entry_hash = SHA256(prev_hash + reading_id + fault_reasons + timestamp)."],
        ["Bitwise Struct Packing", "backend/chain.py", "pack_condition()", "Packs 5 variables into 256 bits via bitwise shifts (<<) and bitwise OR (|)."],
        ["Web3 Blockchain Dispatch", "backend/chain.py", "record_condition_on_chain()", "Dispatches signed transactions to ColdChainMonitor.sol on EVM."],
        ["Forward Custody FSM", "contracts/contracts/CustodyTransfer.sol", "transferCustody()", "Enforces REGISTERED -> IN_TRANSIT -> IN_STORAGE -> AT_RETAIL -> SOLD."],
        ["Pausable Circuit Breakers", "contracts/contracts/ProductRegistry.sol", "pause(), unpause()", "OpenZeppelin Pausable emergency circuit breaker toggles."],
        ["Raw Telemetry Database", "backend/db.py", "init_db(), get_connection()", "SQLite schema: readings, batches, quarantine, and audit_trail."],
        ["Live AI Sandbox UI", "frontend/src/Farmer/Views/AITrustView.jsx", "AITrustView component", "Interactive sliders, live Trust Score card, real-time quarantine audit stream."],
        ["Demonstration Scenarios", "frontend/src/components/ShowcaseDrawer.jsx", "ShowcaseDrawer component", "1-click faculty demo lab executing all 5 real-world scenarios."]
    ]
    add_styled_table(doc, headers_cheat, rows_cheat, col_widths=[1.5, 2.1, 1.5, 1.57])

def main():
    print("Generating Word document...")
    doc = init_document()
    build_content(doc)
    doc.save(DOCX_OUT)
    print(f"Word document saved successfully to: {os.path.abspath(DOCX_OUT)} ({os.path.getsize(DOCX_OUT)} bytes)")
    
    print("Converting to PDF via Microsoft Word COM...")
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = False
        
        docx_abs = os.path.abspath(DOCX_OUT)
        pdf_abs = os.path.abspath(PDF_OUT)
        
        doc_obj = word.Documents.Open(docx_abs)
        # 17 = wdExportFormatPDF
        doc_obj.ExportAsFixedFormat(pdf_abs, 17, False, 0, 0, 1, 1, 0, True, True, 0, True, True, False)
        doc_obj.Close(False)
        word.Quit()
        pythoncom.CoUninitialize()
        print(f"PDF document saved successfully to: {pdf_abs} ({os.path.getsize(pdf_abs)} bytes)")
    except Exception as e:
        print(f"Error during PDF conversion: {e}")

if __name__ == "__main__":
    main()

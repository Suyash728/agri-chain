# scripts/section_chapter_4.py
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from scripts.report_helpers import add_h1, add_h2, add_h3, add_para, add_bullet, add_figure, add_styled_table
import scripts.report_data as rd

def build_chapter_4(doc):
    # ==========================================
    # CHAPTER 4: METHODOLOGY AND SYSTEM DESIGN
    # ==========================================
    add_h1(doc, "Chapter 4: Proposed Methodology and System Design")
    
    add_h2(doc, "4.1 System Overview and 5-Tier Architecture")
    add_para(
        doc,
        "The proposed AgriChain platform is engineered as a robust, highly modular 5-tier architecture that decouples "
        "physical data capture, intelligent pre-commit validation, decentralized ledger persistence, off-chain storage, "
        "and client-side user experience. By decomposing operational responsibilities into discrete, loosely coupled layers, "
        "the system achieves exceptional horizontal scalability, strict failure domain isolation, and high cryptographic security. "
        "Figure 4.1 illustrates the comprehensive 5-tier architecture of the platform."
    )
    
    add_figure(
        doc,
        "extracted_docx_images/image_12_image4.png",
        "Figure 4.1: Four-Tier System Architecture of the AgriChain Platform",
        width_in=5.8,
        desc_text="The 5-tier architecture orchestrates data transformation and state transitions across the following layers:"
    )
    
    add_bullet(doc, "Tier 1: IoT Sensing & Edge Simulation Layer: Captures high-frequency ambient physical conditions via hardware ESP32 microcontrollers and a high-fidelity Python telemetry simulation engine. Monitored variables include ambient temperature (°C), relative humidity (%), GPS geographical coordinates (latitude and longitude), device identifiers, and monotonic hardware timestamps. Telemetry packets are serialized as encrypted JSON payloads and transmitted over HTTPS/REST to the backend ingestion gateway.", "• ")
    add_bullet(doc, "Tier 2: AI Trust Layer (FastAPI Ingestion Engine): Serves as an intelligent, pre-commit gatekeeper executing off-chain validation prior to blockchain submission. The engine executes a 7-stage verification pipeline comprising strict Pydantic v2 schema enforcement, physical and temporal plausibility bounding, dynamic crop policy threshold compliance, 11-dimensional feature extraction, unsupervised Isolation Forest anomaly scoring, and SHA-256 event fingerprinting. Readings exhibiting sensor freezes, thermal breaches, or replay signatures are isolated into a cryptographic quarantine ledger without consuming gas.", "• ")
    add_bullet(doc, "Tier 3: Blockchain & Smart Contract Layer (Polygon Amoy / Hardhat): Executes decentralized state transitions and enforces immutable business logic via four modular Solidity 0.8.28 contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig). Built upon audited OpenZeppelin v5.0 primitives, this tier integrates Role-Based Access Control (RBAC) and Pausable emergency circuit breakers. Environmental conditions are persisted using a novel bitwise single-slot packed struct, achieving massive gas reductions.", "• ")
    add_bullet(doc, "Tier 4: Off-Chain Storage & Decentralized Assets Layer: Integrates a high-performance dual-engine relational database—PostgreSQL (Supabase IPv4 Pooler) for rapid indexed querying and SQLite with Write-Ahead Logging (WAL) for local transactions. Unstructured quality certificates and inspection laboratory documents are pinned to IPFS via the Pinata Gateway, returning immutable Content Identifiers (CIDs) anchored on-chain. This tier also hosts the unbroken SHA-256 Quarantine Hash-Chain.", "• ")
    add_bullet(doc, "Tier 5: Multi-Role Presentation Layer: A modern, responsive React 18 single-page application built with Vite and Tailwind CSS. Provides tailored, role-authenticated interfaces for Farmers, Logistics Transporters, Dark-Store Hub Operators, and System Administrators, alongside a publicly accessible mobile-responsive Consumer Provenance Portal supporting instant QR code batch verification.", "• ")

    add_h2(doc, "4.2 Operational Flowchart of Proposed Methodology")
    add_para(
        doc,
        "The operational lifecycle of produce batches follows a deterministic, forward-only progression ensuring that physical product "
        "movement, IoT sensory surveillance, AI verification, and financial handoffs are synchronized across all actors. "
        "Figure 4.2 presents the complete operational flowchart of the proposed methodology from harvest registration to consumer checkout."
    )
    
    add_figure(
        doc,
        "extracted_ppt_assets/slide_15_img_2.png",
        "Figure 4.2: Operational Flowchart of the Proposed Methodology",
        width_in=5.8,
        desc_text="The end-to-end operational lifecycle unfolds across seven distinct procedural phases:"
    )
    
    add_bullet(doc, "Phase 1: Produce Registration: The farmer authenticates via the Farmer Portal and inputs crop cultivar, quantity in kg, farm GPS location, and base gate price in integer paise. The ProductRegistry smart contract mints an immutable on-chain batch record, and the frontend dynamically generates a high-resolution QR code.", "1. ")
    add_bullet(doc, "Phase 2: IoT Surveillance Initiation: When the batch is loaded onto a refrigerated transport vehicle, an edge IoT sensor node is paired with the batch ID, streaming environmental telemetry packets at regular temporal intervals (e.g., every 30 seconds).", "2. ")
    add_bullet(doc, "Phase 3: Pre-Commit AI Auditing: The FastAPI AI Trust Layer intercepts incoming telemetry packets and executes the 7-stage validation pipeline, evaluating statistical plausibility, crop thermal limits, and Isolation Forest anomaly scores.", "3. ")
    add_bullet(doc, "Phase 4: Cryptographic Routing & Persistence: If validated, telemetry is written to relational storage and queued for packed on-chain condition logging. If anomalous, the reading is appended to the SHA-256 Quarantine Hash Chain, and warning flags are raised.", "4. ")
    add_bullet(doc, "Phase 5: Custody Transfer & Price Accumulation: Upon physical arrival at the dark-store distribution hub, the logistics driver initiates a custody transfer. The dark-store operator verifies physical seal integrity, records their handling fee, and confirms acceptance, advancing the batch state from IN_TRANSIT to IN_STORAGE.", "5. ")
    add_bullet(doc, "Phase 6: Quality Inspection & IPFS Pinning: Quality assurance personnel conduct physical grading and upload certified laboratory inspection documents to IPFS, anchoring the resulting CID to the smart contract.", "6. ")
    add_bullet(doc, "Phase 7: Consumer Provenance Verification: At the point of retail purchase, the consumer scans the product QR code, retrieving the complete farm-to-fork geographical journey, dynamic freshness grade (A+ to F), verified price breakdown, and IPFS laboratory certificates.", "7. ")

    add_h2(doc, "4.3 Data Flow Analysis")
    add_para(
        doc,
        "Data flow diagrams (DFD) provide a structured graphical representation of information transit, process transformations, "
        "and data stores governing the AgriChain ecosystem across Context Level 0 and Complete System Level 1."
    )
    
    add_h3(doc, "4.3.1 DFD Level 0: Context Diagram")
    add_para(
        doc,
        "The Context Diagram (Level 0) defines the overall system boundary, illustrating the external entities that interact "
        "with the core AgriChain processing engine, along with the primary data inflows and outflows. "
        "Figure 4.3 illustrates the DFD Level 0 Context Diagram."
    )
    
    add_figure(
        doc,
        "docs/diagrams/dfd/dfd-level-0-context.png",
        "Figure 4.3: Data Flow Diagram (DFD) Level 0: Context Diagram",
        width_in=5.6,
        desc_text="The Context Diagram identifies four primary external entities interacting with the core platform:"
    )
    
    add_bullet(doc, "E1 (IoT Sensors / ESP32 Edge Devices): Transmits raw environmental telemetry payloads comprising temperature, humidity, GPS coordinates, and transmission timestamps to the central ingestion gateway.", "• ")
    add_bullet(doc, "E2 (Supply Chain Actors): Encompasses Farmers, Logistics Fleet Carriers, and Dark Store Operators who submit authentication credentials, batch registration forms, custody handover confirmations, and margin updates.", "• ")
    add_bullet(doc, "E3 (Consumers & Regulators): Queries batch provenance via mobile QR scans, retrieving journey timelines, freshness ratings, fair price trails, and inspection certificates.", "• ")
    add_bullet(doc, "E4 (Polygon Amoy Blockchain & IPFS): Receives role-gated smart contract state modifications, packed condition records, and document CIDs, returning immutable transaction receipts and cryptographic event logs.", "• ")

    add_h3(doc, "4.3.2 DFD Level 1: Complete System Data Flow")
    add_para(
        doc,
        "The Level 1 Data Flow Diagram decomposes the core system into five fundamental subprocesses and five distinct data repositories, "
        "illustrating the precise routing of verified versus quarantined information. Figure 4.4 presents the complete Level 1 DFD."
    )
    
    add_figure(
        doc,
        "docs/diagrams/dfd/dfd-level-1-complete.png",
        "Figure 4.4: Data Flow Diagram (DFD) Level 1: Complete System Data Flow",
        width_in=5.8,
        desc_text="The Level 1 diagram details the flow of data across five primary functional processes:"
    )
    
    add_bullet(doc, "Process 1.0 (Telemetry Ingestion & AI Trust Validation): Ingests raw sensor streams from E1, queries dynamic crop thresholds from Data Store D5 (Policy Cache), extracts statistical features, executes Isolation Forest evaluation, and bifurcates data into verified streams or quarantine records.", "• ")
    add_bullet(doc, "Process 2.0 (Smart Contract & Blockchain Relaying): Packs verified telemetry into single-slot bitwise representations, signs transactions via backend relayer accounts, and commits updates to Data Store D3 (Polygon Blockchain).", "• ")
    add_bullet(doc, "Process 3.0 (Off-Chain Storage & Quarantine Engine): Writes raw readings and state events to Data Store D1 (PostgreSQL/SQLite Relational DB) while cryptographically linking anomalous readings into Data Store D2 (Quarantine Hash Chain).", "• ")
    add_bullet(doc, "Process 4.0 (Multi-Actor Dashboard & Access Control): Authenticates supply chain actors (E2), validates RBAC roles, coordinates custody transfers, and pins uploaded inspection documents to Data Store D4 (IPFS Document Pins).", "• ")
    add_bullet(doc, "Process 5.0 (Consumer Provenance Verification): Resolves batch queries from consumers (E3), fetches on-chain custody states and price trails from D3, retrieves journey telemetry from D1, verifies IPFS certificates from D4, and computes dynamic freshness grades.", "• ")

    add_h2(doc, "4.4 Database Design and Entity-Relationship Modeling")
    add_para(
        doc,
        "The platform relies on a normalized relational database schema designed to mirror on-chain smart contract state while "
        "providing microsecond-level query responsiveness for complex frontend dashboards and geographical visualization. "
        "Figure 4.5 illustrates the Entity-Relationship Diagram (ERD) defining relational entities and foreign key constraints."
    )
    
    add_figure(
        doc,
        "extracted_ppt_assets/slide_23_img_6.png",
        "Figure 4.5: Entity-Relationship Diagram (ERD) of AgriChain Relational and On-Chain Schema",
        width_in=5.8,
        desc_text="The database architecture is formalized across seven core relational entities:"
    )
    
    add_bullet(doc, "USER / ACTOR (user_id PK, wallet_address, role_enum, full_name, email, organization_name, created_at): Stores stakeholder credentials, cryptographic wallet addresses, and assigned RBAC permissions.", "• ")
    add_bullet(doc, "BATCH (batch_id PK, crop_name, quantity_kg, farm_location, base_price_paise, current_holder_id FK, current_status_enum, contract_batch_id, created_at): Maintains core produce identity and current lifecycle status.", "• ")
    add_bullet(doc, "CUSTODY_EVENT (event_id PK, batch_id FK, from_holder_id FK, to_holder_id FK, event_type, transaction_hash, actor_price_paise, cumulative_price_paise, timestamp): Immutably logs each custody transition and price increment.", "• ")
    add_bullet(doc, "READING (reading_id PK, batch_id FK, temperature_deci_c, humidity_pct, latitude, longitude, trust_score, is_anomalous, validation_verdict, timestamp): Persists high-resolution IoT environmental telemetry.", "• ")
    add_bullet(doc, "QUARANTINE_LOG (log_id PK, reading_id FK, reason_code, anomaly_score, previous_hash, current_hash, is_verified, timestamp): Houses cryptographically chained rejected sensor data for forensic auditing.", "• ")
    add_bullet(doc, "POLICY (policy_id PK, crop_name, min_temp_deci_c, max_temp_deci_c, min_humidity_pct, max_humidity_pct, max_excursion_minutes): Encapsulates cultivar-specific environmental bounds governing automated compliance.", "• ")
    add_bullet(doc, "BATCH_DOCUMENT (doc_id PK, batch_id FK, doc_type, ipfs_cid, sha256_hash, upload_timestamp): Tracks decentralized laboratory quality certificates pinned to IPFS.", "• ")

    add_h3(doc, "4.4.1 Tamper-Evident SHA-256 Quarantine Hash-Chain Algorithm")
    add_para(
        doc,
        "To guarantee that rejected sensor telemetry cannot be retroactively purged or modified by malicious database administrators, "
        "the quarantine repository is implemented as an unbroken SHA-256 cryptographic hash-chain. The genesis block is initialized "
        "with an arbitrary 32-byte zero-digest: $H_0 = \text{0x000...0}$. For every subsequent anomalous reading $k \ge 1$, "
        "the block digest $H_k$ is computed recursively as follows:"
    )
    add_para(
        doc,
        "H_k = \text{SHA-256}\Big( H_{k-1} \parallel \text{reading\_id}_k \parallel \text{batch\_id}_k \parallel \theta_k \parallel \phi_k \parallel \text{reason\_code}_k \parallel \tau_k \Big)",
        align=WD_ALIGN_PARAGRAPH.CENTER
    )
    add_para(
        doc,
        "where $\parallel$ denotes byte-level string concatenation, $\theta_k$ represents temperature in deci-degrees Celsius, "
        "$\phi_k$ represents humidity percentage, and $\tau_k$ represents the ISO-8601 timestamp. If any adversary alters a historical "
        "quarantined reading $j$ (where $j < k$), the digest $H_j$ becomes invalid, breaking the cryptographic continuity of all subsequent "
        "blocks $H_{j+1}, \dots, H_k$. The platform includes an automated verification endpoint (`/admin/quarantine/verify`) that audits "
        "the entire chain in $O(k)$ time, detecting any data corruption within milliseconds."
    )

    add_h2(doc, "4.5 Use Case Analysis and Role Governance")
    add_para(
        doc,
        "The platform establishes strict separation of duties governed by OpenZeppelin AccessControl on-chain and role-authenticated "
        "sessions off-chain. Figure 4.6 illustrates the comprehensive Use Case Diagram for the multi-stakeholder ecosystem."
    )
    
    add_figure(
        doc,
        "extracted_ppt_assets/slide_25_img_7.png",
        "Figure 4.6: Use Case Diagram for AgriChain Multi-Stakeholder Ecosystem",
        width_in=5.8,
        desc_text="The Use Case Diagram defines the operational privileges assigned to each system actor:"
    )
    
    add_bullet(doc, "Farmer Actor: Executes 'Register Produce Batch', 'Configure Base Price', 'Inspect IoT Telemetry', 'View Cold Chain Checkpoints', and 'Generate Traceability QR Code'.", "• ")
    add_bullet(doc, "Logistics Partner Actor: Executes 'Accept Transit Shipment', 'Update Highway GPS Corridor', 'Monitor Reefer Temperature', and 'Confirm Custody Handover to Dark Store'.", "• ")
    add_bullet(doc, "Dark Store Operator Actor: Executes 'Receive Inbound Shipment (GRN)', 'Allocate Climate Storage Bay', 'Conduct Quality Inspection', and 'Process Retail Checkout'.", "• ")
    add_bullet(doc, "Consumer Actor: Executes 'Scan QR Code', 'Inspect Farm-to-Fork Journey', 'Verify Quality Certificates', 'Inspect Fair Price Breakdown', and 'Submit Verified Review'.", "• ")
    add_bullet(doc, "System Administrator: Executes 'Grant / Revoke Smart Contract Roles', 'Trigger Emergency Circuit Breaker Pause/Unpause', and 'Verify Quarantine Hash-Chain Integrity'.", "• ")

    add_h2(doc, "4.6 AI-Based Trust Layer Pipeline")
    add_para(
        doc,
        "The AI Trust Layer represents the core algorithmic innovation of AgriChain, eliminating the vulnerability of streaming "
        "unverified sensor readings directly to immutable distributed ledgers. The validation pipeline executes a 7-stage pre-commit "
        "auditing sequence:"
    )
    add_bullet(doc, "Stage 1 (Strict Schema & Type Enforcement): Validates incoming JSON payloads against strict Pydantic schemas, verifying field presence, non-null constraints, and correct data types.", "• ")
    add_bullet(doc, "Stage 2 (Physical & Temporal Plausibility): Ensures temperature falls within absolute terrestrial limits (-40°C to +70°C), humidity within (0% to 100%), and timestamps satisfy strictly increasing monotonicity $\tau_k > \tau_{k-1}$.", "• ")
    add_bullet(doc, "Stage 3 (Dynamic Crop Policy Compliance): Compares instantaneous readings against cultivar-specific thermal envelopes (e.g., +10°C to +15°C for tomatoes), calculating accumulated Degree-Minutes above threshold.", "• ")
    add_bullet(doc, "Stage 4 (11-Dimensional Feature Engineering): Computes eleven statistical and temporal indicators: raw temperature, raw humidity, 10-reading rolling mean, rolling standard deviation, exponential weighted moving average (EWMA), temperature derivative $\Delta \theta / \Delta t$, humidity derivative $\Delta \phi / \Delta t$, thermal excursion integral, Haversine GPS transit velocity, transmission latency gap, and variance ratio.", "• ")
    add_bullet(doc, "Stage 5 (Unsupervised Isolation Forest Scoring): Evaluates an ensemble of 100 isolation trees. The anomaly score $s(x, n)$ is derived from the average path depth $E(h(x))$ required to isolate observation $x$ across $n$ samples: $s(x, n) = 2^{-E(h(x)) / c(n)}$. Observations with $s > 0.60$ are classified as anomalies.", "• ")
    add_bullet(doc, "Stage 6 (SHA-256 Fingerprinting & Replay Defense): Computes a payload hash to detect identical duplicate packets transmitted within short intervals, defending against telemetry replay attacks.", "• ")
    add_bullet(doc, "Stage 7 (Verdict Generation & Cryptographic Routing): Assigns a final verdict: PASS (relayed to blockchain and relational store) or REJECT (routed to the cryptographic quarantine hash chain).", "• ")

    add_h2(doc, "4.7 Modular Smart Contracts and Circuit Breakers")
    add_para(
        doc,
        "To achieve maximum gas efficiency, maintainability, and security, the on-chain logic is partitioned across four modular "
        "Solidity 0.8.28 contracts deploying OpenZeppelin AccessControl and Pausable circuit breakers:"
    )
    add_bullet(doc, "ProductRegistry.sol: Restricts batch minting to verified FARMER_ROLE addresses. Immutably records batch ID, crop name, harvest timestamp, quantity, and initial farm coordinates.", "• ")
    add_bullet(doc, "CustodyTransfer.sol: Enforces strictly forward-only custody transitions (REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD). Rejects unauthorized actor handoffs and atomically updates the cumulative price trail in integer paise.", "• ")
    add_bullet(doc, "ColdChainMonitor.sol: Records environmental telemetry using a single-slot packed struct. Emits TelemetryLogged events and tracks compliance status.", "• ")
    add_bullet(doc, "PolicyConfig.sol: Manages on-chain crop policy definitions, allowing authorized administrators to update environmental bounds for new cultivars without redeploying core contracts.", "• ")

    add_h3(doc, "4.7.1 Bitwise Single-Slot Packed Struct Optimization")
    add_para(
        doc,
        "On Ethereum Virtual Machine (EVM) blockchains, storage operations (`SSTORE`) represent the most expensive opcode, costing "
        "20,000 gas to initialize an empty 256-bit storage slot and 5,000 gas to modify an existing slot. Standard naive Solidity "
        "implementations store temperature, humidity, coordinates, and timestamps as separate `uint256` variables, consuming "
        "multiple storage slots per reading. In AgriChain, we engineered a bitwise packed `ConditionRecord` struct that fits "
        "entirely within a single 256-bit storage word:"
    )
    add_bullet(doc, "uint64 timestamp: 64 bits representing Unix epoch in seconds (valid for billions of years).", "• ")
    add_bullet(doc, "int16 tempDeciC: 16 bits representing temperature in deci-degrees Celsius (-3276.8°C to +3276.7°C, 0.1°C resolution).", "• ")
    add_bullet(doc, "uint16 humidityPct: 16 bits representing relative humidity in basis points (0 to 10,000 = 0.00% to 100.00%).", "• ")
    add_bullet(doc, "int32 latitudeScaled: 32 bits representing GPS latitude multiplied by 10^6 (micro-degree precision ≈ 11 cm).", "• ")
    add_bullet(doc, "int32 longitudeScaled: 32 bits representing GPS longitude multiplied by 10^6.", "• ")
    add_bullet(doc, "uint16 aiTrustScore: 16 bits representing AI confidence (0 to 1,000 = 0.0% to 100.0%).", "• ")
    add_bullet(doc, "uint8 conditionStatus: 8 bits encoding compliance status (0=NORMAL, 1=WARNING, 2=BREACH).", "• ")
    add_bullet(doc, "uint72 reserved: 72 bits reserved for future cryptographic zk-proof indicators.", "• ")
    add_para(
        doc,
        "Total bit allocation: $64 + 16 + 16 + 32 + 32 + 16 + 8 + 72 = 256$ bits = exactly 1 EVM storage slot! "
        "This structural innovation eliminates secondary `SSTORE` calls, delivering a 52.71% gas reduction under batched updates."
    )

    add_h2(doc, "4.8 Dual Persistence and Decentralized Document Pinning")
    add_para(
        doc,
        "AgriChain combines relational speed with decentralized immutability. High-frequency queries (e.g., rendering real-time "
        "charts on driver dashboards) are serviced by connection-pooled PostgreSQL (Supabase IPv4 Pooler) and transactional SQLite "
        "operating in Write-Ahead Logging (WAL) mode. Conversely, critical compliance assets—such as organic farming certificates, "
        "soil health cards, and pesticide residue gas-chromatography reports—are pinned to the InterPlanetary File System (IPFS) via "
        "the Pinata Gateway. The resulting cryptographic Content Identifiers (CIDs) are permanently anchored onto the `ProductRegistry` "
        "contract, establishing unalterable proof of document authenticity without bloating the blockchain."
    )

    add_h2(doc, "4.9 Software and Hardware Specifications")
    add_para(
        doc,
        "The technical specifications and software stack powering the development, testing, and deployment of the AgriChain platform "
        "are detailed in Table 4.1."
    )
    
    add_styled_table(
        doc,
        rd.TABLE_4_1_HEADER,
        rd.TABLE_4_1_ROWS,
        col_widths=[1.5, 2.3, 2.47],
        caption="Table 4.1: Software and Hardware Requirements Specification"
    )

    add_h2(doc, "4.10 Dynamic Crop Policy Engine")
    add_para(
        doc,
        "Agricultural cultivars exhibit diverse post-harvest physiological characteristics. Table 4.2 outlines the reference thermal "
        "and humidity bounds configured within the Dynamic Crop Policy Engine governing real-time compliance evaluation."
    )
    
    add_styled_table(
        doc,
        rd.TABLE_4_2_HEADER,
        rd.TABLE_4_2_ROWS,
        col_widths=[1.2, 1.2, 1.3, 1.3, 1.27],
        caption="Table 4.2: Crop Policy Reference Thresholds for Cold Chain Monitoring"
    )

    add_h2(doc, "4.11 Project Timeline and Scheduling")
    add_para(
        doc,
        "The project development and empirical validation followed an iterative, milestone-driven engineering schedule spanning "
        "August 2026 to October 2026. Figure 4.7 presents the project implementation Gantt chart."
    )
    
    add_figure(
        doc,
        "extracted_ppt_assets/slide_21_img_5.png",
        "Figure 4.7: Project Timeline and Implementation Gantt Chart",
        width_in=5.8,
        desc_text="The implementation timeline encompasses eight discrete engineering phases:"
    )
    
    add_bullet(doc, "Phase 1 (Aug 1 - Aug 15): Literature review, problem formulation, and system requirements specification.", "• ")
    add_bullet(doc, "Phase 2 (Aug 16 - Aug 31): Smart contract architecture, Solidity development, and Hardhat unit testing.", "• ")
    add_bullet(doc, "Phase 3 (Sep 1 - Sep 15): AI Trust Layer feature engineering, Isolation Forest model training, and schema validation.", "• ")
    add_bullet(doc, "Phase 4 (Sep 16 - Sep 30): FastAPI backend ingestion engine, Web3.py relayer, and dual persistence integration.", "• ")
    add_bullet(doc, "Phase 5 (Oct 1 - Oct 10): React 18 multi-role frontend dashboards, QR generator, and IPFS document pinning.", "• ")
    add_bullet(doc, "Phase 6 (Oct 11 - Oct 18): End-to-end integration, capstone PRD Section 6 automated test suite execution.", "• ")
    add_bullet(doc, "Phase 7 (Oct 19 - Oct 22): Hardware simulation fault injection trials (1,000 runs) and gas benchmarking.", "• ")
    add_bullet(doc, "Phase 8 (Oct 23 - Oct 24): Academic documentation, final report compilation, and project defense preparation.", "• ")

    doc.add_page_break()

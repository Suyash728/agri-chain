# scripts/section_chapters_1_3.py
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from scripts.report_helpers import add_h1, add_h2, add_h3, add_para, add_bullet, add_styled_table
import scripts.report_data as rd

def build_chapters_1_3(doc):
    # ==========================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================
    add_h1(doc, "Chapter 1: Introduction")
    
    add_h2(doc, "1.1 Introduction and Agricultural Context")
    add_para(
        doc,
        "Agriculture forms the primary livelihood for over 54% of India's workforce and contributes approximately 18% to the "
        "national Gross Domestic Product (GDP). Despite its vital importance, the post-harvest supply chain faces severe logistical "
        "inefficiencies, high levels of perishability, and multi-tier intermediary markups. According to reports from the Ministry of "
        "Food Processing Industries (MoFPI) and the Indian Council of Agricultural Research (ICAR), roughly 30% to 40% of fresh fruits "
        "and vegetables spoil before reaching retail markets, resulting in estimated annual post-harvest losses exceeding ₹92,000 crore."
    )
    add_para(
        doc,
        "A major cause of this post-harvest loss is the lack of continuous, reliable cold-chain monitoring during transportation "
        "and warehouse storage. Perishable commodities—including tomatoes, mangoes, leafy vegetables, and dairy—have narrow temperature "
        "tolerances. When temperature control fails during highway transit or at distribution centers, produce spoilage accelerates. "
        "Because traditional supply chain logistics lack automated and verifiable tracking, temperature breaches often go unnoticed "
        "or are concealed by transporters to avoid commercial penalties. As a result, damaged goods frequently reach retail shelves, "
        "leading to food waste and safety risks."
    )
    add_para(
        doc,
        "In addition to cold-chain failures, agricultural marketing suffers from opaque middleman markups. Between the farmer and the "
        "final consumer, goods pass through several intermediaries, including local aggregators, commission agents (arhtiyas), transport "
        "operators, wholesale traders, and retail outlets. Each intermediary adds a margin, yet the purchase prices and operational costs "
        "remain hidden from both farmers and consumers. Consequently, smallholder farmers often receive only 20% to 28% of the final retail "
        "price paid by consumers, despite shouldering production expenses and weather risks. At the same time, consumers pay premium prices "
        "without verifiable confirmation of the harvest date, farming origin, or transit handling conditions."
    )
    add_para(
        doc,
        "Blockchain technology offers a viable approach to address these transparency challenges. By recording custody transfers "
        "and status updates on a decentralized, append-only distributed ledger, blockchain provides a shared, tamper-resistant record "
        "for all participants. Smart contracts further allow deterministic execution of business rules, such as role-gated handovers "
        "and automated compliance checks, without relying on a central intermediary."
    )
    add_para(
        doc,
        "However, applying blockchain directly to sensor-driven supply chains introduces a significant challenge: the 'Garbage In, "
        "Garbage Out' (GIGO) problem. While a blockchain ensures that recorded data cannot be altered after the fact, it cannot verify "
        "whether the ingested data was accurate when submitted. In cold-chain logistics, telemetry streams originating from transit "
        "sensors may contain sudden spikes, communication dropouts, frozen sensor values, or replay attempts. If unverified telemetry "
        "is committed directly to smart contracts, the ledger permanently stores invalid data, leading to incorrect disputes and "
        "unnecessary transaction gas costs. Therefore, an intelligent off-chain filtering layer is necessary to inspect and validate "
        "telemetry before it is committed on-chain."
    )

    add_h2(doc, "1.2 Aim and Motivation of the Project")
    add_para(
        doc,
        "The primary aim of this Major Project is to design, implement, and evaluate AgriChain—a decentralized agricultural supply chain "
        "traceability platform that provides end-to-end provenance, enforces cold-chain compliance through an AI-based Trust Layer, "
        "quarantines anomalous telemetry off-chain, and provides transparent multi-stage price tracking."
    )
    add_para(
        doc,
        "The motivation for this project arises from several key technical and socio-economic challenges in agricultural logistics:"
    )
    add_bullet(doc, "Addressing the Blockchain GIGO Problem: Developing an off-chain AI Trust Layer that screens and validates simulated environmental telemetry before committing updates to public smart contracts.", "1. ")
    add_bullet(doc, "Gas-Efficient Smart Contract Execution: Minimizing Ethereum Virtual Machine (EVM) transaction costs by bitwise packing multiple telemetry fields into a single 256-bit storage slot and supporting batched updates.", "2. ")
    add_bullet(doc, "Tamper-Evident Off-Chain Quarantine: Storing rejected, breached, or anomalous readings in a cryptographic SHA-256 Quarantine Hash Chain, preserving an auditable log without incurring on-chain transaction gas costs.", "3. ")
    add_bullet(doc, "Fair-Share Price Transparency: Recording the farmer's initial price and each intermediary markup on-chain, enabling retail consumers to verify that the farmer received an equitable share of the purchase price.", "4. ")

    add_h2(doc, "1.3 Scope of the Project")
    add_para(
        doc,
        "The functional and architectural scope of the AgriChain platform covers the post-harvest supply chain journey, incorporating "
        "the following components:"
    )
    add_bullet(doc, "Stakeholder Portals: Role-tailored web interfaces for Farmers, Logistics Transporters, Dark Store Operators, Retail Consumers, and System Administrators.", "• ")
    add_bullet(doc, "IoT Telemetry Simulation: A software simulation engine generating realistic ambient temperature (°C), relative humidity (%), simulated GPS route waypoints, and sequential timestamps across transit and storage phases.", "• ")
    add_bullet(doc, "Pre-Commit AI Trust Layer: An off-chain validation pipeline implemented in FastAPI that uses schema validation, plausibility boundaries, dynamic per-crop thermal thresholds, 11-dimensional feature extraction, and an unsupervised Isolation Forest model.", "• ")
    add_bullet(doc, "Modular Smart Contracts: Solidity 0.8.28 contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig) deployed on Polygon Amoy, utilizing OpenZeppelin AccessControl and Pausable circuit breakers.", "• ")
    add_bullet(doc, "Dual Persistence Architecture: PostgreSQL (Supabase IPv4 Pooler) for fast indexed querying, local SQLite for transaction staging, Pinata IPFS for pinning quality inspection certificates, and an append-only SHA-256 quarantine hash-chain.", "• ")
    add_bullet(doc, "Presentation Layer: A responsive React 18 single-page application built with Vite and Tailwind CSS, featuring interactive dashboards, dynamic freshness ratings, QR code scanning, and price journey visualizers.", "• ")

    add_h2(doc, "1.4 Significant Contributions")
    add_para(
        doc,
        "This project presents several practical engineering contributions to decentralized agricultural supply chain architectures:"
    )
    add_bullet(doc, "Pre-Commit AI Trust Validation Pipeline: Developed a 7-stage off-chain screening pipeline that achieved a 97.22% overall F1-score and 100% recall across simulated sensor fault scenarios, preventing invalid data from reaching the ledger.", "1. ")
    add_bullet(doc, "Single-Slot Packed EVM Storage: Engineered a bitwise packed Solidity struct for environmental telemetry that fits into a single 256-bit storage word, achieving a 52.71% gas reduction under batched updates (N=20).", "2. ")
    add_bullet(doc, "Cryptographically Auditable Quarantine Hash Chain: Built an off-chain SHA-256 chained quarantine ledger that maintains an immutable audit trail of rejected readings, thermal breaches, and replay attempts without gas overhead.", "3. ")
    add_bullet(doc, "Dynamic Crop Policy Engine: Implemented configurable thermal envelopes for diverse crop varieties (e.g., tomato, mango, wheat), replacing rigid global thresholds with per-crop compliance monitoring.", "4. ")
    add_bullet(doc, "Transparent Cumulative Price Trail: Established an on-chain accounting mechanism that records each actor's price margin during custody handovers, allowing consumers to verify a 50.0% farmer revenue share.", "5. ")
    add_bullet(doc, "Role-Based Access Control and Circuit Breakers: Integrated OpenZeppelin AccessControl for role separation and emergency pause mechanisms to halt state transitions during detected irregularities.", "6. ")
    add_bullet(doc, "Comprehensive End-to-End System Verification: Conducted automated testing across 10 multi-actor integration test cases and 1,000 simulated telemetry cycles, validating system reliability and data flow consistency.", "7. ")

    add_h2(doc, "1.5 Organization of the Report")
    add_para(
        doc,
        "The remainder of this report is organized as follows:"
    )
    add_bullet(doc, "Chapter 2 (Literature Review): Surveys existing research in blockchain traceability, AI/ML anomaly detection, edge telematics security, and agricultural supply chain architectures, identifying key research gaps.", "• ")
    add_bullet(doc, "Chapter 3 (Problem Statement and System Requirements): Formulates the technical problem statement, system objectives, and functional and non-functional requirements.", "• ")
    add_bullet(doc, "Chapter 4 (Proposed Methodology and System Design): Explains the 5-tier architecture, operational flowchart, DFD Level 0/1 diagrams, database schema, AI trust pipeline, modular smart contracts, and project schedule.", "• ")
    add_bullet(doc, "Chapter 5 (Results and Discussion): Presents experimental evaluation results, including AI confusion matrices, quarantine dashboards, gas consumption benchmarks, and multi-role dashboard implementations.", "• ")
    add_bullet(doc, "Chapter 6 (Conclusions and Future Scope): Concludes the report with a summary of achievements and outlines potential future enhancements.", "• ")
    add_bullet(doc, "Appendices and References: Provides the operational state transition matrix, anomaly decision rules, and cited bibliography.", "• ")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 2: LITERATURE REVIEW
    # ==========================================
    add_h1(doc, "Chapter 2: Literature Review")
    add_para(
        doc,
        "The combination of distributed ledger technologies, sensor-based monitoring, and machine learning anomaly detection "
        "has received increasing attention as a means to improve supply chain transparency and food safety. To establish the context "
        "for the AgriChain platform, this chapter reviews relevant published literature across IEEE, Elsevier, and Springer venues. "
        "The review covers four main themes: blockchain-based traceability, AI/ML anomaly detection, edge telematics security, and "
        "domain-specific agricultural studies, followed by a comparative analysis and research gaps."
    )

    add_h2(doc, "2.1 Blockchain-Based Supply Chain Traceability")
    add_para(
        doc,
        "Using distributed ledgers in supply chains aims to replace fragmented databases with a shared, tamper-resistant record of custody "
        "and product status. Agrawal et al. (2025) [1] explored the integration of the Internet of Everything (IoE) and Artificial "
        "Intelligence in supply chains, noting that decentralized tracking reduces information asymmetry between participants. However, "
        "they observed that transaction throughput and on-chain storage costs on public blockchains pose scalability challenges for "
        "high-frequency data recording."
    )
    add_para(
        doc,
        "Maurya et al. (2025) [3] examined blockchain security mechanisms for IoT networks, surveying consensus protocols and access "
        "control schemes. Their study highlighted that while Proof-of-Stake (PoS) and Layer-2 networks lower transaction energy and cost, "
        "smart contract storage bloat remains a key challenge. Storing frequent environmental readings directly on-chain requires careful "
        "data filtering and efficient storage packing."
    )
    add_para(
        doc,
        "Dudczyk et al. (2024) [4] conducted a survey of blockchain applications in global supply chain management, finding that while "
        "traceability improves stakeholder trust, most deployments lack automated, real-time quality verification mechanisms. Table 2.1 "
        "summarizes key literature on blockchain-based traceability architectures."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_1_HEADER,
        rd.TABLE_2_1_ROWS,
        col_widths=[1.3, 1.0, 1.9, 2.07],
        caption="Table 2.1: Literature Survey: Blockchain-Based Supply Chain Traceability"
    )

    add_h2(doc, "2.2 AI and Machine Learning for Anomaly Detection")
    add_para(
        doc,
        "Machine learning models for anomaly detection are essential to screen out faulty or malicious readings from sensor data "
        "streams. Mohamed et al. (2025) [2] presented an Adaptive WavePCA-Autoencoder (AWPA) combined with an Adaptive Hybrid Exploit "
        "Detection Network (AHEDNet) for identifying security anomalies in sensor streams. Although the deep learning model showed high "
        "accuracy, its computational and memory requirements make it less suitable for low-latency API microservices running on standard servers."
    )
    add_para(
        doc,
        "Zhou et al. (2024) [13] evaluated Long Short-Term Memory (LSTM) networks and Support Vector Machines (SVM) for detecting data "
        "tampering in supply chain workflows. While recurrent models capture sequential relationships well, they require extensive labeled "
        "training datasets and are susceptible to concept drift. In contrast, unsupervised methods such as Isolation Forest isolate anomalies "
        "by recursively partitioning feature values. Because anomalous observations require fewer random partitions to isolate than normal "
        "points, Isolation Forest operates with linear time complexity $O(n)$ and low memory overhead, making it practical for real-time "
        "telemetry validation."
    )
    add_para(
        doc,
        "Kandasamy and Roseline (2025) [14] investigated hybrid deep learning frameworks for detecting data injection attacks in sensor "
        "networks, demonstrating that multi-dimensional feature engineering improves sensitivity to gradual sensor drift. Table 2.2 "
        "summarizes AI and ML approaches to anomaly detection."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_2_HEADER,
        rd.TABLE_2_2_ROWS,
        col_widths=[1.3, 1.0, 1.9, 2.07],
        caption="Table 2.2: Literature Survey: AI and Machine Learning for Anomaly Detection"
    )

    add_h2(doc, "2.3 IoT-Blockchain Security and Edge Telematics Integration")
    add_para(
        doc,
        "The interface between edge telematics modules and decentralized networks is a critical consideration in supply chain architectures. "
        "Yavaprabhas et al. (2024) [5] conducted a field study on stakeholder trust in organic food supply chains using blockchain. Their "
        "findings indicated that despite the presence of smart contracts, consumers and auditors remained cautious regarding manual data "
        "inputs and unvalidated sensor feeds, emphasizing the need for automated pre-commit screening."
    )
    add_para(
        doc,
        "Aggarwal et al. (2024) [6] integrated GPS corridor tracking with smart contracts to monitor perishable agri-food shipments, "
        "demonstrating route compliance tracking but noting challenges in handling transmission dead-zones. Mangala et al. (2024) [9] "
        "and Eghmazi et al. (2024) [12] explored decentralized document pinning and hash chaining for IoT security, showing that storing "
        "cryptographic Content Identifiers (CIDs) on-chain while keeping large files on IPFS provides verifiable tamper evidence at low cost. "
        "Table 2.3 synthesizes research concerning IoT-blockchain security integration."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_3_HEADER,
        rd.TABLE_2_3_ROWS,
        col_widths=[1.3, 1.0, 1.9, 2.07],
        caption="Table 2.3: Literature Survey: IoT and Blockchain Security Integration"
    )

    add_h2(doc, "2.4 Domain-Specific Agricultural Supply Chain Studies")
    add_para(
        doc,
        "Agricultural goods present distinct challenges due to perishability, seasonal harvesting, and biological decay kinetics. "
        "Wu, Jiang, and Cao (2023) [7] proposed a high-efficiency blockchain traceability framework with optimized state verification, "
        "showing that data encoding optimizations reduce verification latency. However, their study applied uniform threshold limits, "
        "whereas optimal storage conditions differ substantially across crops (e.g., tomatoes require +2°C to +8°C, while tropical mangoes "
        "require +10°C to +15°C)."
    )
    add_para(
        doc,
        "Chaker and Damak (2024) [8] examined transparency in agri-food supply chains, observing that intermediaries often resist "
        "traceability systems unless price transparency mechanisms are clearly defined. Shoomal et al. (2024) [10] and Singh and Dadhich "
        "(2023) [11] emphasized that supply chain resilience requires combining environmental monitoring with contract-enforced custody "
        "transitions. Table 2.4 outlines domain-specific agricultural studies."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_4_HEADER,
        rd.TABLE_2_4_ROWS,
        col_widths=[1.3, 1.0, 1.9, 2.07],
        caption="Table 2.4: Literature Survey: Domain-Specific Agricultural Supply Chain Studies"
    )

    add_h2(doc, "2.5 Comparative Analysis of Existing Systems")
    add_para(
        doc,
        "To highlight the specific features of AgriChain, Table 2.5 presents a comparison between existing supply chain implementations "
        "and our proposed 5-tier architecture across key parameters: system architecture, sensor validation, contract modularity, "
        "price transparency, off-chain storage integrity, and corrupted telemetry handling."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_5_HEADER,
        rd.TABLE_2_5_ROWS,
        col_widths=[1.5, 2.3, 2.47],
        caption="Table 2.5: Comparative Analysis: Existing Systems vs. Proposed AgriChain System"
    )

    add_h2(doc, "2.6 Critical Analysis of Existing Research")
    add_para(
        doc,
        "A critical review of the literature reveals five recurring limitations in current blockchain supply chain implementations:"
    )
    add_bullet(doc, "Lack of Pre-Commit Telemetry Screening: Many existing systems stream sensor data directly to smart contracts without off-chain validation, leading to ledger pollution when sensors experience temporary spikes or transmission errors.", "1. ")
    add_bullet(doc, "High On-Chain Storage Costs: Storing separate 256-bit EVM words for each environmental metric (temperature, humidity, coordinates, timestamp) leads to high gas consumption, making frequent updates impractical.", "2. ")
    add_bullet(doc, "Monolithic Contract Structures: Relying on a single large contract for registration, tracking, policy enforcement, and access control complicates upgrades and increases security risk.", "3. ")
    add_bullet(doc, "Unverifiable Off-Chain Logging: Systems that discard anomalous readings into standard relational databases lack cryptographic tamper evidence, leaving logs vulnerable to alteration.", "4. ")
    add_bullet(doc, "Lack of Intermediary Price Accountability: While many platforms track geographical origin, few record intermediate prices at each custody handover, leaving middleman markups untracked.", "5. ")

    add_h2(doc, "2.7 Identified Research Gaps")
    add_para(
        doc,
        "Based on these limitations, the following research gaps (RG) were identified and addressed in this project:"
    )
    add_bullet(doc, "RG-1: Need for a lightweight, pre-commit AI validation pipeline capable of filtering high-frequency telemetry under sub-second latency constraints without requiring dedicated GPU infrastructure.", "• ")
    add_bullet(doc, "RG-2: Need for an EVM storage packing strategy that fits multiple environmental metrics into a single 256-bit slot to reduce condition logging gas costs.", "• ")
    add_bullet(doc, "RG-3: Need for an append-only, cryptographic hash-chain ledger dedicated to logging quarantined readings off-chain with tamper evidence.", "• ")
    add_bullet(doc, "RG-4: Need for configurable, per-crop cold-chain policy management that supports cultivar-specific environmental bounds.", "• ")
    add_bullet(doc, "RG-5: Need to integrate decentralized document pinning (IPFS) with on-chain role-based access control and emergency pause circuit breakers.", "• ")
    add_bullet(doc, "RG-6: Need for an on-chain cumulative price trail that tracks intermediate actor markups and allows consumers to verify fair producer compensation.", "• ")
    add_bullet(doc, "RG-7: Need for end-to-end verification across simulated sensor anomalies, network latency conditions, and multi-actor supply chain workflows.", "• ")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 3: PROBLEM STATEMENT & REQUIREMENTS
    # ==========================================
    add_h1(doc, "Chapter 3: Problem Statement and System Requirements")
    
    add_h2(doc, "3.1 Problem Statement")
    add_para(
        doc,
        "Agricultural supply chains often suffer from post-harvest spoilage, lack of verifiable cold-chain surveillance, and opaque "
        "intermediary pricing that disadvantages smallholder farmers. While distributed ledgers provide tamper-resistant history, "
        "ingesting raw telemetry directly into smart contracts leads to the 'Garbage In, Garbage Out' (GIGO) problem: corrupted, "
        "drifted, or replayed readings are permanently committed to the ledger, causing false disputes and wasting transaction gas. "
        "Additionally, monolithic contract structures result in high gas costs, and off-chain anomaly logs typically lack cryptographic "
        "tamper evidence."
    )
    add_para(
        doc,
        "Formally, let an agricultural produce batch $B_i$ be registered at time $t_0$ by farmer $A_{\\text{farmer}}$. As $B_i$ transitions "
        "through sequential custody states $S = \\{S_{\\text{REG}}, S_{\\text{TRANSIT}}, S_{\\text{STORAGE}}, S_{\\text{RETAIL}}, S_{\\text{SOLD}}\\}$, "
        "a simulated edge telematics client generates a time-series telemetry sequence $T_i = \\{m_1, m_2, \\dots, m_k\\}$, where each measurement "
        "tuple is defined as $m_k = (\\tau_k, \\theta_k, \\phi_k, \\lambda_k, \\mu_k)$ representing timestamp $\\tau_k$, temperature $\\theta_k$, "
        "humidity $\\phi_k$, latitude $\\lambda_k$, and longitude $\\mu_k$."
    )
    add_para(
        doc,
        "The technical objective is to design an automated verification operator $\\mathcal{V}(m_k \\mid \\mathcal{P}_c)$ conditioned on "
        "dynamic crop policy $\\mathcal{P}_c = (\\theta_{\\min}, \\theta_{\\max}, \\phi_{\\min}, \\phi_{\\max})$ such that:"
    )
    add_bullet(doc, "Telemetry Validation: If $m_k$ satisfies plausibility limits and yields an Isolation Forest anomaly score $s(m_k) \\le \\gamma_{\\text{threshold}}$, it is batched and committed to smart contract state $C_{\\text{ColdChain}}$ on Polygon Amoy in a single packed 256-bit slot.", "1. ")
    add_bullet(doc, "Quarantine Routing: If $m_k$ violates crop bounds or triggers $s(m_k) > \\gamma_{\\text{threshold}}$, $m_k$ is quarantined in an off-chain SHA-256 hash-chain $H_k = \\text{SHA-256}(H_{k-1} \\parallel m_k \\parallel \\text{Reason}_k \\parallel \\tau_k)$ without public ledger contamination.", "2. ")
    add_bullet(doc, "Custody and Price Progression: Custody handovers $S_k \\to S_{k+1}$ are strictly forward-only and governed by AccessControl, atomically updating an immutable price vector $\\mathbf{P}_i = (p_{\\text{farmer}}, p_{\\text{logistics}}, p_{\\text{store}}, p_{\\text{retail}})$ to provide transparent margin visibility.", "3. ")

    add_h2(doc, "3.2 System Objectives")
    add_para(
        doc,
        "To address these requirements, the AgriChain platform was developed to achieve six specific engineering objectives:"
    )
    add_bullet(doc, "Objective 1: Multi-Stage AI Trust Engine: Develop a lightweight pre-commit validation pipeline capable of processing simulated telemetry in under 150 milliseconds with an anomaly detection F1-score exceeding 95%.", "• ")
    add_bullet(doc, "Objective 2: Gas-Optimized Smart Contracts: Design modular EVM smart contracts utilizing bitwise packed storage to achieve a gas reduction of over 45% compared to multi-word storage implementations.", "• ")
    add_bullet(doc, "Objective 3: Cryptographic Quarantine Ledger: Build an off-chain SHA-256 hash-chain audit log that captures all rejected or anomalous readings, ensuring auditability without on-chain gas costs.", "• ")
    add_bullet(doc, "Objective 4: Dynamic Crop-Specific Governance: Implement configurable on-chain and off-chain policy thresholds supporting distinct thermal envelopes for different crop varieties.", "• ")
    add_bullet(doc, "Objective 5: Transparent Fair Price Accounting: Engineer an on-chain cumulative price trail that records intermediate actor handoffs and verifies an equitable farmer revenue share.", "• ")
    add_bullet(doc, "Objective 6: Responsive Multi-Role Web Interface: Build dedicated React 18 dashboards for Farmers, Logistics Transporters, Dark Store Operators, Consumers, and Admins, supporting real-time visualizers and QR code verification.", "• ")

    add_h2(doc, "3.3 Functional Requirements")
    add_para(
        doc,
        "The system specifications are organized into twelve functional requirements (FR):"
    )
    add_bullet(doc, "FR-1 (Actor Authentication & RBAC): Enforce role-based access control mapping Ethereum addresses and backend JWT sessions to discrete roles (Farmer, Logistics, DarkStore, Consumer, Admin).", "• ")
    add_bullet(doc, "FR-2 (Batch Produce Registration): Allow farmers to register harvest batches with crop variety, harvest date, quantity in kg, base price in integer paise, and farm location.", "• ")
    add_bullet(doc, "FR-3 (Automated QR Code Generation): Dynamically generate QR codes encoding unique batch identifiers and direct provenance verification URLs upon batch creation.", "• ")
    add_bullet(doc, "FR-4 (Simulated Telemetry Ingestion): Accept simulated JSON telemetry streams and execute schema checks, physical bounds bounding, and sequential timestamp verification.", "• ")
    add_bullet(doc, "FR-5 (AI Anomaly Scoring): Extract 11 statistical features from telemetry and evaluate an Isolation Forest model to assign an anomaly score and validation status.", "• ")
    add_bullet(doc, "FR-6 (Quarantine Logging): Record anomalous or out-of-policy readings into an append-only SHA-256 hash-chain, linking each entry to the previous block digest.", "• ")
    add_bullet(doc, "FR-7 (Packed On-Chain Relay): Relay validated readings to the ColdChainMonitor smart contract using packed struct parameters, emitting TelemetryLogged events.", "• ")
    add_bullet(doc, "FR-8 (Forward-Only Custody Progression): Enforce a strictly forward-only custody sequence (REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD), preventing out-of-order handovers.", "• ")
    add_bullet(doc, "FR-9 (Multi-Tier Price Logging): Atomically record each recipient's price addition in integer paise during custody handovers, maintaining the cumulative retail price.", "• ")
    add_bullet(doc, "FR-10 (IPFS Document Pinning): Pin quality inspection reports and organic certificates to IPFS via Pinata, anchoring resulting CIDs on-chain.", "• ")
    add_bullet(doc, "FR-11 (Emergency Circuit Breakers): Provide administrative controls to pause contract state transitions during detected irregularities via Pausable circuit breakers.", "• ")
    add_bullet(doc, "FR-12 (Consumer Provenance Portal): Allow consumers to scan product QR codes to view the farm-to-fork journey, dynamic freshness grade, fair price breakdown, and verified reviews.", "• ")

    add_h2(doc, "3.4 Non-Functional Requirements")
    add_para(
        doc,
        "The platform architecture satisfies eight non-functional requirements (NFR):"
    )
    add_bullet(doc, "NFR-1 (Validation Latency): The AI Trust Layer pre-commit validation must execute feature extraction and anomaly scoring in under 150 ms per telemetry payload.", "• ")
    add_bullet(doc, "NFR-2 (EVM Gas Efficiency): Batched condition updates (N=20) must average less than 50,000 gas per reading, achieving at least 45% savings over uncompressed storage.", "• ")
    add_bullet(doc, "NFR-3 (Tamper Evidence): Any retroactive alteration to quarantined records must be mathematically detectable via hash-chain verification sweeps within milliseconds.", "• ")
    add_bullet(doc, "NFR-4 (Database Performance): Relational storage must support concurrent read/write operations using connection pooling and SQLite WAL mode.", "• ")
    add_bullet(doc, "NFR-5 (Responsive UI Layout): The web interface must maintain a responsive layout across mobile, tablet, and desktop viewports (320px to 2560px).", "• ")
    add_bullet(doc, "NFR-6 (Security Standards): Passwords must be hashed using bcrypt, API sessions managed via HMAC-SHA256 JWTs, and smart contracts aligned with audited OpenZeppelin v5.0 libraries.", "• ")
    add_bullet(doc, "NFR-7 (Asynchronous Concurrency): The backend must utilize non-blocking asynchronous I/O across database access, IPFS uploads, and blockchain transactions.", "• ")
    add_bullet(doc, "NFR-8 (Integer Precision Rules): All financial figures must use integer paise (1 INR = 100 paise) and temperatures must use integer deci-degrees Celsius (24.5°C = 245) to avoid floating-point rounding issues.", "• ")

    add_h2(doc, "3.5 Target Stakeholder Profiles and Personas")
    add_para(
        doc,
        "The platform interfaces were designed to accommodate five distinct user personas representing typical supply chain participants:"
    )
    add_bullet(doc, "Persona 1: Ramesh Patel (Smallholder Farmer): Cultivates a 4-acre organic farm near Nashik. Needs an easy-to-use crop registration form, proof of harvest origin, and transparent price tracking without technical complexity.", "• ")
    add_bullet(doc, "Persona 2: Vikram Singh (Refrigerated Fleet Transporter): Operates refrigerated transport vehicles. Needs continuous telemetry tracking, route milestone logging, and unambiguous custody handovers to protect against wrongful damage claims.", "• ")
    add_bullet(doc, "Persona 3: Priya Sharma (Dark Store Hub Manager): Manages an urban distribution hub. Requires incoming shipment verification, storage bay allocation, and prompt inventory processing for local fulfillment.", "• ")
    add_bullet(doc, "Persona 4: Ananya Iyer (Retail Consumer): Urban grocery buyer seeking verifiable information on harvest date, chemical residue testing, transit handling, and fair farmer compensation.", "• ")
    add_bullet(doc, "Persona 5: Rajesh Verma (Supply Chain Administrator): System administrator overseeing contract roles, monitoring quarantine alerts, auditing hash-chain integrity, and activating circuit breakers if necessary.", "• ")

    doc.add_page_break()

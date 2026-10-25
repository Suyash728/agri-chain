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
        "Agriculture constitutes the foundational backbone of the Indian socio-economic landscape, providing direct and "
        "indirect livelihoods to over 54% of the national workforce and contributing approximately 18% to the gross domestic "
        "product (GDP). Despite this pivotal role, the agricultural supply chain in developing nations suffers from deep-seated "
        "structural systemic inefficiencies, chronic multi-tiered information asymmetry, and alarming post-harvest food waste. "
        "Empirical reports published by the Ministry of Food Processing Industries (MoFPI) and the Indian Council of Agricultural "
        "Research (ICAR) estimate that between 30% and 40% of all harvested fruits and vegetables perish prior to reaching consumer "
        "retail markets, translating into an astonishing annual economic loss exceeding ₹92,651 crore."
    )
    add_para(
        doc,
        "This colossal post-harvest destruction is directly exacerbated by acute deficits in temperature-controlled logistics "
        "and fragmented cold-storage infrastructure. Perishable crops—such as tomatoes, strawberries, leafy greens, mangoes, "
        "and dairy products—exhibit severe biochemical and physiological sensitivity to ambient thermal fluctuations. "
        "When cold-chain integrity is breached during highway transit or transit-hub storage, microbial proliferation and "
        "enzymatic decomposition accelerate exponentially according to kinetic Arrhenius principles. However, because modern "
        "logistics corridors lack automated, unalterable sensory surveillance, such temperature excursions frequently go undetected "
        "or are actively concealed by transport carriers seeking to evade commercial penalties. Consequently, deteriorated produce "
        "is routinely distributed to urban retail shelves, presenting severe food safety hazards and driving consumer dissatisfaction."
    )
    add_para(
        doc,
        "Simultaneously, the traditional agricultural distribution paradigm is paralyzed by opaque intermediary exploitation. "
        "Between the primary producer (the smallholder farmer) and the final retail consumer sits an intricate hierarchy of "
        "aggregators, commission agents (arhtiyas), transport syndicates, wholesale brokers, and dark-store distribution hubs. "
        "Each intermediary layer imposes substantial markups while concealing operational costs and procurement prices from both "
        "ends of the value chain. As a consequence, smallholder farmers often realize as little as 20% to 28% of the final retail "
        "price paid by consumers, while bearing virtually 100% of the production risk, input costs, and climate vulnerabilities. "
        "Conversely, consumers pay inflated prices without receiving any verifiable guarantee regarding the harvest date, botanical "
        "origin, organic authenticity, or cold-chain history of the food they consume."
    )
    add_para(
        doc,
        "In response to these systemic dilemmas, distributed ledger technology (blockchain) has emerged as a promising paradigm "
        "for establishing decentralized, tamper-proof provenance and unalterable custody tracking. By persisting state transitions "
        "across a decentralized network of cryptographic nodes, blockchain eliminates reliance on centralized authorities and provides "
        "all participants with an auditable single version of the truth. Furthermore, Turing-complete smart contracts enable the "
        "automated, deterministic enforcement of operational business logic, custody handovers, and compliance standards."
    )
    add_para(
        doc,
        "However, applying blockchain technology directly to real-world agricultural IoT ecosystems reveals a critical, often fatal "
        "architectural vulnerability known as the 'Garbage In, Garbage Out' (GIGO) oracle problem. While a blockchain guarantees "
        "that committed data cannot be modified retroactively, it possesses zero intrinsic capacity to ascertain whether incoming "
        "data accurately reflects physical reality at the moment of recording. In physical cold chains, IoT sensors deployed in "
        "reefer vehicles or warehouse storage bays are routinely vulnerable to thermal spikes, power blackouts, transmission packet "
        "loss, hardware drift, calibration failures, and malicious replay attacks. If faulty or manipulated sensor telemetry is "
        "streamed directly into immutable smart contracts, the ledger permanently canonizes corrupted data, triggering erroneous "
        "custody disputes, false contract terminations, and wasted transaction gas fees."
    )

    add_h2(doc, "1.2 Aim and Motivation of the Project")
    add_para(
        doc,
        "The primary aim of this Major Project is to design, engineer, and empirically evaluate AgriChain—a unified, decentralized, "
        "and AI-governed agricultural supply chain traceability platform that establishes end-to-end provenance, enforces strict "
        "cold-chain compliance, isolates corrupt telemetry off-chain, and guarantees transparent multi-tier price realization."
    )
    add_para(
        doc,
        "The driving motivation behind this work stems from the urgent necessity to bridge the dangerous chasm between physical IoT "
        "sensing and on-chain decentralized persistence. Specifically, this project is motivated by four core engineering objectives:"
    )
    add_bullet(doc, "Resolving the Blockchain GIGO Dilemma: Engineering an intelligent, multi-stage AI Trust Layer that intercepts, audits, and validates physical IoT environmental readings off-chain before committing state transitions to public smart contracts.", "1. ")
    add_bullet(doc, "Cost-Efficient Blockchain Execution: Overcoming the prohibitive gas cost barriers of decentralized networks by optimizing smart contract storage schemas, packing multiple sensor telemetry fields into single 256-bit EVM storage slots, and batching condition updates.", "2. ")
    add_bullet(doc, "Tamper-Evident Off-Chain Integrity: Ensuring that corrupted or anomalous sensor readings are not discarded without accountability, but are permanently logged into an unbroken cryptographic SHA-256 Quarantine Hash Chain that provides forensic auditability without wasting public blockchain gas.", "3. ")
    add_bullet(doc, "Democratizing Price Transparency: Establishing an immutable, on-chain price trail that records the farmer's gate price alongside each intermediary margin, empowering consumers to verify fair producer compensation and holding middlemen accountable.", "4. ")

    add_h2(doc, "1.3 Scope of the Project")
    add_para(
        doc,
        "The functional and architectural scope of the AgriChain platform spans the entire post-harvest agricultural journey, "
        "encompassing the physical and digital boundaries defined below:"
    )
    add_bullet(doc, "Ecosystem Actors: The platform models and deploys dedicated role-governed interfaces for five primary stakeholders: Primary Producers (Farmers), Logistics Fleet Operators, Dark-Store Fulfillment Hubs, Retail Consumers, and System Administrators.", "• ")
    add_bullet(doc, "IoT Sensory Monitoring: Real-time environmental tracking encompassing ambient temperature (°C), relative humidity (%), vehicle geographical coordinates (Latitude/Longitude), and transmission timestamps across transit and warehousing phases.", "• ")
    add_bullet(doc, "AI Ingestion Engine: An unsupervised machine learning pipeline utilizing an 11-dimensional Isolation Forest model, physical plausibility heuristics, crop-specific dynamic thermal bounds, and temporal rate-of-change analysis.", "• ")
    add_bullet(doc, "Smart Contract Infrastructure: Modular Solidity 0.8.28 contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig) deployed on the Polygon Amoy EVM testnet, featuring OpenZeppelin AccessControl RBAC and Pausable emergency circuit breakers.", "• ")
    add_bullet(doc, "Dual Persistence Architecture: Integration of PostgreSQL (Supabase IPv4 Pooler) for fast relational query indexing, local transactional SQLite, Pinata IPFS gateways for decentralized pinning of food safety certificates, and a cryptographic quarantine ledger.", "• ")
    add_bullet(doc, "Presentation Layer: A highly responsive React 18 single-page application built with Vite and Tailwind CSS, featuring interactive dashboards, dynamic freshness grade visualizers, cryptographic verification modals, and mobile-friendly QR code scanners.", "• ")

    add_h2(doc, "1.4 Significant Contributions")
    add_para(
        doc,
        "This project delivers several significant original engineering and research contributions to the domain of decentralized "
        "agri-food supply chain architectures:"
    )
    add_bullet(doc, "Multi-Stage Pre-Commit AI Trust Pipeline: Formulated a 7-stage off-chain telemetry auditing pipeline that achieves a 97.22% overall F1-score and 100% recall across hardware-injected sensor faults, ensuring zero ledger pollution.", "1. ")
    add_bullet(doc, "Single-Slot Packed Storage EVM Architecture: Designed a bitwise packed Solidity struct for environmental conditions, reducing blockchain storage requirements from three storage words to exactly one word, achieving a 52.71% gas reduction under batched updates.", "2. ")
    add_bullet(doc, "Cryptographically Auditable Quarantine Hash Chain: Pioneered an off-chain SHA-256 chained quarantine ledger that preserves forensic evidence of sensor failures, thermal breaches, and replay attacks without incurring on-chain transaction costs.", "3. ")
    add_bullet(doc, "Dynamic Crop Policy Engine: Implemented on-chain and off-chain configurable thermal envelopes for diverse agricultural cultivars, replacing rigid hardcoded thresholds with extensible per-crop governance.", "4. ")
    add_bullet(doc, "Immutable Fair Price Trail: Developed an immutable, cumulative accounting mechanism tracking farmer gate price and intermediary markups, verifying a 50.0% farmer revenue share on consumer provenance scans.", "5. ")
    add_bullet(doc, "Role-Based Access Control and Circuit Breakers: Integrated audited OpenZeppelin RBAC contracts with automated emergency pause mechanisms that halt compromised supply chain batches during consecutive severe thermal excursions.", "6. ")
    add_bullet(doc, "End-to-End Empirical Verification: Executed a comprehensive capstone verification suite comprising 10 multi-actor integration tests (PRD Section 6) and 1,000 synthetic fault trials, validating complete system robustness.", "7. ")

    add_h2(doc, "1.5 Organization of the Report")
    add_para(
        doc,
        "The remainder of this Major Project Report is systematically structured into five subsequent chapters, followed by "
        "appendices and references:"
    )
    add_bullet(doc, "Chapter 2 (Literature Review): Conducts an extensive review of existing scholarly literature spanning blockchain traceability, AI/ML anomaly detection, IoT hardware security, and agri-food logistics, culminating in a comparative analysis and formal research gaps.", "• ")
    add_bullet(doc, "Chapter 3 (Problem Statement and System Requirements): Formulates the rigorous mathematical problem statement, outlines primary and secondary objectives, and details the comprehensive functional and non-functional requirements.", "• ")
    add_bullet(doc, "Chapter 4 (Proposed Methodology and System Design): Details the 5-tier architecture, operational flowchart, DFD Level 0/1 diagrams, ER relational modeling, use case diagrams, AI trust layer pipeline, modular smart contracts, and project scheduling.", "• ")
    add_bullet(doc, "Chapter 5 (Results and Discussion): Presents empirical experimental findings, including AI confusion matrices, quarantine dashboards, PRD test suite verification, EVM gas benchmarks, multi-role user dashboards, and in-depth academic discussions.", "• ")
    add_bullet(doc, "Chapter 6 (Conclusions and Future Scope): Concludes the report with a synthesis of realized contributions and outlines nine promising future research trajectories, followed by appendices and the bibliography.", "• ")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 2: LITERATURE REVIEW
    # ==========================================
    add_h1(doc, "Chapter 2: Literature Review")
    add_para(
        doc,
        "The convergence of distributed ledger technologies, Internet of Things (IoT) sensing, and machine learning anomaly "
        "detection represents a rapidly expanding research domain aimed at transforming global logistics and food distribution networks. "
        "To establish a solid academic and theoretical foundation for the proposed AgriChain platform, this chapter provides a systematic, "
        "multi-dimensional review of existing scholarly works published across prestigious IEEE, Elsevier, and Springer venues. "
        "The literature review is organized into four thematic areas, followed by a comparative synthesis, critical analysis, and "
        "formal identification of research gaps."
    )

    add_h2(doc, "2.1 Blockchain-Based Supply Chain Traceability")
    add_para(
        doc,
        "The foundational premise of utilizing distributed ledgers in supply chains centers on replacing centralized, silod databases "
        "with immutable, shared state machines. Agrawal et al. (2025) [1] comprehensively investigated the integration of the Internet "
        "of Everything (IoE) and Artificial Intelligence within modern supply chains, demonstrating that decentralized data capture "
        "drastically mitigates supplier information asymmetry. However, their study primarily focused on theoretical architectural models, "
        "acknowledging that transaction throughput bottlenecks on Layer-1 public blockchains present significant scalability hurdles "
        "when deployed in high-frequency agricultural environments."
    )
    add_para(
        doc,
        "Maurya et al. (2025) [3] analyzed blockchain-driven security paradigms for IoT networks, surveying state-of-the-art consensus "
        "protocols, smart contract vulnerability surfaces, and cryptographic access schemes. Their findings underscored that while "
        "Proof-of-Stake (PoS) and Layer-2 rollups dramatically diminish cryptographic energy consumption compared to legacy Proof-of-Work "
        "systems, smart contract state bloat remains a severe constraint. Writing high-frequency IoT telemetry directly to blockchain "
        "storage slots rapidly becomes financially prohibitive unless rigorous data filtering and struct packing mechanisms are introduced."
    )
    add_para(
        doc,
        "Dudczyk et al. (2024) [4] conducted a global survey of blockchain applications in supply chain management, highlighting that "
        "while decentralized provenance enhances stakeholder trust, the vast majority of existing deployments operate in isolated silos "
        "without integrating real-time automated physical quality verification. Table 2.1 summarizes the pivotal literature concerning "
        "blockchain-based traceability architectures."
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
        "The deployment of machine learning algorithms for detecting anomalies in industrial time-series streams is vital for filtering "
        "erroneous or malicious sensory data. Mohamed et al. (2025) [2] proposed an Adaptive WavePCA-Autoencoder (AWPA) coupled with an "
        "Adaptive Hybrid Exploit Detection Network (AHEDNet) to identify zero-day security breaches and corrupted data points in industrial "
        "sensor streams. While their deep hybrid architecture exhibited exceptional anomaly detection accuracy exceeding 98%, the extensive "
        "computational overhead and GPU memory footprint make it impractical for resource-constrained edge gateways or low-latency "
        "API microservices."
    )
    add_para(
        doc,
        "Zhou et al. (2024) [13] evaluated deep sequential models (LSTM) alongside support vector machines (SVM) for detecting malicious "
        "tampering and data injection attacks across supply chain workflows. While LSTMs excel at capturing long-term temporal dependencies, "
        "they exhibit vulnerability to concept drift and require extensive labeled training datasets that are rarely accessible in agricultural "
        "cold-chain deployments. Conversely, unsupervised methods—such as Liu et al.'s Isolation Forest—isolate anomalous observations "
        "by recursively partitioning feature spaces using orthogonal decision splits. Because anomalous data points require significantly "
        "fewer partitions to isolate than normal clustering points, Isolation Forest achieves linear time complexity $O(n)$ with minimal "
        "computational memory, rendering it uniquely suited for real-time edge telemetry validation."
    )
    add_para(
        doc,
        "Kandasamy and Roseline (2025) [14] investigated hybrid deep learning frameworks for detecting Man-in-the-Middle (MitM) and "
        "telemetry injection attacks across wireless sensor networks, verifying that multi-dimensional feature engineering substantially "
        "elevates detection sensitivity against subtle, continuous sensor drifts. Table 2.2 provides a structured synthesis of AI and ML "
        "models applied to anomaly detection."
    )

    add_styled_table(
        doc,
        rd.TABLE_2_2_HEADER,
        rd.TABLE_2_2_ROWS,
        col_widths=[1.3, 1.0, 1.9, 2.07],
        caption="Table 2.2: Literature Survey: AI and Machine Learning for Anomaly Detection"
    )

    add_h2(doc, "2.3 IoT-Blockchain Security and Hardware Integration")
    add_para(
        doc,
        "The physical interface between hardware microcontrollers (e.g., ESP32, Arduino) and decentralized networks represents the most "
        "vulnerable boundary in end-to-end supply chain architectures. Yavaprabhas et al. (2024) [5] conducted an empirical field investigation "
        "into the impact of blockchain on stakeholder trust within organic food supply chains. Their research revealed that despite deploying "
        "smart contracts, consumers and auditors maintained lingering skepticism regarding the integrity of manual data input and unverified "
        "sensor readings, concluding that cryptographic hardware-level proof-of-reading is essential to eliminate human tampering."
    )
    add_para(
        doc,
        "Aggarwal et al. (2024) [6] integrated GPS navigation corridors with blockchain smart contracts to monitor perishable agri-food "
        "transportation. Their system demonstrated automated route compliance, but lacked off-chain cryptographic holding mechanisms "
        "when telemetry transmission experienced cellular blackout dead-zones. Mangala et al. (2024) [9] and Eghmazi et al. (2024) [12] "
        "addressed IoT cloud security by implementing decentralized document pinning and cryptographic hash chaining, proving that "
        "anchoring off-chain IPFS Content Identifiers (CIDs) onto distributed ledgers provides mathematically verifiable tamper evidence "
        "at a tiny fraction of on-chain storage costs. Table 2.3 synthesizes research concerning IoT-blockchain security integration."
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
        "Agricultural commodities possess unique biological and perishable characteristics that distinguish them from standard industrial "
        "manufactured goods. Wu, Jiang, and Cao (2023) [7] engineered a high-efficiency blockchain traceability framework with optimized "
        "state verification, proving that state pruning and optimized data encoding significantly reduce verification latency. However, "
        "their architecture treated all agricultural produce under generic threshold parameters, ignoring the reality that optimal storage "
        "temperatures vary dramatically across cultivars (e.g., tomatoes require +10°C to +15°C, while strawberries perish above +4°C)."
    )
    add_para(
        doc,
        "Chaker and Damak (2024) [8] examined transparency and security in agri-food chains, observing that traditional intermediary "
        "cartels actively resist blockchain adoption unless economic incentives and fair pricing mechanisms are directly embedded into "
        "the operational protocol. Shoomal et al. (2024) [10] and Singh and Dadhich (2023) [11] reinforced the imperative of dynamic "
        "multi-stakeholder governance, emphasizing that supply chain resilience requires combining real-time IoT surveillance with automated "
        "contract-enforced accountability. Table 2.4 details domain-specific agricultural supply chain implementations."
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
        "To clearly establish the technological advancements delivered by AgriChain, Table 2.5 presents a comprehensive comparative "
        "matrix benchmarking existing state-of-the-art agricultural supply chain implementations against our proposed 5-tier architecture. "
        "The comparison spans six critical architectural pillars: system architecture, sensor validation, smart contract customization, "
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
        "A rigorous synthesis of the scholarly literature examined above reveals five critical recurring limitations that impede "
        "the practical real-world adoption of blockchain in agricultural supply chains:"
    )
    add_bullet(doc, "Absence of Pre-Commit Sensory Validation: The overwhelming majority of existing blockchain traceability architectures adopt a naive 'stream-to-chain' approach, blindly committing raw IoT telemetry to immutable ledgers without off-chain verification, thereby permanently poisoning public state with faulty or spoofed data.", "1. ")
    add_bullet(doc, "Prohibitive EVM Storage Costs: Monolithic smart contracts that store independent 256-bit storage words for temperature, humidity, coordinates, and timestamps incur exorbitant gas fees ($0.20 to $1.50 per update on public chains), rendering high-frequency cold-chain tracking economically non-viable for low-margin agricultural produce.", "2. ")
    add_bullet(doc, "Rigid, Monolithic Contract Design: Existing implementations rely on single, highly coupled smart contracts that merge product registration, custody transfer, policy enforcement, and payment settlement into a single codebase, introducing severe upgrade bottlenecks and single points of failure.", "3. ")
    add_bullet(doc, "Unverifiable Off-Chain Quarantine: Systems that filter abnormal sensor data off-chain routinely discard rejected readings into standard relational logs without cryptographic anchoring, leaving the system vulnerable to silent tampering by compromised database administrators.", "4. ")
    add_bullet(doc, "Total Absence of Intermediary Price Accountability: While contemporary systems track botanical provenance, virtually none record the economic handoff prices across intermediate custody transfers, allowing commission cartels to continue exploiting primary producers undetected.", "5. ")

    add_h2(doc, "2.7 Identified Research Gaps")
    add_para(
        doc,
        "Based on the critical analysis of prior literature, this project identifies and formally targets seven distinct research gaps (RG):"
    )
    add_bullet(doc, "RG-1: Lack of an ultra-lightweight, multi-stage off-chain AI validation pipeline capable of filtering high-velocity IoT telemetry under sub-second latency constraints without requiring resource-heavy deep learning GPU infrastructure.", "• ")
    add_bullet(doc, "RG-2: Inability of existing EVM smart contracts to persist multi-variable environmental telemetry in a single, packed 256-bit storage slot, creating unnecessary transaction gas inflation.", "• ")
    add_bullet(doc, "RG-3: Absence of a cryptographically unbroken, tamper-evident hash-chain ledger dedicated exclusively to off-chain telemetry quarantine and explainable fault logging.", "• ")
    add_bullet(doc, "RG-4: Lack of dynamic, per-crop cold-chain policy governance enabling real-time on-chain enforcement of cultivar-specific thermal thresholds.", "• ")
    add_bullet(doc, "RG-5: Failure of existing agricultural dApps to combine decentralized document pinning (IPFS) with automated role-based access control (RBAC) and emergency circuit breakers.", "• ")
    add_bullet(doc, "RG-6: Absence of an immutable, cumulative fair price trail that records farmer gate price alongside intermediate actor markups to verify equitable economic distribution to consumers.", "• ")
    add_bullet(doc, "RG-7: Lack of end-to-end empirical validation across simulated hardware faults, network latency variations, and complete capstone multi-actor lifecycle integration suites.", "• ")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 3: PROBLEM STATEMENT & REQUIREMENTS
    # ==========================================
    add_h1(doc, "Chapter 3: Problem Statement and System Requirements")
    
    add_h2(doc, "3.1 Problem Statement")
    add_para(
        doc,
        "Modern agricultural supply chains in developing nations suffer from acute information asymmetry, high post-harvest "
        "spoilage rates, and non-transparent price realization for primary producers. While blockchain technology provides "
        "decentralized immutability, existing agricultural implementations are paralyzed by the 'Garbage In, Garbage Out' (GIGO) "
        "dilemma: corrupt, manipulated, or failing IoT telemetry streams directly into the distributed ledger without validation. "
        "Furthermore, monolithic smart contracts incur prohibitive gas costs, off-chain storage repositories lack cryptographic "
        "tamper evidence, and intermediaries conceal cumulative profit margins from farmers and consumers."
    )
    add_para(
        doc,
        "Formally, consider an agricultural produce batch $B_i$ harvested at time $t_0$ by farmer $A_{	ext{farmer}}$. As $B_i$ progresses "
        "through discrete physical custody states $S = \{S_{	ext{REG}}, S_{	ext{TRANSIT}}, S_{	ext{STORAGE}}, S_{	ext{RETAIL}}, S_{	ext{SOLD}}\}$, "
        "an edge IoT device generates a time-series telemetry sequence $T_i = \{m_1, m_2, \dots, m_k\}$, where each measurement tuple "
        "is defined as $m_k = (	au_k, 	heta_k, \phi_k, \lambda_k, \mu_k)$ representing timestamp $	au_k$, temperature $	heta_k$, "
        "humidity $\phi_k$, latitude $\lambda_k$, and longitude $\mu_k$."
    )
    add_para(
        doc,
        "The fundamental technical problem is to design an automated, deterministic verification operator $\mathcal{V}(m_k \mid \mathcal{P}_c)$ "
        "conditioned on dynamic crop policy $\mathcal{P}_c = (	heta_{\min}, 	heta_{\max}, \phi_{\min}, \phi_{\max})$ such that:"
    )
    add_bullet(doc, "Telemetry Legitimacy: If $m_k$ is statistically and physically plausible, it is committed to smart contract state $C_{	ext{ColdChain}}$ on Polygon Amoy in a single packed 256-bit storage slot, updating batch freshness and trust score.", "1. ")
    add_bullet(doc, "Quarantine Isolation: If $m_k$ violates physical plausibility, dynamic crop bounds, or triggers an Isolation Forest anomaly score $s(m_k) > \gamma_{	ext{threshold}}$, $m_k$ is cryptographically quarantined into an off-chain SHA-256 hash-chain $H_k = 	ext{SHA-256}(H_{k-1} \parallel m_k \parallel 	ext{Reason}_k \parallel 	au_k)$ without ledger contamination.", "2. ")
    add_bullet(doc, "Custody & Price Enforceability: Custody transitions $S_k 	o S_{k+1}$ are strictly forward-only and governed by OpenZeppelin AccessControl, atomically updating an immutable price vector $\mathbf{P}_i = (p_{	ext{farmer}}, p_{	ext{logistics}}, p_{	ext{store}}, p_{	ext{retail}})$ guaranteeing transparent margin visibility.", "3. ")

    add_h2(doc, "3.2 System Objectives")
    add_para(
        doc,
        "To solve the formalized problem, the proposed AgriChain platform is engineered to achieve six specific technical objectives:"
    )
    add_bullet(doc, "Objective 1: Multi-Stage AI Trust Engine: Develop a high-throughput, low-latency off-chain pre-commit telemetry validation pipeline capable of processing environmental readings in under 150 milliseconds with an anomaly detection F1-score exceeding 95%.", "• ")
    add_bullet(doc, "Objective 2: Gas-Optimized Smart Contracts: Design modular EVM smart contracts utilizing packed bitwise storage representations to achieve a gas reduction greater than 45% compared to standard multi-word storage implementations.", "• ")
    add_bullet(doc, "Objective 3: Cryptographic Quarantine Ledger: Build a tamper-evident SHA-256 hash-chain audit log that captures all rejected or anomalous sensor readings, ensuring 100% auditability without incurring on-chain gas costs.", "• ")
    add_bullet(doc, "Objective 4: Dynamic Crop-Specific Governance: Implement a flexible on-chain and off-chain policy engine supporting distinct, reconfigurable environmental envelopes for varied crop cultivars.", "• ")
    add_bullet(doc, "Objective 5: Immutable Fair Price Accounting: Engineer an on-chain cumulative price trail that tracks intermediate actor handoffs and verifies a minimum 45% producer revenue realization upon consumer scan.", "• ")
    add_bullet(doc, "Objective 6: Responsive Multi-Role Web Platform: Construct dedicated, secure React 18 user interfaces for Farmers, Logistics Carriers, Dark Store Operators, Consumers, and Admins, providing real-time telemetry visualizers and instant QR code verification.", "• ")

    add_h2(doc, "3.3 Functional Requirements")
    add_para(
        doc,
        "The functional specifications of the platform are organized across twelve rigorous functional requirements (FR):"
    )
    add_bullet(doc, "FR-1 (Actor Authentication & RBAC): System must enforce role-based authentication mapping cryptographic Ethereum wallet addresses and backend JWT sessions to discrete roles (Farmer, Logistics, DarkStore, Consumer, Admin).", "• ")
    add_bullet(doc, "FR-2 (Batch Produce Registration): Farmers must be able to register new agricultural batches with botanical cultivar, harvest date, quantity in kilograms, base price in integer paise, and initial storage location.", "• ")
    add_bullet(doc, "FR-3 (Automated QR Code Generation): Upon batch registration, the platform must dynamically generate high-resolution QR codes encoding unique batch identifiers and direct provenance verification URLs.", "• ")
    add_bullet(doc, "FR-4 (IoT Ingestion & Pre-Validation): The ingestion API must accept JSON telemetry packets and immediately execute physical bounds checks, schema validations, and temporal monotonicity verifications.", "• ")
    add_bullet(doc, "FR-5 (AI Anomaly Scoring): Ingestion pipeline must extract 11 statistical features and evaluate an unsupervised Isolation Forest model to assign an anomaly score and binary legitimacy flag.", "• ")
    add_bullet(doc, "FR-6 (Cryptographic Quarantine Logging): Corrupted or out-of-bound readings must be recorded in an append-only hash-chain where each block encapsulates the SHA-256 digest of the previous quarantine entry.", "• ")
    add_bullet(doc, "FR-7 (Packed On-Chain Relay): Validated readings must be relayed to the ColdChainMonitor contract using packed struct parameters, emitting real-time TelemetryLogged EVM events.", "• ")
    add_bullet(doc, "FR-8 (Strict Forward Custody Transfer): Custody transfers must execute in a strictly forward-only sequence (REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD), rejecting any backward or out-of-order transitions.", "• ")
    add_bullet(doc, "FR-9 (Multi-Tier Price Logging): Each custody transfer must atomically record the recipient's added price margin in integer paise, recalculating the cumulative retail price.", "• ")
    add_bullet(doc, "FR-10 (IPFS Document Pinning): Quality inspection reports, pesticide lab test certificates, and organic compliance certificates must be pinned to IPFS, with their cryptographic CIDs anchored to batch state on-chain.", "• ")
    add_bullet(doc, "FR-11 (Emergency Circuit Breakers): System administrators must have multi-sig authority to pause contract state transitions during detected security anomalies, with automatic pause triggers upon consecutive critical thermal violations.", "• ")
    add_bullet(doc, "FR-12 (Consumer Provenance Portal): Public consumers must be able to scan product QR codes to view the farm-to-fork geographical journey, dynamic freshness grade, fair price breakdown, and verified peer reviews without requiring a Web3 wallet.", "• ")

    add_h2(doc, "3.4 Non-Functional Requirements")
    add_para(
        doc,
        "The architecture is engineered to satisfy eight critical non-functional requirements (NFR):"
    )
    add_bullet(doc, "NFR-1 (Inference Latency): The AI Trust Layer pre-commit validation pipeline must execute end-to-end feature extraction and anomaly scoring in under 150 milliseconds per telemetry payload.", "• ")
    add_bullet(doc, "NFR-2 (Blockchain Gas Efficiency): Individual on-chain condition writes must consume less than 85,000 gas, and batched updates (N=20) must average less than 50,000 gas per reading.", "• ")
    add_bullet(doc, "NFR-3 (Data Integrity & Tamper Evidence): The off-chain quarantine hash-chain must mathematically guarantee that any retroactive modification of historical logs is detectable within 10 milliseconds during validation sweeps.", "• ")
    add_bullet(doc, "NFR-4 (Relational Storage Performance): The dual-engine database layer must sustain a throughput of at least 500 concurrent read/write telemetry queries per second under connection-pooled PostgreSQL.", "• ")
    add_bullet(doc, "NFR-5 (Mobile Accessibility & Responsiveness): The client presentation interface must maintain 100% responsive fluid layout across viewport widths from 320px (mobile smartphones) to 2560px (ultra-wide desktop displays).", "• ")
    add_bullet(doc, "NFR-6 (Security & Cryptographic Standards): All password hashes must use bcrypt (work factor 12), API sessions must use HMAC-SHA256 JWTs with 24-hour expiration, and smart contracts must adhere strictly to audited OpenZeppelin v5.0 primitives.", "• ")
    add_bullet(doc, "NFR-7 (Scalability & Concurrency): The FastAPI asynchronous event loop must support non-blocking asynchronous I/O across database operations, IPFS uploads, and blockchain transaction relaying.", "• ")
    add_bullet(doc, "NFR-8 (Precision & Rounding Safety): All monetary values must be represented strictly as integer paise (1 INR = 100 paise) and all temperatures as integer deci-degrees Celsius (24.5°C = 245) to eliminate floating-point rounding errors.", "• ")

    add_h2(doc, "3.5 Target Stakeholder Profiles and Personas")
    add_para(
        doc,
        "To ensure human-centered design and seamless operational adoption, the AgriChain platform is tailored around five "
        "distinct stakeholder personas representing the real-world agricultural value chain:"
    )
    add_bullet(doc, "Persona 1: Ramesh Patel (Smallholder Farmer): Primary producer operating a 4-acre organic horticulture farm in Nashik, Maharashtra. Seeks guaranteed proof of organic origin, fair price realization without middleman deduction, and simple mobile-friendly crop registration without complex blockchain jargon.", "• ")
    add_bullet(doc, "Persona 2: Vikram Singh (Refrigerated Fleet Transporter): Cold-chain carrier managing multi-axle refrigerated trucks along National Highway corridors. Requires automated IoT reefer monitoring, instantaneous GPS waypoint tracking, clear custody transfer handshakes, and protection against false temperature breach claims.", "• ")
    add_bullet(doc, "Persona 3: Priya Sharma (Dark-Store Hub Manager): Urban fulfillment center operator responsible for inbound produce receiving, rapid quality grading, climate-controlled storage bay allocation, and rapid dispatch to quick-commerce delivery riders.", "• ")
    add_bullet(doc, "Persona 4: Ananya Iyer (Urban Retail Consumer): Health-conscious urban consumer purchasing fresh groceries. Demands verifiable transparency regarding harvest freshness, pesticide residue lab tests, cold-chain integrity, and ethical validation that the farmer received a fair share of the retail price.", "• ")
    add_bullet(doc, "Persona 5: Rajesh Verma (Supply Chain Quality Administrator): System administrator overseeing network health, smart contract circuit breakers, regulatory compliance auditing, quarantine log verification, and role-based permissions.", "• ")

    doc.add_page_break()

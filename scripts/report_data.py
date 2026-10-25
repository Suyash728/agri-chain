# scripts/report_data.py
# Complete text, tables, and metadata for AgriChain BE Major Project Report

STUDENTS = [
    {"name": "Doctor UmerKhan JunaidKhan", "id": "TU8S2425008"},
    {"name": "Kerkar Suyash Satish", "id": "TU8S2425003"},
    {"name": "Esaf Shanum Shakil", "id": "TU8S2425004"},
    {"name": "Patil Rutuja Sanjeev", "id": "TU8S2425006"}
]

GUIDE = "Prof. Shraddha Rokade"
COORDINATOR = "Prof. Snehal Mane"
HOD = "Dr. Sandeep Raskar"
PRINCIPAL = "Dr. Deven Shah"
COLLEGE = "Terna Engineering College"
DEPARTMENT = "Department of Artificial Intelligence (AI) and Data Science"
ACADEMIC_YEAR = "2026–2027"
ADDRESS = "Plot No. 12, Sector-22, Phase-II, Nerul (W), Navi Mumbai – 400 706"
TITLE = "A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains"

ABBREVIATIONS = [
    ("AI", "Artificial Intelligence"),
    ("IoT", "Internet of Things"),
    ("DFD", "Data Flow Diagram"),
    ("ERD", "Entity-Relationship Diagram"),
    ("RBAC", "Role-Based Access Control"),
    ("EVM", "Ethereum Virtual Machine"),
    ("IPFS", "InterPlanetary File System"),
    ("CID", "Content Identifier (Cryptographic Hash)"),
    ("GRN", "Goods Receipt Note / Inbound Receiving"),
    ("ML", "Machine Learning"),
    ("SHA", "Secure Hash Algorithm (e.g., SHA-256)"),
    ("GPS", "Global Positioning System"),
    ("API", "Application Programming Interface"),
    ("REST", "Representational State Transfer"),
    ("UI", "User Interface"),
    ("SCM", "Supply Chain Management"),
    ("XAI", "Explainable Artificial Intelligence"),
    ("SHAP", "Shapley Additive exPlanations"),
    ("MITM", "Man-in-the-Middle Attack"),
    ("IoE", "Internet of Everything")
]

TABLE_2_1_HEADER = ["Ref No.", "Paper Title", "Author(s) & Year", "Focus", "Key Contribution", "Limitation"]
TABLE_2_1_ROWS = [
    ["1", "Blockchain Technology for Global Supply Chain Management: A Survey of Applications, Challenges, Opportunities and Implications", "Dudczyk, Dunston & Crosby (2024)", "Blockchain in Global Supply Chains", "Reviews blockchain applications and benefits for global supply-chain transparency and traceability.", "Lacks agriculture-specific evaluation."],
    ["2", "Revolutionizing Agri-Food Supply Chain Management with Blockchain-Based Traceability and Navigation Integration", "Aggarwal, Rani, Rani & Sharma (2024)", "Blockchain in Agri-Food", "Provides blockchain-based traceability and navigation for food provenance and consumer trust.", "Scalability concerns in large-scale deployment."],
    ["3", "High-Efficiency Blockchain-Based Supply Chain Traceability", "Wu, Jiang & Cao (2023)", "Blockchain Traceability", "Improves efficiency of blockchain-based supply-chain traceability by reducing search latency and storage overhead.", "Limited real-world/large-scale validation."],
    ["4", "Integrating Blockchain Technology for Enhanced Transparency and Security in Supply Chains", "Chaker & Damak (2024)", "Blockchain for Supply Chain", "Discusses blockchain integration for supply-chain transparency and security.", "Mostly conceptual; limited quantitative evidence."],
    ["5", "Demystifying the Impact of Blockchain on Trust in Emerging and Established Relationships: A Case of Organic Food Supply Chains", "Yavaprabhas, Kurnia, Seyedghorban & Samson (2024)", "Blockchain in Organic Food", "Examines how blockchain can improve trust in organic food supply-chain relationships.", "Findings are context-specific to organic food."]
]

TABLE_2_2_HEADER = ["Ref No.", "Paper Title", "Author(s) & Year", "Focus", "Key Contribution", "Limitation"]
TABLE_2_2_ROWS = [
    ["1", "Optimizing Supply Chain Management With IoE and AI", "Agrawal, Aronkar, Palav, Badre, Karumuri & Bagale (2025)", "IoE & AI in SCM", "Explores AI and Internet of Everything for supply-chain optimization and decision-making.", "Lacks empirical validation in agricultural contexts."],
    ["2", "Zero-Day Exploits Detection with Adaptive WavePCA-Autoencoder (AWPA) Adaptive Hybrid Exploit Detection Network (AHEDNet)", "Mohamed, Al-Saleh, Sharma & Tejani (2025)", "ML-Based Security", "Uses a hybrid ML approach for proactive zero-day exploit detection.", "Requires high-quality, large training datasets."],
    ["3", "A Novel Malware Detection Model in the Software Supply Chain Based on LSTM and SVMs", "Zhou, Li, Fu & Jiao (2024)", "ML Malware Detection", "Uses LSTM and SVM-based models for malware detection.", "Higher model complexity increases deployment cost."],
    ["4", "Harnessing Advanced Hybrid Deep Learning Model for Real-Time Detection and Prevention of Man-in-the-Middle Cyber Attacks", "Kandasamy & Roseline (2025)", "Deep Learning Security", "Applies hybrid deep learning for real-time MITM attack detection and prevention.", "Computationally intensive for constrained devices."]
]

TABLE_2_3_HEADER = ["Ref No.", "Paper Title", "Author(s) & Year", "Focus", "Key Contribution", "Limitation"]
TABLE_2_3_ROWS = [
    ["1", "Secure Pharmaceutical Supply Chain Using Blockchain in IoT Cloud Systems", "Mangala, Naveen, Reddy, Buyya, Venugopal, Iyengar & Patnaik (2024)", "Blockchain + IoT", "Integrates blockchain with IoT-cloud systems for secure authentication and anti-counterfeiting.", "High system complexity limits adoption."],
    ["2", "Enhancing Supply Chain Resilience and Efficiency Through Internet of Things Integration: Challenges and Opportunities", "Shoomal, Jahanbakht, Componation & Ozay (2024)", "IoT-Enabled SCM", "Shows how IoT improves supply-chain resilience, efficiency and coordination.", "Data privacy risks remain unresolved."],
    ["3", "Supply Chain Management Growth With the Adoption of Blockchain Technology (BoT) and Internet of Things (IoT)", "Singh & Dadhich (2023)", "Blockchain + IoT", "Presents a model showing improved supply-chain coordination and visibility through Blockchain + IoT.", "Lacks real implementation and empirical testing."],
    ["4", "Blockchain-Driven Security for IoT Networks: State-of-the-Art, Challenges and Future Directions", "Maurya, Rishiwal, Yadav, Shiblee, Yadav, Agarwal & Chaudhry (2025)", "IoT Security", "Reviews blockchain-based approaches for improving IoT security and data protection.", "Introduces computational overhead."],
    ["5", "Enhancing IoT Data Security: Using the Blockchain to Boost Data Integrity and Privacy", "Eghmazi, Ataei, Landry & Chevrette (2024)", "IoT Data Security", "Uses blockchain to improve IoT data integrity, privacy and security.", "Scalability with high sensor-data volume is not fully addressed."]
]

TABLE_2_4_HEADER = ["Ref No.", "Paper Title", "Author(s) & Year", "Focus", "Key Contribution", "Limitation"]
TABLE_2_4_ROWS = [
    ["1", "Revolutionizing Agri-Food Supply Chain Management with Blockchain-Based Traceability and Navigation Integration", "Aggarwal, Rani, Rani & Sharma (2024)", "Agri-Food Traceability", "Improves end-to-end food provenance, traceability and consumer trust.", "Scalability concerns in large-scale deployment."],
    ["2", "Demystifying the Impact of Blockchain on Trust in Emerging and Established Relationships: A Case of Organic Food Supply Chains", "Yavaprabhas, Kurnia, Seyedghorban & Samson (2024)", "Organic Food Supply Chain", "Demonstrates blockchain's role in strengthening trust within organic food supply chains.", "Findings are specific to organic food case studies."],
    ["3", "Optimizing Supply Chain Management With IoE and AI", "Agrawal, Aronkar, Palav, Badre, Karumuri & Bagale (2025)", "AI in Supply Chain", "Explores AI and IoE for supply-chain optimization.", "Lacks empirical validation in agricultural contexts."],
    ["4", "Enhancing Supply Chain Resilience and Efficiency Through Internet of Things Integration: Challenges and Opportunities", "Shoomal, Jahanbakht, Componation & Ozay (2024)", "IoT Supply Chain", "Highlights IoT applications for real-time tracking and improved supply-chain resilience.", "Privacy, interoperability and scalability challenges."],
    ["5", "Blockchain Technology for Global Supply Chain Management: A Survey of Applications, Challenges, Opportunities and Implications", "Dudczyk, Dunston & Crosby (2024)", "Global Supply Chain", "Identifies blockchain's benefits for transparency and traceability across supply chains.", "Does not specifically evaluate agricultural applications."]
]

TABLE_2_5_HEADER = ["Dimension / Parameter", "Existing Supply Chain Systems", "Proposed AgriChain Framework"]
TABLE_2_5_ROWS = [
    ["System Architecture", "Mainly focus on blockchain-based traceability in isolation", "Unified 5-tier architecture: Blockchain + IoT + AI Trust Layer + Smart Contracts + React UI"],
    ["Sensor Data Validation", "IoT data directly recorded on-chain without validation ('Garbage In, Garbage Out')", "Multi-stage AI Trust Layer validates telemetry off-chain before committing to blockchain"],
    ["Smart Contract Customization", "Monolithic, rigid contracts with limited parameter flexibility", "Modular smart contracts (ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig) with OpenZeppelin RBAC and Pausable circuit breakers"],
    ["Payment & Price Transparency", "Opaque intermediary markups; payments unlinked to verified custody", "Transparent, cumulative on-chain price trail recording farmer gate price and actor margins at every handoff"],
    ["Off-Chain Storage & Data Integrity", "Unprotected off-chain databases vulnerable to silent tampering", "Tamper-evident SHA-256 Quarantine Hash-Chain and decentralized IPFS document vault with on-chain CIDs"],
    ["Handling of Corrupted Telemetry", "Thermal breaches or sensor faults pollute public ledger", "Anomalies, sensor freezes, and replay attacks isolated into cryptographic quarantine without wasting gas"]
]


TABLE_4_1_HEADER = ["Category", "Component / Specification", "Purpose in Architecture"]
TABLE_4_1_ROWS = [
    ["Operating System", "Windows 11 / Linux Ubuntu 22.04 LTS", "Host environment for local nodes, backend, and development servers"],
    ["Programming Languages", "Python 3.11+, Solidity 0.8.28, JavaScript (ES6+), HTML5/CSS3", "Core backend, smart contract development, and web application programming"],
    ["Blockchain & Tooling", "Hardhat v2.22, Polygon Amoy Testnet (Chain ID 80002)", "EVM execution environment, compilation, testing, and deployment"],
    ["Smart Contract Library", "OpenZeppelin Contracts v5.0 (AccessControl, Pausable)", "Audited role-based access control and emergency circuit breaker patterns"],
    ["AI & Machine Learning", "Scikit-Learn (Isolation Forest), NumPy, SciPy", "Unsupervised anomaly detection, multi-dimensional feature engineering"],
    ["Backend Web Framework", "FastAPI, Uvicorn (ASGI), Web3.py v6.x, Pydantic v2", "High-throughput asynchronous REST API, blockchain relayer, schema validation"],
    ["Database & Storage", "PostgreSQL (Supabase IPv4 Pooler), SQLite 3 (WAL mode), Pinata IPFS Gateway", "Dual-engine relational storage, tamper-evident hash chaining, decentralized document pinning"],
    ["Frontend Framework", "React 18, Vite v6.0, Tailwind CSS v3.4, Lucide React", "Responsive multi-role UI dashboards (Farmer, Logistics, Dark Store, Consumer, Admin)"],
    ["IoT Hardware / Sim", "ESP32 DevKit v1, DHT22 Sensor, NEO-6M GPS, Python CLI Simulator", "Physical and synthetic multi-fault environmental telemetry streaming"]
]

TABLE_4_2_HEADER = ["Crop Name", "Min Temp (C)", "Max Temp (C)", "Min Humidity (%)", "Max Humidity (%)", "Optimal Storage Category"]
TABLE_4_2_ROWS = [
    ["Tomato", "2.0 C (20 deci-C)", "8.0 C (80 deci-C)", "85%", "95%", "Chilled Fresh Produce / High Humidity"],
    ["Mango", "10.0 C (100 deci-C)", "15.0 C (150 deci-C)", "85%", "90%", "Tropical Climate Control / Low Chill"],
    ["Wheat", "15.0 C (150 deci-C)", "25.0 C (250 deci-C)", "50%", "70%", "Ambient Dry Grain Storage / Low Moisture"]
]

TABLE_5_1_HEADER = ["Evaluation Metric", "Recorded Result", "Description & Interpretation"]
TABLE_5_1_ROWS = [
    ["Number of Synthetic Samples", "1,000", "Total balanced test samples evaluated across 7 realistic telemetry scenarios"],
    ["Accuracy", "96.0%", "Proportion of total sensor transmissions correctly classified as valid or anomalous"],
    ["Precision", "94.6%", "Proportion of flagged anomalies that were genuine faults (low false-positive burden)"],
    ["Recall (Sensitivity)", "100.0%", "Detection rate of genuine anomalies (zero undetected breaches or thermal failures)"],
    ["F1-Score", "97.2%", "Harmonic mean of precision and recall demonstrating exceptional balance"],
    ["False-Positive Rate", "5.4%", "Marginal rate of benign baseline fluctuations subjected to secondary verification"],
    ["Model Inference Latency", "31.8 ms", "Average execution time per reading, well within real-time IoT transmission intervals"]
]

TABLE_5_2_HEADER = ["Verification Area / Sub-System", "Recorded Outcome", "Scope of Automated Validation"]
TABLE_5_2_ROWS = [
    ["Modular Smart-Contract RBAC Checks", "PASS", "Gating of registerBatch, transferCustody, recordCondition to assigned roles"],
    ["Batched Condition Oracle Writes", "PASS", "EVM transaction execution of recordConditionsBatch fitting single gas slot"],
    ["AI Trust Multi-Fault Evaluation", "PASS", "Detection of all 7 fault profiles (temp spikes, GPS teleportation, replay attacks)"],
    ["Multi-Role Supply Chain Journey", "PASS", "State progression: REGISTERED -> IN_TRANSIT -> IN_STORAGE -> AT_RETAIL -> SOLD"],
    ["IoT Hardware Breach & Push-Button Quarantine", "PASS", "Interception of 48 C thermal breaches and routing to quarantine hash-chain"],
    ["Decentralized IPFS Quality Certificates", "PASS", "Pinata upload, CID generation (ipfs://Qm...), and on-chain hash anchoring"],
    ["Dark Store Inbound Receiving & Checkout", "PASS", "GRN bay allocation, micro-inventory update, and retail checkout execution"],
    ["Consumer Reviews & Rating Aggregation", "PASS", "Verified review submission strictly for SOLD batches with 5-star scoring"],
    ["Multi-Stage Fair Price Distribution", "PASS", "Cumulative paise calculation verifying farmer price share transparency (50.0%)"],
    ["Smart Contract Pausable Circuit Breakers", "PASS", "Administrative emergency pause reverting state mutations with EnforcedPause error"]
]

TABLE_5_3_HEADER = ["Batch Size (N)", "Individual Writes Total Gas", "Batched Write Gas", "Gas Reduction (%)", "Average Gas Per Reading"]
TABLE_5_3_ROWS = [
    ["1", "71,484", "—", "0.00%", "71,484"],
    ["5", "357,420", "204,460", "42.79%", "40,892"],
    ["10", "714,840", "369,180", "48.35%", "36,918"],
    ["20", "1,429,680", "676,140", "52.71%", "33,807"]
]

TABLE_5_4_HEADER = ["Supply Chain Stage", "Actor in Custody", "Cumulative Price (INR)", "Cumulative Price (Paise)", "Stage Value Addition"]
TABLE_5_4_ROWS = [
    ["Farm Harvest (Stage 0)", "Rahul Patil (Farmer)", "INR 10.00 / kg", "1,000 paise", "Base cultivation & harvest value"],
    ["Logistics Dispatch (Stage 1)", "Safexpress Logistics", "INR 14.00 / kg", "1,400 paise", "INR 4.00 cold-chain transportation markup"],
    ["Dark Store Receiving (Stage 2)", "Pune Hub DarkStore", "INR 17.50 / kg", "1,750 paise", "INR 3.50 climate storage & handling markup"],
    ["Consumer Retail Checkout (Stage 3)", "Priya Sharma (Consumer)", "INR 20.00 / kg", "2,000 paise", "INR 2.50 retail distribution & quality assurance"]
]

BIBLIOGRAPHY = [
    "[1] A. Agrawal, S. Aronkar, S. Palav, A. Badre, S. Karumuri, and P. Bagale, \"Optimizing Supply Chain Management With IoE and AI,\" in Transforming Businesses With Internet of Everything (IoE) and AI, IGI Global, 2025, pp. 210–235.",
    "[2] M. Mohamed, A. Al-Saleh, A. Sharma, and M. Tejani, \"Zero-Day Exploits Detection with Adaptive WavePCA-Autoencoder (AWPA) Adaptive Hybrid Exploit Detection Network (AHEDNet),\" Scientific Reports, vol. 15, no. 1, p. 4128, 2025.",
    "[3] A. Maurya, S. Rishiwal, R. Yadav, M. Shiblee, S. Yadav, S. Agarwal, and K. Chaudhry, \"Blockchain-Driven Security for IoT Networks: State-of-the-Art, Challenges and Future Directions,\" Peer-to-Peer Networking and Applications, vol. 18, pp. 115–142, 2025.",
    "[4] D. Dudczyk, M. Dunston, and M. Crosby, \"Blockchain Technology for Global Supply Chain Management: A Survey of Applications, Challenges, Opportunities and Implications,\" IEEE Access, vol. 12, pp. 45210–45235, 2024.",
    "[5] S. Yavaprabhas, R. Kurnia, M. Seyedghorban, and D. Samson, \"Demystifying the Impact of Blockchain on Trust in Emerging and Established Relationships: A Case of Organic Food Supply Chains,\" International Journal of Operations & Production Management, vol. 44, no. 6, pp. 1120–1145, 2024.",
    "[6] S. Aggarwal, P. Rani, R. Rani, and V. Sharma, \"Revolutionizing Agri-Food Supply Chain Management with Blockchain-Based Traceability and Navigation Integration,\" Computers and Electronics in Agriculture, vol. 218, p. 108654, 2024.",
    "[7] H. Wu, Z. Jiang, and Y. Cao, \"High-Efficiency Blockchain-Based Supply Chain Traceability with Optimized State Verification,\" IEEE Transactions on Network and Service Management, vol. 20, no. 4, pp. 4110–4124, 2023.",
    "[8] M. Chaker and M. Damak, \"Integrating Blockchain Technology for Enhanced Transparency and Security in Supply Chains,\" Journal of Cleaner Production, vol. 434, p. 140122, 2024.",
    "[9] S. Mangala, N. Naveen, S. Reddy, R. Buyya, K. Venugopal, S. Iyengar, and L. Patnaik, \"Secure Pharmaceutical Supply Chain Using Blockchain in IoT Cloud Systems,\" IEEE Internet of Things Journal, vol. 11, no. 8, pp. 14205–14218, 2024.",
    "[10] S. Shoomal, M. Jahanbakht, F. Componation, and E. Ozay, \"Enhancing Supply Chain Resilience and Efficiency Through Internet of Things Integration: Challenges and Opportunities,\" IEEE Transactions on Engineering Management, vol. 71, pp. 3120–3136, 2024.",
    "[11] R. Singh and A. Dadhich, \"Supply Chain Management Growth With the Adoption of Blockchain Technology (BoT) and Internet of Things (IoT),\" in Advances in Supply Chain Intelligence, Springer, 2023, pp. 185–204.",
    "[12] S. Eghmazi, A. Ataei, L. Landry, and G. Chevrette, \"Enhancing IoT Data Security: Using the Blockchain to Boost Data Integrity and Privacy,\" Computers & Security, vol. 138, p. 103680, 2024.",
    "[13] X. Zhou, W. Li, X. Fu, and Y. Jiao, \"A Novel Malware Detection Model in the Software Supply Chain Based on LSTM and SVMs,\" Journal of Systems Architecture, vol. 148, p. 103090, 2024.",
    "[14] M. Kandasamy and J. Roseline, \"Harnessing Advanced Hybrid Deep Learning Model for Real-Time Detection and Prevention of Man-in-the-Middle Cyber Attacks,\" Journal of Information Security and Applications, vol. 80, p. 103672, 2025.",
    "[15] F. Carbo-Valverde, P. Cuadros-Solas, and F. Rodriguez-Fernandez, \"Machine Learning in Financial Services and Fraud Detection: Random Forests and Causal Forests,\" Financial Innovation, vol. 6, no. 1, pp. 1–28, 2020.",
    "[16] M. Btoush, A. Al-Aroud, and S. Al-Khasawneh, \"A Systematic Literature Review of Machine Learning and Deep Learning Techniques for Anomaly Detection in Critical Systems,\" IEEE Access, vol. 11, pp. 98450–98475, 2023."
]

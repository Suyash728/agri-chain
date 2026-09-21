const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, SectionType
} = require('docx');
const fs = require('fs');

const FONT = 'Times New Roman';
const BODY = 20;      // half-points => 10pt
const SMALL = 16;     // 8pt for tables
const TW = 9360;      // full text width in DXA

// ---------- helpers ----------
const p = (text, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.JUSTIFIED,
  spacing: { after: opts.after === undefined ? 100 : opts.after, line: opts.line || 240 },
  indent: opts.indent === undefined ? { firstLine: 200 } : opts.indent,
  children: [new TextRun({ text, font: FONT, size: opts.size || BODY, bold: !!opts.bold, italics: !!opts.italics })]
});

const rich = (runs, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.JUSTIFIED,
  spacing: { after: opts.after === undefined ? 100 : opts.after, line: 240 },
  indent: opts.indent === undefined ? { firstLine: 200 } : opts.indent,
  children: runs.map(r => new TextRun({
    text: r.t, font: FONT, size: r.size || BODY, bold: !!r.b, italics: !!r.i
  }))
});

const h1 = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT, size: BODY, allCaps: true })]
});

const h2 = (text) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 160, after: 100 },
  indent: { firstLine: 200 },
  children: [new TextRun({ text, font: FONT, size: BODY, italics: true })]
});

const cell = (text, w, opts = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: opts.head ? { type: ShadingType.CLEAR, fill: 'D9D9D9' } : undefined,
  margins: { top: 40, bottom: 40, left: 60, right: 60 },
  children: [new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 0, line: 200 },
    indent: { firstLine: 0 },
    children: [new TextRun({ text, font: FONT, size: SMALL, bold: !!opts.head })]
  })]
});

const caption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 80 },
  indent: { firstLine: 0 },
  children: [new TextRun({ text, font: FONT, size: SMALL })]
});

const ref = (n, text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 40, line: 200 },
  indent: { left: 360, hanging: 360 },
  children: [new TextRun({ text: `[${n}] ${text}`, font: FONT, size: SMALL })]
});

// ---------- SECTION 1: title block (single column) ----------
const titleBlock = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    indent: { firstLine: 0 },
    children: [new TextRun({
      text: 'Trust in Off-Chain Data for Blockchain-Based Agricultural Supply Chain Traceability: A Survey of Oracle Mechanisms and AI-Driven Validation',
      font: FONT, size: 48
    })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 }, indent: { firstLine: 0 },
    children: [new TextRun({ text: 'Suyash Satish Kerkar, [Author 2], [Author 3], [Author 4], [Guide Name]', font: FONT, size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 }, indent: { firstLine: 0 },
    children: [new TextRun({ text: 'Department of Artificial Intelligence and Data Science', font: FONT, size: 20, italics: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 }, indent: { firstLine: 0 },
    children: [new TextRun({ text: 'Terna Engineering College, Navi Mumbai, Maharashtra, India', font: FONT, size: 20, italics: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 300 }, indent: { firstLine: 0 },
    children: [new TextRun({ text: '{email1, email2, email3, email4, guide}@ternaengg.ac.in', font: FONT, size: 20 })]
  }),
];

// ---------- SECTION 2: abstract + body part 1 (two columns) ----------
const bodyA = [
  rich([
    { t: 'Abstract—', b: true },
    { t: 'Blockchain-based traceability systems are widely proposed as a remedy for the opacity, fragmentation, and fraud that characterise agricultural supply chains. The property these systems actually deliver, however, is narrower than is usually claimed. A distributed ledger guarantees that a record, once committed, cannot be altered undetected; it guarantees nothing about whether that record was true at the moment of commitment. In an agricultural supply chain, where nearly every on-chain fact originates from an IoT sensor deployed in an uncontrolled environment or from manual entry by a party with an economic stake in the outcome, this distinction is decisive. This survey reviews the literature addressing that gap. We examine 52 works spanning four intersecting bodies of research: blockchain traceability frameworks for agri-food supply chains, IoT sensing and cold-chain monitoring, the blockchain oracle problem and data on-chaining, and machine-learning approaches to sensor data validation. We classify traceability frameworks by whether and how they validate inputs prior to commitment, and we classify oracle trust mechanisms by the assumption on which their trust rests. Our principal finding is that the agri-food traceability literature and the oracle trust literature have developed largely in isolation: traceability frameworks overwhelmingly treat sensor readings as ground truth at ingestion, while oracle trust research remains oriented toward financial data feeds and rarely addresses the physical, domain-constrained data characteristic of perishable logistics. We identify six research gaps arising from this separation, of which the most consequential is that no reviewed work clearly distinguishes implausible data, which should be rejected, from plausible data reporting a genuine violation, which must be recorded and attributed.' }
  ], { indent: { firstLine: 0 } }),
  rich([
    { t: 'Index Terms—', b: true },
    { t: 'Blockchain, oracle problem, agricultural supply chain, traceability, Internet of Things, anomaly detection, smart contracts, data integrity, cold chain.' }
  ], { indent: { firstLine: 0 }, after: 200 }),

  h1('I. Introduction'),
  p('Agricultural supply chains couple a large number of weakly connected actors — farmers, aggregators, transporters, warehouses, retailers, and consumers — across long distances and extended timescales. The resulting structure is characteristically opaque. Records are fragmented across the parties that generate them, held in incompatible formats, and in many regions maintained on paper or not at all. The consequences are well documented: delayed product recalls, food adulteration and fraud, disputed liability for spoilage, and a persistent asymmetry of information in which the producer has the least visibility into the chain and captures the smallest share of final value [1]–[3].', { indent: { firstLine: 0 } }),
  p('Blockchain technology has been proposed extensively as the structural answer to this opacity. A distributed ledger offers a shared record that no single participant controls, that all participants can read, and that none can retroactively alter. Smart contracts add programmable enforcement, allowing custody transfers, quality thresholds, and settlement conditions to execute without a trusted intermediary. A substantial body of work now demonstrates such systems for agri-food traceability, from early platform implementations [1] to crop-specific deployments [2] and provenance frameworks designed for scale [21].'),
  p('The claim these systems make, however, is frequently overstated in a specific and consequential way. Immutability is a property of the record, not of the world the record describes. A blockchain guarantees that a stored temperature reading has not been modified since it was written. It offers no assurance that the sensor which produced that reading was functioning correctly, was physically present where it claimed to be, or was not deliberately manipulated before transmission. Once a false value is committed, immutability preserves it with exactly the fidelity accorded to a true one, and confers upon it the same appearance of authority. The system becomes, in the precise sense, tamper-evident but not trustworthy.'),
  p('This is a recognised problem in the blockchain literature, where it is known as the oracle problem: smart contracts cannot natively access external state, and any mechanism that imports such state becomes a point at which the trust guarantees of the ledger terminate [4], [5], [8]. What is notable is how rarely the agri-food traceability literature engages with it. Caldarelli\'s examination of blockchain application papers found that only a small minority considered the role of oracles at all, and fewer still discussed the limitations oracles introduce [9]. Traceability frameworks are typically evaluated on transaction latency, throughput, and gas cost — metrics that measure how efficiently the system records data, and say nothing about whether the recorded data deserved to be there.'),
  p('The gap matters more in agriculture than in most domains. Financial oracles report on data that is itself digitally native and independently observable by many parties; a manipulated price feed can be cross-checked against other exchanges. A temperature reading from a refrigerated truck on a rural highway has no independent observer. It is generated by inexpensive hardware, in a physically hostile environment, by a device in the custody of the party whose performance it measures. The incentive to falsify is direct, the opportunity is unsupervised, and the verification surface is minimal.'),
  p('This survey reviews the mechanisms proposed to close that gap, and asks what remains unaddressed. Our contributions are as follows:'),
  p('1) We synthesise four research areas that are rarely surveyed together: agri-food blockchain traceability, IoT cold-chain sensing, blockchain oracle trust, and machine-learning anomaly detection for sensor streams.', { indent: { left: 200, firstLine: 0 } }),
  p('2) We introduce a classification of traceability frameworks by input validation posture — whether inputs are validated before commitment, and if so by what mechanism — and apply it to the reviewed implementations.', { indent: { left: 200, firstLine: 0 } }),
  p('3) We classify oracle trust mechanisms by their underlying trust assumption, and assess the applicability of each class to physical sensor data in perishable logistics.', { indent: { left: 200, firstLine: 0 } }),
  p('4) We identify six research gaps, and argue in particular that the conflation of implausible readings with genuine threshold violations is a foundational error that invalidates the purpose of cold-chain monitoring.', { indent: { left: 200, firstLine: 0 } }),
  p('The remainder of this paper is organised as follows. Section II establishes the necessary background. Section III describes the survey methodology. Section IV reviews the literature thematically. Section V presents a comparative analysis. Sections VI and VII set out research gaps and open challenges respectively, Section VIII discusses future directions, and Section IX concludes.'),

  h1('II. Problem Domain and Background'),
  h2('A. The Agricultural Supply Chain'),
  p('A typical agri-food chain comprises production, aggregation, processing, transport, storage, retail, and consumption stages, with custody of the physical goods transferring at each boundary. Two features distinguish it from manufacturing supply chains. First, the product degrades continuously and irreversibly as a function of environmental exposure, so the conditions of transit are themselves part of product quality rather than incidental to it. Second, the upstream participants are numerous, small, and weakly organised, which means the party with the greatest interest in transparency is also the party least able to demand it.', { indent: { firstLine: 0 } }),

  h2('B. Blockchain and Smart Contracts'),
  p('A blockchain is an append-only ledger replicated across participating nodes, in which agreement on state is reached by a consensus protocol rather than by a central authority. Smart contracts are deterministic programs executed by every node, whose outputs are therefore agreed by consensus. Determinism is what makes consensus possible, and it is also the source of the oracle problem: a contract that could issue an external network request would produce different results on different nodes at different times, breaking agreement [5].', { indent: { firstLine: 0 } }),
  p('Permissioned ledgers such as Hyperledger Fabric and permissionless ones such as Ethereum have both been applied to traceability, with differing trade-offs in throughput, cost, and governance [1], [19]. The choice affects performance but not the oracle problem, which arises identically in both.'),

  h2('C. IoT Sensing in Perishable Logistics'),
  p('Cold-chain instrumentation typically comprises temperature and humidity sensing, location tracking, and in some deployments shock or light detection, transmitted over cellular or short-range links to a gateway. The operating environment is adversarial to measurement in mundane ways: sensors experience calibration drift over extended use, low-temperature operation increases measurement error, connectivity is intermittent on rural routes, and power constraints force sparse sampling [26], [27]. These are ordinary engineering difficulties, but they matter here because every one of them produces data that is wrong without being malicious — and a validation mechanism must distinguish between the two.', { indent: { firstLine: 0 } }),

  h2('D. Blockchain Oracles and Data On-Chaining'),
  p('An oracle is any mechanism that supplies external state to a smart contract. Oracles are commonly classified along several axes: inbound versus outbound, push versus pull, software versus hardware, and centralised versus decentralised [12], [13]. Heiss et al. reframed the problem as one of data on-chaining, arguing that the relevant question is not merely how data reaches the chain but what trust properties the on-chaining pipeline preserves [6]. This framing is important for the present survey because it directs attention to the pre-processing that occurs between sensor and ledger — precisely where validation would have to sit [7].', { indent: { firstLine: 0 } }),

  h2('E. Anomaly Detection for Sensor Streams'),
  p('Anomaly detection methods relevant to telemetry fall into several families. Statistical and threshold-based methods flag values outside a fixed or adaptive range; they are interpretable and cheap but cannot detect anomalies whose individual values are unremarkable. Distance- and density-based methods identify points distant from the bulk of observations. Tree-based isolation methods, of which Isolation Forest [16] is the canonical example, exploit the observation that anomalies are easier to isolate under random partitioning, and require no labelled data. Reconstruction-based deep methods, notably LSTM encoder-decoder architectures [17], model temporal structure and flag sequences the model reconstructs poorly, making them suited to drift and flatline faults that are invisible pointwise. Pang et al. provide a comprehensive taxonomy of the deep learning approaches [18].', { indent: { firstLine: 0 } }),

  h1('III. Survey Methodology'),
  p('We conducted a structured search across IEEE Xplore, ACM Digital Library, ScienceDirect, SpringerLink, and Google Scholar, supplemented by backward and forward citation snowballing from the principal oracle surveys [4], [5].', { indent: { firstLine: 0 } }),
  p('Search strings combined terms from the four target areas, including ("blockchain oracle" OR "data on-chaining") AND (IoT OR sensor) AND trust; ("oracle problem") AND ("supply chain" OR traceability); ("anomaly detection") AND ("cold chain" OR perishable); and (agriculture OR "agri-food") AND blockchain AND (IoT OR sensor).'),
  p('The time window was 2016 to 2026. The lower bound reflects the emergence of the oracle problem as a distinct research topic; foundational algorithmic references predating this window were retained where they are canonical.'),
  p('Inclusion criteria were: peer-reviewed publication or established preprint; written in English; addressing blockchain-based traceability, oracle or on-chaining trust, or sensor anomaly detection; and reporting a method, architecture, or evaluation. Works were excluded where they offered no methodological contribution, appeared in non-indexed venues, were duplicates, or were commercial white papers without independent validation.'),
  p('Screening proceeded in three stages. Database search returned 214 records. After duplicate removal, 176 remained. Title and abstract screening reduced this to 78. Full-text assessment yielded 52 works included in the review, of which 21 are examined in the comparative analysis of Section V. [NOTE TO AUTHORS: replace these counts with your actual screening numbers and render as a PRISMA flow diagram.]'),
  p('For each included work we recorded: application domain, data source, whether inputs were validated before commitment, method or algorithm, evaluation basis, reported results, and stated limitations. This extraction schema directly produces the comparative tables in Section V.'),

  h1('IV. Literature Review'),
  h2('A. Blockchain Foundations for Agri-Food Traceability'),
  p('The foundational implementations established that end-to-end traceability on a distributed ledger is technically feasible. Caro et al. presented AgriBlockIoT, a decentralised traceability system integrating IoT devices with the ledger, and notably implemented it on both Ethereum and Hyperledger Sawtooth to permit direct comparison of latency, CPU, and network cost [1]. Salah et al. demonstrated a crop-specific Ethereum implementation for soybean traceability, using smart contracts to govern transitions between supply-chain stages [2]. Biswas et al. applied similar principles to wine, where provenance carries a direct price premium and counterfeiting is economically attractive [22]. Malik et al. addressed the scalability limits these systems encounter, proposing a layered framework to support provenance queries at volume [21].', { indent: { firstLine: 0 } }),
  p('Broader reviews confirm both the breadth of activity and its consistent shape. Casino et al., surveying blockchain applications across domains, found supply chain to be among the most active application areas while noting a prevalence of proof-of-concept evaluation over deployment [3]. Panarello et al. surveyed blockchain–IoT integration specifically, identifying device constraints and data volume as recurring obstacles [19].'),
  p('What is consistent across this body of work is the treatment of the input. Data arriving from an IoT device is written to the ledger, and the contribution of the system is located in what happens afterwards — how efficiently it is stored, how it is queried, who may read it. The question of whether the arriving data was correct is, with few exceptions, outside the scope of these frameworks. This is not an oversight on the part of individual authors so much as a shared framing, and it is the framing this survey seeks to make visible.'),

  h2('B. IoT Integration and Cold-Chain Monitoring'),
  p('A parallel literature addresses the sensing layer on its own terms. Work on cold-chain monitoring establishes the practical realities of the measurement environment. Studies of anomaly detection in cold-chain data streams identify strong noise, elevated measurement error at low temperature, accuracy degradation over sensor lifetime, and high data volume and dimensionality as the defining challenges [26]. Deployment-oriented work reports systems built on business-defined thresholds rather than learned models, with decision support delivered by alerting [27] — an approach that is robust and interpretable but incapable of detecting faults whose values fall within nominal range.', { indent: { firstLine: 0 } }),
  p('Vangala et al. examined secure sensing for agricultural IoT from a blockchain perspective, addressing device authentication and the security of the sensing layer itself [20]. This is an important complement to the traceability literature, because it targets the assumption that the traceability frameworks leave implicit: that the device reporting is the device it claims to be.'),
  p('The cold-chain and traceability literatures, however, rarely cite one another. Work on sensor reliability tends to terminate at the alerting or dashboard layer; work on blockchain traceability tends to begin at the point where a reading has already been accepted.'),

  h2('C. The Oracle Problem and Data On-Chaining'),
  p('The oracle literature addresses the trust boundary directly. Egberts framed the problem early, arguing that reliance on external data sources undermines the decentralisation properties that motivate ledger adoption in the first place [8]. Al-Breiki et al. provided the standard reference treatment, analysing the notion of trust in oracles and comparing the trust-enabling features of leading platforms and approaches [4]. Pasdar et al. subsequently produced a comprehensive survey of oracle implementations, situating the problem as one of connecting programmable contracts to the systems where real-world state resides [5], and separately catalogued recurring oracle design patterns [13].', { indent: { firstLine: 0 } }),
  p('Several mechanisms for establishing oracle trustworthiness recur. Trusted execution environments allow an oracle to attest that data was obtained from a specified source without modification, as demonstrated by authenticated data feed designs [24]. Decentralised oracle networks distribute the reporting function across independent nodes and aggregate their submissions, substituting majority honesty for single-party trust. Reputation mechanisms weight submissions by historical reliability [14]. Recent work applies machine learning to the oracle selection problem itself, using reinforcement learning to balance oracle trustworthiness against cost [14], [25].'),
  p('Heiss et al. contributed the framing most directly relevant here. Their work on data on-chaining systems shifts the question from the oracle as an actor to the pipeline as a process with trust properties to be preserved [6]. In subsequent work they addressed the specific problem that arises when sensor data is pre-processed before commitment: signatures constructed over raw input no longer apply to processed output, so integrity is not end-to-end, and the pre-processing step becomes an exploitable position that stakeholders cannot validate through consensus [7]. This is the closest existing treatment of the problem this survey identifies in the agricultural setting.'),
  p('Caldarelli et al. examined the oracle problem specifically in traceability, arguing that for non-fungible physical products the binding between the physical item and its digital record is itself an oracle problem, and one that cryptographic measures alone cannot resolve [9]. Al Sadawi et al. surveyed the blockchain–IoT–oracle intersection as a whole [10], and Albizri and Appelbaum characterised the resulting situation as a paradox in which systems designed to eliminate trusted intermediaries reintroduce one at the data boundary [11].'),
  p('The domain orientation of this literature is nonetheless evident. Its motivating examples are predominantly financial — price feeds, prediction markets, decentralised finance — where data is digitally native, independently observable, and adversarially valuable in direct monetary terms. Physical sensor data in a logistics context has a different structure: it is continuous rather than discrete, governed by physical laws that constrain plausible transitions, produced by devices with identity but no independent corroboration, and valuable to falsify for reasons of liability rather than direct extraction.'),

  h2('D. Machine Learning for Sensor Data Validation'),
  p('Work combining machine learning with blockchain for IoT data has grown substantially, though its centre of gravity is intrusion detection rather than data validation. Surveys of IoT anomaly detection catalogue the available techniques and note blockchain as an emerging complement, principally for tamper-evident logging of detection outcomes [28], [29]. Several architectures place deep anomaly detection at the edge and commit results to a ledger, with the ledger providing auditability for the detection process rather than validation of the underlying stream.', { indent: { firstLine: 0 } }),
  p('For the algorithms themselves, the relevant families are well established. Isolation Forest offers unsupervised detection with low computational cost and no labelling requirement [16]. LSTM encoder-decoder architectures model temporal dependency and detect anomalies through reconstruction error, addressing fault classes such as drift and flatline that pointwise methods miss [17]. Pang et al. survey the deep learning landscape comprehensively [18].'),
  p('A small number of works apply such methods explicitly at the ingestion boundary. Lv et al. addressed location spoofing detection in blockchain-based IoT systems using a fuzzy analytic hierarchy process to assess the trustworthiness of location proofs [23] — a direct instance of validating a specific claim class before accepting it. This remains the exception rather than the pattern.'),

  h2('E. Device-Level and Cryptographic Integrity'),
  p('A final strand addresses integrity at the device. Authentication schemes bind readings to a device identity, and hardware mechanisms including secure elements and physical unclonable functions aim to make that identity resistant to extraction. Al Breiki et al. combined blockchain with trusted oracles for decentralised access control over IoT data [15]. These measures are necessary and complementary but insufficient in isolation: cryptographic authentication establishes that a reading originated from a particular device, and says nothing about whether that device was reporting the truth. A compromised or drifting sensor produces cryptographically impeccable falsehoods.', { indent: { firstLine: 0 } }),
];

// ---------- SECTION 3: tables (single column) ----------
const tRow = (cells, w, head) => new TableRow({
  tableHeader: !!head,
  children: cells.map((c, i) => cell(c, w[i], { head }))
});

const W1 = [560, 1300, 1150, 1450, 1600, 1450, 1850];
const W2 = [1500, 1750, 2100, 2000, 2010];

const table1 = new Table({
  columnWidths: W1,
  width: { size: TW, type: WidthType.DXA },
  rows: [
    tRow(['Ref', 'Domain / Focus', 'Data Source', 'Input Validation Before Commitment', 'Method / Platform', 'Evaluation Basis', 'Stated Limitation'], W1, true),
    tRow(['[1]', 'Agri-food traceability', 'IoT devices', 'None stated', 'Ethereum and Hyperledger Sawtooth', 'Latency, CPU, network usage', 'Preliminary evaluation; no input trust model'], W1),
    tRow(['[2]', 'Soybean supply chain', 'Actor-entered', 'None stated', 'Ethereum smart contracts', 'Functional demonstration; cost', 'Assumes honest actor input'], W1),
    tRow(['[21]', 'Supply-chain provenance', 'Actor-entered', 'None stated', 'Layered permissioned framework', 'Scalability of provenance queries', 'Input integrity out of scope'], W1),
    tRow(['[22]', 'Wine provenance', 'Actor-entered', 'None stated', 'Blockchain traceability system', 'System demonstration', 'Physical–digital binding unaddressed'], W1),
    tRow(['[20]', 'Agricultural IoT sensing', 'Sensor devices', 'Device authentication', 'Blockchain-based secure sensing', 'Security analysis', 'Authenticates device, not reading veracity'], W1),
    tRow(['[7]', 'Generic IoT on-chaining', 'Sensor devices', 'Yes — verifiable pre-processing', 'Trustworthy pre-processing workflow', 'Security argument; prototype', 'Not domain-specific; no policy semantics'], W1),
    tRow(['[23]', 'IoT location proofs', 'Location data', 'Yes — spoofing detection', 'Fuzzy AHP evaluation', 'Simulation', 'Single claim class (location only)'], W1),
    tRow(['[26]', 'Cold-chain logistics', 'Sensor stream', 'Detection only, off-chain', 'Stream anomaly detection', 'Detection accuracy', 'No ledger integration'], W1),
    tRow(['[27]', 'Cold-chain transport', 'Sensor stream', 'Threshold rules only', 'IoT alerting and dashboard', 'Operational deployment', 'Cannot detect in-range faults'], W1),
    tRow(['[14]', 'Industrial IoT oracle', 'Heterogeneous off-chain', 'Yes — node selection and reputation', 'Oracle scheme with QoS balancing', 'Security and QoS analysis', 'Not applied to physical perishables'], W1),
    tRow(['[NOTE]', 'Extend this table to 15–20 rows as your screening completes. Each row must be filled from the full text, not the abstract.', '', '', '', '', ''], W1),
  ]
});

const table2 = new Table({
  columnWidths: W2,
  width: { size: TW, type: WidthType.DXA },
  rows: [
    tRow(['Mechanism Class', 'Representative Work', 'Trust Assumption', 'Strength', 'Limitation for Perishable Logistics'], W2, true),
    tRow(['Trusted execution environment', '[24]', 'Hardware enclave is not compromised', 'Attests data was retrieved unmodified from a named source', 'Attests transmission fidelity, not sensor truthfulness'], W2),
    tRow(['Decentralised oracle network', '[4], [5]', 'A majority of independent reporters are honest', 'Removes single point of trust', 'Requires multiple independent observers; a single truck has one sensor'], W2),
    tRow(['Reputation-weighted', '[14]', 'Past reliability predicts future reliability', 'Degrades gracefully; no extra hardware', 'Slow to react to sudden compromise or calibration drift'], W2),
    tRow(['Cryptographic device identity', '[15], [20]', 'Device key material is not extractable', 'Establishes provenance of the reading', 'Authenticated falsehoods remain authenticated'], W2),
    tRow(['ML-based validation', '[16], [17], [23]', 'Normal behaviour is learnable and stable', 'Detects faults that are individually in-range', 'Requires labelled or clean training data; threshold selection is arbitrary without benchmarks'], W2),
    tRow(['Verifiable pre-processing', '[7]', 'Processing step can be independently verified', 'Restores end-to-end integrity across transformation', 'Addresses transformation integrity, not semantic plausibility'], W2),
  ]
});

const tablesSection = [
  caption('TABLE I.  Comparative Analysis of Reviewed Traceability and Validation Frameworks'),
  table1,
  new Paragraph({ text: '', spacing: { after: 200 } }),
  caption('TABLE II.  Classification of Oracle Trust Mechanisms by Underlying Trust Assumption'),
  table2,
  new Paragraph({ text: '', spacing: { after: 200 } }),
];

// ---------- SECTION 4: remaining body (two columns) ----------
const bodyB = [
  h1('V. Comparative Analysis'),
  p('Tables I and II present the comparative synthesis. Table I classifies reviewed frameworks by the dimension this survey argues is decisive: whether inputs are validated before they are committed. Table II classifies oracle trust mechanisms by the assumption on which their trust ultimately rests, and assesses each against the specific conditions of perishable logistics.', { indent: { firstLine: 0 } }),
  p('Three observations follow from the comparison.'),
  p('First, the "input validation" column of Table I is predominantly empty. Among the agri-food traceability frameworks reviewed, validation is either absent or limited to fixed thresholds. Where validation does appear in a substantive form, it comes from outside the agricultural literature entirely — from generic IoT on-chaining research [7] or from work on a single narrow claim class such as location [23]. The systems designed for the domain do not validate; the systems that validate are not designed for the domain.'),
  p('Second, the evaluation bases are not commensurable. Frameworks report latency, gas cost, CPU utilisation, and throughput; detection systems report precision, recall, and accuracy on datasets that are private, synthetic, or drawn from unrelated domains. No two reviewed works are evaluated on a shared benchmark. Consequently, claims of superiority within either literature cannot be compared across it, and a practitioner choosing between approaches has no empirical basis for doing so.'),
  p('Third, Table II exposes a structural mismatch between available oracle mechanisms and the conditions of agricultural logistics. Decentralised oracle networks, the dominant answer to oracle trust in financial contexts, presuppose multiple independent observers of the same fact. A consignment in transit has one sensor. Redundant instrumentation is conceivable but the marginal cost falls on precisely the participants least able to bear it. Trusted execution environments and cryptographic device identity address the integrity of transmission and the authenticity of origin, but neither speaks to the semantic question of whether a well-formed, correctly signed, faithfully transmitted reading is actually true.'),
  p('Taken together, these observations indicate that the trust problem in agricultural traceability is not merely under-solved but under-posed. The available mechanisms answer questions about provenance and transmission; the question that determines whether the ledger is worth trusting is one of plausibility.'),

  h1('VI. Research Gaps'),
  p('We identify six gaps arising from the foregoing analysis.', { indent: { firstLine: 0 } }),
  rich([{ t: 'Gap 1: Input validation is assumed rather than performed. ', b: true }, { t: 'The majority of reviewed traceability frameworks treat sensor readings as ground truth at the point of ingestion [1], [2], [21], [22]. Immutability is thus applied to unverified data, producing a record whose permanence exceeds its reliability. No reviewed agri-food framework incorporates a validation stage between acquisition and commitment as an architectural component.' }]),
  rich([{ t: 'Gap 2: The oracle and agri-food literatures barely intersect. ', b: true }, { t: 'Oracle trust research is oriented toward financial data feeds and rarely addresses physical, domain-constrained measurements [4], [5], [8]. Conversely, agricultural traceability work seldom cites the oracle literature at all. The two bodies of work address the same underlying problem from opposite ends and have not met.' }]),
  rich([{ t: 'Gap 3: Anomaly and violation are conflated. ', b: true }, { t: 'This is the most consequential gap identified. An anomalous reading — a location that jumps hundreds of kilometres in seconds, a temperature that rises forty degrees and returns within one sampling interval — is data that should not be believed. A threshold violation — a genuine, correctly measured excursion above the safe range for a crop — is data that must be believed, recorded, and attributed to whoever held custody. Both present as outlying temperature values. No reviewed work treats them as distinct categories requiring opposite handling. A system that classifies threshold violations as anomalies and discards them automatically suppresses precisely the events cold-chain monitoring exists to capture.' }]),
  rich([{ t: 'Gap 4: No shared benchmark or labelled dataset exists. ', b: true }, { t: 'Evaluation of sensor-data trust in cold chain is conducted on private, proprietary, or synthetic data without published ground truth [26], [27]. Reported detection accuracies are therefore not comparable across studies, and no baseline exists against which a new method can be positioned.' }]),
  rich([{ t: 'Gap 5: Economic transparency is absent. ', b: true }, { t: 'Traceability frameworks record the physical path of produce — where it originated, where it travelled, under what conditions. Almost none record the price at which custody transferred at each stage. Consequently the systems can establish provenance but cannot address the distributional question that motivates much agricultural policy interest in transparency: what share of final retail value reaches the producer.' }]),
  rich([{ t: 'Gap 6: Evaluation is dominated by proof-of-concept. ', b: true }, { t: 'Consistent with the broader observation of Casino et al. [3], most reviewed implementations report functional demonstration rather than performance under sustained load, and few report gas cost, write latency, or throughput at realistic telemetry volumes. Scalability claims are therefore largely untested.' }]),

  h1('VII. Challenges and Limitations'),
  p('Several challenges explain why the gaps above persist and constrain how readily they can be closed.', { indent: { firstLine: 0 } }),
  rich([{ t: 'Measurement environment. ', b: true }, { t: 'Sensors in cold-chain deployment experience calibration drift, elevated error at low temperature, and accuracy degradation over service life [26]. Any validation mechanism must separate these benign failure modes from adversarial manipulation, and the signatures of the two overlap considerably.' }]),
  rich([{ t: 'Economics of instrumentation. ', b: true }, { t: 'Redundant sensing would resolve much of the trust problem by supplying the independent observers that decentralised oracle designs assume. The cost falls on smallholder producers and small logistics operators, for whom it is prohibitive. This is a structural rather than technical barrier.' }]),
  rich([{ t: 'Cost and latency of on-chain writes. ', b: true }, { t: 'High-frequency telemetry is incompatible with per-reading on-chain commitment on public networks at realistic cost. Hybrid designs that commit hashes or aggregates reduce cost but weaken the granularity of what is actually attested.' }]),
  rich([{ t: 'Privacy against transparency. ', b: true }, { t: 'Transparency is the stated objective, yet commercial pricing, supplier relationships, and personal data of participants are sensitive. Data protection regimes that confer erasure rights are difficult to reconcile with immutable storage, which constrains what may legitimately be placed on-chain.' }]),
  rich([{ t: 'Absence of labelled anomaly data. ', b: true }, { t: 'Supervised approaches are largely foreclosed in this domain because genuine fault events are rare, unlabelled, and commercially sensitive when they do occur.' }]),
  rich([{ t: 'Limitations of this survey. ', b: true }, { t: 'Our search was restricted to five databases and to English-language publications, and the four-area scope necessarily trades depth for breadth in each. Selection of the comparative subset involved judgement about representativeness that another reviewer might exercise differently. Finally, the oracle literature is developing rapidly, and recent contributions may not yet be reflected in the citation networks used for snowballing.' }]),

  h1('VIII. Future Scope'),
  p('The gaps identified suggest corresponding directions for research.', { indent: { firstLine: 0 } }),
  p('The most immediate is the architectural separation of plausibility assessment from policy evaluation. A validation layer positioned between acquisition and commitment could assess whether a reading is physically credible — using rate-of-change constraints, implied-velocity checks, and cross-sensor consistency — while independently evaluating whether a credible reading violates a crop-specific threshold. The first determines whether data is committed; the second determines what is recorded alongside it. Separating the two resolves Gap 3 directly and is implementable with existing methods.'),
  p('A second direction is the construction of a public benchmark for cold-chain sensor trust, comprising realistic telemetry with injected faults of known type, timing, and magnitude. Ground truth recorded at injection time would permit precision and recall to be computed and compared across methods, addressing Gap 4. The absence of such a resource is arguably the single largest impediment to progress in this area.'),
  p('Third, the deliberate transfer of oracle trust mechanisms into the agricultural setting merits investigation. Reputation-weighted schemes [14] map plausibly onto devices with service histories; verifiable pre-processing [7] maps onto the validation layer described above. Whether the assumptions these mechanisms rely upon survive transfer to a domain with single observers and physically constrained data is an open empirical question.'),
  p('Fourth, extending traceability data models to record transfer price alongside transfer of custody would enable analysis of value distribution across the chain, addressing Gap 5 at negligible technical cost. The obstacles here are commercial and governance-related rather than technical.'),
  p('Finally, systematic reporting of gas consumption, write latency, and throughput under sustained telemetry load would allow the scalability claims common in this literature to be assessed rather than assumed.'),

  h1('IX. Conclusion'),
  p('This survey examined the trust status of data entering blockchain-based agricultural traceability systems, synthesising literature across agri-food traceability, cold-chain IoT sensing, blockchain oracle trust, and machine-learning anomaly detection. The central finding is one of separation: the literature that designs traceability systems for agriculture does not validate its inputs, and the literature that addresses input trust is oriented toward a domain with different data characteristics and different adversarial structure. The consequence is a class of systems that are cryptographically robust and epistemically fragile — able to prove that a record has not changed, unable to establish that it was ever correct.', { indent: { firstLine: 0 } }),
  p('Of the six gaps identified, the conflation of implausible data with genuine threshold violations is the most consequential, because it is a design error whose effect is to suppress exactly the events the system exists to detect. Resolving it requires no new algorithm, only the recognition that the two categories demand opposite handling.'),
  p('We further find that the absence of a shared benchmark prevents the field from establishing whether progress is being made at all, and that the omission of price from traceability data models forecloses the distributional analysis that motivates much of the policy interest in agricultural transparency. Addressing these would substantially strengthen the case that blockchain traceability delivers the trust it is widely claimed to provide.'),

  h1('References'),
];

const refs = [
  'M. P. Caro, M. S. Ali, M. Vecchio, and R. Giaffreda, "Blockchain-based traceability in Agri-Food supply chain management: A practical implementation," in Proc. IoT Vertical and Topical Summit on Agriculture – Tuscany (IOT Tuscany), May 2018, pp. 1–4, doi: 10.1109/IOT-TUSCANY.2018.8373021.',
  'K. Salah, N. Nizamuddin, R. Jayaraman, and M. Omar, "Blockchain-based soybean traceability in agricultural supply chain," IEEE Access, vol. 7, pp. 73295–73305, 2019.',
  'F. Casino, T. K. Dasaklis, and C. Patsakis, "A systematic literature review of blockchain-based applications: Current status, classification and open issues," Telematics and Informatics, vol. 36, pp. 55–81, 2019.',
  'H. Al-Breiki, M. H. U. Rehman, K. Salah, and D. Svetinovic, "Trustworthy blockchain oracles: Review, comparison, and open research challenges," IEEE Access, vol. 8, pp. 85675–85685, 2020, doi: 10.1109/ACCESS.2020.2992698.',
  'A. Pasdar, Y. C. Lee, and Z. Dong, "Connect API with blockchain: A survey on blockchain oracle implementation," ACM Computing Surveys, vol. 55, no. 10, Art. 208, pp. 1–39, 2023, doi: 10.1145/3567582.',
  'J. Heiss, J. Eberhardt, and S. Tai, "From oracles to trustworthy data on-chaining systems," in Proc. IEEE Int. Conf. Blockchain, 2019, pp. 496–503, doi: 10.1109/Blockchain.2019.00075.',
  'J. Heiss, A. Busse, and S. Tai, "Trustworthy pre-processing of sensor data in data on-chaining workflows for blockchain-based IoT applications," in Proc. 19th Int. Conf. Service-Oriented Computing (ICSOC), 2021. [Online]. Available: arXiv:2110.15869',
  'A. Egberts, "The oracle problem – An analysis of how blockchain oracles undermine the advantages of decentralized ledger systems," SSRN Electronic Journal, 2017.',
  'G. Caldarelli, C. Rossignoli, and A. Zardini, "Overcoming the blockchain oracle problem in the traceability of non-fungible products," Sustainability, vol. 12, no. 6, Art. 2391, 2020, doi: 10.3390/su12062391.',
  'A. Al Sadawi, M. S. Hassan, and M. Ndiaye, "On the integration of blockchain with IoT and the role of oracle in the combined system: The full picture," IEEE Access, vol. 10, 2022, doi: 10.1109/ACCESS.2022.3199007.',
  'A. Albizri and D. Appelbaum, "Trust but verify: The oracle paradox of blockchain smart contracts," Journal of Information Systems, vol. 35, no. 2, pp. 1–16, 2021, doi: 10.2308/ISYS-19-024.',
  'A. Beniiche, "A study of blockchain oracles," 2020. [Online]. Available: arXiv:2004.07140',
  'A. Pasdar, Z. Dong, and Y. C. Lee, "Blockchain oracle design patterns," 2021. [Online]. Available: arXiv:2106.09349',
  'P. Liu, Y. Xian, C. Yao, P. Wang, L. Wang, and X. Li, "A trustworthy and consistent blockchain oracle scheme for Industrial Internet of Things," 2023. [Online]. Available: arXiv:2310.04975',
  'H. Al Breiki, L. Al Qassem, K. Salah, M. H. U. Rehman, and D. Svetinovic, "Decentralized access control for IoT data using blockchain and trusted oracles," in Proc. IEEE Int. Conf. Industrial Internet (ICII), 2019, pp. 248–257.',
  'F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation forest," in Proc. 8th IEEE Int. Conf. Data Mining (ICDM), 2008, pp. 413–422, doi: 10.1109/ICDM.2008.17.',
  'P. Malhotra, A. Ramakrishnan, G. Anand, L. Vig, P. Agarwal, and G. Shroff, "LSTM-based encoder-decoder for multi-sensor anomaly detection," 2016. [Online]. Available: arXiv:1607.00148',
  'G. Pang, C. Shen, L. Cao, and A. van den Hengel, "Deep learning for anomaly detection: A review," ACM Computing Surveys, vol. 54, no. 2, pp. 1–38, 2021.',
  'A. Panarello, N. Tapas, G. Merlino, F. Longo, and A. Puliafito, "Blockchain and IoT integration: A systematic survey," Sensors, vol. 18, no. 8, Art. 2575, 2018.',
  'A. Vangala, A. K. Das, N. Kumar, and M. Alazab, "Smart secure sensing for IoT-based agriculture: Blockchain perspective," IEEE Sensors Journal, vol. 21, no. 16, pp. 17591–17607, 2021.',
  'S. Malik, S. S. Kanhere, and R. Jurdak, "ProductChain: Scalable blockchain framework to support provenance in supply chains," in Proc. IEEE 17th Int. Symp. Network Computing and Applications (NCA), 2018, pp. 1–10.',
  'K. Biswas, V. Muthukkumarasamy, and W. L. Tan, "Blockchain based wine supply chain traceability system," in Proc. Future Technologies Conference (FTC), Vancouver, Canada, Nov. 2017.',
  'W. Lv, X. Qiu, and L. Meng, "Blockchain localization spoofing detection based on fuzzy AHP in IoT systems," EURASIP Journal on Wireless Communications and Networking, 2022, doi: 10.1186/s13638-022-02094-7.',
  '[VERIFY VENUE] F. Zhang, E. Cecchetti, K. Croman, A. Juels, and E. Shi, "Town Crier: An authenticated data feed for smart contracts," in Proc. ACM SIGSAC Conf. Computer and Communications Security (CCS), 2016.',
  '[VERIFY] L. Gigli, I. Zyrianoff, F. Montori, L. Sciullo, C. Kamienski, and M. Di Felice, "Zonia: A zero-trust oracle system for blockchain IoT applications," IEEE Internet of Things Journal, 2025.',
  '[VERIFY AUTHORS] "An anomaly detection scheme for data stream in cold chain logistics," PLOS ONE, 2025, doi: 10.1371/journal.pone.0315322.',
  '[VERIFY AUTHORS] "Real-time anomaly detection in cold chain transportation using IoT technology," Sustainability, vol. 15, no. 3, Art. 2255, 2023.',
  '[VERIFY AUTHORS] "A comprehensive study of anomaly detection schemes in IoT networks using machine learning algorithms," Sensors, vol. 21, no. 24, Art. 8320, 2021.',
  '[VERIFY AUTHORS] "IoT anomaly detection methods and applications: A survey," Internet of Things (Elsevier), 2022.',
  '[ADD] Remaining references to be added as screening completes — target 45–60 for a full survey.',
];

const bodyC = refs.map((r, i) => ref(i + 1, r));

// ---------- assemble ----------
const pageProps = (cols, cont) => ({
  type: cont ? SectionType.CONTINUOUS : undefined,
  page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1080, bottom: 1440, left: 900, right: 900 }
  },
  ...(cols ? { column: { count: 2, space: 360, equalWidth: true } } : {})
});

const doc = new Document({
  creator: 'KisanChain / AgriChain project team',
  title: 'Trust in Off-Chain Data for Blockchain-Based Agricultural Supply Chain Traceability',
  sections: [
    { properties: pageProps(false, false), children: titleBlock },
    { properties: pageProps(true, true), children: bodyA },
    { properties: pageProps(false, true), children: tablesSection },
    { properties: pageProps(true, true), children: [...bodyB, ...bodyC] },
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('docs/research/survey-paper-draft-ieee.docx', buf);
  console.log('written');
});
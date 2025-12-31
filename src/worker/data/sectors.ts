// Sector display names with emojis
export const sectorList: Record<string, string> = {
  agriculture: "🌱 Agriculture & Biotech",
  fsf: "🥦 Food, Soil & Farming",
  banking: "🏦 Banking & Finance",
  creative: "🖋️ Creative Tech",
  logistics: "📦 Logistics & Packaging",
  "education-ip": "📚 Education & IP",
  fashion: "✂ Fashion & Identity",
  gaming: "🎮 Gaming & Simulation",
  health: "🧠 Health & Hygiene",
  housing: "🏗️ Housing & Infrastructure",
  justice: "⚖ Justice & Ethics",
  knowledge: "📖 Knowledge & Archives",
  micromesh: "☰ Micro-Mesh Logistics",
  media: "🎬 Motion, Media & Sonic",
  nutrition: "✿ Nutrition & Food Chain",
  "ai-logic": "🧠 AI, Logic & Grid",
  packaging: "📦 Packaging & Materials",
  quantum: "✴️ Quantum Protocols",
  ritual: "☯ Ritual & Culture",
  saas: "🔑 SaaS & Licensing",
  trade: "🧺 Trade Systems",
  utilities: "🔋 Utilities & Energy",
  voice: "🎙️ Voice & Audio",
  webless: "📡 Webless Tech & Nodes",
  nft: "🔁 NFT & Ownership",
  "education-youth": "🎓 Education & Youth",
  zerowaste: "♻️ Zero Waste",
  professional: "🧾 Professional Services",
  "payroll-mining": "🪙 Payroll Mining & Accounting",
  mining: "⛏️ Mining & Resources",
  wildlife: "🦁 Wildlife & Habitat",
  "admin-panel": "⚙️ Admin Panel",
  "global-index": "🌐 Global Brand Index",
};

// Brand interface
export interface Brand {
  name: string;
  subNodes: string[];
  masterLicensePrice?: number;
}

// Sector pricing and metadata interface
export interface SectorPricing {
  glyph: string;
  monthlyFee: number;
  annualFee: number;
  payoutTier: string;
  region: string;
}

// Sector data interface
export interface SectorData {
  name: string;
  description: string;
  nodes: number;
  revenue: number;
  dominanceScore: number;
  brands: Brand[];
  coreLogic?: string;
  keyBenefits?: string;
  economicModel?: string;
  scrollProfiles?: Array<{ name: string; link: string }>;
  pricing: SectorPricing;
}

// Helper to generate random license prices
const getRandomLicensePrice = () =>
  Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;

const addRandomPrices = (brandsArray: Omit<Brand, "masterLicensePrice">[]): Brand[] => {
  return brandsArray.map((brand) => ({
    ...brand,
    masterLicensePrice: getRandomLicensePrice(),
  }));
};

// All sector data - COMPLETE DATA FOR ALL 31 SECTORS WITH PRICING
export const sectorData: Record<string, SectorData> = {
  agriculture: {
    name: "Agriculture & Biotech",
    description: "Monitoring of AgroChain™ framework, covering product offerings and payment processing via PayPal integration.",
    nodes: 1200,
    revenue: 5200000,
    dominanceScore: 75,
    pricing: {
      glyph: "🌱",
      monthlyFee: 45,
      annualFee: 450,
      payoutTier: "B+",
      region: "Global Rural",
    },
    brands: addRandomPrices([
      { name: "CropLink", subNodes: ["CropLink ID™", "CropLink Vault™", "CropLink Field™", "CropLink Yield™"] },
      { name: "SoilPulse", subNodes: ["SoilPulse Trace™", "SoilPulse Data™", "SoilPulse Alert™"] },
      { name: "RootYield", subNodes: ["RootYield Base™", "RootYield Chain™", "RootYield X™"] },
      { name: "AquaFarm", subNodes: ["AquaFarm Sync™", "AquaFarm Logi™", "AquaFarm Vault™"] },
      { name: "AgriMesh", subNodes: ["AgriMesh Route™", "AgriMesh Pulse™", "AgriMesh View™"] },
      { name: "GrowNode", subNodes: ["GrowNode Basic™", "GrowNode Trade™", "GrowNode Vault™"] },
      { name: "GrainCast", subNodes: ["GrainCast Forecast™", "GrainCast Scroll™"] },
      { name: "SoilBank", subNodes: ["SoilBank Ledger™", "SoilBank Pay™"] },
      { name: "CropID", subNodes: ["CropID Scanner™", "CropID Trust™"] },
      { name: "AgriVault", subNodes: ["AgriVault Lock™", "AgriVault Chain™", "AgriVault Seed™"] },
    ]),
    coreLogic: `<ul>
      <li><strong>Decentralized Crop Tracking:</strong> Utilizes blockchain to create immutable records of crop growth, harvest, and distribution, ensuring transparency and preventing fraud.</li>
      <li><strong>Automated Environmental Monitoring:</strong> Integrates with IoT sensors for real-time data on soil conditions, weather patterns, and pest activity, triggering automated responses.</li>
      <li><strong>Smart Contract-Based Supply Chains:</strong> Automates agreements between farmers, distributors, and retailers, ensuring fair pricing and timely payments upon verifiable conditions.</li>
      <li><strong>Bio-Asset Tokenization:</strong> Enables the tokenization of unique biological assets (e.g., rare seed strains, genetic data) for secure ownership and intellectual property management.</li>
    </ul>`,
    keyBenefits: `<ul>
      <li><strong>Enhanced Food Safety & Traceability:</strong> Consumers can verify the origin and journey of their food, increasing trust.</li>
      <li><strong>Optimized Resource Management:</strong> Farmers can make data-driven decisions to reduce water usage, optimize fertilizer application, and minimize waste.</li>
      <li><strong>Reduced Agricultural Fraud:</strong> Immutable records and transparent transactions significantly reduce opportunities for counterfeiting and mislabeling.</li>
      <li><strong>Fairer Trade Practices:</strong> Smart contracts ensure equitable distribution of value across the supply chain, benefiting smallholder farmers.</li>
      <li><strong>Accelerated Biotech Innovation:</strong> Secure IP management and data sharing foster collaboration and faster development of new agricultural technologies.</li>
    </ul>`,
    economicModel: `<ul>
      <li><strong>Master License Fee:</strong> Annual fee for core protocol access, varying by scale of operation.</li>
      <li><strong>Transaction Fees:</strong> Small percentage (e.g., 0.1-0.5%) on verified data transactions and smart contract executions within the AgroChain™.</li>
      <li><strong>Royalty Split:</strong><ul>
        <li><strong>45%</strong> to Protocol Development & Maintenance</li>
        <li><strong>25%</strong> to Data Providers & Node Operators</li>
        <li><strong>20%</strong> to Ecosystem Growth Fund</li>
        <li><strong>10%</strong> to IP Holders</li>
      </ul></li>
    </ul>`,
    scrollProfiles: [{ name: "PayPal Integration Manual", link: "manuals/agriculture-paypal.pdf" }],
  },

  fsf: {
    name: "Food, Soil & Farming",
    description: "Comprehensive food chain tracking from soil to table, ensuring quality and sustainability.",
    nodes: 980,
    revenue: 4200000,
    dominanceScore: 72,
    pricing: {
      glyph: "🥦",
      monthlyFee: 46,
      annualFee: 480,
      payoutTier: "B+",
      region: "Rural",
    },
    brands: addRandomPrices([
      { name: "AgriCore", subNodes: ["SoilSync", "CropTrack", "FarmLink", "HarvestNet"] },
      { name: "SoilHealth", subNodes: ["BioBoost", "NutrientFlow", "EarthGuard", "RootMax"] },
      { name: "FarmFresh", subNodes: ["OrganicGrow", "PureHarvest", "GreenCycle", "EcoFarm"] },
      { name: "CropCircle", subNodes: ["YieldMap", "PlantPulse", "GrowthScan", "FieldSense"] },
      { name: "HarvestHub", subNodes: ["GrainGate", "ProducePath", "MarketLink", "FarmFlow"] },
      { name: "TerraNova", subNodes: ["LandRevive", "SoilBalance", "EcoTill", "AgroRenew"] },
      { name: "GreenSprout", subNodes: ["SeedStart", "PlantBoost", "GrowTrack", "EcoRoot"] },
      { name: "AgroLife", subNodes: ["FarmVital", "CropCare", "SoilSense", "HarvestEase"] },
      { name: "BioFarm", subNodes: ["EcoGrow", "NaturalYield", "SoilPure", "PlantHealth"] },
      { name: "EcoHarvest", subNodes: ["GreenField", "CropCycle", "SoilNurture", "FarmSustain"] },
    ]),
  },

  banking: {
    name: "Banking & Finance",
    description: "Tracking of financial transactions, compliance, and integration with Xero for accounting.",
    nodes: 2500,
    revenue: 15500000,
    dominanceScore: 92,
    pricing: {
      glyph: "🏦",
      monthlyFee: 125,
      annualFee: 1250,
      payoutTier: "A+",
      region: "Div A-E",
    },
    brands: addRandomPrices([
      { name: "FinGrid", subNodes: ["Ledger Mesh", "Arbitrage Core", "Token Router", "Tax Engine", "Vault Lock"] },
      { name: "TradeAmp", subNodes: ["Zeno Mesh", "Crux Bridge", "Hive Monitor", "Wire Reconciler"] },
      { name: "LoopPay", subNodes: ["Lumen Pulse", "Delta Secure", "Fractal Trace", "Torus Signal"] },
      { name: "TaxNova", subNodes: ["Ark Model", "Node Gate", "Veritas Sync", "Cage Mapper"] },
      { name: "VaultMaster", subNodes: ["Core Trace", "Sky Sweep", "Mint Grid", "Orbit Channel"] },
      { name: "Gridwise", subNodes: ["Hash Clear", "Micro Chain", "Anchor Lock", "Fleet Sync"] },
      { name: "CrateDance", subNodes: ["Zoom Channel", "Beacon Path", "Crate Vault", "Numen Index"] },
      { name: "CashGlyph", subNodes: ["Spark Flow", "Meta Signal", "Aether Drift", "Custody Map"] },
      { name: "Foresync", subNodes: ["Neutron Signal", "Cash Stream", "Jet Grid", "Pulse Map"] },
      { name: "OmniRank", subNodes: ["Sync Grid", "Tangent Vector", "Nova Route", "Glide Core"] },
    ]),
    coreLogic: `<ul>
      <li><strong>Distributed Ledger for Transactions:</strong> Provides an immutable, auditable trail for all financial transactions, enhancing security and transparency.</li>
      <li><strong>Automated Compliance Engines:</strong> Smart contracts automatically enforce regulatory requirements (e.g., KYC, AML) across financial operations.</li>
      <li><strong>Interoperable Financial Instruments:</strong> Enables seamless transfer and management of tokenized assets and digital currencies across different financial platforms.</li>
      <li><strong>Fraud Detection AI:</strong> AI models continuously analyze transaction patterns for anomalies, flagging suspicious activities in real-time.</li>
    </ul>`,
    keyBenefits: `<ul>
      <li><strong>Reduced Transaction Costs & Time:</strong> Streamlined processes and automated verifications lead to faster and cheaper financial operations.</li>
      <li><strong>Enhanced Security & Auditability:</strong> Blockchain-level security and transparent ledgers minimize fraud and simplify audits.</li>
      <li><strong>Improved Regulatory Adherence:</strong> Automated compliance ensures financial institutions meet evolving regulatory standards with ease.</li>
      <li><strong>New Financial Product Innovation:</strong> The flexible infrastructure supports the creation of novel digital assets and financial services.</li>
    </ul>`,
    economicModel: `<ul>
      <li><strong>Per-Transaction Fees:</strong> Micro-fees charged on each financial transaction processed through the network.</li>
      <li><strong>Tiered Licensing:</strong> Institutions pay based on transaction volume, number of active users, or specialized feature access.</li>
      <li><strong>Royalty Split:</strong><ul>
        <li><strong>50%</strong> to Network Validators & Infrastructure Providers</li>
        <li><strong>25%</strong> to Protocol Development & Research</li>
        <li><strong>15%</strong> to Regulatory Compliance & Governance Fund</li>
        <li><strong>10%</strong> to Ecosystem Development & Partnerships</li>
      </ul></li>
    </ul>`,
    scrollProfiles: [
      { name: "Xero Integration Setup", link: "manuals/xero-integration.pdf" },
      { name: "PayPal Subscriptions Manual", link: "manuals/paypal-subscriptions.pdf" },
    ],
  },

  creative: {
    name: "Creative Tech",
    description: "Digital creation tools for media, design, and content production.",
    nodes: 850,
    revenue: 6700000,
    dominanceScore: 78,
    pricing: {
      glyph: "🖋️",
      monthlyFee: 67,
      annualFee: 720,
      payoutTier: "A",
      region: "Div E",
    },
    brands: addRandomPrices([
      { name: "MediaGrid", subNodes: ["SceneLink™", "FXLayer™", "ClipVault™"] },
      { name: "StudioPath", subNodes: ["StudioSync™", "StagePulse™", "RenderMesh™"] },
      { name: "SoundReel", subNodes: ["AudioTrace™", "VoiceVault™", "WaveLoop™"] },
      { name: "EditFrame", subNodes: ["CutChain™", "TimelineScroll™", "FXSnap™"] },
      { name: "MotionKit", subNodes: ["VectorNode™", "AnimCast™", "ScrollFX™"] },
      { name: "GhostTrace", subNodes: ["TraceBlock™", "ScreenShield™", "CloneLock™"] },
      { name: "TalentMap", subNodes: ["LedgerID™", "Royaltix™", "PayoutTag™"] },
      { name: "SignalVerse", subNodes: ["FreqCast™", "GridWave™", "AudioMesh™"] },
      { name: "ScrollPlay", subNodes: ["PlayNode™", "FrameTrigger™", "RenderSync™"] },
      { name: "FXStream", subNodes: ["FXRender™", "ScrollVision™", "LoopFrame™"] },
    ]),
  },

  logistics: {
    name: "Logistics & Packaging",
    description: "Supply chain management and package tracking solutions.",
    nodes: 1800,
    revenue: 8900000,
    dominanceScore: 85,
    pricing: {
      glyph: "📦",
      monthlyFee: 58,
      annualFee: 595,
      payoutTier: "B+",
      region: "Div B-F",
    },
    brands: addRandomPrices([
      { name: "CrateLogic", subNodes: ["BoxNode™", "CrateMap™", "PackSync™", "CrateSync™"] },
      { name: "PackChain", subNodes: ["VendorPack™", "LabelTrace™", "ShipGrid™", "ScrollWrap™"] },
      { name: "SortFleet", subNodes: ["SortPulse™", "BinLogic™", "FleetTrack™", "ScrollSort™"] },
      { name: "RouteMesh", subNodes: ["NodeMap™", "GeoSignal™", "DropLink™", "RouteFlow™"] },
      { name: "LogiStack", subNodes: ["ScrollStack™", "YieldSync™", "PayoutRoute™", "StackNode™"] },
      { name: "DeliveryX", subNodes: ["LastMile™", "ScanDrop™", "AgentTrack™", "QuickChain™"] },
      { name: "CargoVault", subNodes: ["VaultLink™", "WeightTag™", "CargoScan™", "CargoClaim™"] },
      { name: "PalletPath", subNodes: ["PathFinder™", "RackTrace™", "GridStore™", "LoadMark™"] },
      { name: "LabelFlow", subNodes: ["PrintNode™", "ScrollCode™", "InkRoute™", "LabelSync™"] },
      { name: "DropLoop", subNodes: ["LoopID™", "VendorDrop™", "TimeGate™", "LoopConfirm™"] },
    ]),
  },

  "education-ip": {
    name: "Education & IP",
    description: "Learning management and intellectual property protection systems.",
    nodes: 750,
    revenue: 3900000,
    dominanceScore: 68,
    pricing: {
      glyph: "📚",
      monthlyFee: 39,
      annualFee: 420,
      payoutTier: "A",
      region: "Tribal/Global",
    },
    brands: addRandomPrices([
      { name: "EduNest", subNodes: ["LearnNode", "ScrollSeed", "CampusID", "MentorLink", "PathClaim"] },
      { name: "FormFlex", subNodes: ["SkillWrap", "GradeSync", "CourseMap", "IDTrack", "PupilMesh"] },
      { name: "ScrollBooks", subNodes: ["ChapterFlow", "StoryTag", "QuizLink", "YieldRead", "TextClaim"] },
      { name: "MindLift", subNodes: ["BoostTrack", "LearnSignal", "LevelUp", "FocusPath", "VaultPace"] },
      { name: "GridClass", subNodes: ["ClassNode", "TeachSync", "VaultBoard", "EduAlert", "NodeAttend"] },
      { name: "YouthSignal", subNodes: ["SignalDrop", "SkillPing", "PeerMesh", "RoleAssign", "TrackEcho"] },
      { name: "TalentNest", subNodes: ["TalentVault", "ClaimCoach", "RoleTree", "PayoutPath", "CertifyNode"] },
      { name: "PeerPath", subNodes: ["PeerMap", "ConnectNode", "SkillVote", "PathSync", "LearnOrbit"] },
      { name: "ScrollGrade", subNodes: ["GradeID", "TestVault", "YieldCredit", "ExamSync", "ResultNode"] },
      { name: "LearnMesh", subNodes: ["MeshID", "ModuleLink", "ClassSync", "ProgressTag", "LoopNode"] },
    ]),
  },

  "education-youth": {
    name: "Education & Youth",
    description: "Youth-focused learning platforms and skill development tools.",
    nodes: 620,
    revenue: 3100000,
    dominanceScore: 65,
    pricing: {
      glyph: "🎓",
      monthlyFee: 40,
      annualFee: 430,
      payoutTier: "A",
      region: "Global Youth",
    },
    brands: addRandomPrices([
      { name: "YouthSpark", subNodes: ["SparkNode", "EduMesh", "LearnLoop"] },
      { name: "EduFlow", subNodes: ["FlowTrack", "SkillGrid", "YouthSync"] },
      { name: "LearnGen", subNodes: ["GenCode", "FutureVault", "LearnMap"] },
      { name: "FutureNode", subNodes: ["NodePlay", "SkillBoost", "YouthConnect"] },
      { name: "SkillSeedling", subNodes: ["SeedlingID", "GrowTrack", "LearnPulse"] },
      { name: "BrightPath", subNodes: ["PathMentor", "BrightSync", "YouthFlow"] },
      { name: "MentorLinkYouth", subNodes: ["LinkMentor", "SkillNode", "YouthPath"] },
      { name: "CodeSprout", subNodes: ["SproutCode", "LearnBuild", "GameDevNode"] },
      { name: "GameLearn", subNodes: ["LearnSim", "GameDesign", "YouthPlay"] },
      { name: "CreativeYouth", subNodes: ["CreativeMesh", "ArtNode", "YouthCreate"] },
    ]),
  },

  fashion: {
    name: "Fashion & Identity",
    description: "Fashion industry supply chain and brand identity management.",
    nodes: 920,
    revenue: 7200000,
    dominanceScore: 74,
    pricing: {
      glyph: "✂",
      monthlyFee: 70,
      annualFee: 750,
      payoutTier: "A",
      region: "Global Metro",
    },
    brands: addRandomPrices([
      { name: "FashionNest™", subNodes: ["EchoNest", "TrackSeal", "GridPath", "PulseTag", "LoopForm", "WearGrid"] },
      { name: "StyleForm™", subNodes: ["RunwayMesh", "FashionPanel", "TagSync", "EchoForm", "BeamLook", "PulseTrack"] },
      { name: "ChicClaim™", subNodes: ["ClaimStyle", "PulseBeam", "TrackPanel", "EchoClaim", "SyncTag", "LookNode"] },
      { name: "RunwayPulse™", subNodes: ["GridForm", "LoopMesh", "DropEcho", "TrackWear", "ClaimPanel", "PulsePath"] },
      { name: "TrendCast™", subNodes: ["PulseRoot", "EchoTrack", "WearCast", "BeamTrace", "CrateDrop", "ClaimMark"] },
      { name: "BrandX™", subNodes: ["LoopPanel", "FashionDrop", "TrackGrid", "PulseCast", "EchoWear", "GridMark"] },
      { name: "LuxLink™", subNodes: ["LookSync", "PanelTag", "PulseLoop", "TrackCrate", "EchoSeal", "GridNest"] },
      { name: "VogueSync™", subNodes: ["ClaimMesh", "DropPath", "PulseTag", "EchoCast", "TrackPoint", "StyleFit"] },
      { name: "ModeFrame™", subNodes: ["EchoStyle", "PanelClaim", "PulseGrid", "TrackNest", "ClaimNode", "SyncEcho"] },
      { name: "GlamRoot™", subNodes: ["TrackPulse", "BeamCast", "LookTag", "EchoTrace", "CratePanel", "GridTrack"] },
    ]),
  },

  gaming: {
    name: "Gaming & Simulation",
    description: "Gaming platforms, virtual worlds, and simulation technology.",
    nodes: 1100,
    revenue: 8200000,
    dominanceScore: 81,
    pricing: {
      glyph: "🎮",
      monthlyFee: 80,
      annualFee: 820,
      payoutTier: "A",
      region: "Global Digital",
    },
    brands: addRandomPrices([
      { name: "GameGrid", subNodes: ["GridRender", "PulseEngine", "VaultSave"] },
      { name: "PixelPulse", subNodes: ["LinkSim", "NodeControl", "PlayStream"] },
      { name: "QuestVault", subNodes: ["GameID", "LevelTrack", "FlowState"] },
      { name: "SimuLink", subNodes: ["MeshConnect", "SyncMatch", "QuestLog"] },
      { name: "PlayNode", subNodes: ["PixelArt", "SoundFX", "InputHandler"] },
      { name: "MetaGame", subNodes: ["RenderFarm", "PhysicsEngine", "AIBehavior"] },
      { name: "LevelUp", subNodes: ["ScoreTracker", "LeaderboardSync", "AchievementNode"] },
      { name: "ArcadeFlow", subNodes: ["MultiplayerMesh", "ChatNode", "SpectateView"] },
      { name: "VRMesh", subNodes: ["AssetStream", "TextureAtlas", "ShaderGraph"] },
      { name: "EsportSync", subNodes: ["GameAnalytics", "PlayerMetrics", "MonetizationHook"] },
    ]),
  },

  health: {
    name: "Health & Hygiene",
    description: "Healthcare tracking, hygiene monitoring, and medical data management.",
    nodes: 1250,
    revenue: 9500000,
    dominanceScore: 83,
    pricing: {
      glyph: "🧠",
      monthlyFee: 52,
      annualFee: 550,
      payoutTier: "B",
      region: "Div F",
    },
    brands: addRandomPrices([
      { name: "MedVault", subNodes: ["ScanID", "PatientDrop", "RecordLink", "VaultCare"] },
      { name: "CleanCast", subNodes: ["SanitizeGrid", "QRLabel", "TouchLock", "DropZone"] },
      { name: "ScrollHealth", subNodes: ["ScrollID", "TreatmentTrack", "CareClaim", "HealthEcho"] },
      { name: "Hygienix", subNodes: ["WashCycle", "QRNode", "DisinfectLink", "VaultTag"] },
      { name: "CareNode", subNodes: ["PatientSync", "PayoutCare", "NodeClaim", "AlertScan"] },
      { name: "VaultSan", subNodes: ["CleanTrace", "HygieneCert", "QRGrid", "SecureDrop"] },
      { name: "TrackMeds", subNodes: ["DoseTrack", "QRScript", "VaultDrug", "AlertLink"] },
      { name: "SteriMesh", subNodes: ["MeshDrop", "CleanEcho", "QRTrack", "SteriNode"] },
      { name: "MedLoop", subNodes: ["HealthPath", "PatientCast", "QRClaim", "VaultID"] },
      { name: "PulseClean", subNodes: ["PulseSync", "ScanLink", "SanitaryTag", "VaultLock"] },
    ]),
  },

  housing: {
    name: "Housing & Infrastructure",
    description: "Construction management, infrastructure planning, and property development.",
    nodes: 1450,
    revenue: 10200000,
    dominanceScore: 87,
    pricing: {
      glyph: "🏗️",
      monthlyFee: 59,
      annualFee: 610,
      payoutTier: "B+",
      region: "Div A-F",
    },
    brands: addRandomPrices([
      { name: "BuildNest", subNodes: ["PlotVault", "GridPermit", "ScrollClaim", "LandNode"] },
      { name: "InfraGrid", subNodes: ["QRPipe", "SignalTrace", "VaultZone", "NodeLayout"] },
      { name: "CivicPath", subNodes: ["PermitID", "RoutePlan", "VaultForm", "ZoningMesh"] },
      { name: "VaultFrame", subNodes: ["FrameDrop", "BuildQR", "ClaimSync", "SiteNode"] },
      { name: "ArchiLoop", subNodes: ["DesignTrace", "VaultDraw", "BlueprintNode", "CivicCast"] },
      { name: "ScrollPlot", subNodes: ["QRClaim", "VaultMap", "LandTrack", "NodePing"] },
      { name: "UrbanTrace", subNodes: ["StreetPlan", "VaultRoad", "SignalGrid", "SurveyNode"] },
      { name: "BuildChain", subNodes: ["QRBuild", "SiteVault", "ContractorLink", "NodePermit"] },
      { name: "PlotMesh", subNodes: ["MeshTag", "VaultCoord", "ZoningNode", "ClaimForm"] },
      { name: "LandClaim", subNodes: ["ParcelGrid", "PlotPath", "VaultTag", "ClaimNode"] },
    ]),
  },

  justice: {
    name: "Justice & Ethics",
    description: "Legal systems, ethical frameworks, and justice administration.",
    nodes: 680,
    revenue: 5800000,
    dominanceScore: 71,
    pricing: {
      glyph: "⚖",
      monthlyFee: 90,
      annualFee: 920,
      payoutTier: "A",
      region: "Global Legal",
    },
    brands: addRandomPrices([
      { name: "LawLedger", subNodes: ["LedgerProve", "EthicScan", "VerdictLog"] },
      { name: "EthicGrid", subNodes: ["LinkJustice", "NodeEquity", "TraceTruth"] },
      { name: "VerdictVault", subNodes: ["ChainClause", "SyncRight", "AuditFlow"] },
      { name: "JusticeLink", subNodes: ["LawID", "EthicMonitor", "VerdictTrack"] },
      { name: "EquityNode", subNodes: ["JusticeMesh", "EquityPulse", "TruthVault"] },
      { name: "TruthTrace", subNodes: ["ClauseNode", "RightTrace", "AuditLink"] },
      { name: "ClauseChain", subNodes: ["FairGrid", "LawSync", "EthicFlow"] },
      { name: "RightSync", subNodes: ["VerdictChain", "JusticeClaim", "EquityLog"] },
      { name: "AuditLaw", subNodes: ["TruthNode", "ClauseScan", "RightVault"] },
      { name: "FairFlow", subNodes: ["AuditMesh", "FairPulse", "LawTrack"] },
    ]),
  },

  knowledge: {
    name: "Knowledge & Archives",
    description: "Information management, archival systems, and knowledge bases.",
    nodes: 890,
    revenue: 6100000,
    dominanceScore: 76,
    pricing: {
      glyph: "📖",
      monthlyFee: 55,
      annualFee: 580,
      payoutTier: "B+",
      region: "Global Archives",
    },
    brands: addRandomPrices([
      { name: "InfoVault", subNodes: ["VaultIndex", "GridSearch", "LinkData"] },
      { name: "ArchiveGrid", subNodes: ["NodeKnowledge", "MeshWisdom", "LoreScroll"] },
      { name: "LexiLink", subNodes: ["FlowFact", "SyncCogni", "BaseLearn"] },
      { name: "DataNodeX", subNodes: ["HubIntellect", "InfoTrace", "ArchiveScan"] },
      { name: "WisdomMesh", subNodes: ["LexiNode", "DataQuery", "WisdomMap"] },
      { name: "ScrollLore", subNodes: ["ScrollData", "FactChain", "CogniLink"] },
      { name: "FactFlow", subNodes: ["LearnVault", "IntellectGrid", "InfoSync"] },
      { name: "CogniSync", subNodes: ["ArchiveNode", "LexiMesh", "DataFlow"] },
      { name: "LearnBase", subNodes: ["WisdomTrace", "ScrollFact", "FactBase"] },
      { name: "IntellectHub", subNodes: ["CogniNode", "LearnSync", "IntellectMap"] },
    ]),
  },

  micromesh: {
    name: "Micro-Mesh Logistics",
    description: "Micro-scale logistics and distributed delivery networks.",
    nodes: 1550,
    revenue: 7800000,
    dominanceScore: 79,
    pricing: {
      glyph: "☰",
      monthlyFee: 62,
      annualFee: 650,
      payoutTier: "B+",
      region: "Local/Regional",
    },
    brands: addRandomPrices([
      { name: "MicroGrid", subNodes: ["GridConnect", "LinkNano", "MeshPico"] },
      { name: "NanoLink", subNodes: ["NodeFemto", "FlowAtto", "SyncZepto"] },
      { name: "PicoMesh", subNodes: ["TraceYocto", "MicroQuantum", "MeshHyper"] },
      { name: "FemtoNode", subNodes: ["GridFlexi", "MicroNode", "NanoSync"] },
      { name: "AttoFlow", subNodes: ["PicoFlow", "FemtoTrace", "AttoMesh"] },
      { name: "ZeptoSync", subNodes: ["ZeptoNode", "YoctoSync", "QuantumFlow"] },
      { name: "YoctoTrace", subNodes: ["HyperTrace", "FlexiNode", "MicroLink"] },
      { name: "QuantumMicro", subNodes: ["NanoMesh", "PicoSync", "FemtoFlow"] },
      { name: "HyperMesh", subNodes: ["AttoTrace", "ZeptoNode", "YoctoMesh"] },
      { name: "FlexiGrid", subNodes: ["QuantumSync", "HyperFlow", "FlexiTrace"] },
    ]),
  },

  media: {
    name: "Motion, Media & Sonic",
    description: "Media production, audio engineering, and content distribution.",
    nodes: 1350,
    revenue: 9100000,
    dominanceScore: 84,
    pricing: {
      glyph: "🎬",
      monthlyFee: 72,
      annualFee: 740,
      payoutTier: "A",
      region: "Creative",
    },
    brands: addRandomPrices([
      { name: "FrameCast", subNodes: ["VaultScene", "MediaNode", "QRStream", "ClipTag"] },
      { name: "SonicGrid", subNodes: ["AudioNode", "WavePulse", "QRMix", "VaultTrack"] },
      { name: "EditMesh", subNodes: ["ClipClaim", "VaultCut", "QREdit", "LayerLink"] },
      { name: "PulseMedia", subNodes: ["StreamSignal", "QRDrop", "VaultFrame", "EchoTag"] },
      { name: "VaultVision", subNodes: ["VaultClip", "QRLabel", "MotionIndex", "SceneMap"] },
      { name: "ScrollSound", subNodes: ["SoundNode", "QRTrack", "VaultEcho", "MixProof"] },
      { name: "RenderCast", subNodes: ["RenderGrid", "VaultOutput", "QREncode", "ClipPush"] },
      { name: "VoiceLoop", subNodes: ["VoicePing", "TrackID", "QRLine", "VaultAudio"] },
      { name: "AudioDrop", subNodes: ["DropWave", "VaultClaim", "QRNode", "SoundPrint"] },
      { name: "MediaMesh", subNodes: ["ClipMesh", "VaultFrame", "QRPlay", "RenderTag"] },
    ]),
  },

  nutrition: {
    name: "Nutrition & Food Chain",
    description: "Nutritional tracking, food safety, and supply chain transparency.",
    nodes: 1050,
    revenue: 7400000,
    dominanceScore: 77,
    pricing: {
      glyph: "✿",
      monthlyFee: 48,
      annualFee: 500,
      payoutTier: "B+",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "AgriNest™", subNodes: ["CropTag", "SoilPath", "YieldSync", "VaultHarvest"] },
      { name: "FreshSync™", subNodes: ["NestGrain", "PulseField", "FarmTrack", "ClaimRoot"] },
      { name: "CropLoop™", subNodes: ["CycleGrain", "VaultCrop", "YieldClaim", "FieldDrop"] },
      { name: "SoilGrid™", subNodes: ["SoilBeam", "FarmYield", "VaultNest", "TagField"] },
      { name: "FarmDrop™", subNodes: ["DropCrop", "HarvestTrack", "ClaimEcho", "PulseSoil"] },
      { name: "GrainVault™", subNodes: ["GrainTrack", "YieldNest", "VaultMap", "SoilNode"] },
      { name: "HarvestClaim™", subNodes: ["ClaimCrop", "PulseHarvest", "RootVault", "NestLoop"] },
      { name: "PulseCrop™", subNodes: ["PulseSoilX", "VaultGrain", "FieldClaim", "TrackEcho"] },
      { name: "YieldField™", subNodes: ["SoilDrop", "PlantClaim", "YieldProof", "VaultRoot"] },
      { name: "RootMap™", subNodes: ["FarmGrid", "VaultPath", "CropPanel", "EchoHarvest"] },
    ]),
  },

  "ai-logic": {
    name: "AI, Logic & Grid",
    description: "Artificial intelligence systems, logical frameworks, and grid computing.",
    nodes: 1650,
    revenue: 12300000,
    dominanceScore: 89,
    pricing: {
      glyph: "🧠",
      monthlyFee: 104,
      annualFee: 1050,
      payoutTier: "A+",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "OmniKey", subNodes: ["TraceBeam", "VaultEcho", "QRPath", "MeshID"] },
      { name: "SignalPulse", subNodes: ["BeamNode", "VaultTrack", "QRLogic", "SignalDrop"] },
      { name: "MeshIndex", subNodes: ["YieldTrack", "VaultMap", "QRClaim", "OmniPath"] },
      { name: "ClaimNodeX", subNodes: ["BoardNode", "VaultCert", "QRFrame", "MeshCast"] },
      { name: "LogicEcho", subNodes: ["SyncGrid", "VaultEcho", "QRNode", "TokenLink"] },
      { name: "OmniRender", subNodes: ["AIPath", "VaultClaim", "QRLogic", "SyncTag"] },
      { name: "SyncLine", subNodes: ["CastGrid", "VaultTrack", "QRPing", "SignalEcho"] },
      { name: "TokenBoard", subNodes: ["PingNode", "VaultBeam", "QRProof", "MeshDrop"] },
      { name: "SignalClaim", subNodes: ["MeshTrace", "VaultDrop", "QRNode", "LogicPush"] },
      { name: "GridCast", subNodes: ["GridPath", "VaultFrame", "QRSignal", "TokenPing"] },
    ]),
  },

  packaging: {
    name: "Packaging & Materials",
    description: "Packaging solutions, material science, and sustainable containers.",
    nodes: 980,
    revenue: 6800000,
    dominanceScore: 75,
    pricing: {
      glyph: "📦",
      monthlyFee: 65,
      annualFee: 680,
      payoutTier: "B",
      region: "Div B",
    },
    brands: addRandomPrices([
      { name: "PackVault", subNodes: ["VaultSecure", "GridOptimize", "LinkSeal"] },
      { name: "WrapGrid", subNodes: ["NodeBox", "MeshContain", "PackEco"] },
      { name: "SealLink", subNodes: ["WrapSmart", "BoxFlexi", "SealSecure"] },
      { name: "BoxNode", subNodes: ["PackTrace", "VaultWrap", "GridSeal"] },
      { name: "ContainMesh", subNodes: ["LinkBox", "NodeContain", "MeshEco"] },
      { name: "EcoPack", subNodes: ["WrapSmart", "BoxFlexi", "SealSecure"] },
      { name: "SmartWrap", subNodes: ["PackTrace", "VaultWrap", "GridSeal"] },
      { name: "FlexiBox", subNodes: ["LinkBox", "NodeContain", "MeshEco"] },
      { name: "SecureSeal", subNodes: ["PackSmart", "WrapFlexi", "SealTrace"] },
      { name: "TracePack", subNodes: ["BoxEco", "ContainSecure", "PackOptimize"] },
    ]),
  },

  quantum: {
    name: "Quantum Protocols",
    description: "Quantum computing protocols and advanced cryptographic systems.",
    nodes: 420,
    revenue: 11500000,
    dominanceScore: 86,
    pricing: {
      glyph: "✴️",
      monthlyFee: 130,
      annualFee: 1300,
      payoutTier: "A+",
      region: "Global Research",
    },
    brands: addRandomPrices([
      { name: "QuantumMesh™", subNodes: ["QSync", "VaultWave", "QubitCast", "ClaimGrid"] },
      { name: "PulseQ™", subNodes: ["PulseEntangle", "FieldDrop", "VaultPhase", "QuantumTag"] },
      { name: "EntanglePath™", subNodes: ["LogicEnt", "VaultEchoQ", "QubitClaim", "TraceLoop"] },
      { name: "QubitNest™", subNodes: ["NestPhase", "GridQubit", "VaultSpin", "ClaimZero"] },
      { name: "LogicSpin™", subNodes: ["SpinDrop", "PhasePath", "VaultCast", "QGrid"] },
      { name: "VaultQuantum™", subNodes: ["QTrace", "VaultNestQ", "LogicSignal", "PulseClaimQ"] },
      { name: "WaveSignal™", subNodes: ["SignalWave", "EntangleLink", "VaultGridQ", "QubitBeam"] },
      { name: "PhaseClaim™", subNodes: ["PhaseClaimX", "VaultLogicQ", "TraceQPath", "SyncZero"] },
      { name: "GridState™", subNodes: ["StateMesh", "QubitEchoX", "ClaimField", "VaultSignalQ"] },
      { name: "QuantumDrop™", subNodes: ["QuantumDropX", "FieldVault", "NestWave", "ClaimSpin"] },
    ]),
  },

  ritual: {
    name: "Ritual & Culture",
    description: "Cultural preservation, ritual documentation, and heritage systems.",
    nodes: 540,
    revenue: 4600000,
    dominanceScore: 69,
    pricing: {
      glyph: "☯",
      monthlyFee: 68,
      annualFee: 725,
      payoutTier: "A",
      region: "Div C",
    },
    brands: addRandomPrices([
      { name: "RiteNest™", subNodes: ["TotemTrack", "VaultSpirit", "GlyphTag", "ScrollLoop"] },
      { name: "PulseSpirit™", subNodes: ["ClanPath", "EchoTotem", "PulseMyth", "ScrollClaim"] },
      { name: "ClanScroll™", subNodes: ["CultureCast", "VaultClaim", "RiteMark", "TradEcho"] },
      { name: "CultureGrid™", subNodes: ["LoopTotem", "ClaimClan", "VaultGlyph", "SymbolTrack"] },
      { name: "MythLoop™", subNodes: ["MythDrop", "EchoPath", "ScrollProof", "RitualGrid"] },
      { name: "AuraDrop™", subNodes: ["AuraTrack", "VaultCast", "TotemPanel", "GlyphEcho"] },
      { name: "CeremPath™", subNodes: ["CeremSync", "ClaimRite", "ScrollVault", "TotemBeam"] },
      { name: "EchoGlyph™", subNodes: ["GlyphSync", "SpiritClaim", "VaultMyth", "EchoClan"] },
      { name: "TradVault™", subNodes: ["TradPanel", "LoopClaim", "MythTrack", "VaultCulture"] },
      { name: "LineageClaim™", subNodes: ["LineagePath", "VaultTag", "EchoGlyph", "ScrollCast"] },
    ]),
  },

  saas: {
    name: "SaaS & Licensing",
    description: "Software as a service platforms and digital licensing systems.",
    nodes: 1280,
    revenue: 9800000,
    dominanceScore: 82,
    pricing: {
      glyph: "🔑",
      monthlyFee: 95,
      annualFee: 980,
      payoutTier: "A",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "SaaSChain™", subNodes: ["SuitePath", "VaultLicense", "TokenPanel", "ClaimKey"] },
      { name: "LicenseGrid™", subNodes: ["GridDrop", "LicenseEcho", "VaultTrack", "KeyTag"] },
      { name: "TokenSaaS™", subNodes: ["SaaSPanel", "ClaimSync", "VaultBeam", "OmniGrid"] },
      { name: "VaultKey™", subNodes: ["KeyProof", "TokenClaim", "ScrollVault", "LicenseSeal"] },
      { name: "OmniLicense™", subNodes: ["LicenseDrop", "VaultMap", "TokenNest", "ClaimEcho"] },
      { name: "ScrollSync™", subNodes: ["SyncTrack", "LicensePath", "VaultKeyX", "SuiteEcho"] },
      { name: "PulseSaaS™", subNodes: ["PulseSync", "VaultPanelX", "TokenGrid", "ClaimBoard"] },
      { name: "ClaimSuite™", subNodes: ["SuiteLoop", "LicenseNest", "VaultClaim", "KeyEcho"] },
      { name: "YieldKey™", subNodes: ["YieldSuite", "LicensePanel", "VaultDrop", "ScrollTrack"] },
      { name: "SaaSBoard™", subNodes: ["BoardEcho", "VaultBeamX", "LicenseSync", "ClaimPanel"] },
    ]),
  },

  trade: {
    name: "Trade Systems",
    description: "Trading platforms, market systems, and exchange protocols.",
    nodes: 1420,
    revenue: 10600000,
    dominanceScore: 88,
    pricing: {
      glyph: "🧺",
      monthlyFee: 88,
      annualFee: 888,
      payoutTier: "A+",
      region: "Div A-F",
    },
    brands: addRandomPrices([
      { name: "TradeFlow", subNodes: ["FlowTrade", "GridMarket", "NodeExchange"] },
      { name: "MarketGrid", subNodes: ["LinkValue", "MeshCommodity", "SyncSupply"] },
      { name: "ExchangeNode", subNodes: ["TraceDemand", "TradeGlobal", "ExchangeFair"] },
      { name: "ValueLink", subNodes: ["FlowAsset", "TradeID", "MarketScan"] },
      { name: "CommodityMesh", subNodes: ["ExchangeMesh", "NodeValue", "CommodityFlow"] },
      { name: "SupplySync", subNodes: ["SupplyTrace", "DemandLink", "GlobalNode"] },
      { name: "DemandTrace", subNodes: ["FairGrid", "AssetSync", "TradePulse"] },
      { name: "GlobalTrade", subNodes: ["MarketFlow", "ExchangeTrace", "ValueNode"] },
      { name: "FairExchange", subNodes: ["CommodityLink", "SupplyMesh", "DemandFlow"] },
      { name: "AssetFlow", subNodes: ["GlobalSync", "FairTrace", "AssetNode"] },
    ]),
  },

  utilities: {
    name: "Utilities & Energy",
    description: "Energy management, utility systems, and infrastructure services.",
    nodes: 1580,
    revenue: 11200000,
    dominanceScore: 86,
    pricing: {
      glyph: "🔋",
      monthlyFee: 70,
      annualFee: 710,
      payoutTier: "B+",
      region: "Div A-Z",
    },
    brands: addRandomPrices([
      { name: "PowerGrid", subNodes: ["GridPower", "FlowHydro", "NodeSolar"] },
      { name: "HydroFlow", subNodes: ["LinkWind", "MeshGeo", "SyncEnergy"] },
      { name: "SolarNode", subNodes: ["TraceWater", "UtilityWaste", "GridSmart"] },
      { name: "WindLink", subNodes: ["FlowResource", "PowerID", "HydroScan"] },
      { name: "GeoMesh", subNodes: ["SolarMesh", "NodeWind", "GeoFlow"] },
      { name: "EnergySync", subNodes: ["EnergyTrace", "WaterLink", "WasteNode"] },
      { name: "WaterTrace", subNodes: ["SmartGrid", "ResourceSync", "PowerPulse"] },
      { name: "WasteUtility", subNodes: ["HydroFlow", "SolarTrace", "WindNode"] },
      { name: "SmartGridX", subNodes: ["GeoLink", "EnergyMesh", "WaterFlow"] },
      { name: "ResourceFlow", subNodes: ["WasteSync", "SmartTrace", "ResourceNode"] },
    ]),
  },

  voice: {
    name: "Voice & Audio",
    description: "Voice recognition, audio processing, and sonic technologies.",
    nodes: 870,
    revenue: 6300000,
    dominanceScore: 73,
    pricing: {
      glyph: "🎙️",
      monthlyFee: 60,
      annualFee: 630,
      payoutTier: "B",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "AudioMesh", subNodes: ["MeshAudio", "NodeSonic", "LinkVoice"] },
      { name: "SonicNode", subNodes: ["GridEcho", "VaultSound", "SyncSpeech"] },
      { name: "VoiceLink", subNodes: ["TraceTone", "FlowVocal", "MeshAcoustic"] },
      { name: "EchoGrid", subNodes: ["NodeListen", "AudioID", "SonicScan"] },
      { name: "SoundVault", subNodes: ["VoiceMesh", "EchoNode", "SoundFlow"] },
      { name: "SpeechSync", subNodes: ["SpeechTrace", "ToneLink", "VocalNode"] },
      { name: "ToneTrace", subNodes: ["AcousticGrid", "ListenSync", "AudioPulse"] },
      { name: "VocalFlow", subNodes: ["SonicFlow", "VoiceTrace", "EchoNode"] },
      { name: "AcousticMesh", subNodes: ["SoundLink", "SpeechMesh", "ToneFlow"] },
      { name: "ListenNode", subNodes: ["VocalSync", "AcousticTrace", "ListenNode"] },
    ]),
  },

  webless: {
    name: "Webless Tech & Nodes",
    description: "Offline-first technologies, QR systems, and mesh networking.",
    nodes: 1320,
    revenue: 8600000,
    dominanceScore: 80,
    pricing: {
      glyph: "📡",
      monthlyFee: 76,
      annualFee: 770,
      payoutTier: "A",
      region: "Div D-G",
    },
    brands: addRandomPrices([
      { name: "OmniQR", subNodes: ["QRNode", "YieldPing", "ClaimGrid", "ScanFlow", "RouteToken"] },
      { name: "MeshSync", subNodes: ["NodeJoin", "MeshPulse", "ConnectGrid", "DropRoute", "SignalFlow"] },
      { name: "VaultBeacon", subNodes: ["FlashNode", "SecurePing", "LightPath", "VaultCast", "NodePing"] },
      { name: "TapClaim", subNodes: ["NFCTrigger", "ScrollTap", "NodePush", "PayoutTouch", "QRClaim"] },
      { name: "ScrollKey", subNodes: ["KeyNode", "UnlockTrack", "AccessVault", "PeerPass", "SecureDrop"] },
      { name: "AirLoop", subNodes: ["LoopCast", "AirPing", "PassiveTrack", "QRWave", "SignalBoard"] },
      { name: "DotGrid", subNodes: ["DotNode", "MeshPrint", "InkLink", "FormSync", "TagPulse"] },
      { name: "VaultTouch", subNodes: ["TouchID", "QRAccess", "ScrollPulse", "FieldTrigger", "NodeProof"] },
      { name: "PouchCast", subNodes: ["DeviceDrop", "LoopTouch", "PulseSend", "AirLabel", "AssetBeam"] },
      { name: "YieldTrace", subNodes: ["QRDrop", "PathYield", "SignalToken", "ScanLock", "LoopClaim"] },
    ]),
  },

  nft: {
    name: "NFT & Ownership",
    description: "Non-fungible tokens, digital ownership, and blockchain assets.",
    nodes: 950,
    revenue: 9200000,
    dominanceScore: 84,
    pricing: {
      glyph: "🔁",
      monthlyFee: 120,
      annualFee: 1200,
      payoutTier: "A",
      region: "FAA IP",
    },
    brands: addRandomPrices([
      { name: "ClaimGrid™", subNodes: ["TokenPath", "VaultTrace", "ClaimEcho", "ScrollDrop"] },
      { name: "TokenSync™", subNodes: ["SyncToken", "ProofPanel", "NFTTag", "VaultClaim"] },
      { name: "VaultMint™", subNodes: ["MintYield", "ChainEcho", "DropGrid", "TokenSeal"] },
      { name: "NFTLoop™", subNodes: ["LoopProof", "VaultSync", "AssetTag", "NFTTrack"] },
      { name: "ScrollProof™", subNodes: ["ScrollMint", "ClaimLoop", "VaultAsset", "DropChain"] },
      { name: "IPTrace™", subNodes: ["TraceMint", "VaultBoard", "NFTDrop", "IPClaim"] },
      { name: "MintEcho™", subNodes: ["EchoScroll", "ClaimNest", "TokenLock", "SealDrop"] },
      { name: "VaultSeal™", subNodes: ["VaultProof", "NFTSync", "ChainYield", "DropEcho"] },
      { name: "ChainLock™", subNodes: ["LockTrace", "VaultMap", "ProofToken", "ClaimTrack"] },
      { name: "PulseDrop™", subNodes: ["PulseGrid", "NFTVault", "AssetSync", "MintProof"] },
    ]),
  },

  zerowaste: {
    name: "Zero Waste",
    description: "Waste reduction, recycling systems, and circular economy platforms.",
    nodes: 720,
    revenue: 5200000,
    dominanceScore: 70,
    pricing: {
      glyph: "♻️",
      monthlyFee: 40,
      annualFee: 450,
      payoutTier: "B",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "EcoNest™", subNodes: ["GreenSync", "VaultTrack", "LoopPath", "CompostTag"] },
      { name: "GreenLoop™", subNodes: ["TrashGrid", "CycleDrop", "VaultEcho", "ClaimPath"] },
      { name: "CycleSync™", subNodes: ["RecycleCast", "GreenEcho", "SortTrack", "YieldBin"] },
      { name: "ZeroCrate™", subNodes: ["DropWaste", "EcoNode", "ClaimClean", "LoopTrace"] },
      { name: "WasteGrid™", subNodes: ["GridWaste", "VaultNest", "SortEcho", "BinClaim"] },
      { name: "BioDrop™", subNodes: ["BioTrack", "VaultBin", "PulseSort", "TrashTag"] },
      { name: "SustainClaim™", subNodes: ["EcoProof", "ClaimBin", "CycleTag", "LoopEcho"] },
      { name: "LoopSort™", subNodes: ["SortMap", "VaultClaim", "CleanDrop", "GreenVault"] },
      { name: "PulseGreen™", subNodes: ["GreenFlow", "BinCast", "EcoClaim", "RecycleNest"] },
      { name: "YieldTrash™", subNodes: ["PulseTrash", "VaultClean", "ClaimDrop", "CycleTrack"] },
    ]),
  },

  professional: {
    name: "Professional Services",
    description: "Legal, accounting, consulting, and professional service management.",
    nodes: 1180,
    revenue: 10400000,
    dominanceScore: 87,
    pricing: {
      glyph: "🧾",
      monthlyFee: 110,
      annualFee: 1100,
      payoutTier: "A",
      region: "Global",
    },
    brands: addRandomPrices([
      { name: "LedgerNest™", subNodes: ["LedgerCore", "VaultTrack", "QRInvoice", "AuditSync", "StatementFlow", "TaxGrid"] },
      { name: "OmniBooks™", subNodes: ["BooksPath", "VaultEcho", "QRPay", "BudgetMesh", "EntryLoop", "PayrollCast"] },
      { name: "QCalcX™", subNodes: ["QuantZone", "CostTrack", "VaultEcho", "GridEstimate", "QRClaim", "SiteYield"] },
      { name: "SiteProof™", subNodes: ["ProofMesh", "ProjectVault", "QRSync", "SpecClaim", "SurveyNode", "BuildFlow"] },
      { name: "LawTrace™", subNodes: ["LawGrid", "VaultLegal", "QRCase", "ClauseMap", "SignalJudge", "TrackClaim"] },
      { name: "ContractCast™", subNodes: ["CastPath", "VaultContract", "QRSign", "FormDrop", "LegalSync", "NodeClause"] },
      { name: "Enginuity™", subNodes: ["EnginuityCore", "VaultStruct", "QREngine", "ModelClaim", "SpecLoop", "PlanNode"] },
      { name: "StructVault™", subNodes: ["VaultFrame", "StructMap", "QRDesign", "BuildPath", "EstimateLine", "NodeSpec"] },
      { name: "RegiSync™", subNodes: ["RegCore", "VaultRule", "QRCompliance", "GovTrack", "DocNode", "ProofSync"] },
      { name: "ScrollAudit™", subNodes: ["AuditTrail", "VaultAudit", "QRTrace", "NodeForm", "ControlClaim", "VerifyRoute"] },
    ]),
  },

  "payroll-mining": {
    name: "Payroll Mining & Accounting",
    description: "Blockchain-based payroll, cryptocurrency accounting, and mining operations.",
    nodes: 850,
    revenue: 8900000,
    dominanceScore: 81,
    pricing: {
      glyph: "🪙",
      monthlyFee: 100,
      annualFee: 1000,
      payoutTier: "A+",
      region: "Global Finance",
    },
    brands: addRandomPrices([
      { name: "PayMine", subNodes: ["MineTrack", "LedgerVerify", "AuditSync"] },
      { name: "CoinLedger", subNodes: ["PayrollCrypto", "AccountToken", "FlowMine"] },
      { name: "AuditCoin", subNodes: ["PayYield", "LedgerHash", "PayBlock"] },
      { name: "CryptoPayroll", subNodes: ["CoinNode", "MineID", "LedgerScan"] },
      { name: "TokenAccount", subNodes: ["AuditBlock", "CryptoFlow", "TokenYield"] },
      { name: "MineFlow", subNodes: ["MineSync", "PayTrace", "HashFlow"] },
      { name: "YieldPay", subNodes: ["YieldNode", "LedgerBlock", "CoinFlow"] },
      { name: "HashLedger", subNodes: ["CryptoTrace", "TokenNode", "MinePay"] },
      { name: "BlockPay", subNodes: ["BlockSync", "NodeHash", "CoinYield"] },
      { name: "NodeCoin", subNodes: ["PayFlow", "LedgerMine", "AuditTrace"] },
    ]),
  },

  mining: {
    name: "Mining & Resources",
    description: "Resource extraction, mining operations, and geological tracking.",
    nodes: 1120,
    revenue: 12800000,
    dominanceScore: 88,
    pricing: {
      glyph: "⛏️",
      monthlyFee: 150,
      annualFee: 1800,
      payoutTier: "A+",
      region: "Global Resources",
    },
    brands: addRandomPrices([
      { name: "MineNest™", subNodes: ["NestTrack", "VaultShaft", "QRMine", "ClaimGrid"] },
      { name: "DrillCoreX™", subNodes: ["CoreDrop", "PulsePath", "OreTrace", "DrillYield"] },
      { name: "OreSync™", subNodes: ["SyncRock", "VaultEcho", "QRDrill", "ClaimTag"] },
      { name: "VaultRock™", subNodes: ["RockBeam", "MineLoop", "SignalTrace", "QRClaim"] },
      { name: "ClaimMine™", subNodes: ["ClaimOre", "VaultPath", "OrePing", "MineSignal"] },
      { name: "TrackShaft™", subNodes: ["ShaftMesh", "DropMine", "TrackSeam", "QRTrack"] },
      { name: "PulseMine™", subNodes: ["PulseCrate", "MineEcho", "YieldDrill", "GridTag"] },
      { name: "CoreBeam™", subNodes: ["BeamPath", "ClaimRock", "VaultLoop", "SeamDrop"] },
      { name: "DigEcho™", subNodes: ["EchoMine", "RockPing", "VaultTrace", "ClaimBeam"] },
      { name: "RockPath™", subNodes: ["PathDrop", "GridMine", "QRNode", "YieldOre"] },
    ]),
  },

  wildlife: {
    name: "Wildlife & Habitat",
    description: "Wildlife conservation, habitat monitoring, and biodiversity tracking.",
    nodes: 640,
    revenue: 4800000,
    dominanceScore: 67,
    pricing: {
      glyph: "🦁",
      monthlyFee: 35,
      annualFee: 380,
      payoutTier: "B",
      region: "Conservation Zones",
    },
    brands: addRandomPrices([
      { name: "EcoGuard", subNodes: ["GuardEco", "LinkHabitat", "TraceWild"] },
      { name: "HabitatLink", subNodes: ["NodeBio", "MeshConserv", "SyncSpecies"] },
      { name: "WildTrace", subNodes: ["ProtectZone", "FlowNature", "GridPreserve"] },
      { name: "BioNode", subNodes: ["VaultFauna", "EcoID", "HabitatScan"] },
      { name: "ConservMesh", subNodes: ["WildMesh", "NodeBio", "ConservFlow"] },
      { name: "SpeciesSync", subNodes: ["SpeciesTrace", "ZoneLink", "NatureNode"] },
      { name: "ZoneProtect", subNodes: ["PreserveGrid", "FaunaSync", "EcoPulse"] },
      { name: "NatureFlow", subNodes: ["HabitatFlow", "WildTrace", "BioNode"] },
      { name: "PreserveGrid", subNodes: ["ConservLink", "SpeciesMesh", "ZoneFlow"] },
      { name: "FaunaVault", subNodes: ["NatureSync", "PreserveTrace", "FaunaNode"] },
    ]),
  },
};

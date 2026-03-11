/**
 * ExplorePage — GitHub Explore equivalent for academic research
 * Features: trending research, featured projects, topic discovery, researcher spotlights
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { PageShell } from "../components/layout/PageShell";
import { Telescope } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type TrendPeriod = "today" | "week" | "month";
type ExploreTab = "trending" | "topics" | "researchers" | "collections" | "startups";
type StartupStage = "idea" | "mvp" | "seed" | "series-a" | "growth";
type StartupSector = "biotech" | "deeptech" | "ai" | "climatetech" | "edtech" | "healthtech" | "fintech" | "spacetech";
type StartupRole = "co-founder" | "advisor" | "engineer" | "researcher" | "designer" | "marketing";

interface StartupProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stage: StartupStage;
  sector: StartupSector;
  rolesNeeded: StartupRole[];
  founder: string;
  founderAvatar: string;
  teamSize: number;
  seeking: string[];
  raised: string | null;
  website: string | null;
  tags: string[];
  isWatching: boolean;
  hasApplied: boolean;
  createdAt: number;
  location: string;
}

interface TrendingProject {
  id: string;
  name: string;
  description: string;
  author: string;
  authorAvatar: string;
  field: string;
  stars: number;
  starsToday: number;
  forks: number;
  language: string;
  languageColor: string;
  tags: string[];
  updatedAt: number;
}

interface ResearchTopic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  projectCount: number;
  researcherCount: number;
  trending: boolean;
  relatedTopics: string[];
}

interface ResearcherSpotlight {
  id: string;
  name: string;
  avatar: string;
  institution: string;
  field: string;
  bio: string;
  publications: number;
  citations: number;
  hIndex: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  topTopics: string[];
  recentActivity: string;
}

interface ResearchCollection {
  id: string;
  title: string;
  description: string;
  curator: string;
  curatorAvatar: string;
  projectCount: number;
  stars: number;
  coverColor: string;
  coverIcon: string;
  tags: string[];
  createdAt: number;
}

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-explore-data";

const STAGE_CFG: Record<StartupStage, { label: string; color: string; icon: string }> = {
  idea:      { label: 'Idea',      color: '#6b7280', icon: '💡' },
  mvp:       { label: 'MVP',       color: '#8b5cf6', icon: '🛠️' },
  seed:      { label: 'Seed',      color: '#3b82f6', icon: '🌱' },
  'series-a':{ label: 'Series A',  color: '#6366f1', icon: '🚀' },
  growth:    { label: 'Growth',    color: '#22c55e', icon: '📈' },
};

const SECTOR_CFG: Record<StartupSector, { label: string; color: string; icon: string }> = {
  biotech:     { label: 'BioTech',     color: '#22c55e', icon: '🧬' },
  deeptech:    { label: 'DeepTech',    color: '#6366f1', icon: '⚛️' },
  ai:          { label: 'AI/ML',       color: '#8b5cf6', icon: '🤖' },
  climatetech: { label: 'ClimateTech', color: '#10b981', icon: '🌍' },
  edtech:      { label: 'EdTech',      color: '#f59e0b', icon: '🎓' },
  healthtech:  { label: 'HealthTech',  color: '#ef4444', icon: '🏥' },
  fintech:     { label: 'FinTech',     color: '#3b82f6', icon: '💰' },
  spacetech:   { label: 'SpaceTech',   color: '#a855f7', icon: '🚀' },
};

const ROLE_CFG: Record<StartupRole, { label: string; color: string }> = {
  'co-founder': { label: 'Co-founder', color: '#f97316' },
  advisor:      { label: 'Advisor',    color: '#8b5cf6' },
  engineer:     { label: 'Engineer',   color: '#3b82f6' },
  researcher:   { label: 'Researcher', color: '#6366f1' },
  designer:     { label: 'Designer',   color: '#ec4899' },
  marketing:    { label: 'Marketing',  color: '#22c55e' },
};

const SAMPLE_STARTUPS: StartupProject[] = [
  {
    id: 's1', name: 'NeuralPath', tagline: 'AI-powered drug discovery for rare diseases',
    description: 'Using transformer-based models trained on molecular graphs to identify novel drug candidates for rare genetic disorders 10× faster than traditional screening.',
    stage: 'seed', sector: 'biotech', rolesNeeded: ['co-founder', 'researcher', 'engineer'],
    founder: 'Dr. Elena Vasquez', founderAvatar: '🧬', teamSize: 4, seeking: ['ML Engineer', 'Medicinal Chemist', 'Clinical Advisor'],
    raised: '$1.2M', website: null, tags: ['drug-discovery', 'rare-disease', 'transformers'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 14, location: 'Boston, MA',
  },
  {
    id: 's2', name: 'ClimaCore', tagline: 'Real-time carbon accounting for supply chains',
    description: 'Scope 3 emissions tracking platform combining satellite data, IoT sensors, and LLM-based supplier questionnaires to give Fortune 500 companies audit-ready carbon reports.',
    stage: 'series-a', sector: 'climatetech', rolesNeeded: ['engineer', 'marketing', 'advisor'],
    founder: 'Dr. Marco Rossi', founderAvatar: '🌍', teamSize: 12, seeking: ['Backend Engineer', 'ESG Advisor', 'B2B Sales Lead'],
    raised: '$4.5M', website: 'climacore.io', tags: ['carbon', 'ESG', 'supply-chain', 'IoT'],
    isWatching: true, hasApplied: false, createdAt: Date.now() - 86400000 * 30, location: 'Amsterdam, NL',
  },
  {
    id: 's3', name: 'SynapseEdu', tagline: 'Adaptive research literacy for undergraduates',
    description: 'LLM-tutored platform that teaches critical reading of scientific papers through Socratic dialogue, spaced repetition, and peer debate simulations.',
    stage: 'mvp', sector: 'edtech', rolesNeeded: ['co-founder', 'designer', 'researcher'],
    founder: 'Dr. Aisha Patel', founderAvatar: '📚', teamSize: 2, seeking: ['Co-founder (Product)', 'UX Researcher', 'University Partnerships'],
    raised: null, website: null, tags: ['research-literacy', 'LLM', 'pedagogy'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 7, location: 'Oxford, UK',
  },
  {
    id: 's4', name: 'QuantumVault', tagline: 'Post-quantum encryption for research data',
    description: 'End-to-end encrypted data storage and sharing platform built on lattice-based cryptography, compliant with upcoming NIST PQC standards.',
    stage: 'mvp', sector: 'deeptech', rolesNeeded: ['engineer', 'advisor', 'marketing'],
    founder: 'Prof. Wei Zhang', founderAvatar: '🔐', teamSize: 3, seeking: ['Cryptography Engineer', 'CISO Advisor', 'Enterprise Sales'],
    raised: '$250K', website: null, tags: ['post-quantum', 'encryption', 'NIST-PQC'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 21, location: 'Singapore',
  },
  {
    id: 's5', name: 'GenomeFlow', tagline: 'No-code genomics pipeline builder',
    description: 'Drag-and-drop platform for building, running, and sharing genomic analysis pipelines on cloud infrastructure. Reduces setup time from weeks to hours.',
    stage: 'seed', sector: 'biotech', rolesNeeded: ['engineer', 'researcher', 'designer'],
    founder: 'Dr. Sarah Kim', founderAvatar: '🧪', teamSize: 6, seeking: ['Frontend Engineer', 'Bioinformatician', 'UX Designer'],
    raised: '$800K', website: 'genomeflow.io', tags: ['genomics', 'no-code', 'bioinformatics', 'cloud'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 45, location: 'Cambridge, MA',
  },
  {
    id: 's6', name: 'OrbitMed', tagline: 'Space-based health monitoring for chronic diseases',
    description: 'Leveraging microgravity research insights to develop next-gen wearables for continuous cardiovascular and metabolic monitoring.',
    stage: 'idea', sector: 'spacetech', rolesNeeded: ['co-founder', 'researcher', 'engineer'],
    founder: 'Dr. James Okafor', founderAvatar: '🚀', teamSize: 1, seeking: ['Technical Co-founder', 'Cardiologist Advisor', 'Hardware Engineer'],
    raised: null, website: null, tags: ['wearables', 'space-medicine', 'cardiovascular'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 3, location: 'Houston, TX',
  },
  {
    id: 's7', name: 'PeerLedger', tagline: 'Blockchain-verified peer review on DeSci rails',
    description: 'Decentralized peer review protocol where reviewers earn token rewards for quality feedback, and papers earn on-chain credibility scores over time.',
    stage: 'mvp', sector: 'deeptech', rolesNeeded: ['engineer', 'advisor', 'researcher'],
    founder: 'Prof. Marcus Bell', founderAvatar: '⛓️', teamSize: 5, seeking: ['Solidity Dev', 'Academic Partnerships Lead', 'Tokenomics Advisor'],
    raised: '$180K', website: 'peerledger.xyz', tags: ['DeSci', 'peer-review', 'blockchain', 'tokenomics'],
    isWatching: true, hasApplied: false, createdAt: Date.now() - 86400000 * 60, location: 'Remote',
  },
  {
    id: 's8', name: 'CortexCare', tagline: 'AI mental health triage for university students',
    description: 'Conversational AI platform providing evidence-based CBT exercises and triage support, integrated with university counselling systems to reduce wait times by 70%.',
    stage: 'growth', sector: 'healthtech', rolesNeeded: ['engineer', 'advisor', 'marketing'],
    founder: 'Prof. Lisa Nguyen', founderAvatar: '🧠', teamSize: 18, seeking: ['Clinical Psychologist Advisor', 'University Partnership Manager', 'Growth Marketer'],
    raised: '$6.2M', website: 'cortexcare.ai', tags: ['mental-health', 'CBT', 'university', 'AI'],
    isWatching: false, hasApplied: false, createdAt: Date.now() - 86400000 * 90, location: 'London, UK',
  },
];

const FIELD_COLORS: Record<string, string> = {
  "Physics": "#6366f1",
  "Biology": "#22c55e",
  "Chemistry": "#f59e0b",
  "Mathematics": "#3b82f6",
  "Computer Science": "#8b5cf6",
  "Neuroscience": "#ec4899",
  "Psychology": "#14b8a6",
  "Economics": "#f97316",
  "Philosophy": "#a855f7",
  "Engineering": "#64748b",
  "Medicine": "#ef4444",
  "Environmental Science": "#10b981",
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Sample Data ─────────────────────────────────────────────
function createSampleData() {
  const projects: TrendingProject[] = [
    {
      id: generateId(), name: "Quantum Entanglement in Biological Systems",
      description: "Investigating quantum coherence effects in photosynthesis and avian navigation. Multi-disciplinary approach combining quantum physics and molecular biology.",
      author: "Dr. Elena Vasquez", authorAvatar: "🧬", field: "Physics",
      stars: 342, starsToday: 28, forks: 67, language: "LaTeX", languageColor: "#3D6117",
      tags: ["quantum-biology", "photosynthesis", "entanglement"], updatedAt: Date.now() - 3600000,
    },
    {
      id: generateId(), name: "Neural Architecture Search for Scientific Discovery",
      description: "Automated discovery of neural network architectures optimized for scientific data analysis and hypothesis generation.",
      author: "Prof. James Chen", authorAvatar: "🤖", field: "Computer Science",
      stars: 289, starsToday: 45, forks: 112, language: "Python", languageColor: "#3572A5",
      tags: ["NAS", "AI-science", "deep-learning"], updatedAt: Date.now() - 7200000,
    },
    {
      id: generateId(), name: "CRISPR-Cas13 RNA Editing Toolkit",
      description: "Comprehensive toolkit for RNA-level gene editing with improved specificity and reduced off-target effects.",
      author: "Dr. Sarah Kim", authorAvatar: "🧪", field: "Biology",
      stars: 567, starsToday: 34, forks: 203, language: "R", languageColor: "#198CE7",
      tags: ["CRISPR", "RNA-editing", "gene-therapy"], updatedAt: Date.now() - 1800000,
    },
    {
      id: generateId(), name: "Topological Data Analysis for Climate Models",
      description: "Applying persistent homology and topological methods to identify patterns in climate simulation data.",
      author: "Dr. Marco Rossi", authorAvatar: "🌍", field: "Mathematics",
      stars: 198, starsToday: 15, forks: 42, language: "Julia", languageColor: "#9558B2",
      tags: ["TDA", "climate", "topology"], updatedAt: Date.now() - 14400000,
    },
    {
      id: generateId(), name: "Consciousness and Integrated Information Theory",
      description: "Formalizing and testing predictions of IIT 4.0 with novel experimental paradigms using perturbational complexity index.",
      author: "Prof. Giulio Tononi", authorAvatar: "🧠", field: "Neuroscience",
      stars: 423, starsToday: 52, forks: 89, language: "MATLAB", languageColor: "#e16737",
      tags: ["consciousness", "IIT", "neuroscience"], updatedAt: Date.now() - 5400000,
    },
    {
      id: generateId(), name: "Behavioral Economics of AI Adoption",
      description: "Large-scale study on cognitive biases affecting AI tool adoption in academic research workflows.",
      author: "Dr. Aisha Patel", authorAvatar: "📊", field: "Economics",
      stars: 156, starsToday: 19, forks: 31, language: "Stata", languageColor: "#1a5f91",
      tags: ["behavioral-economics", "AI-adoption", "cognitive-bias"], updatedAt: Date.now() - 10800000,
    },
    {
      id: generateId(), name: "Metamaterials for Acoustic Cloaking",
      description: "Design and fabrication of acoustic metamaterials achieving broadband sound invisibility at room temperature.",
      author: "Dr. Wei Zhang", authorAvatar: "🔊", field: "Engineering",
      stars: 234, starsToday: 22, forks: 56, language: "COMSOL", languageColor: "#4a90d9",
      tags: ["metamaterials", "acoustics", "cloaking"], updatedAt: Date.now() - 21600000,
    },
    {
      id: generateId(), name: "Microbiome-Gut-Brain Axis in Depression",
      description: "Longitudinal study mapping gut microbiome composition to depressive symptom trajectories using multi-omics approaches.",
      author: "Prof. Lisa Nguyen", authorAvatar: "🦠", field: "Medicine",
      stars: 378, starsToday: 41, forks: 95, language: "Python", languageColor: "#3572A5",
      tags: ["microbiome", "depression", "gut-brain"], updatedAt: Date.now() - 9000000,
    },
  ];

  const topics: ResearchTopic[] = [
    { id: generateId(), name: "Artificial Intelligence", description: "Machine learning, deep learning, and AI applications in science", icon: "🤖", color: "#8b5cf6", projectCount: 1247, researcherCount: 892, trending: true, relatedTopics: ["Machine Learning", "Neural Networks", "NLP"] },
    { id: generateId(), name: "Quantum Computing", description: "Quantum algorithms, error correction, and quantum advantage", icon: "⚛️", color: "#6366f1", projectCount: 634, researcherCount: 421, trending: true, relatedTopics: ["Quantum Physics", "Cryptography", "Optimization"] },
    { id: generateId(), name: "Gene Editing", description: "CRISPR, base editing, and gene therapy technologies", icon: "🧬", color: "#22c55e", projectCount: 892, researcherCount: 567, trending: true, relatedTopics: ["Molecular Biology", "Genetics", "Biotechnology"] },
    { id: generateId(), name: "Climate Science", description: "Climate modeling, carbon capture, and environmental impact", icon: "🌍", color: "#10b981", projectCount: 756, researcherCount: 498, trending: false, relatedTopics: ["Environmental Science", "Atmospheric Physics", "Ecology"] },
    { id: generateId(), name: "Neuroscience", description: "Brain mapping, neural circuits, and cognitive science", icon: "🧠", color: "#ec4899", projectCount: 1089, researcherCount: 734, trending: true, relatedTopics: ["Psychology", "Cognitive Science", "Neuroimaging"] },
    { id: generateId(), name: "Materials Science", description: "Novel materials, nanomaterials, and metamaterials", icon: "🔬", color: "#f59e0b", projectCount: 543, researcherCount: 378, trending: false, relatedTopics: ["Nanotechnology", "Chemistry", "Engineering"] },
    { id: generateId(), name: "Blockchain & DeSci", description: "Decentralized science, open access, and research DAOs", icon: "⛓️", color: "#3b82f6", projectCount: 234, researcherCount: 156, trending: true, relatedTopics: ["Cryptography", "Open Science", "Governance"] },
    { id: generateId(), name: "Longevity Research", description: "Aging biology, senolytics, and lifespan extension", icon: "⏳", color: "#f97316", projectCount: 412, researcherCount: 289, trending: true, relatedTopics: ["Biology", "Medicine", "Gerontology"] },
    { id: generateId(), name: "Space Exploration", description: "Astrobiology, space habitats, and interplanetary research", icon: "🚀", color: "#a855f7", projectCount: 367, researcherCount: 245, trending: false, relatedTopics: ["Astrophysics", "Engineering", "Biology"] },
    { id: generateId(), name: "Consciousness Studies", description: "Theories of consciousness, qualia, and subjective experience", icon: "💭", color: "#14b8a6", projectCount: 198, researcherCount: 134, trending: false, relatedTopics: ["Philosophy", "Neuroscience", "Psychology"] },
    { id: generateId(), name: "Synthetic Biology", description: "Engineered organisms, genetic circuits, and biofabrication", icon: "🧫", color: "#ef4444", projectCount: 478, researcherCount: 312, trending: true, relatedTopics: ["Bioengineering", "Genetics", "Biotechnology"] },
    { id: generateId(), name: "Robotics", description: "Autonomous systems, soft robotics, and human-robot interaction", icon: "🦾", color: "#64748b", projectCount: 623, researcherCount: 445, trending: false, relatedTopics: ["AI", "Engineering", "Computer Science"] },
  ];

  const researchers: ResearcherSpotlight[] = [
    { id: generateId(), name: "Dr. Elena Vasquez", avatar: "🧬", institution: "MIT", field: "Quantum Biology", bio: "Pioneering research at the intersection of quantum physics and molecular biology.", publications: 87, citations: 4523, hIndex: 38, followers: 1245, following: 89, isFollowing: false, topTopics: ["Quantum Biology", "Photosynthesis", "Entanglement"], recentActivity: "Published new findings on quantum coherence in chloroplasts" },
    { id: generateId(), name: "Prof. James Chen", avatar: "🤖", institution: "Stanford", field: "AI for Science", bio: "Developing AI systems that accelerate scientific discovery across disciplines.", publications: 134, citations: 12890, hIndex: 56, followers: 3456, following: 234, isFollowing: true, topTopics: ["Neural Architecture Search", "AI-Science", "AutoML"], recentActivity: "Released v3.0 of ScienceNAS framework" },
    { id: generateId(), name: "Dr. Sarah Kim", avatar: "🧪", institution: "Harvard", field: "Gene Editing", bio: "Leading CRISPR-Cas13 research for therapeutic RNA editing applications.", publications: 62, citations: 3890, hIndex: 32, followers: 2134, following: 156, isFollowing: false, topTopics: ["CRISPR", "RNA Editing", "Gene Therapy"], recentActivity: "Achieved 99.7% specificity in RNA targeting" },
    { id: generateId(), name: "Prof. Giulio Tononi", avatar: "🧠", institution: "UW-Madison", field: "Consciousness", bio: "Creator of Integrated Information Theory, exploring the nature of consciousness.", publications: 198, citations: 28900, hIndex: 72, followers: 5678, following: 45, isFollowing: false, topTopics: ["IIT", "Consciousness", "Neuroscience"], recentActivity: "Published IIT 4.0 mathematical framework" },
    { id: generateId(), name: "Dr. Aisha Patel", avatar: "📊", institution: "Oxford", field: "Behavioral Economics", bio: "Studying how cognitive biases shape technology adoption in research.", publications: 45, citations: 2100, hIndex: 24, followers: 890, following: 178, isFollowing: false, topTopics: ["Behavioral Economics", "AI Adoption", "Decision Making"], recentActivity: "Completed 10,000-participant survey on AI tool usage" },
    { id: generateId(), name: "Dr. Wei Zhang", avatar: "🔊", institution: "Tsinghua", field: "Metamaterials", bio: "Designing next-generation acoustic and electromagnetic metamaterials.", publications: 76, citations: 5670, hIndex: 41, followers: 1567, following: 112, isFollowing: true, topTopics: ["Metamaterials", "Acoustics", "Photonics"], recentActivity: "Demonstrated broadband acoustic cloaking at room temperature" },
  ];

  const collections: ResearchCollection[] = [
    { id: generateId(), title: "Foundations of AGI Safety", description: "Curated collection of research on alignment, interpretability, and AI safety.", curator: "AI Safety Institute", curatorAvatar: "🛡️", projectCount: 34, stars: 567, coverColor: "#6366f1", coverIcon: "🤖", tags: ["AI Safety", "Alignment", "Interpretability"], createdAt: Date.now() - 86400000 * 30 },
    { id: generateId(), title: "Open Science Toolkit", description: "Tools and frameworks for reproducible, transparent research.", curator: "Open Science Foundation", curatorAvatar: "🔓", projectCount: 28, stars: 423, coverColor: "#22c55e", coverIcon: "🔬", tags: ["Open Science", "Reproducibility", "Tools"], createdAt: Date.now() - 86400000 * 15 },
    { id: generateId(), title: "Climate Action Research", description: "High-impact research projects addressing climate change mitigation and adaptation.", curator: "Climate Research Network", curatorAvatar: "🌍", projectCount: 45, stars: 789, coverColor: "#10b981", coverIcon: "🌱", tags: ["Climate", "Sustainability", "Environment"], createdAt: Date.now() - 86400000 * 45 },
    { id: generateId(), title: "Pandemic Preparedness", description: "Research on epidemic modeling, vaccine development, and public health infrastructure.", curator: "Global Health Initiative", curatorAvatar: "🏥", projectCount: 52, stars: 634, coverColor: "#ef4444", coverIcon: "🦠", tags: ["Epidemiology", "Vaccines", "Public Health"], createdAt: Date.now() - 86400000 * 60 },
    { id: generateId(), title: "Quantum Advantage Benchmarks", description: "Standardized benchmarks and protocols for demonstrating quantum computational advantage.", curator: "Quantum Computing Hub", curatorAvatar: "⚛️", projectCount: 19, stars: 345, coverColor: "#8b5cf6", coverIcon: "💻", tags: ["Quantum Computing", "Benchmarks", "Algorithms"], createdAt: Date.now() - 86400000 * 20 },
    { id: generateId(), title: "Neurodiversity in Research", description: "Studies on cognitive diversity and its impact on scientific innovation and team dynamics.", curator: "Inclusive Science Lab", curatorAvatar: "🧩", projectCount: 23, stars: 278, coverColor: "#ec4899", coverIcon: "🧠", tags: ["Neurodiversity", "Innovation", "Teams"], createdAt: Date.now() - 86400000 * 10 },
  ];

  return { projects, topics, researchers, collections };
}

const STARTUPS_SK = 'thinkspace-startups-v1';
function loadStartups(): StartupProject[] {
  try { const r = localStorage.getItem(STARTUPS_SK); return r ? JSON.parse(r) : SAMPLE_STARTUPS; } catch { return SAMPLE_STARTUPS; }
}
function saveStartups(s: StartupProject[]) {
  try { localStorage.setItem(STARTUPS_SK, JSON.stringify(s)); } catch {}
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReturnType<typeof createSampleData>;
  } catch { /* ignore */ }
  return createSampleData();
}

function saveData(data: ReturnType<typeof createSampleData>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────
export default function ExplorePage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const accent = "hsl(var(--primary))";
  const textColor = "hsl(var(--foreground))";

  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState<ExploreTab>("trending");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string>("all");

  const [startups, setStartups] = useState<StartupProject[]>(loadStartups);
  const [filterStage, setFilterStage]   = useState<StartupStage | 'all'>('all');
  const [filterSector, setFilterSector] = useState<StartupSector | 'all'>('all');
  const [filterRole, setFilterRole]     = useState<StartupRole | 'all'>('all');
  const [startupSearch, setStartupSearch] = useState('');

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveStartups(startups); }, [startups]);

  // ─── Handlers ────────────────────────────────────────────
  const handleToggleFollow = useCallback((researcherId: string) => {
    setData((prev) => ({
      ...prev,
      researchers: prev.researchers.map((r) =>
        r.id === researcherId
          ? { ...r, isFollowing: !r.isFollowing, followers: r.isFollowing ? r.followers - 1 : r.followers + 1 }
          : r
      ),
    }));
  }, []);

  const handleWatchStartup = useCallback((id: string) => {
    setStartups(prev => prev.map(s => s.id === id ? { ...s, isWatching: !s.isWatching } : s));
  }, []);

  const handleApplyStartup = useCallback((id: string) => {
    setStartups(prev => prev.map(s => s.id === id ? { ...s, hasApplied: true } : s));
  }, []);

  const filteredStartups = useMemo(() => startups.filter(s => {
    if (filterStage  !== 'all' && s.stage  !== filterStage)  return false;
    if (filterSector !== 'all' && s.sector !== filterSector) return false;
    if (filterRole   !== 'all' && !s.rolesNeeded.includes(filterRole)) return false;
    if (startupSearch.trim()) {
      const q = startupSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q) ||
             s.description.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  }), [startups, filterStage, filterSector, filterRole, startupSearch]);

  const handleStarProject = useCallback((projectId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, stars: p.stars + 1, starsToday: p.starsToday + 1 } : p
      ),
    }));
  }, []);

  // ─── Filtered Data ───────────────────────────────────────
  const filteredProjects = useMemo(() => {
    let result = [...data.projects];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedField !== "all") {
      result = result.filter((p) => p.field === selectedField);
    }
    if (trendPeriod === "today") result.sort((a, b) => b.starsToday - a.starsToday);
    else result.sort((a, b) => b.stars - a.stars);
    return result;
  }, [data.projects, searchQuery, selectedField, trendPeriod]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return data.topics;
    const q = searchQuery.toLowerCase();
    return data.topics.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [data.topics, searchQuery]);

  const filteredResearchers = useMemo(() => {
    if (!searchQuery) return data.researchers;
    const q = searchQuery.toLowerCase();
    return data.researchers.filter(
      (r) => r.name.toLowerCase().includes(q) || r.institution.toLowerCase().includes(q) || r.field.toLowerCase().includes(q)
    );
  }, [data.researchers, searchQuery]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return data.collections;
    const q = searchQuery.toLowerCase();
    return data.collections.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [data.collections, searchQuery]);

  const allFields = useMemo(() => {
    const fields = new Set(data.projects.map((p) => p.field));
    return ["all", ...Array.from(fields).sort()];
  }, [data.projects]);

  // ─── Styles ──────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    padding: "20px",
    transition: "all 0.2s",
    cursor: "pointer",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: isMobile ? "8px 12px" : "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: active ? "hsl(var(--primary) / 0.12)" : "transparent",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    fontSize: isMobile ? "12px" : "14px",
    transition: "all 0.2s",
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: `1px solid ${active ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
    background: active ? "hsl(var(--primary) / 0.12)" : "transparent",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  });

  const formatNumber = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <PageShell
      title={t("explore.title") || "Εξερεύνηση"}
      subtitle={t("explore.subtitle") || "Ανακαλύψτε τάσεις, ερευνητές και έργα"}
      icon={<Telescope className="w-5 h-5" />}
    >

        {/* Search Bar */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("explore.searchPlaceholder")}
            className="w-full text-sm bg-muted/30 border border-border text-foreground outline-none"
            style={{
              padding: "14px 20px",
              borderRadius: "10px",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid hsl(var(--border))", paddingBottom: "12px", flexWrap: "wrap" }}>
          {(["trending", "topics", "researchers", "collections", "startups"] as ExploreTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
              {tab === "trending" && "🔥 "}{tab === "topics" && "📚 "}{tab === "researchers" && "👩‍🔬 "}{tab === "collections" && "📦 "}{tab === "startups" && "🚀 "}
              {!isMobile && (tab === "startups" ? "Startups" : t(`explore.tab.${tab}`))}
            </button>
          ))}
        </div>

        {/* ─── Trending Tab ─────────────────────────────── */}
        {activeTab === "trending" && (
          <div>
            {/* Period + Field Filters */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(["today", "week", "month"] as TrendPeriod[]).map((p) => (
                  <button key={p} onClick={() => setTrendPeriod(p)} style={pillStyle(trendPeriod === p)}>
                    {t(`explore.period.${p}`)}
                  </button>
                ))}
              </div>
              <div style={{ width: "1px", height: "20px", background: "hsl(var(--border))" }} />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {allFields.map((f) => (
                  <button key={f} onClick={() => setSelectedField(f)} style={pillStyle(selectedField === f)}>
                    {f === "all" ? t("common.all") : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Project List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredProjects.map((project, idx) => (
                <div key={project.id} style={{ ...cardStyle, display: "flex", gap: isMobile ? "10px" : "16px", alignItems: "flex-start" }}>
                  {!isMobile && <div className="text-xl font-bold text-muted-foreground/30" style={{ minWidth: "28px", textAlign: "right", paddingTop: "2px" }}>
                    {idx + 1}
                  </div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span style={{ fontSize: "18px" }}>{project.authorAvatar}</span>
                      <span className="text-muted-foreground text-sm">{project.author} /</span>
                      <span className="font-semibold text-base text-primary">{project.name}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2.5 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex gap-4 items-center flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: project.languageColor, display: "inline-block" }} />
                        {project.language}
                      </span>
                      <span>⭐ {formatNumber(project.stars)}</span>
                      <span>🔀 {project.forks}</span>
                      <span style={{ background: `${FIELD_COLORS[project.field] || "#666"}22`, padding: "2px 8px", borderRadius: "10px", border: `1px solid ${FIELD_COLORS[project.field] || "#666"}44` }}>
                        {project.field}
                      </span>
                      {project.tags.map((tag) => (
                        <span key={tag} className="bg-muted/50 px-2 py-0.5 rounded-lg text-[11px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!isMobile && <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStarProject(project.id); }}
                      className="px-3.5 py-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-pointer text-xs whitespace-nowrap hover:bg-muted/50"
                    >
                      ⭐ Star
                    </button>
                    <span className="text-xs text-green-500 font-semibold">
                      ▲ {project.starsToday} {t("explore.today")}
                    </span>
                  </div>}
                </div>
              ))}
              {filteredProjects.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-4">🔍</div>
                  <p>{t("explore.noResults")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Topics Tab ───────────────────────────────── */}
        {activeTab === "topics" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {filteredTopics.map((topic) => (
              <div key={topic.id} style={{ ...cardStyle, borderLeft: `3px solid ${topic.color}` }}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span style={{ fontSize: "24px" }}>{topic.icon}</span>
                  <div>
                    <div className="font-semibold text-[15px]">
                      {topic.name}
                      {topic.trending && (
                        <span className="ml-2 text-[11px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          🔥 {t("explore.trending")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-3 leading-snug">
                  {topic.description}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>📁 {topic.projectCount} {t("explore.projects")}</span>
                  <span>👩‍🔬 {topic.researcherCount} {t("explore.researchers")}</span>
                </div>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {topic.relatedTopics.map((rt) => (
                    <span key={rt} className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
                      {rt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Researchers Tab ──────────────────────────── */}
        {activeTab === "researchers" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {filteredResearchers.map((researcher) => (
              <div key={researcher.id} style={cardStyle}>
                <div className="flex gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center text-3xl shrink-0">
                    {researcher.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">{researcher.name}</div>
                    <div className="text-muted-foreground text-xs">{researcher.institution} · {researcher.field}</div>
                    <p className="text-muted-foreground text-xs mt-1 leading-snug">
                      {researcher.bio}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3 p-2.5 bg-muted/20 rounded-lg">
                  {[
                    { v: researcher.publications, l: t("explore.pubs") },
                    { v: formatNumber(researcher.citations), l: t("explore.citations") },
                    { v: researcher.hIndex, l: "h-index" },
                    { v: formatNumber(researcher.followers), l: t("explore.followers") },
                  ].map(s => (
                    <div key={s.l} className="text-center">
                      <div className="font-bold text-base">{s.v}</div>
                      <div className="text-[10px] text-muted-foreground">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {researcher.topTopics.map((topic) => (
                    <span key={topic} className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    💬 {researcher.recentActivity}
                  </span>
                  <button
                    onClick={() => handleToggleFollow(researcher.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold ml-3 shrink-0 cursor-pointer border ${
                      researcher.isFollowing
                        ? 'border-border bg-transparent text-muted-foreground'
                        : 'border-primary bg-primary text-primary-foreground'
                    }`}
                  >
                    {researcher.isFollowing ? t("explore.following") : t("explore.follow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Collections Tab ──────────────────────────── */}
        {activeTab === "collections" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {filteredCollections.map((collection) => (
              <div key={collection.id} style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
                <div style={{ background: `linear-gradient(135deg, ${collection.coverColor}33, ${collection.coverColor}11)`, padding: "24px 20px", borderBottom: `1px solid ${collection.coverColor}33`, textAlign: "center" }}>
                  <span style={{ fontSize: "40px" }}>{collection.coverIcon}</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <div className="font-semibold text-[15px] mb-1.5">{collection.title}</div>
                  <p className="text-muted-foreground text-sm mb-3 leading-snug">{collection.description}</p>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span style={{ fontSize: "14px" }}>{collection.curatorAvatar}</span>
                    <span className="text-xs text-muted-foreground">{t("explore.curatedBy")} {collection.curator}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>📁 {collection.projectCount} {t("explore.projects")}</span>
                    <span>⭐ {collection.stars}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {collection.tags.map((tag) => (
                      <span key={tag} className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Startups Tab ─────────────────────────────── */}
        {activeTab === "startups" && (
          <div>
            {/* Search */}
            <input value={startupSearch} onChange={e => setStartupSearch(e.target.value)}
              placeholder="🔍  Search startups, founders, tags…"
              className="w-full text-sm bg-muted/30 border border-border text-foreground outline-none mb-3.5"
              style={{ padding: '10px 16px', borderRadius: '10px', boxSizing: 'border-box' }}/>

            {/* Stage filter */}
            <div className="flex gap-1.5 mb-2 flex-wrap items-center">
              <span className="text-[11px] text-muted-foreground mr-1 font-semibold">STAGE</span>
              <button onClick={() => setFilterStage('all')} style={pillStyle(filterStage === 'all')}>All</button>
              {(Object.keys(STAGE_CFG) as StartupStage[]).map(s => (
                <button key={s} onClick={() => setFilterStage(s)}
                  style={{ ...pillStyle(filterStage === s), borderColor: filterStage === s ? STAGE_CFG[s].color : 'hsl(var(--border))', color: filterStage === s ? STAGE_CFG[s].color : 'hsl(var(--muted-foreground))', background: filterStage === s ? `${STAGE_CFG[s].color}22` : 'transparent' }}>
                  {STAGE_CFG[s].icon} {STAGE_CFG[s].label}
                </button>
              ))}
            </div>

            {/* Sector filter */}
            <div className="flex gap-1.5 mb-2 flex-wrap items-center">
              <span className="text-[11px] text-muted-foreground mr-1 font-semibold">SECTOR</span>
              <button onClick={() => setFilterSector('all')} style={pillStyle(filterSector === 'all')}>All</button>
              {(Object.keys(SECTOR_CFG) as StartupSector[]).map(s => (
                <button key={s} onClick={() => setFilterSector(s)}
                  style={{ ...pillStyle(filterSector === s), borderColor: filterSector === s ? SECTOR_CFG[s].color : 'hsl(var(--border))', color: filterSector === s ? SECTOR_CFG[s].color : 'hsl(var(--muted-foreground))', background: filterSector === s ? `${SECTOR_CFG[s].color}22` : 'transparent' }}>
                  {SECTOR_CFG[s].icon} {SECTOR_CFG[s].label}
                </button>
              ))}
            </div>

            {/* Role filter */}
            <div className="flex gap-1.5 mb-5 flex-wrap items-center">
              <span className="text-[11px] text-muted-foreground mr-1 font-semibold">ROLE NEEDED</span>
              <button onClick={() => setFilterRole('all')} style={pillStyle(filterRole === 'all')}>All</button>
              {(Object.keys(ROLE_CFG) as StartupRole[]).map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  style={{ ...pillStyle(filterRole === r), borderColor: filterRole === r ? ROLE_CFG[r].color : 'hsl(var(--border))', color: filterRole === r ? ROLE_CFG[r].color : 'hsl(var(--muted-foreground))', background: filterRole === r ? `${ROLE_CFG[r].color}22` : 'transparent' }}>
                  {ROLE_CFG[r].label}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} found
            </div>

            {/* Cards */}
            {filteredStartups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-4">🚀</div>
                <p>No startups match your filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredStartups.map(startup => {
                  const stg  = STAGE_CFG[startup.stage];
                  const sec  = SECTOR_CFG[startup.sector];
                  return (
                    <div key={startup.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${sec.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                            {sec.icon}
                          </div>
                          <div>
                            <div className="font-bold text-[15px]">{startup.name}</div>
                            <div className="text-[11px] text-muted-foreground">{startup.founder} · {startup.location}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: `${stg.color}22`, color: stg.color, border: `1px solid ${stg.color}40`, whiteSpace: 'nowrap' }}>
                            {stg.icon} {stg.label}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: `${sec.color}15`, color: sec.color, border: `1px solid ${sec.color}30`, whiteSpace: 'nowrap' }}>
                            {sec.label}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-semibold mb-1">{startup.tagline}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2.5 line-clamp-3">
                        {startup.description}
                      </p>

                      {/* Roles needed */}
                      <div className="mb-2">
                        <div className="text-[10px] text-muted-foreground/60 mb-1 font-semibold">ROLES NEEDED</div>
                        <div className="flex gap-1 flex-wrap">
                          {startup.rolesNeeded.map(r => (
                            <span key={r} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: `${ROLE_CFG[r].color}18`, color: ROLE_CFG[r].color, border: `1px solid ${ROLE_CFG[r].color}30`, fontWeight: 600 }}>
                              {ROLE_CFG[r].label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Seeking */}
                      <div className="mb-2.5">
                        <div className="text-[10px] text-muted-foreground/60 mb-1 font-semibold">SPECIFICALLY SEEKING</div>
                        <div className="flex gap-1 flex-wrap">
                          {startup.seeking.map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/50 text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex gap-3 text-[11px] text-muted-foreground mb-3 flex-wrap">
                        <span>👥 {startup.teamSize} team</span>
                        {startup.raised && <span className="text-green-500 font-semibold">💰 {startup.raised} raised</span>}
                        {!startup.raised && <span className="text-muted-foreground/50">💡 Pre-funding</span>}
                        {startup.website && <span>🌐 {startup.website}</span>}
                      </div>

                      {/* Tags */}
                      <div className="flex gap-1 flex-wrap mb-3">
                        {startup.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded-lg">#{tag}</span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleApplyStartup(startup.id)}
                          disabled={startup.hasApplied}
                          className={`flex-1 py-2 rounded-lg border-none text-xs font-semibold ${startup.hasApplied ? 'bg-green-500/15 text-green-500 cursor-default' : 'bg-primary text-primary-foreground cursor-pointer'}`}>
                          {startup.hasApplied ? '✓ Applied' : '✉ Apply / Connect'}
                        </button>
                        <button onClick={() => handleWatchStartup(startup.id)}
                          className={`px-3.5 py-2 rounded-lg text-xs cursor-pointer font-semibold border ${
                            startup.isWatching ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-border bg-transparent text-muted-foreground'
                          }`}>
                          {startup.isWatching ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

    </PageShell>
  );
}

/**
 * DiscoverPage — Public Research Profiles & Discovery
 * Discover researchers, trending documents, popular collections
 * Wired to UserDataContext for follow state, real collections, and following list
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { User, Users, TrendingUp, Tag, FolderOpen, Compass, Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useUserData } from "../context/UserDataContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useUserSkills, INTENT_LABELS, IntentType } from "../context/UserSkillsContext";
import { PageShell } from "../components/layout/PageShell";
import { ReportBlockButton, useBlockList } from "../components/ReportBlockModal";
import type { ReportTarget } from "../components/ReportBlockModal";
import { TrustBadge } from "../components/TrustBadge";

// ── Compatibility score ────────────────────────────────────────────────────────

function computeCompatibility(myProfile: any, expertiseTags: string[]): number {
  if (!myProfile || !myProfile.skills) return 0;
  const mySkillNames = new Set<string>(myProfile.skills.map((s: any) => s.name.toLowerCase()));
  const overlap = expertiseTags.filter(t => mySkillNames.has(t.toLowerCase())).length;
  let score = Math.min(60, overlap * 15);
  if (myProfile.availableForCollab) score += 10;
  if (myProfile.skills.length > 0) score += 10;
  if (myProfile.intents && myProfile.intents.length > 0) score += 20;
  return Math.min(100, score);
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'hsl(var(--success))' : score >= 40 ? 'hsl(var(--warning))' : '#6b7280';
  const dim = 32;
  const r = 13;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div title={`${score}% match`} style={{ position: 'relative', width: dim, height: dim, flexShrink: 0 }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={16} cy={16} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
        <circle cx={16} cy={16} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

type DiscoverTab = "researchers" | "following" | "trending" | "collections" | "topics";

interface ResearcherCard {
  id: string;
  name: string;
  institution: string;
  field: string;
  bio: string;
  avatar: string;
  publications: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  expertise: string[];
  recentWork: string;
}

interface TrendingDoc {
  id: string;
  title: string;
  author: string;
  field: string;
  views: number;
  bookmarks: number;
  updatedAt: number;
}

interface TopicCard {
  id: string;
  name: string;
  icon: string;
  color: string;
  researcherCount: number;
  documentCount: number;
  trending: boolean;
}

const SAMPLE_RESEARCHERS: ResearcherCard[] = [
  { id: "r1", name: "Dr. Elena Vasquez", institution: "MIT", field: "Cognitive Science", bio: "Researching neural correlates of working memory and attention.", avatar: "E", publications: 47, followers: 312, following: 89, isFollowing: false, expertise: ["Neuroscience", "fMRI", "Cognitive Load"], recentWork: "Neural Correlates of Selective Attention" },
  { id: "r2", name: "Prof. Marcus Chen", institution: "Stanford", field: "AI & Machine Learning", bio: "Building interpretable AI systems for scientific discovery.", avatar: "M", publications: 83, followers: 1240, following: 156, isFollowing: true, expertise: ["Deep Learning", "NLP", "Interpretability"], recentWork: "Attention Mechanisms in Scientific Text" },
  { id: "r3", name: "Dr. Amara Osei", institution: "Oxford", field: "Philosophy of Science", bio: "Exploring epistemological foundations of empirical research.", avatar: "A", publications: 29, followers: 178, following: 203, isFollowing: false, expertise: ["Epistemology", "Philosophy", "Methodology"], recentWork: "Falsificationism Revisited" },
  { id: "r4", name: "Dr. Yuki Tanaka", institution: "Tokyo University", field: "Computational Biology", bio: "Applying ML to protein structure prediction and genomics.", avatar: "Y", publications: 61, followers: 892, following: 124, isFollowing: false, expertise: ["Bioinformatics", "Genomics", "ML"], recentWork: "Graph Neural Networks for Protein Folding" },
  { id: "r5", name: "Prof. Sofia Reyes", institution: "Barcelona", field: "Behavioral Economics", bio: "Studying decision-making under uncertainty and cognitive biases.", avatar: "S", publications: 38, followers: 445, following: 67, isFollowing: true, expertise: ["Behavioral Economics", "Decision Theory", "Psychology"], recentWork: "Loss Aversion in Academic Publishing" },
  { id: "r6", name: "Dr. James Okafor", institution: "Cambridge", field: "Climate Science", bio: "Modeling climate feedback loops and tipping points.", avatar: "J", publications: 52, followers: 673, following: 98, isFollowing: false, expertise: ["Climate Modeling", "Earth Systems", "Data Science"], recentWork: "Arctic Amplification Feedback Analysis" },
];

const SAMPLE_TRENDING: TrendingDoc[] = [
  { id: "t1", title: "Large Language Models in Scientific Discovery", author: "Prof. Marcus Chen", field: "AI", views: 4821, bookmarks: 342, updatedAt: Date.now() - 86400000 * 2 },
  { id: "t2", title: "Replication Crisis: A Meta-Analysis", author: "Dr. Sofia Reyes", field: "Methodology", views: 3156, bookmarks: 289, updatedAt: Date.now() - 86400000 * 4 },
  { id: "t3", title: "Neural Correlates of Creative Thinking", author: "Dr. Elena Vasquez", field: "Neuroscience", views: 2890, bookmarks: 201, updatedAt: Date.now() - 86400000 * 6 },
  { id: "t4", title: "Graph Theory Applications in Biology", author: "Dr. Yuki Tanaka", field: "Computational Biology", views: 2341, bookmarks: 178, updatedAt: Date.now() - 86400000 * 7 },
  { id: "t5", title: "Epistemological Challenges in AI Ethics", author: "Dr. Amara Osei", field: "Philosophy", views: 1987, bookmarks: 156, updatedAt: Date.now() - 86400000 * 9 },
];

// Field impact badges — inspired by SciConnect ResearchCard Q-rank (reverse flow)
const FIELD_IMPACT: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "AI":                   { label: "Q1",  color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)",  border: "hsl(var(--success) / 0.3)" },
  "Neuroscience":         { label: "Q1",  color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)",  border: "hsl(var(--success) / 0.3)" },
  "Computational Biology":{ label: "Q1",  color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)",  border: "hsl(var(--success) / 0.3)" },
  "Methodology":          { label: "Q2",  color: "hsl(var(--info))", bg: "hsl(var(--info) / 0.1)", border: "hsl(var(--info) / 0.3)" },
  "Philosophy":           { label: "Q2",  color: "hsl(var(--info))", bg: "hsl(var(--info) / 0.1)", border: "hsl(var(--info) / 0.3)" },
};

const SAMPLE_TOPICS: TopicCard[] = [
  { id: "tp1", name: "Machine Learning", icon: "🤖", color: "#6366f1", researcherCount: 1240, documentCount: 8920, trending: true },
  { id: "tp2", name: "Neuroscience", icon: "🧠", color: "#ec4899", researcherCount: 892, documentCount: 5430, trending: true },
  { id: "tp3", name: "Climate Science", icon: "🌍", color: "#10b981", researcherCount: 673, documentCount: 4210, trending: false },
  { id: "tp4", name: "Quantum Computing", icon: "⚛️", color: "#f59e0b", researcherCount: 445, documentCount: 2890, trending: true },
  { id: "tp5", name: "Behavioral Economics", icon: "📊", color: "#06b6d4", researcherCount: 389, documentCount: 3120, trending: false },
  { id: "tp6", name: "Philosophy of Science", icon: "🔭", color: "#8b5cf6", researcherCount: 312, documentCount: 1870, trending: false },
  { id: "tp7", name: "Computational Biology", icon: "🧬", color: "#ef4444", researcherCount: 567, documentCount: 4560, trending: true },
  { id: "tp8", name: "Cognitive Science", icon: "💡", color: "#f97316", researcherCount: 478, documentCount: 3240, trending: false },
];

// ── Collaboration Proposal (self-contained) ───────────────────────────────────
type ProposalRole = 'co-author'|'collaborator'|'co-founder'|'advisor'|'peer-reviewer'|'research-partner';
type ProposalScope = 'paper'|'project'|'startup'|'grant'|'mentoring'|'other';
interface CollabProposal { id:string; toUserId:string; toUserName:string; role:ProposalRole; scope:ProposalScope; timeframe:string; compensation:string; message:string; milestones:string[]; sentAt:number; }
const PROP_KEY_D = 'collab_proposals_v1';
const PROP_ROLE_LABELS: Record<ProposalRole,string> = {'co-author':'Co-author','collaborator':'Collaborator','co-founder':'Co-founder','advisor':'Advisor','peer-reviewer':'Peer Reviewer','research-partner':'Research Partner'};
const PROP_SCOPE_LABELS: Record<ProposalScope,string> = {paper:'Research Paper',project:'Research Project',startup:'Startup',grant:'Grant Proposal',mentoring:'Mentoring',other:'Other'};
function loadDiscoverProposals(): CollabProposal[] { try { const r = localStorage.getItem(PROP_KEY_D); if (r) return JSON.parse(r); } catch {} return []; }
function saveDiscoverProposals(d: CollabProposal[]) { try { localStorage.setItem(PROP_KEY_D, JSON.stringify(d)); } catch {} }

const ALL_FIELDS = Array.from(new Set(SAMPLE_RESEARCHERS.map(r => r.field)));

type SortMode = "followers" | "publications" | "name" | "compatibility";
const ALL_INTENTS = Object.keys(INTENT_LABELS) as IntentType[];

export default function DiscoverPage() {
  const nav = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  // Semantic token shim — replaces legacy useTheme colors
  const colors = { textPrimary: 'hsl(var(--foreground))', textSecondary: 'hsl(var(--muted-foreground))', textMuted: 'hsl(var(--muted-foreground))', borderPrimary: 'hsl(var(--border))', bgInput: 'hsl(var(--muted) / 0.4)', bgSecondary: 'hsl(var(--card))' };
  const isDark = false; // no longer used for colors — kept for compat
  const { t } = useLanguage();

  const { followResearcher, unfollowResearcher, isFollowing, stats, following, collections } = useUserData();
  const { skillsProfile } = useUserSkills();
  const [activeTab, setActiveTab] = useState<DiscoverTab>("researchers");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("followers");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [justFollowed, setJustFollowed] = useState<string | null>(null);
  const [intentFilter, setIntentFilter] = useState<IntentType | 'all'>('all');
  const [openToCollabOnly, setOpenToCollabOnly] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const { isBlocked } = useBlockList();

  // Proposal modal state
  const [proposals, setProposals] = useState<CollabProposal[]>(loadDiscoverProposals);
  const [propTarget, setPropTarget] = useState<{ id: string; name: string } | null>(null);
  const [propSent, setPropSent] = useState(false);
  const [propForm, setPropForm] = useState({ role: 'collaborator' as ProposalRole, scope: 'project' as ProposalScope, timeframe: '', compensation: '', message: '', milestones: [] as string[], milestoneInput: '' });

  const hasSentProposal = (userId: string) => proposals.some(p => p.toUserId === userId);

  const openProposal = useCallback((userId: string, userName: string) => {
    setPropTarget({ id: userId, name: userName });
    setPropSent(false);
    setPropForm({ role: 'collaborator', scope: 'project', timeframe: '', compensation: '', message: '', milestones: [], milestoneInput: '' });
  }, []);

  const addPropMilestone = useCallback(() => {
    const v = propForm.milestoneInput.trim();
    if (!v) return;
    setPropForm(f => ({ ...f, milestones: [...f.milestones, v], milestoneInput: '' }));
  }, [propForm.milestoneInput]);

  const sendProposal = useCallback(() => {
    if (!propTarget || !propForm.message.trim()) return;
    const np: CollabProposal = { id: `prop-${Date.now()}`, toUserId: propTarget.id, toUserName: propTarget.name, role: propForm.role, scope: propForm.scope, timeframe: propForm.timeframe, compensation: propForm.compensation, message: propForm.message, milestones: propForm.milestones, sentAt: Date.now() };
    const next = [...proposals, np]; setProposals(next); saveDiscoverProposals(next);
    setPropSent(true);
    setTimeout(() => setPropTarget(null), 2000);
  }, [propTarget, propForm, proposals]);
  // Derive my skill names for filter pills from shared context
  const mySkillNames = useMemo((): string[] => {
    return skillsProfile.skills.map(s => s.name).filter(Boolean).slice(0, 8);
  }, [skillsProfile.skills]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const toggleFollow = (r: ResearcherCard) => {
    const alreadyFollowing = isFollowing(r.id);
    if (alreadyFollowing) {
      unfollowResearcher(r.id);
    } else {
      followResearcher({ id: r.id, name: r.name, institution: r.institution, expertise: r.expertise });
      setJustFollowed(r.id);
      setTimeout(() => setJustFollowed(null), 1800);
    }
  };

  const filteredResearchers = useMemo(() => {
    let list = SAMPLE_RESEARCHERS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.field.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q) ||
        r.expertise.some(e => e.toLowerCase().includes(q))
      );
    }
    if (fieldFilter !== "all") list = list.filter(r => r.field === fieldFilter);
    if (topicFilter) list = list.filter(r => r.expertise.some(e => e.toLowerCase().includes(topicFilter.toLowerCase())) || r.field.toLowerCase().includes(topicFilter.toLowerCase()));
    if (skillFilter) list = list.filter(r => r.expertise.some(e => e.toLowerCase().includes(skillFilter.toLowerCase())));
    // Intent filter: keep researchers whose intent tags overlap with the selected intent
    if (intentFilter !== 'all') {
      const cfg = INTENT_LABELS[intentFilter];
      if (cfg) list = list.filter(r =>
        r.expertise.some(e => e.toLowerCase().includes(cfg.label.toLowerCase().split(' ')[0])) ||
        r.field.toLowerCase().includes(cfg.label.toLowerCase().split(' ')[0])
      );
    }
    return [...list].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "publications") return b.publications - a.publications;
      if (sortMode === "compatibility") return computeCompatibility(skillsProfile, b.expertise) - computeCompatibility(skillsProfile, a.expertise);
      return b.followers - a.followers;
    });
  }, [searchQuery, fieldFilter, sortMode, topicFilter, skillFilter, intentFilter, skillsProfile]);

  const filteredTrending = useMemo(() => {
    if (!searchQuery) return SAMPLE_TRENDING;
    const q = searchQuery.toLowerCase();
    return SAMPLE_TRENDING.filter(d => d.title.toLowerCase().includes(q) || d.field.toLowerCase().includes(q));
  }, [searchQuery]);

  // Public collections from UserDataContext
  const publicCollections = useMemo(() => collections.filter(c => c.visibility === "public"), [collections]);

  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    border: `1px solid ${colors.borderPrimary}`,
    borderRadius: "16px",
    padding: "20px",
    transition: "all 0.2s ease",
  };

  const TABS: { key: DiscoverTab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: "researchers", icon: <User size={14} />, label: t("discover.researchers") || "Researchers" },
    { key: "following",   icon: <Users size={14} />, label: t("discover.following") || "Following", badge: following.length },
    { key: "trending",    icon: <TrendingUp size={14} />, label: t("discover.trending") || "Trending" },
    { key: "topics",      icon: <Tag size={14} />, label: t("discover.topics") || "Topics" },
    { key: "collections", icon: <FolderOpen size={14} />, label: t("discover.collections") || "Collections", badge: publicCollections.length },
  ];

  return (
    <PageShell>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "16px 12px" : "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "10px" }}>
              <Compass size={28} /> {t("nav.discover") || "Discover Researchers"}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: colors.textSecondary }}>
              {t("discover.subtitle") || "Find researchers, trending work, and topics in your field"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: colors.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t("discover.searchPlaceholder") || "Search researchers, topics, institutions..."}
            style={{ width: "100%", padding: "12px 48px 12px 44px", borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--foreground))", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "18px", lineHeight: 1, padding: "2px" }}>×</button>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "hsl(var(--muted) / 0.4)", padding: "4px", borderRadius: "10px", width: isMobile ? "100%" : "fit-content", flexWrap: "wrap", overflowX: isMobile ? "auto" as const : undefined }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "7px 14px", borderRadius: "10px", border: "none", background: activeTab === tab.key ? "hsl(var(--background))" : "transparent", color: activeTab === tab.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", fontWeight: activeTab === tab.key ? 700 : 500, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.18s", whiteSpace: "nowrap" }}>
              {tab.icon} {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px", background: activeTab === tab.key ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted))", color: activeTab === tab.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Researchers filter/sort bar ─────────────────────────────────────── */}
        {activeTab === "researchers" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)} style={{ padding: "7px 12px", borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--foreground))", fontSize: "12px", cursor: "pointer" }}>
              <option value="all">{t("common.allFields") || "All Fields"}</option>
              {ALL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} style={{ padding: "7px 12px", borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--foreground))", fontSize: "12px", cursor: "pointer" }}>
              <option value="followers">{t("discover.sort.followers") || "Sort: Most Followers"}</option>
              <option value="publications">{t("discover.sort.publications") || "Sort: Most Publications"}</option>
              <option value="name">{t("discover.sort.name") || "Sort: Name A–Z"}</option>
              <option value="compatibility">⚡ Sort: Best Match</option>
            </select>
            <select value={intentFilter} onChange={e => setIntentFilter(e.target.value as any)} style={{ padding: "7px 12px", borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--foreground))", fontSize: "12px", cursor: "pointer" }}>
              <option value="all">All Intents</option>
              {ALL_INTENTS.map(i => <option key={i} value={i}>{INTENT_LABELS[i].icon} {INTENT_LABELS[i].label}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: colors.textSecondary, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={openToCollabOnly} onChange={e => setOpenToCollabOnly(e.target.checked)} style={{ accentColor: 'hsl(var(--success))' }} />
              🟢 Open to collab
            </label>
            {topicFilter && (
              <button onClick={() => setTopicFilter(null)} style={{ padding: "7px 12px", borderRadius: "9px", border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.12)", color: isDark ? "#a5b4fc" : "#6366f1", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                🏷️ {topicFilter} <span style={{ fontWeight: 700 }}>×</span>
              </button>
            )}
            {skillFilter && (
              <button onClick={() => setSkillFilter(null)} style={{ padding: "7px 12px", borderRadius: "9px", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.12)", color: isDark ? "#6ee7b7" : "#059669", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚡ {skillFilter} <span style={{ fontWeight: 700 }}>×</span>
              </button>
            )}
            <span style={{ fontSize: "12px", color: colors.textMuted }}>{filteredResearchers.length} researcher{filteredResearchers.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* ── My Skills filter pills (from profile_skills_v1) ───────────────────── */}
        {activeTab === "researchers" && mySkillNames.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>⚡ My Skills:</span>
            {mySkillNames.map(skill => {
              const active = skillFilter === skill;
              return (
                <button key={skill} onClick={() => setSkillFilter(active ? null : skill)} style={{
                  padding: "4px 11px", borderRadius: "14px", fontSize: "11px", fontWeight: 600,
                  border: `1px solid ${active ? "rgba(16,185,129,0.5)" : colors.borderPrimary}`,
                  background: active ? "rgba(16,185,129,0.15)" : "transparent",
                  color: active ? (isDark ? "#6ee7b7" : "#059669") : colors.textSecondary,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  {skill}
                </button>
              );
            })}
            <span style={{ fontSize: "11px", color: colors.textMuted, marginLeft: "4px" }}>— filter by your expertise</span>
          </div>
        )}

        {/* ── Researchers Tab ─────────────────────────────────────────────────── */}
        {activeTab === "researchers" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {filteredResearchers.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px", color: colors.textMuted }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: colors.textSecondary, marginBottom: "6px" }}>{t("common.noResults") || "No researchers found"}</p>
                <p style={{ fontSize: "13px" }}>{t("discover.noResearchersHint") || "Try a different name, field, or institution"}</p>
              </div>
            )}
            {filteredResearchers.filter(r => !isBlocked(r.id)).map(r => {
              const isFollowed = isFollowing(r.id);
              return (
                <div key={r.id} style={cardStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#fff", fontWeight: 700 }}>
                        {r.avatar}
                      </div>
                      {/* Presence dot — deterministic from id hash */}
                      {(() => {
                        const hash = r.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                        const status = hash % 3 === 0 ? "online" : hash % 3 === 1 ? "away" : "offline";
                        const dotColor = status === "online" ? "hsl(var(--success))" : status === "away" ? "hsl(var(--warning))" : "#6b7280";
                        return (
                          <span style={{
                            position: "absolute", bottom: "2px", right: "2px",
                            width: "11px", height: "11px", borderRadius: "50%",
                            background: dotColor,
                            border: isDark ? "2px solid #0f0f1a" : "2px solid #ffffff",
                            boxShadow: status === "online" ? `0 0 6px ${dotColor}88` : "none",
                          }} title={status.charAt(0).toUpperCase() + status.slice(1)} />
                        );
                      })()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: "15px", color: colors.textPrimary }}>{r.name}</span>
                        {skillsProfile.skills.length > 0 && <ScoreBadge score={computeCompatibility(skillsProfile, r.expertise)} />}
                        <TrustBadge size="xs" />
                      </div>
                      <div style={{ fontSize: "12px", color: colors.textSecondary }}>{r.institution} · {r.field}</div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px", color: colors.textMuted }}>
                        <span><strong style={{ color: colors.textPrimary }}>{r.publications}</strong> {t("community.publications") || "papers"}</span>
                        <span><strong style={{ color: colors.textPrimary }}>{isFollowed ? r.followers + 1 : r.followers}</strong> {t("profile.followers") || "followers"}</span>
                        <span><strong style={{ color: colors.textPrimary }}>{r.following}</strong> {t("profile.following") || "following"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollow(r)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: isFollowed ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${colors.borderPrimary}`,
                        background: justFollowed === r.id ? "rgba(16,185,129,0.2)" : isFollowed ? "rgba(99,102,241,0.15)" : "transparent",
                        color: justFollowed === r.id ? "#10b981" : isFollowed ? "#a5b4fc" : colors.textSecondary,
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.25s ease",
                        transform: justFollowed === r.id ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {justFollowed === r.id ? `✓ ${t("discover.follow") || "Follow"}ed!` : isFollowed ? `✓ ${t("discover.following") || "Following"}` : `+ ${t("discover.follow") || "Follow"}`}
                    </button>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: colors.textSecondary, lineHeight: 1.5 }}>{r.bio}</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {r.expertise.map(tag => (
                      <span key={tag} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", color: isDark ? "#a5b4fc" : "#6366f1", border: "1px solid rgba(99,102,241,0.2)", fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: "10px" }}>
                    <div style={{ fontSize: "12px", color: colors.textMuted }}>
                      📄 Recent: <em style={{ color: colors.textSecondary }}>{r.recentWork}</em>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => openProposal(r.id, r.name)}
                        style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: hasSentProposal(r.id) ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(99,102,241,0.35)', background: hasSentProposal(r.id) ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.08)', color: hasSentProposal(r.id) ? '#22c55e' : (isDark ? '#a5b4fc' : '#6366f1') }}
                      >{hasSentProposal(r.id) ? '✓ Proposed' : '🤝 Propose'}</button>
                      <ReportBlockButton
                        target={{ type: 'user', id: r.id, name: r.name } as ReportTarget}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === "trending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredTrending.map((doc, idx) => {
              const impact = FIELD_IMPACT[doc.field];
              return (
                <div key={doc.id} style={{ ...cardStyle, display: "flex", gap: "16px", alignItems: "center" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: idx < 3 ? "linear-gradient(135deg,#f59e0b,#d97706)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: idx < 3 ? "#fff" : colors.textMuted, flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: colors.textPrimary }}>{doc.title}</span>
                      {impact && (
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "6px", background: impact.bg, color: impact.color, border: `1px solid ${impact.border}`, flexShrink: 0 }}>
                          {impact.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary }}>{doc.author} · {doc.field} · {new Date(doc.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>{doc.views.toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: colors.textMuted }}>{t("common.views") || "views"}</div>
                    </div>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24" }}>{doc.bookmarks}</div>
                      <div style={{ fontSize: "10px", color: colors.textMuted }}>⭐</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Following Tab ───────────────────────────────────────────────────── */}
        {activeTab === "following" && (
          <div>
            {following.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.textPrimary, marginBottom: "8px" }}>{t("discover.noFollowing") || "Not following anyone yet"}</h3>
                <p style={{ fontSize: "14px", color: colors.textSecondary, maxWidth: "360px", margin: "0 auto 20px" }}>{t("discover.noFollowingHint") || "Discover researchers and follow them to see their work here."}</p>
                <button onClick={() => setActiveTab("researchers")} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>{t("discover.researchers") || "Browse Researchers"}</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
                {following.map(f => (
                  <div key={f.id} style={{ ...cardStyle, display: "flex", gap: "14px", alignItems: "center" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {f.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: colors.textPrimary }}>{f.name}</div>
                      <div style={{ fontSize: "12px", color: colors.textSecondary }}>{f.institution}</div>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                        {f.expertise.slice(0, 2).map(e => (
                          <span key={e} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", color: isDark ? "#a5b4fc" : "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>{e}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => unfollowResearcher(f.id)} style={{ padding: "5px 12px", borderRadius: "16px", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.1)", color: isDark ? "#a5b4fc" : "#6366f1", fontSize: "11px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                      ✓ {t("discover.following") || "Following"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Topics Tab — clickable to filter researchers ────────────────────── */}
        {activeTab === "topics" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {SAMPLE_TOPICS.map(topic => (
              <div key={topic.id}
                onClick={() => { setTopicFilter(topic.name); setActiveTab("researchers"); }}
                style={{ ...cardStyle, position: "relative", overflow: "hidden" as const, cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = topic.color + "66"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = colors.borderPrimary; }}
              >
                {topic.trending && (
                  <div style={{ position: "absolute", top: "12px", right: "12px", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>🔥 Trending</div>
                )}
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${topic.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "12px", border: `1px solid ${topic.color}44` }}>
                  {topic.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>{topic.name}</h3>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: colors.textSecondary, marginBottom: "10px" }}>
                  <span><strong style={{ color: colors.textPrimary }}>{topic.researcherCount.toLocaleString()}</strong> {t("discover.researchers") || "researchers"}</span>
                  <span><strong style={{ color: colors.textPrimary }}>{topic.documentCount.toLocaleString()}</strong> {t("common.docs") || "docs"}</span>
                </div>
                <div style={{ fontSize: "11px", color: topic.color, fontWeight: 600 }}>{t("discover.browseResearchers") || "Browse researchers"} →</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Collections Tab — real public collections from UserDataContext ───── */}
        {activeTab === "collections" && (
          <div>
            {publicCollections.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: colors.textPrimary, marginBottom: "8px" }}>{t("discover.publicCollections") || "Public Collections"}</h3>
                <p style={{ fontSize: "14px", color: colors.textSecondary, maxWidth: "400px", margin: "0 auto 20px" }}>
                  {t("discover.publicCollectionsDesc") || "Make your collections public in Collections to share them here."}
                </p>
                <button onClick={() => nav("/collections")} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                  {t("discover.myCollections") || "View My Collections"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {publicCollections.map(col => (
                  <div key={col.id} style={{ ...cardStyle, cursor: "pointer" }}
                    onClick={() => nav("/collections")}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📂</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: colors.textPrimary }}>{col.name}</div>
                        <div style={{ fontSize: "12px", color: colors.textSecondary }}>{col.documentIds.length} {t("common.documents") || "documents"}</div>
                      </div>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 600 }}>{t("collections.visibility.public") || "Public"}</span>
                    </div>
                    {col.description && <p style={{ margin: "0 0 10px", fontSize: "13px", color: colors.textSecondary, lineHeight: 1.5 }}>{col.description}</p>}
                    {col.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {col.tags.map(tag => (
                          <span key={tag} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: colors.textMuted, border: `1px solid ${colors.borderPrimary}` }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ gridColumn: "1/-1", textAlign: "center", marginTop: "8px" }}>
                  <button onClick={() => nav("/collections")} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${colors.borderPrimary}`, borderRadius: "9px", color: colors.textSecondary, fontSize: "13px", cursor: "pointer" }}>
                    {t("discover.myCollections") || "View My Collections"} →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        {stats.followingCount > 0 && activeTab !== "following" && (
          <div style={{ marginTop: "24px", padding: "12px 20px", borderRadius: "12px", background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>👥</span>
            <span style={{ fontSize: "13px", color: colors.textSecondary }}>{t("discover.following") || "Following"} <strong style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>{stats.followingCount} {t("discover.researchers") || "researchers"}</strong></span>
            <button onClick={() => setActiveTab("following")} style={{ marginLeft: "auto", fontSize: "12px", padding: "4px 12px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: isDark ? "#a5b4fc" : "#6366f1", cursor: "pointer" }}>{t("common.viewAll") || "View all"}</button>
          </div>
        )}

      </div>

      {/* ── Collaboration Proposal Modal ─────────────────────────────────────── */}
      {propTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={e => { if (e.target === e.currentTarget) setPropTarget(null); }}>
          <div style={{ width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', background: isDark ? colors.bgSecondary : '#fff', borderRadius:'16px', border:`1px solid ${colors.borderPrimary}`, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${colors.borderPrimary}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:colors.textPrimary }}>🤝 Propose Collaboration to {propTarget.name}</h2>
              <button onClick={() => setPropTarget(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:colors.textSecondary }}>×</button>
            </div>
            {propSent ? (
              <div style={{ padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'44px', marginBottom:'12px' }}>✅</div>
                <div style={{ fontWeight:700, fontSize:'16px', color:colors.textPrimary }}>Proposal sent!</div>
                <div style={{ fontSize:'13px', color:colors.textSecondary, marginTop:'6px' }}>{propTarget.name} will be notified of your interest.</div>
              </div>
            ) : (
              <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'13px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'4px' }}>Your Role</label>
                    <select value={propForm.role} onChange={e => setPropForm(f => ({ ...f, role: e.target.value as ProposalRole }))} style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none', cursor:'pointer' }}>
                      {(Object.keys(PROP_ROLE_LABELS) as ProposalRole[]).map(k => <option key={k} value={k}>{PROP_ROLE_LABELS[k]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'4px' }}>Scope</label>
                    <select value={propForm.scope} onChange={e => setPropForm(f => ({ ...f, scope: e.target.value as ProposalScope }))} style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none', cursor:'pointer' }}>
                      {(Object.keys(PROP_SCOPE_LABELS) as ProposalScope[]).map(k => <option key={k} value={k}>{PROP_SCOPE_LABELS[k]}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'4px' }}>Timeframe</label>
                    <input value={propForm.timeframe} onChange={e => setPropForm(f => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 3 months, Q2 2025" style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none', boxSizing:'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'4px' }}>Compensation</label>
                    <input value={propForm.compensation} onChange={e => setPropForm(f => ({ ...f, compensation: e.target.value }))} placeholder="Co-authorship, paid, equity…" style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none', boxSizing:'border-box' as const }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'4px' }}>Message *</label>
                  <textarea value={propForm.message} onChange={e => setPropForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your collaboration idea, relevant experience, and why this would be a great fit..." rows={4} style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none', resize:'vertical', boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', color:colors.textSecondary, display:'block', marginBottom:'6px' }}>Milestones <span style={{ opacity:0.5 }}>(optional)</span></label>
                  {propForm.milestones.map((m, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <span style={{ flex:1, padding:'5px 10px', borderRadius:'7px', fontSize:'12px', background: isDark?'rgba(255,255,255,0.04)':'rgba(47,41,65,0.04)', border:`1px solid ${colors.borderPrimary}`, color:colors.textPrimary }}>• {m}</span>
                      <button onClick={() => setPropForm(f => ({ ...f, milestones: f.milestones.filter((_,j) => j !== i) }))} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:colors.textSecondary }}>×</button>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:'6px' }}>
                    <input value={propForm.milestoneInput} onChange={e => setPropForm(f => ({ ...f, milestoneInput: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPropMilestone(); } }} placeholder="Add milestone..." style={{ flex:1, padding:'7px 10px', borderRadius:'8px', fontSize:'12px', border:`1px solid ${colors.borderPrimary}`, background: isDark?'rgba(255,255,255,0.05)':'#fff', color:colors.textPrimary, outline:'none' }} />
                    <button onClick={addPropMilestone} style={{ padding:'7px 14px', borderRadius:'8px', border:'none', background:'rgba(99,102,241,0.8)', color:'#fff', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>+</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px' }}>
                  <button onClick={() => setPropTarget(null)} style={{ padding:'9px 18px', borderRadius:'8px', border:`1px solid ${colors.borderPrimary}`, background:'transparent', color:colors.textSecondary, fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                  <button onClick={sendProposal} disabled={!propForm.message.trim()} style={{ padding:'9px 24px', borderRadius:'8px', border:'none', background: propForm.message.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : colors.borderPrimary, color: propForm.message.trim() ? '#fff' : colors.textSecondary, fontSize:'13px', fontWeight:700, cursor: propForm.message.trim() ? 'pointer' : 'not-allowed' }}>Send Proposal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

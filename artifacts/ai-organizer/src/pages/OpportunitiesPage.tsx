/**
 * OpportunitiesPage — /opportunities
 * Self-contained: all data/state in localStorage, no external context needed.
 */
import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageShell } from '../components/layout/PageShell';

type OppType = 'cofounder' | 'collaborator' | 'job' | 'freelance' | 'investment' | 'mentoring' | 'research';
type EngType = 'full-time' | 'part-time' | 'contract' | 'volunteer' | 'equity-only';

interface Opp {
  id: string; title: string; description: string; type: OppType; sector: string;
  skills: string[]; engagement: EngType; compensation: string; location: string;
  remote: boolean; postedBy: string; postedByRole: string; postedAt: number;
  tags: string[]; saved: boolean; applied: boolean;
}

const T: Record<OppType, { label: string; icon: string; color: string }> = {
  cofounder:    { label: 'Co-founder',   icon: '🤝', color: '#6366f1' },
  collaborator: { label: 'Collaborator', icon: '🔗', color: '#3b82f6' },
  job:          { label: 'Job',          icon: '💼', color: '#8b5cf6' },
  freelance:    { label: 'Freelance',    icon: '🚀', color: '#64748b' },
  investment:   { label: 'Investment',   icon: '💰', color: '#22c55e' },
  mentoring:    { label: 'Mentoring',    icon: '🎓', color: '#f59e0b' },
  research:     { label: 'Research',     icon: '🔬', color: '#ec4899' },
};

const ENG: Record<EngType, string> = {
  'full-time': 'Full-time', 'part-time': 'Part-time',
  'contract': 'Contract', 'volunteer': 'Volunteer', 'equity-only': 'Equity Only',
};

const SAMPLE: Opp[] = [
  { id:'o1', title:'Technical Co-founder Wanted', description:'Building an AI-powered biomedical research assistant. Seeking full-stack or ML engineer with passion for science.', type:'cofounder', sector:'Technology', skills:['Machine Learning','Web Development'], engagement:'full-time', compensation:'Equity 15–25%', location:'Remote/EU', remote:true, postedBy:'Dr. Sofia Papadaki', postedByRole:'Founder', postedAt:Date.now()-2*86400000, tags:['AI','Biotech'], saved:false, applied:false },
  { id:'o2', title:'Research Collaborator — Climate Modeling', description:'Our lab seeks a computational scientist for climate simulation. 6-month project with co-authorship.', type:'research', sector:'Science', skills:['Climate Science','Statistics'], engagement:'part-time', compensation:'Paid + authorship', location:'Athens', remote:true, postedBy:'Prof. Nikos Stavros', postedByRole:'Professor', postedAt:Date.now()-5*86400000, tags:['Climate','Research'], saved:false, applied:false },
  { id:'o3', title:'Freelance UX Designer — EdTech', description:'3-month engagement to redesign our learning platform. Flexible hours.', type:'freelance', sector:'Design', skills:['UX/UI Design','Prototyping'], engagement:'contract', compensation:'€50–80/hr', location:'Remote', remote:true, postedBy:'Maria Konstantinou', postedByRole:'Startup Team', postedAt:Date.now()-86400000, tags:['EdTech','UX'], saved:false, applied:false },
  { id:'o4', title:'Angel Investor — HealthTech Seed', description:'Digital health startup seeking €200k–500k seed. FDA pre-submission completed.', type:'investment', sector:'Medicine', skills:['HealthTech'], engagement:'equity-only', compensation:'Equity stake', location:'Thessaloniki', remote:false, postedBy:'Alexandros Petridis', postedByRole:'Founder', postedAt:Date.now()-7*86400000, tags:['HealthTech','Seed'], saved:false, applied:false },
  { id:'o5', title:'NLP Mentor Wanted', description:'Second-year PhD student in NLP seeking bi-weekly mentoring from an ML expert.', type:'mentoring', sector:'Technology', skills:['Machine Learning','NLP'], engagement:'volunteer', compensation:'Goodwill', location:'Remote', remote:true, postedBy:'Eleni Georgiou', postedByRole:'PhD Student', postedAt:Date.now()-3*86400000, tags:['NLP','PhD'], saved:false, applied:false },
  { id:'o6', title:'Behavioral Science Co-author', description:'Looking for a behavioral economist to co-author a paper on academic publishing decisions.', type:'collaborator', sector:'Academia', skills:['Behavioral Economics','Academic Writing'], engagement:'part-time', compensation:'Co-authorship', location:'Barcelona', remote:true, postedBy:'Prof. Sofia Reyes', postedByRole:'Professor', postedAt:Date.now()-4*86400000, tags:['Behavioral','Research'], saved:false, applied:false },
];

// ── Collaboration Proposal (self-contained) ─────────────────────────────────
type ProposalRole = 'co-author'|'collaborator'|'co-founder'|'advisor'|'peer-reviewer'|'research-partner';
type ProposalScope = 'paper'|'project'|'startup'|'grant'|'mentoring'|'other';
interface CollabProposal { id:string; toOppId:string; toOppTitle:string; role:ProposalRole; scope:ProposalScope; timeframe:string; compensation:string; message:string; milestones:string[]; sentAt:number; }
const PROP_KEY = 'collab_proposals_v1';
const ROLE_LABELS: Record<ProposalRole,string> = {'co-author':'Co-author','collaborator':'Collaborator','co-founder':'Co-founder','advisor':'Advisor','peer-reviewer':'Peer Reviewer','research-partner':'Research Partner'};
const SCOPE_LABELS: Record<ProposalScope,string> = {paper:'Research Paper',project:'Research Project',startup:'Startup',grant:'Grant Proposal',mentoring:'Mentoring',other:'Other'};
function loadProposals(): CollabProposal[] { try { const r = localStorage.getItem(PROP_KEY); if (r) return JSON.parse(r); } catch {} return []; }
function saveProposals(d: CollabProposal[]) { try { localStorage.setItem(PROP_KEY, JSON.stringify(d)); } catch {} }

const SK = 'opportunities_v1';
function load(): Opp[] { try { const r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch {} return SAMPLE; }
function persist(d: Opp[]) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }
function ago(ts: number) { const d = Math.floor((Date.now()-ts)/86400000); return d===0?'Today':d===1?'1d ago':d<7?`${d}d ago`:`${Math.floor(d/7)}w ago`; }

export default function OpportunitiesPage() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [opps, setOpps] = useState<Opp[]>(load);
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState<OppType|'all'>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selId, setSelId] = useState(SAMPLE[0].id);
  const [showPost, setShowPost] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', type:'collaborator' as OppType, sector:'Technology', skills:'', engagement:'part-time' as EngType, compensation:'', location:'', remote:true, tags:'' });

  const upd = (fn: (p: Opp[]) => Opp[]) => setOpps(p => { const n = fn(p); persist(n); return n; });

  // Proposal modal state
  const [proposals, setProposals] = useState<CollabProposal[]>(loadProposals);
  const [propTarget, setPropTarget] = useState<{ id: string; title: string } | null>(null);
  const [propSent, setPropSent] = useState(false);
  const [propForm, setPropForm] = useState({ role: 'collaborator' as ProposalRole, scope: 'project' as ProposalScope, timeframe: '', compensation: '', message: '', milestones: [] as string[], milestoneInput: '' });

  const hasSentProposal = (oppId: string) => proposals.some(p => p.toOppId === oppId);

  const openProposal = useCallback((oppId: string, oppTitle: string) => {
    setPropTarget({ id: oppId, title: oppTitle });
    setPropSent(false);
    setPropForm({ role: 'collaborator', scope: 'project', timeframe: '', compensation: '', message: '', milestones: [], milestoneInput: '' });
  }, []);

  const addMilestone = useCallback(() => {
    const v = propForm.milestoneInput.trim();
    if (!v) return;
    setPropForm(f => ({ ...f, milestones: [...f.milestones, v], milestoneInput: '' }));
  }, [propForm.milestoneInput]);

  const sendProposal = useCallback(() => {
    if (!propTarget || !propForm.message.trim()) return;
    const np: CollabProposal = { id: `prop-${Date.now()}`, toOppId: propTarget.id, toOppTitle: propTarget.title, role: propForm.role, scope: propForm.scope, timeframe: propForm.timeframe, compensation: propForm.compensation, message: propForm.message, milestones: propForm.milestones, sentAt: Date.now() };
    const next = [...proposals, np]; setProposals(next); saveProposals(next);
    setPropSent(true);
    setTimeout(() => setPropTarget(null), 2000);
  }, [propTarget, propForm, proposals]);

  const filtered = useMemo(() => {
    let items = opps;
    if (search.trim()) { const q=search.toLowerCase(); items=items.filter(o=>o.title.toLowerCase().includes(q)||o.description.toLowerCase().includes(q)||o.tags.some(t=>t.toLowerCase().includes(q))); }
    if (typeF !== 'all') items = items.filter(o=>o.type===typeF);
    if (remoteOnly) items = items.filter(o=>o.remote);
    if (savedOnly) items = items.filter(o=>o.saved);
    return items;
  }, [opps, search, typeF, remoteOnly, savedOnly]);

  const sel = filtered.find(o=>o.id===selId) ?? filtered[0];
  const bdr = 'hsl(var(--border))';
  const txt = 'hsl(var(--foreground))';
  const mut = 'hsl(var(--muted-foreground))';
  const cbg = 'hsl(var(--card))';
  const colors = { bgSecondary: 'hsl(var(--card))' };
  const iSt = { width:'100%', padding:'8px 12px', borderRadius:'10px', fontSize:'13px', border:`1px solid ${bdr}`, background:'hsl(var(--muted) / 0.4)', color:txt, outline:'none', boxSizing:'border-box' as const };

  const handlePost = () => {
    const n: Opp = { ...form, id:`o-${Date.now()}`, skills:form.skills.split(',').map(s=>s.trim()).filter(Boolean), tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean), postedBy:'You', postedByRole:'Member', postedAt:Date.now(), saved:false, applied:false };
    upd(p=>[n,...p]); setSelId(n.id); setShowPost(false);
    setForm({ title:'', description:'', type:'collaborator', sector:'Technology', skills:'', engagement:'part-time', compensation:'', location:'', remote:true, tags:'' });
  };

  return (
    <PageShell>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding: isMobile ? '16px 12px' : '24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ margin:0, fontSize:'24px', fontWeight:800, color:txt }}>🎯 {t('opportunities.title')||'Opportunities & Open Roles'}</h1>
            <p style={{ margin:'4px 0 0', fontSize:'13px', color:mut }}>{t('opportunities.subtitle')||'Find co-founders, collaborators, investors, mentors and more'}</p>
          </div>
          <button onClick={()=>setShowPost(true)} style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
            + Post Opportunity
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px', padding:'12px 16px', background:'hsl(var(--muted) / 0.3)', borderRadius:'10px', border:`1px solid ${bdr}` }}>
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:'160px' }}>
            <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', opacity:0.4, fontSize:'13px' }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{ ...iSt, paddingLeft:'30px' }} />
          </div>
          <select value={typeF} onChange={e=>setTypeF(e.target.value as any)} style={{ ...iSt, width:'auto', cursor:'pointer' }}>
            <option value="all">All Types</option>
            {(Object.keys(T) as OppType[]).map(k=><option key={k} value={k}>{T[k].icon} {T[k].label}</option>)}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:mut, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={remoteOnly} onChange={e=>setRemoteOnly(e.target.checked)} style={{ accentColor:'#22c55e' }} /> 🌐 Remote
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:mut, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={savedOnly} onChange={e=>setSavedOnly(e.target.checked)} style={{ accentColor:'#f59e0b' }} /> ⭐ Saved
          </label>
          <span style={{ fontSize:'12px', color:mut, marginLeft:'auto' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap:'16px', alignItems:'start' }}>
          {/* List */}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'72vh', overflowY:'auto' }}>
            {filtered.length===0 && <div style={{ padding:'40px 16px', textAlign:'center', color:mut }}><div style={{ fontSize:'32px', marginBottom:'10px' }}>🎯</div><div style={{ fontWeight:600 }}>No results</div></div>}
            {filtered.map(o => {
              const cfg=T[o.type]; const isSel=sel?.id===o.id;
              return (
                <div key={o.id} onClick={()=>setSelId(o.id)} style={{ padding:'12px 14px', borderRadius:'10px', cursor:'pointer', borderTop:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`, borderRight:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`, borderBottom:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`, background: isSel?(isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)'):cbg, borderLeft:`3px solid ${isSel?'#6366f1':'transparent'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'6px' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:txt, marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.title}</div>
                      <div style={{ fontSize:'11px', color:mut, marginBottom:'5px' }}>{o.postedBy} · {ago(o.postedAt)}</div>
                      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                        <span style={{ padding:'2px 7px', borderRadius:'10px', fontSize:'10px', fontWeight:600, background:`${cfg.color}18`, color:cfg.color }}>{cfg.icon} {cfg.label}</span>
                        {o.remote&&<span style={{ padding:'2px 7px', borderRadius:'10px', fontSize:'10px', background:'rgba(34,197,94,0.1)', color:'#22c55e' }}>🌐</span>}
                        {o.applied&&<span style={{ padding:'2px 7px', borderRadius:'10px', fontSize:'10px', background:'rgba(99,102,241,0.1)', color:'#6366f1' }}>✓</span>}
                      </div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();upd(p=>p.map(x=>x.id===o.id?{...x,saved:!x.saved}:x));}} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'15px', color:o.saved?'#f59e0b':isDark?'rgba(255,255,255,0.2)':'rgba(47,41,65,0.2)', padding:'2px', flexShrink:0 }}>{o.saved?'⭐':'☆'}</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          {sel ? (
            <div style={{ background:cbg, border:`1px solid ${bdr}`, borderRadius:'10px', padding: isMobile ? '16px' : '28px', position:'sticky', top:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' }}>
                    <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:600, background:`${T[sel.type].color}18`, color:T[sel.type].color }}>{T[sel.type].icon} {T[sel.type].label}</span>
                    {sel.remote&&<span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'12px', background:'rgba(34,197,94,0.1)', color:'#22c55e' }}>🌐 Remote</span>}
                    {sel.applied&&<span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'12px', background:'rgba(99,102,241,0.1)', color:'#6366f1' }}>✓ Applied</span>}
                  </div>
                  <h2 style={{ margin:'0 0 6px', fontSize:'19px', fontWeight:700, color:txt }}>{sel.title}</h2>
                  <div style={{ fontSize:'13px', color:mut }}>By <strong style={{ color:txt }}>{sel.postedBy}</strong> · {sel.postedByRole} · {ago(sel.postedAt)}</div>
                </div>
                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                  <button onClick={()=>upd(p=>p.map(o=>o.id===sel.id?{...o,saved:!o.saved}:o))} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:`1px solid ${sel.saved?'rgba(245,158,11,0.4)':bdr}`, background:sel.saved?'rgba(245,158,11,0.1)':'transparent', color:sel.saved?'#f59e0b':mut }}>{sel.saved?'⭐ Saved':'☆ Save'}</button>
                  <button
                    onClick={() => hasSentProposal(sel.id) ? upd(p=>p.map(o=>o.id===sel.id?{...o,applied:true}:o)) : openProposal(sel.id, sel.title)}
                    style={{ padding:'8px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', border:'none', background: hasSentProposal(sel.id)||sel.applied ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: hasSentProposal(sel.id)||sel.applied ? (isDark?'#a5b4fc':'#5b5bd6') : '#fff' }}>
                    {hasSentProposal(sel.id) ? '✓ Proposed' : sel.applied ? '✓ Applied' : '🤝 Propose Collaboration'}
                  </button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'10px', padding:'12px', background:'hsl(var(--muted) / 0.3)', borderRadius:'10px', border:`1px solid ${bdr}`, marginBottom:'18px' }}>
                {[['📍','Location',sel.location],['⏱️','Engagement',ENG[sel.engagement]],['💰','Compensation',sel.compensation||'—'],['🏢','Sector',sel.sector]].map(([ic,lb,vl])=>(
                  <div key={lb as string}><div style={{ fontSize:'10px', fontWeight:600, color:mut, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'2px' }}>{ic} {lb}</div><div style={{ fontSize:'13px', color:txt, fontWeight:500 }}>{vl}</div></div>
                ))}
              </div>
              <p style={{ margin:'0 0 16px', fontSize:'14px', color:txt, lineHeight:1.7, opacity:0.85 }}>{sel.description}</p>
              {sel.skills.length>0&&<div style={{ marginBottom:'14px' }}><div style={{ fontSize:'12px', fontWeight:600, color:mut, marginBottom:'7px' }}>Skills needed</div><div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>{sel.skills.map(s=><span key={s} style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', background:'hsl(var(--primary) / 0.1)', border:'1px solid hsl(var(--primary) / 0.25)', color:'hsl(var(--primary))' }}>{s}</span>)}</div></div>}
              {sel.tags.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>{sel.tags.map(tag=><span key={tag} style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', background:'hsl(var(--muted) / 0.4)', border:`1px solid ${bdr}`, color:mut }}>#{tag}</span>)}</div>}
            </div>
          ) : (
            <div style={{ padding:'60px', textAlign:'center', color:mut }}><div style={{ fontSize:'40px', marginBottom:'12px' }}>🎯</div><div style={{ fontWeight:600 }}>Select an opportunity</div></div>
          )}
        </div>

        {/* Collaboration Proposal Modal */}
        {propTarget && (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={e => { if (e.target === e.currentTarget) setPropTarget(null); }}>
            <div style={{ width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', background: colors.bgSecondary, borderRadius:'10px', border:`1px solid ${bdr}`, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
              <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:txt }}>🤝 Propose Collaboration</h2>
                <button onClick={() => setPropTarget(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:mut }}>×</button>
              </div>
              <div style={{ padding:'12px 22px 6px', borderBottom:`1px solid ${bdr}` }}>
                <div style={{ fontSize:'12px', color:mut }}>Opportunity: <strong style={{ color:txt }}>{propTarget.title}</strong></div>
              </div>
              {propSent ? (
                <div style={{ padding:'48px', textAlign:'center' }}>
                  <div style={{ fontSize:'44px', marginBottom:'12px' }}>✅</div>
                  <div style={{ fontWeight:700, fontSize:'16px', color:txt }}>Proposal sent!</div>
                  <div style={{ fontSize:'13px', color:mut, marginTop:'6px' }}>The poster will be notified of your interest.</div>
                </div>
              ) : (
                <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'13px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div>
                      <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'4px' }}>Your Role</label>
                      <select value={propForm.role} onChange={e => setPropForm(f => ({ ...f, role: e.target.value as ProposalRole }))} style={{ ...iSt, cursor:'pointer' }}>
                        {(Object.keys(ROLE_LABELS) as ProposalRole[]).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'4px' }}>Scope</label>
                      <select value={propForm.scope} onChange={e => setPropForm(f => ({ ...f, scope: e.target.value as ProposalScope }))} style={{ ...iSt, cursor:'pointer' }}>
                        {(Object.keys(SCOPE_LABELS) as ProposalScope[]).map(k => <option key={k} value={k}>{SCOPE_LABELS[k]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div>
                      <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'4px' }}>Timeframe</label>
                      <input value={propForm.timeframe} onChange={e => setPropForm(f => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 3 months, Q2 2025" style={iSt} />
                    </div>
                    <div>
                      <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'4px' }}>Compensation</label>
                      <input value={propForm.compensation} onChange={e => setPropForm(f => ({ ...f, compensation: e.target.value }))} placeholder="Co-authorship, paid, equity…" style={iSt} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'4px' }}>Message *</label>
                    <textarea value={propForm.message} onChange={e => setPropForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your interest, relevant experience, and what you bring to this collaboration..." rows={4} style={{ ...iSt, resize:'vertical' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', color:mut, display:'block', marginBottom:'6px' }}>Milestones <span style={{ opacity:0.5 }}>(optional)</span></label>
                    {propForm.milestones.map((m, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                        <span style={{ flex:1, padding:'5px 10px', borderRadius:'7px', fontSize:'12px', background: isDark?'rgba(255,255,255,0.04)':'rgba(47,41,65,0.04)', border:`1px solid ${bdr}`, color:txt }}>• {m}</span>
                        <button onClick={() => setPropForm(f => ({ ...f, milestones: f.milestones.filter((_,j) => j !== i) }))} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:mut }}>×</button>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:'6px' }}>
                      <input value={propForm.milestoneInput} onChange={e => setPropForm(f => ({ ...f, milestoneInput: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }} placeholder="Add milestone..." style={{ ...iSt, flex:1 }} />
                      <button onClick={addMilestone} style={{ padding:'7px 14px', borderRadius:'8px', border:'none', background:'rgba(99,102,241,0.8)', color:'#fff', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>+</button>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px' }}>
                    <button onClick={() => setPropTarget(null)} style={{ padding:'9px 18px', borderRadius:'8px', border:`1px solid ${bdr}`, background:'transparent', color:mut, fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                    <button onClick={sendProposal} disabled={!propForm.message.trim()} style={{ padding:'9px 24px', borderRadius:'8px', border:'none', background: propForm.message.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : bdr, color: propForm.message.trim() ? '#fff' : mut, fontSize:'13px', fontWeight:700, cursor: propForm.message.trim() ? 'pointer' : 'not-allowed' }}>Send Proposal</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Modal */}
        {showPost&&(
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={e=>{if(e.target===e.currentTarget)setShowPost(false);}}>
            <div style={{ width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', background: colors.bgSecondary, borderRadius:'10px', border:`1px solid ${bdr}`, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
              <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:txt }}>+ Post Opportunity</h2>
                <button onClick={()=>setShowPost(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:mut, lineHeight:1 }}>×</button>
              </div>
              <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title *" style={iSt} />
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description *" rows={3} style={{ ...iSt, resize:'vertical' }} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as OppType}))} style={{ ...iSt, cursor:'pointer' }}>
                    {(Object.keys(T) as OppType[]).map(k=><option key={k} value={k}>{T[k].icon} {T[k].label}</option>)}
                  </select>
                  <select value={form.engagement} onChange={e=>setForm(f=>({...f,engagement:e.target.value as EngType}))} style={{ ...iSt, cursor:'pointer' }}>
                    {(Object.keys(ENG) as EngType[]).map(k=><option key={k} value={k}>{ENG[k]}</option>)}
                  </select>
                </div>
                <select value={form.sector} onChange={e=>setForm(f=>({...f,sector:e.target.value}))} style={{...iSt,cursor:'pointer'}}>
                  {['Technology','Science','Design','Medicine','Academia','Business','Climate','Education','FinTech','Other'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input value={form.skills} onChange={e=>setForm(f=>({...f,skills:e.target.value}))} placeholder="Skills needed (comma-separated)" style={iSt} />
                <input value={form.compensation} onChange={e=>setForm(f=>({...f,compensation:e.target.value}))} placeholder="Compensation (e.g. €50/hr, Equity 10%)" style={iSt} />
                <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location" style={iSt} />
                <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:mut, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.remote} onChange={e=>setForm(f=>({...f,remote:e.target.checked}))} style={{ accentColor:'#22c55e' }} /> Remote-friendly
                </label>
                <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Tags (comma-separated)" style={iSt} />
                <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                  <button onClick={()=>setShowPost(false)} style={{ padding:'8px 18px', borderRadius:'8px', border:`1px solid ${bdr}`, background:'transparent', color:mut, fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                  <button onClick={handlePost} disabled={!form.title.trim()||!form.description.trim()} style={{ padding:'8px 22px', borderRadius:'8px', border:'none', background:form.title&&form.description?'linear-gradient(135deg,#6366f1,#8b5cf6)':bdr, color:form.title&&form.description?'#fff':mut, fontSize:'13px', fontWeight:600, cursor:form.title&&form.description?'pointer':'not-allowed' }}>Post</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

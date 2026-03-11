import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PageShell } from '../components/layout/PageShell';

type Stage = 'watchlist'|'contacted'|'diligence'|'term_sheet'|'closed'|'passed';
type Sector = 'Technology'|'Biotech'|'EdTech'|'HealthTech'|'FinTech'|'CleanTech'|'DeepTech'|'Other';
type Round = 'Pre-seed'|'Seed'|'Series A'|'Series B'|'Grant'|'Revenue';
interface Deal {
  id:string; name:string; tagline:string; founders:string; sector:Sector; round:Round;
  asking:string; valuation:string; stage:Stage; score:number; notes:string; tags:string[];
  website:string; addedAt:number; updatedAt:number; starred:boolean; revenue:string; teamSize:number;
}
interface PortfolioItem {
  id:string; name:string; sector:Sector; invested:string; currentVal:string;
  round:Round; date:number; status:'active'|'exited'|'written_off'; multiple:number;
}

const STAGE_CFG: Record<Stage,{label:string;color:string;icon:string}> = {
  watchlist: {label:'Watchlist',  color:'#6b7280', icon:'👁️'},
  contacted: {label:'Contacted',  color:'#3b82f6', icon:'📧'},
  diligence: {label:'Diligence',  color:'#8b5cf6', icon:'🔬'},
  term_sheet:{label:'Term Sheet', color:'#f59e0b', icon:'📝'},
  closed:    {label:'Closed',     color:'#22c55e', icon:'🎉'},
  passed:    {label:'Passed',     color:'#ef4444', icon:'✗'},
};
const STAGES: Stage[] = ['watchlist','contacted','diligence','term_sheet','closed','passed'];

const SAMPLE_DEALS: Deal[] = [
  {id:'d1',name:'NeuroSync AI',tagline:'AI-powered neurofeedback for ADHD treatment',founders:'Dr. Maria Papadaki, Alex Chen',sector:'HealthTech',round:'Seed',asking:'€500k',valuation:'€3M',stage:'diligence',score:82,notes:'Strong clinical data. IP pending. Team ex-CERN.',tags:['AI','MedTech','B2B'],website:'neurosync.io',addedAt:Date.now()-8*86400000,updatedAt:Date.now()-2*86400000,starred:true,revenue:'€12k MRR',teamSize:5},
  {id:'d2',name:'GreenChain',tagline:'Blockchain-verified carbon credits for SMEs',founders:'Nikos Stavros',sector:'CleanTech',round:'Pre-seed',asking:'€250k',valuation:'€1.5M',stage:'contacted',score:64,notes:'Interesting market. Regulatory risk. Team small.',tags:['Climate','Web3'],website:'greenchain.eco',addedAt:Date.now()-15*86400000,updatedAt:Date.now()-5*86400000,starred:false,revenue:'Pre-revenue',teamSize:3},
  {id:'d3',name:'EduFlow',tagline:'Adaptive learning paths via cognitive science',founders:'Sofia Reyes, Ioanna Kosta',sector:'EdTech',round:'Seed',asking:'€800k',valuation:'€5M',stage:'term_sheet',score:91,notes:'Outstanding retention. 40% MoM growth. Strong moat.',tags:['AI','EdTech','B2C'],website:'eduflow.app',addedAt:Date.now()-20*86400000,updatedAt:Date.now()-86400000,starred:true,revenue:'€45k MRR',teamSize:8},
  {id:'d4',name:'BioSynth Labs',tagline:'Rapid protein synthesis platform for pharma R&D',founders:'Prof. George Alexiou',sector:'Biotech',round:'Series A',asking:'€2M',valuation:'€12M',stage:'watchlist',score:73,notes:'Deep tech. Long timeline but massive TAM.',tags:['Biotech','DeepTech'],website:'biosynthlabs.com',addedAt:Date.now()-3*86400000,updatedAt:Date.now()-3*86400000,starred:false,revenue:'€80k ARR',teamSize:12},
  {id:'d5',name:'FinPilot',tagline:'CFO-as-a-Service for early-stage startups',founders:'Dimitris Petros',sector:'FinTech',round:'Pre-seed',asking:'€150k',valuation:'€900k',stage:'passed',score:35,notes:'Crowded market. No clear differentiation.',tags:['FinTech','SaaS'],website:'finpilot.co',addedAt:Date.now()-30*86400000,updatedAt:Date.now()-10*86400000,starred:false,revenue:'€5k MRR',teamSize:2},
  {id:'d6',name:'QuantumEdge',tagline:'Quantum-classical hybrid optimization for logistics',founders:'Dr. Elena Vasquez',sector:'DeepTech',round:'Seed',asking:'€1M',valuation:'€6M',stage:'contacted',score:78,notes:'Early but visionary. Need to validate PMF.',tags:['Quantum','Logistics'],website:'quantumedge.tech',addedAt:Date.now()-6*86400000,updatedAt:Date.now()-86400000,starred:true,revenue:'Pre-revenue',teamSize:4},
];
const SAMPLE_PORT: PortfolioItem[] = [
  {id:'p1',name:'DataMesh',sector:'Technology',invested:'€200k',currentVal:'€480k',round:'Seed',date:Date.now()-365*86400000,status:'active',multiple:2.4},
  {id:'p2',name:'ClinIQ',sector:'HealthTech',invested:'€500k',currentVal:'€1.8M',round:'Series A',date:Date.now()-500*86400000,status:'active',multiple:3.6},
  {id:'p3',name:'EcoRoute',sector:'CleanTech',invested:'€150k',currentVal:'€0',round:'Pre-seed',date:Date.now()-800*86400000,status:'written_off',multiple:0},
];

const DK='investor_deals_v1'; const PK='investor_portfolio_v1';
function loadDeals():Deal[]{try{const r=localStorage.getItem(DK);if(r)return JSON.parse(r);}catch{}return SAMPLE_DEALS;}
function saveDeals(d:Deal[]){try{localStorage.setItem(DK,JSON.stringify(d));}catch{}}
function loadPort():PortfolioItem[]{try{const r=localStorage.getItem(PK);if(r)return JSON.parse(r);}catch{}return SAMPLE_PORT;}
function savePort(d:PortfolioItem[]){try{localStorage.setItem(PK,JSON.stringify(d));}catch{}}
function ago(ts:number){const d=Math.floor((Date.now()-ts)/86400000);return d===0?'Today':d===1?'1d ago':d<7?`${d}d ago`:`${Math.floor(d/7)}w ago`;}
function sc(s:number){return s>=75?'#22c55e':s>=50?'#f59e0b':'#ef4444';}

const BLANK={name:'',tagline:'',founders:'',sector:'Technology' as Sector,round:'Seed' as Round,
  asking:'',valuation:'',stage:'watchlist' as Stage,score:50,notes:'',tags:[] as string[],
  website:'',starred:false,revenue:'',teamSize:1};

// ─── ScoreRing ────────────────────────────────────────────────────────────────
function ScoreRing({score,size=48}:{score:number;size?:number}){
  const r=size/2-4; const c=size/2;
  return(
    <div style={{textAlign:'center'}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="4"/>
          <circle cx={c} cy={c} r={r} fill="none" stroke={sc(score)} strokeWidth="4"
            strokeDasharray={2*Math.PI*r} strokeDashoffset={2*Math.PI*r*(1-score/100)}
            strokeLinecap="round" style={{transition:'stroke-dashoffset 0.4s'}}/>
        </svg>
        <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:size<40?'10px':'12px',fontWeight:800,color:sc(score)}}>{score}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InvestorDashboardPage() {
  const {isDark} = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [deals,setDeals] = useState<Deal[]>(loadDeals);
  const [portfolio,setPortfolio] = useState<PortfolioItem[]>(loadPort);
  const [tab,setTab] = useState<'pipeline'|'watchlist'|'portfolio'|'analytics'>('pipeline');
  const [search,setSearch] = useState('');
  const [sectorF,setSectorF] = useState('all');
  const [selId,setSelId] = useState<string|null>(SAMPLE_DEALS[0].id);
  const [showAdd,setShowAdd] = useState(false);
  const [form,setForm] = useState({...BLANK});
  const [draggingId,setDraggingId] = useState<string|null>(null);
  const [dragOver,setDragOver] = useState<Stage|null>(null);
  const [noteEdit,setNoteEdit] = useState('');
  const [editingNote,setEditingNote] = useState(false);

  const upd = useCallback((fn:(p:Deal[])=>Deal[])=>{
    setDeals(p=>{const n=fn(p);saveDeals(n);return n;});
  },[]);

  const updPort = useCallback((fn:(p:PortfolioItem[])=>PortfolioItem[])=>{
    setPortfolio(p=>{const n=fn(p);savePort(n);return n;});
  },[]);

  const sectors = useMemo(()=>{
    const s=new Set(deals.map(d=>d.sector));
    return['all',...Array.from(s).sort()];
  },[deals]);

  const filtered = useMemo(()=>{
    let items=deals;
    if(search.trim()){const q=search.toLowerCase();
      items=items.filter(d=>d.name.toLowerCase().includes(q)||d.tagline.toLowerCase().includes(q)||d.founders.toLowerCase().includes(q)||d.tags.some(t=>t.toLowerCase().includes(q)));}
    if(sectorF!=='all')items=items.filter(d=>d.sector===sectorF);
    if(tab==='watchlist')items=items.filter(d=>d.starred);
    return items;
  },[deals,search,sectorF,tab]);

  const byStage = useMemo(()=>{
    const m:Record<Stage,Deal[]>={} as Record<Stage,Deal[]>;
    STAGES.forEach(s=>{m[s]=[];});
    filtered.forEach(d=>{if(m[d.stage])m[d.stage].push(d);});
    return m;
  },[filtered]);

  const sel = selId?deals.find(d=>d.id===selId)||null:null;

  const stats = useMemo(()=>({
    total:deals.length,
    active:deals.filter(d=>!['closed','passed'].includes(d.stage)).length,
    highScore:deals.filter(d=>d.score>=75).length,
    starred:deals.filter(d=>d.starred).length,
    avgScore:deals.length?Math.round(deals.reduce((a,d)=>a+d.score,0)/deals.length):0,
  }),[deals]);

  const portStats = useMemo(()=>{
    const active=portfolio.filter(p=>p.status==='active');
    return{
      total:portfolio.length,active:active.length,
      avgMult:active.length?+(active.reduce((a,p)=>a+p.multiple,0)/active.length).toFixed(1):0,
    };
  },[portfolio]);

  const addDeal=()=>{
    if(!form.name.trim())return;
    const d:Deal={...form,id:`d-${Date.now()}`,addedAt:Date.now(),updatedAt:Date.now()};
    upd(p=>[d,...p]);setSelId(d.id);setShowAdd(false);setForm({...BLANK});
  };

  const bdr='hsl(var(--border))'; const txt='hsl(var(--foreground))'; const mut='hsl(var(--muted-foreground))';
  const cbg='hsl(var(--card))';
  const iSt:React.CSSProperties={width:'100%',padding:'8px 12px',borderRadius:'10px',fontSize:'13px',
    border:`1px solid hsl(var(--border))`,background:'hsl(var(--muted) / 0.3)',color:'hsl(var(--foreground))',outline:'none',boxSizing:'border-box'};

  return (
    <PageShell>
      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'24px'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',gap:'12px',flexWrap:'wrap'}}>
          <div>
            <h1 style={{margin:0,fontSize:'26px',fontWeight:800,color:txt}}>💼 Investor Dashboard</h1>
            <p style={{margin:'4px 0 0',fontSize:'13px',color:mut}}>Deal flow, pipeline management, and portfolio tracking</p>
          </div>
          <button onClick={()=>setShowAdd(true)}
            style={{padding:'9px 20px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
            + Add Deal
          </button>
        </div>

        {/* ── Stats bar ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px',marginBottom:'20px'}}>
          {[
            {l:'Total Deals',v:stats.total,i:'📋',c:'#6366f1'},
            {l:'Active Pipeline',v:stats.active,i:'🔄',c:'#3b82f6'},
            {l:'High Score ≥75',v:stats.highScore,i:'⭐',c:'#f59e0b'},
            {l:'Watchlisted',v:stats.starred,i:'👁️',c:'#8b5cf6'},
            {l:'Portfolio Cos.',v:portStats.total,i:'💰',c:'#22c55e'},
            {l:'Avg Score',v:stats.avgScore,i:'📈',c:'#14b8a6'},
          ].map(s=>(
            <div key={s.l} style={{padding:'14px',borderRadius:'12px',background:cbg,border:`1px solid ${bdr}`,textAlign:'center'}}>
              <div style={{fontSize:'18px',marginBottom:'4px'}}>{s.i}</div>
              <div style={{fontSize:'20px',fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:'11px',color:mut,marginTop:'2px'}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{display:'flex',gap:'4px',marginBottom:'16px',borderBottom:`1px solid ${bdr}`,paddingBottom:'10px',flexWrap:'wrap'}}>
          {(['pipeline','watchlist','portfolio','analytics'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'8px 16px',borderRadius:'8px',border:'none',cursor:'pointer',
                background:tab===t?'rgba(99,102,241,0.12)':'transparent',
                color:tab===t?'#6366f1':mut,fontSize:'13px',fontWeight:tab===t?600:400}}>
              {t==='pipeline'&&'📊 Pipeline'}
              {t==='watchlist'&&`👁️ Watchlist (${stats.starred})`}
              {t==='portfolio'&&'💼 Portfolio'}
              {t==='analytics'&&'📈 Analytics'}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        {(tab==='pipeline'||tab==='watchlist')&&(
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}>
            <div style={{position:'relative',flex:'1 1 180px'}}>
              <span style={{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',opacity:0.4,fontSize:'12px'}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search deals…"
                style={{...iSt,paddingLeft:'28px'}}/>
            </div>
            <select value={sectorF} onChange={e=>setSectorF(e.target.value)}
              style={{...iSt,width:'auto',cursor:'pointer'}}>
              {sectors.map(s=><option key={s} value={s}>{s==='all'?'All Sectors':s}</option>)}
            </select>
            <span style={{fontSize:'12px',color:mut,display:'flex',alignItems:'center'}}>
              {filtered.length} deal{filtered.length!==1?'s':''}
            </span>
          </div>
        )}

        {/* ══ PIPELINE KANBAN ══ */}
        {tab==='pipeline'&&(
          <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'8px',alignItems:'flex-start'}}>
            {STAGES.map(stage=>{
              const cfg=STAGE_CFG[stage]; const cards=byStage[stage]||[]; const isOver=dragOver===stage;
              return(
                <div key={stage}
                  onDragOver={e=>{e.preventDefault();setDragOver(stage);}}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={()=>{if(draggingId)upd(p=>p.map(d=>d.id===draggingId?{...d,stage,updatedAt:Date.now()}:d));setDraggingId(null);setDragOver(null);}}
                  style={{minWidth: isMobile ? '100%' : '192px',flex:'1 1 192px',
                    background:isOver?`${cfg.color}10`:'hsl(var(--muted) / 0.2)',
                    border:`1px solid ${isOver?cfg.color:bdr}`,borderRadius:'10px',padding:'10px',transition:'all 0.2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'8px'}}>
                    <span>{cfg.icon}</span>
                    <span style={{fontSize:'11px',fontWeight:700,color:cfg.color}}>{cfg.label}</span>
                    <span style={{marginLeft:'auto',fontSize:'10px',fontWeight:700,color:'#fff',
                      background:cfg.color,padding:'1px 6px',borderRadius:'10px'}}>{cards.length}</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'5px',minHeight:'60px'}}>
                    {cards.map(deal=>(
                      <div key={deal.id} draggable
                        onDragStart={()=>setDraggingId(deal.id)}
                        onClick={()=>setSelId(deal.id)}
                        style={{padding:'9px',borderRadius:'8px',cursor:'grab',
                          background:selId===deal.id?`${cfg.color}12`:cbg,
                          border:`1px solid ${selId===deal.id?cfg.color:bdr}`,transition:'all 0.15s'}}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:'4px',marginBottom:'3px'}}>
                          <span style={{fontSize:'12px',fontWeight:700,color:txt,flex:1,minWidth:0,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{deal.name}</span>
                          <ScoreRing score={deal.score} size={28}/>
                        </div>
                        <div style={{fontSize:'10px',color:mut,overflow:'hidden',textOverflow:'ellipsis',
                          whiteSpace:'nowrap',marginBottom:'4px'}}>{deal.tagline}</div>
                        <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'9px',padding:'1px 5px',borderRadius:'8px',
                            background:`${cfg.color}15`,color:cfg.color}}>{deal.round}</span>
                          <span style={{fontSize:'9px',padding:'1px 5px',borderRadius:'8px',
                            background:'hsl(var(--muted) / 0.3)',color:mut}}>{deal.asking}</span>
                          {deal.starred&&<span style={{fontSize:'9px'}}>⭐</span>}
                        </div>
                      </div>
                    ))}
                    {cards.length===0&&(
                      <div style={{padding:'14px 6px',textAlign:'center',color:mut,fontSize:'10px',opacity:0.5}}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ WATCHLIST ══ */}
        {tab==='watchlist'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'10px'}}>
            {filtered.length===0&&(
              <div style={{padding:'48px',textAlign:'center',color:mut,gridColumn:'1/-1'}}>
                <div style={{fontSize:'36px',marginBottom:'10px'}}>👁️</div>
                <div style={{fontWeight:600}}>No watchlisted deals yet — star deals to watch them here</div>
              </div>
            )}
            {filtered.map(deal=>{const cfg=STAGE_CFG[deal.stage];return(
              <div key={deal.id} onClick={()=>setSelId(deal.id)}
                style={{padding:'14px',borderRadius:'12px',border:`1px solid ${selId===deal.id?'rgba(99,102,241,0.4)':bdr}`,
                  background:selId===deal.id?'rgba(99,102,241,0.06)':cbg,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'14px',fontWeight:700,color:txt}}>{deal.name}</div>
                    <div style={{fontSize:'11px',color:mut,marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{deal.tagline}</div>
                  </div>
                  <ScoreRing score={deal.score} size={40}/>
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:`${cfg.color}15`,color:cfg.color}}>{cfg.icon} {cfg.label}</span>
                  <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:'rgba(99,102,241,0.1)',color:'#6366f1'}}>{deal.round}</span>
                  <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:'hsl(var(--muted) / 0.3)',color:mut}}>{deal.asking}</span>
                </div>
              </div>
            );})}
          </div>
        )}

        {/* ══ PORTFOLIO ══ */}
        {tab==='portfolio'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px',marginBottom:'20px'}}>
              {[
                {l:'Companies',v:portStats.total,c:'#6366f1'},
                {l:'Active',v:portStats.active,c:'#22c55e'},
                {l:'Avg Multiple',v:`${portStats.avgMult}x`,c:'#f59e0b'},
              ].map(s=>(
                <div key={s.l} style={{padding:'16px',borderRadius:'12px',background:cbg,border:`1px solid ${bdr}`,textAlign:'center'}}>
                  <div style={{fontSize:'22px',fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:'11px',color:mut,marginTop:'4px'}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {portfolio.map(p=>{
                const sc_={active:'#22c55e',exited:'#3b82f6',written_off:'#ef4444'}[p.status];
                return(
                  <div key={p.id} style={{padding:'16px',borderRadius:'12px',background:cbg,border:`1px solid ${bdr}`,display:'flex',gap:'16px',alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{flex:'1 1 160px'}}>
                      <div style={{fontSize:'14px',fontWeight:700,color:txt}}>{p.name}</div>
                      <div style={{fontSize:'11px',color:mut,marginTop:'2px'}}>{p.sector} · {p.round}</div>
                    </div>
                    <div style={{textAlign:'center',minWidth:'80px'}}>
                      <div style={{fontSize:'11px',color:mut}}>Invested</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:txt}}>{p.invested}</div>
                    </div>
                    <div style={{textAlign:'center',minWidth:'80px'}}>
                      <div style={{fontSize:'11px',color:mut}}>Current</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:p.status==='written_off'?'#ef4444':txt}}>{p.status==='written_off'?'—':p.currentVal}</div>
                    </div>
                    <div style={{textAlign:'center',minWidth:'60px'}}>
                      <div style={{fontSize:'11px',color:mut}}>Multiple</div>
                      <div style={{fontSize:'14px',fontWeight:800,color:p.multiple>=2?'#22c55e':p.multiple>=1?'#f59e0b':'#ef4444'}}>{p.multiple}x</div>
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background:`${sc_}18`,color:sc_}}>
                        {p.status.replace('_',' ')}
                      </span>
                      <select value={p.status} onChange={e=>updPort(pt=>pt.map(x=>x.id===p.id?{...x,status:e.target.value as PortfolioItem['status']}:x))}
                        style={{fontSize:'10px',padding:'2px 6px',borderRadius:'6px',border:`1px solid ${bdr}`,background:'hsl(var(--muted) / 0.3)',color:mut,cursor:'pointer'}}>
                        <option value="active">Active</option>
                        <option value="exited">Exited</option>
                        <option value="written_off">Written Off</option>
                      </select>
                      <button onClick={()=>updPort(pt=>pt.filter(x=>x.id!==p.id))}
                        style={{padding:'3px 8px',borderRadius:'6px',border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',cursor:'pointer',fontSize:'10px'}}>🗑</button>
                    </div>
                  </div>
                );
              })}
              {portfolio.length===0&&(
                <div style={{padding:'40px',textAlign:'center',color:mut}}>
                  <div style={{fontSize:'36px',marginBottom:'10px'}}>💼</div>
                  <div style={{fontWeight:600}}>No portfolio companies yet</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab==='analytics'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'14px'}}>
            {/* Stage distribution */}
            <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid ${bdr}`}}>
              <div style={{fontSize:'13px',fontWeight:700,color:txt,marginBottom:'12px'}}>📊 Stage Distribution</div>
              {STAGES.map(stage=>{
                const count=deals.filter(d=>d.stage===stage).length;
                const pct=deals.length?Math.round((count/deals.length)*100):0;
                const cfg=STAGE_CFG[stage];
                return(
                  <div key={stage} style={{marginBottom:'7px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'2px'}}>
                      <span style={{color:txt}}>{cfg.icon} {cfg.label}</span>
                      <span style={{color:mut}}>{count} ({pct}%)</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'hsl(var(--muted) / 0.4)'}}>
                      <div style={{height:'100%',borderRadius:'3px',background:cfg.color,width:`${pct}%`,transition:'width 0.4s'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Score distribution */}
            <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid ${bdr}`}}>
              <div style={{fontSize:'13px',fontWeight:700,color:txt,marginBottom:'12px'}}>🎯 Score Breakdown</div>
              {[{l:'High (75–100)',min:75,max:100,c:'#22c55e'},{l:'Mid (50–74)',min:50,max:74,c:'#f59e0b'},{l:'Low (0–49)',min:0,max:49,c:'#ef4444'}].map(b=>{
                const count=deals.filter(d=>d.score>=b.min&&d.score<=b.max).length;
                const pct=deals.length?Math.round((count/deals.length)*100):0;
                return(
                  <div key={b.l} style={{marginBottom:'7px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'2px'}}>
                      <span style={{color:txt}}>{b.l}</span>
                      <span style={{color:mut}}>{count} ({pct}%)</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'hsl(var(--muted) / 0.4)'}}>
                      <div style={{height:'100%',borderRadius:'3px',background:b.c,width:`${pct}%`,transition:'width 0.4s'}}/>
                    </div>
                  </div>
                );
              })}
              <div style={{marginTop:'14px',padding:'10px',borderRadius:'10px',background:'hsl(var(--muted) / 0.2)',textAlign:'center'}}>
                <div style={{fontSize:'11px',color:mut}}>Overall Avg Score</div>
                <div style={{fontSize:'24px',fontWeight:800,color:sc(stats.avgScore)}}>{stats.avgScore}</div>
              </div>
            </div>
            {/* Sector breakdown */}
            <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid ${bdr}`}}>
              <div style={{fontSize:'13px',fontWeight:700,color:txt,marginBottom:'12px'}}>🏭 Sector Mix</div>
              {Array.from(new Set(deals.map(d=>d.sector))).sort().map((sector,i)=>{
                const count=deals.filter(d=>d.sector===sector).length;
                const pct=deals.length?Math.round((count/deals.length)*100):0;
                const c=['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6'][i%7];
                return(
                  <div key={sector} style={{marginBottom:'7px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'2px'}}>
                      <span style={{color:txt}}>{sector}</span>
                      <span style={{color:mut}}>{count}</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'hsl(var(--muted) / 0.4)'}}>
                      <div style={{height:'100%',borderRadius:'3px',background:c,width:`${pct}%`,transition:'width 0.4s'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Recent activity */}
            <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid ${bdr}`}}>
              <div style={{fontSize:'13px',fontWeight:700,color:txt,marginBottom:'12px'}}>🕐 Recent Activity</div>
              {[...deals].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,6).map(d=>{
                const cfg=STAGE_CFG[d.stage];
                return(
                  <div key={d.id} style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'7px'}}>
                    <span style={{fontSize:'14px'}}>{cfg.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',fontWeight:600,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
                      <div style={{fontSize:'10px',color:mut}}>→ {cfg.label}</div>
                    </div>
                    <span style={{fontSize:'10px',color:mut,whiteSpace:'nowrap'}}>{ago(d.updatedAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ DEAL DETAIL PANEL ══ */}
        {sel&&(tab==='pipeline'||tab==='watchlist')&&(
          <div style={{marginTop:'16px',padding:'20px',borderRadius:'16px',background:cbg,border:`1px solid rgba(99,102,241,0.2)`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px',flexWrap:'wrap',marginBottom:'14px'}}>
              <div style={{display:'flex',gap:'12px',alignItems:'center',flex:1}}>
                <ScoreRing score={sel.score} size={56}/>
                <div>
                  <h2 style={{margin:0,fontSize:'18px',fontWeight:800,color:txt}}>{sel.name}</h2>
                  <div style={{fontSize:'12px',color:mut,marginTop:'2px'}}>{sel.tagline}</div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'5px'}}>
                    {sel.tags.map(t=>(
                      <span key={t} style={{fontSize:'9px',padding:'2px 6px',borderRadius:'8px',background:'rgba(99,102,241,0.12)',color:'#6366f1'}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                <button onClick={()=>upd(p=>p.map(d=>d.id===sel.id?{...d,starred:!d.starred,updatedAt:Date.now()}:d))}
                  style={{padding:'6px 12px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',cursor:'pointer',color:sel.starred?'#f59e0b':mut,fontSize:'12px'}}>
                  {sel.starred?'⭐ Watching':'☆ Watch'}
                </button>
                <button onClick={()=>{setNoteEdit(sel.notes);setEditingNote(true);}}
                  style={{padding:'6px 12px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',cursor:'pointer',color:mut,fontSize:'12px'}}>
                  ✏️ Notes
                </button>
                <button onClick={()=>upd(p=>p.filter(d=>d.id!==sel.id))}
                  style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',cursor:'pointer',color:'#ef4444',fontSize:'12px'}}>
                  🗑 Remove
                </button>
              </div>
            </div>
            {/* Info grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'8px',marginBottom:'12px'}}>
              {[
                {l:'Founders',v:sel.founders},
                {l:'Sector',v:sel.sector},
                {l:'Round',v:sel.round},
                {l:'Asking',v:sel.asking},
                {l:'Valuation',v:sel.valuation},
                {l:'Revenue',v:sel.revenue},
                {l:'Team Size',v:`${sel.teamSize} people`},
                {l:'Added',v:ago(sel.addedAt)},
                {l:'Updated',v:ago(sel.updatedAt)},
              ].map(f=>(
                <div key={f.l} style={{padding:'8px 10px',borderRadius:'10px',background:'hsl(var(--muted) / 0.2)'}}>
                  <div style={{fontSize:'10px',color:mut,marginBottom:'2px'}}>{f.l}</div>
                  <div style={{fontSize:'12px',fontWeight:600,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.v}</div>
                </div>
              ))}
            </div>
            {/* Stage mover */}
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'11px',color:mut,marginBottom:'6px'}}>Move stage:</div>
              <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                {STAGES.map(s=>{const c=STAGE_CFG[s];return(
                  <button key={s} onClick={()=>upd(p=>p.map(d=>d.id===sel.id?{...d,stage:s,updatedAt:Date.now()}:d))}
                    style={{padding:'4px 10px',borderRadius:'8px',border:`1px solid ${sel.stage===s?c.color:bdr}`,
                      background:sel.stage===s?`${c.color}15`:'transparent',cursor:'pointer',
                      color:sel.stage===s?c.color:mut,fontSize:'10px',fontWeight:sel.stage===s?700:400}}>
                    {c.icon} {c.label}
                  </button>
                );})}
              </div>
            </div>
            {/* Score slider */}
            <div style={{marginBottom:'12px',display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'11px',color:mut,minWidth:'60px'}}>Score: <b style={{color:sc(sel.score)}}>{sel.score}</b></span>
              <input type="range" min={0} max={100} value={sel.score}
                onChange={e=>upd(p=>p.map(d=>d.id===sel.id?{...d,score:+e.target.value,updatedAt:Date.now()}:d))}
                style={{flex:1,accentColor:'#6366f1'}}/>
            </div>
            {/* Notes */}
            {editingNote?(
              <div>
                <textarea value={noteEdit} onChange={e=>setNoteEdit(e.target.value)}
                  rows={4} style={{...iSt,resize:'vertical',fontFamily:'inherit'}} placeholder="Investment notes…"/>
                <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
                  <button onClick={()=>{upd(p=>p.map(d=>d.id===sel.id?{...d,notes:noteEdit,updatedAt:Date.now()}:d));setEditingNote(false);}}
                    style={{padding:'5px 12px',borderRadius:'7px',border:'none',background:'#6366f1',color:'#fff',cursor:'pointer',fontSize:'12px'}}>Save</button>
                  <button onClick={()=>setEditingNote(false)}
                    style={{padding:'5px 12px',borderRadius:'7px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'12px'}}>Cancel</button>
                </div>
              </div>
            ):(
              sel.notes&&<div style={{padding:'10px 12px',borderRadius:'10px',background:'hsl(var(--muted) / 0.2)',fontSize:'12px',color:txt,whiteSpace:'pre-wrap'}}>{sel.notes}</div>
            )}
            {sel.website&&(
              <a href={`https://${sel.website}`} target="_blank" rel="noopener noreferrer"
                style={{display:'inline-block',marginTop:'8px',fontSize:'11px',color:'#6366f1'}}>
                🌐 {sel.website}
              </a>
            )}
          </div>
        )}

        {/* ══ ADD DEAL MODAL ══ */}
        {showAdd&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'16px'}}
            onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}>
            <div style={{width:'100%',maxWidth:'540px',maxHeight:'90vh',overflowY:'auto',borderRadius:'18px',
              background:'hsl(var(--popover))',border:`1px solid ${bdr}`,padding:'24px',boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
                <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:txt}}>➕ Add New Deal</h3>
                <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:mut,fontSize:'18px'}}>✕</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {[
                  {l:'Company Name *',k:'name',t:'text',ph:'e.g. NeuroSync AI'},
                  {l:'Tagline',k:'tagline',t:'text',ph:'One-line description'},
                  {l:'Founders',k:'founders',t:'text',ph:'Founder names'},
                  {l:'Website',k:'website',t:'text',ph:'domain.com'},
                  {l:'Asking',k:'asking',t:'text',ph:'€500k'},
                  {l:'Valuation',k:'valuation',t:'text',ph:'€3M'},
                  {l:'Revenue',k:'revenue',t:'text',ph:'€12k MRR'},
                ].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>{f.l}</label>
                    <input value={(form as unknown as Record<string,string>)[f.k]||''} placeholder={f.ph}
                      onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={iSt}/>
                  </div>
                ))}
                {[
                  {l:'Sector',k:'sector',opts:['Technology','Biotech','EdTech','HealthTech','FinTech','CleanTech','DeepTech','Other']},
                  {l:'Round',k:'round',opts:['Pre-seed','Seed','Series A','Series B','Grant','Revenue']},
                  {l:'Stage',k:'stage',opts:STAGES},
                ].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>{f.l}</label>
                    <select value={(form as unknown as Record<string,string>)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{...iSt,cursor:'pointer'}}>
                      {f.opts.map(o=><option key={o} value={o}>{f.k==='stage'?STAGE_CFG[o as Stage].label:o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Score (0–100)</label>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <input type="range" min={0} max={100} value={form.score}
                      onChange={e=>setForm(p=>({...p,score:+e.target.value}))}
                      style={{flex:1,accentColor:'#6366f1'}}/>
                    <span style={{fontSize:'13px',fontWeight:700,color:sc(form.score),minWidth:'28px'}}>{form.score}</span>
                  </div>
                </div>
                <div>
                  <label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                    rows={3} style={{...iSt,resize:'vertical',fontFamily:'inherit'}} placeholder="Investment thesis, risks, follow-ups…"/>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'18px',justifyContent:'flex-end'}}>
                <button onClick={()=>setShowAdd(false)}
                  style={{padding:'9px 18px',borderRadius:'9px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'13px'}}>
                  Cancel
                </button>
                <button onClick={addDeal} disabled={!form.name.trim()}
                  style={{padding:'9px 20px',borderRadius:'9px',border:'none',
                    background:form.name.trim()?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(99,102,241,0.3)',
                    color:'#fff',cursor:form.name.trim()?'pointer':'default',fontWeight:700,fontSize:'13px'}}>
                  Add Deal
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}

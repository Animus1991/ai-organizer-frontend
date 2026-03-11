import { useState, useMemo, useRef } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { useIsMobile } from '../hooks/useMediaQuery';

type RefType = 'article'|'book'|'inproceedings'|'thesis'|'report'|'misc'|'preprint'|'webpage';
interface Reference {
  id:string; type:RefType; title:string; authors:string; year:string;
  journal?:string; volume?:string; issue?:string; pages?:string;
  publisher?:string; doi?:string; url?:string; abstract?:string;
  tags:string[]; notes:string; addedAt:number; citationKey:string;
}
const TYPE_CFG:Record<RefType,{label:string;icon:string;color:string}> = {
  article:       {label:'Journal Article',icon:'📄',color:'#3b82f6'},
  book:          {label:'Book',           icon:'📚',color:'#8b5cf6'},
  inproceedings: {label:'Conference',     icon:'🎤',color:'#f59e0b'},
  thesis:        {label:'Thesis',         icon:'🎓',color:'#14b8a6'},
  report:        {label:'Report',         icon:'📋',color:'#6b7280'},
  misc:          {label:'Misc',           icon:'📎',color:'#6366f1'},
  preprint:      {label:'Preprint',       icon:'🔬',color:'#ec4899'},
  webpage:       {label:'Webpage',        icon:'🌐',color:'#22c55e'},
};
const SAMPLE:Reference[] = [
  {id:'r1',type:'article',title:'Attention Is All You Need',authors:'Vaswani, A.; Shazeer, N.; Parmar, N.',year:'2017',journal:'NeurIPS',volume:'30',pages:'5998-6008',doi:'10.48550/arXiv.1706.03762',url:'https://arxiv.org/abs/1706.03762',abstract:'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',tags:['deep-learning','transformers','NLP'],notes:'Foundational paper for modern LLMs.',addedAt:Date.now()-30*86400000,citationKey:'vaswani2017attention'},
  {id:'r2',type:'book',title:'Deep Learning',authors:'Goodfellow, I.; Bengio, Y.; Courville, A.',year:'2016',publisher:'MIT Press',url:'https://www.deeplearningbook.org',abstract:'An introduction to deep learning.',tags:['deep-learning','textbook'],notes:'',addedAt:Date.now()-60*86400000,citationKey:'goodfellow2016deep'},
  {id:'r3',type:'preprint',title:'LLaMA: Open and Efficient Foundation Language Models',authors:'Touvron, H. et al.',year:'2023',journal:'arXiv',doi:'10.48550/arXiv.2302.13971',url:'https://arxiv.org/abs/2302.13971',abstract:'Collection of foundation language models from 7B to 65B parameters.',tags:['LLM','open-source'],notes:'',addedAt:Date.now()-10*86400000,citationKey:'touvron2023llama'},
  {id:'r4',type:'inproceedings',title:'BERT: Pre-training of Deep Bidirectional Transformers',authors:'Devlin, J.; Chang, M.; Lee, K.; Toutanova, K.',year:'2019',journal:'NAACL 2019',pages:'4171-4186',doi:'10.18653/v1/N19-1423',abstract:'We introduce BERT, a language representation model.',tags:['BERT','NLP','transformers'],notes:'Key fine-tuning paradigm paper.',addedAt:Date.now()-45*86400000,citationKey:'devlin2019bert'},
];
const SK='references_v1';
function loadRefs():Reference[]{try{const r=localStorage.getItem(SK);if(r)return JSON.parse(r);}catch{}return SAMPLE;}
function saveRefs(d:Reference[]){try{localStorage.setItem(SK,JSON.stringify(d));}catch{}}

function parseBibTeX(raw:string):Partial<Reference>[]{
  const out:Partial<Reference>[]=[];
  const re=/@(\w+)\s*\{([^,]+),([^@]*)\}/gs; let m:RegExpExecArray|null;
  while((m=re.exec(raw))!==null){
    const type=m[1].toLowerCase(); const key=m[2].trim(); const body=m[3];
    const get=(f:string)=>{const r2=new RegExp(`${f}\\s*=\\s*[{"](.*?)[}"],?`,'is');const fm=r2.exec(body);return fm?fm[1].trim():'';};
    const t:RefType=['article','book','inproceedings','thesis','report','preprint','webpage'].includes(type)?type as RefType:'misc';
    out.push({type:t,citationKey:key,title:get('title'),authors:get('author'),year:get('year'),
      journal:get('journal')||get('booktitle'),volume:get('volume'),issue:get('number'),
      pages:get('pages'),publisher:get('publisher'),doi:get('doi'),url:get('url'),
      abstract:get('abstract'),tags:[],notes:'',addedAt:Date.now(),id:`r-${Date.now()}-${Math.random()}`});
  }
  return out;
}
function toAPA(r:Reference):string{
  const a=r.authors.includes(';')?r.authors.split(';').map(x=>x.trim()).join(', '):r.authors;
  let s=`${a} (${r.year}). ${r.title}.`;
  if(r.journal)s+=` ${r.journal}`;
  if(r.volume)s+=`, ${r.volume}`;if(r.issue)s+=`(${r.issue})`;if(r.pages)s+=`, ${r.pages}`;s+='.';
  if(r.doi)s+=` https://doi.org/${r.doi}`;return s;
}
function toMLA(r:Reference):string{
  const a=r.authors.split(';')[0].trim();
  let s=`${a}. "${r.title}."`;
  if(r.journal)s+=` ${r.journal},`;if(r.volume)s+=` vol. ${r.volume},`;if(r.issue)s+=` no. ${r.issue},`;
  s+=` ${r.year}`;if(r.pages)s+=`, pp. ${r.pages}`;s+='.';return s;
}
function toBibTeX(r:Reference):string{
  const lines=[`@${r.type}{${r.citationKey},`];
  const f=(k:string,v?:string)=>{if(v)lines.push(`  ${k.padEnd(10)}= {${v}},`);};
  f('title',r.title);f('author',r.authors);f('year',r.year);f('journal',r.journal);
  f('volume',r.volume);f('number',r.issue);f('pages',r.pages);f('publisher',r.publisher);
  f('doi',r.doi);f('url',r.url);lines.push('}');return lines.join('\n');
}
const BLANK:Omit<Reference,'id'|'addedAt'>={
  type:'article',title:'',authors:'',year:String(new Date().getFullYear()),
  journal:'',volume:'',issue:'',pages:'',publisher:'',doi:'',url:'',abstract:'',tags:[],notes:'',citationKey:'',
};

export default function ReferencesPage(){
  const isMobile = useIsMobile();
  const [refs,setRefs]=useState<Reference[]>(loadRefs);
  const [search,setSearch]=useState('');
  const [typeF,setTypeF]=useState<RefType|'all'>('all');
  const [tagF,setTagF]=useState('');
  const [selId,setSelId]=useState<string|null>(SAMPLE[0].id);
  const [panelTab,setPanelTab]=useState<'list'|'add'|'import'>('list');
  const [citeFmt,setCiteFmt]=useState<'apa'|'mla'|'bibtex'>('apa');
  const [form,setForm]=useState({...BLANK});
  const [bibtexInput,setBibtexInput]=useState('');
  const [importPreview,setImportPreview]=useState<Partial<Reference>[]>([]);
  const [doiInput,setDoiInput]=useState('');
  const [doiLoading,setDoiLoading]=useState(false);
  const [doiError,setDoiError]=useState('');
  const [copied,setCopied]=useState('');
  const [sortBy,setSortBy]=useState<'year'|'title'|'added'>('added');
  const fileRef=useRef<HTMLInputElement>(null);

  const upd=(fn:(p:Reference[])=>Reference[])=>{setRefs(p=>{const n=fn(p);saveRefs(n);return n;});};

  const lookupDOI=async()=>{
    if(!doiInput.trim())return;
    setDoiLoading(true);setDoiError('');
    try{
      const clean=doiInput.trim().replace(/^https?:\/\/doi\.org\//,'');
      const res=await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`);
      if(!res.ok)throw new Error('not found');
      const data=await res.json(); const w=data.message;
      const authors=(w.author||[]).map((a:{family?:string;given?:string})=>`${a.family||''}, ${a.given||''}`.trim()).join('; ');
      const year=w.published?.['date-parts']?.[0]?.[0]?String(w.published['date-parts'][0][0]):'';
      const ck=`${(w.author?.[0]?.family||'anon').toLowerCase()}${year}${(w.title?.[0]||'').split(' ')[0].toLowerCase()}`;
      setForm(p=>({...p,title:w.title?.[0]||'',authors,year,journal:w['container-title']?.[0]||'',
        volume:w.volume||'',issue:w.issue||'',pages:w.page||'',publisher:w.publisher||'',doi:clean,
        url:w.URL||'',abstract:(w.abstract||'').replace(/<[^>]*>/g,''),citationKey:ck,
        type:(w.type==='journal-article'?'article':w.type==='book'?'book':'misc') as RefType}));
      setPanelTab('add');
    }catch{setDoiError('Could not fetch DOI. Check the identifier and try again.');}
    finally{setDoiLoading(false);}
  };
  const addRef=()=>{
    if(!form.title.trim())return;
    const ck=form.citationKey||`${form.authors.split(',')[0].toLowerCase().replace(/\s/g,'')}${form.year}`;
    const r:Reference={...form,id:`r-${Date.now()}`,addedAt:Date.now(),citationKey:ck};
    upd(p=>[r,...p]);setSelId(r.id);setPanelTab('list');setForm({...BLANK});
  };
  const importBibTeX=()=>{
    const parsed=parseBibTeX(bibtexInput);if(!parsed.length)return;
    const complete=parsed.filter(p=>p.title).map(p=>({...BLANK,...p,id:`r-${Date.now()}-${Math.random()}`} as Reference));
    upd(p=>[...complete,...p]);setImportPreview([]);setBibtexInput('');setPanelTab('list');
    if(complete[0])setSelId(complete[0].id);
  };
  const copyText=(text:string,key:string)=>{navigator.clipboard.writeText(text).then(()=>{setCopied(key);setTimeout(()=>setCopied(''),2000);});};
  const exportAll=()=>{
    const blob=new Blob([refs.map(toBibTeX).join('\n\n')],{type:'text/plain'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='references.bib';a.click();
  };

  const allTags=useMemo(()=>{const s=new Set<string>();refs.forEach(r=>r.tags.forEach(t=>s.add(t)));return Array.from(s).sort();},[refs]);
  const filtered=useMemo(()=>{
    let items=refs;
    if(search.trim()){const q=search.toLowerCase();items=items.filter(r=>r.title.toLowerCase().includes(q)||r.authors.toLowerCase().includes(q)||r.citationKey.toLowerCase().includes(q));}
    if(typeF!=='all')items=items.filter(r=>r.type===typeF);
    if(tagF)items=items.filter(r=>r.tags.includes(tagF));
    if(sortBy==='year')items=[...items].sort((a,b)=>Number(b.year)-Number(a.year));
    else if(sortBy==='title')items=[...items].sort((a,b)=>a.title.localeCompare(b.title));
    else items=[...items].sort((a,b)=>b.addedAt-a.addedAt);
    return items;
  },[refs,search,typeF,tagF,sortBy]);

  const sel=selId?refs.find(r=>r.id===selId)||null:null;
  const citation=sel?(citeFmt==='apa'?toAPA(sel):citeFmt==='mla'?toMLA(sel):toBibTeX(sel)):'';

  const bdr='hsl(var(--border))';const txt='hsl(var(--foreground))';const mut='hsl(var(--muted-foreground))';
  const cbg='hsl(var(--card) / 0.5)';
  const isDark = true;
  const iSt:React.CSSProperties={width:'100%',padding:'8px 12px',borderRadius:'10px',fontSize:'13px',
    border:`1px solid ${bdr}`,background:'hsl(var(--muted) / 0.3)',color:txt,outline:'none',boxSizing:'border-box'};
  return (
    <PageShell>
      <div style={{maxWidth:'1300px',margin:'0 auto',padding:'24px'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',gap:'12px',flexWrap:'wrap'}}>
          <div>
            <h1 style={{margin:0,fontSize:'26px',fontWeight:800,color:txt}}>📚 Reference Manager</h1>
            <p style={{margin:'4px 0 0',fontSize:'13px',color:mut}}>BibTeX import · DOI lookup · APA/MLA/BibTeX export · Citation insert</p>
          </div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            <button onClick={exportAll} style={{padding:'8px 16px',borderRadius:'9px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'12px'}}>⬇ Export .bib ({refs.length})</button>
            <button onClick={()=>setPanelTab('import')} style={{padding:'8px 16px',borderRadius:'9px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'12px'}}>📥 Import BibTeX</button>
            <button onClick={()=>setPanelTab('add')} style={{padding:'8px 16px',borderRadius:'9px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:700}}>+ Add Reference</button>
          </div>
        </div>

        {/* ── Type summary badges ── */}
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px'}}>
          {Object.entries(TYPE_CFG).map(([type,cfg])=>{const n=refs.filter(r=>r.type===type).length;if(!n)return null;
            return(<span key={type} onClick={()=>setTypeF(typeF===type?'all':type as RefType)}
              style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,cursor:'pointer',
                background:typeF===type?cfg.color:`${cfg.color}15`,color:typeF===type?'#fff':cfg.color}}>
              {cfg.icon} {cfg.label} ({n})</span>);})}
        </div>

        {/* ── DOI Lookup bar ── */}
        <div style={{display:'flex',gap:'8px',marginBottom:'14px',padding:'12px 14px',borderRadius:'12px',border:`1px solid ${bdr}`,background:cbg,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:'12px',fontWeight:600,color:txt,whiteSpace:'nowrap'}}>🔎 DOI Lookup:</span>
          <input value={doiInput} onChange={e=>setDoiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookupDOI()}
            placeholder="Paste DOI or https://doi.org/10.xxxx/…" style={{...iSt,flex:'1 1 260px'}}/>
          <button onClick={lookupDOI} disabled={doiLoading||!doiInput.trim()}
            style={{padding:'8px 16px',borderRadius:'8px',border:'none',
              background:doiInput.trim()&&!doiLoading?'#6366f1':'rgba(99,102,241,0.3)',
              color:'#fff',cursor:doiInput.trim()&&!doiLoading?'pointer':'default',fontSize:'12px',fontWeight:600,whiteSpace:'nowrap'}}>
            {doiLoading?'Looking up…':'Fetch Metadata'}
          </button>
          {doiError&&<span style={{fontSize:'11px',color:'#ef4444',width:'100%'}}>{doiError}</span>}
        </div>

        {/* ── Filters ── */}
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
          <div style={{position:'relative',flex:'1 1 180px'}}>
            <span style={{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',opacity:0.4,fontSize:'12px'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, author, key…" style={{...iSt,paddingLeft:'28px'}}/>
          </div>
          <select value={typeF} onChange={e=>setTypeF(e.target.value as RefType|'all')} style={{...iSt,width:'auto',cursor:'pointer'}}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={tagF} onChange={e=>setTagF(e.target.value)} style={{...iSt,width:'auto',cursor:'pointer'}}>
            <option value="">All Tags</option>
            {allTags.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'year'|'title'|'added')} style={{...iSt,width:'auto',cursor:'pointer'}}>
            <option value="added">Recently Added</option>
            <option value="year">Year (newest)</option>
            <option value="title">Title A–Z</option>
          </select>
          <span style={{fontSize:'12px',color:mut,display:'flex',alignItems:'center'}}>{filtered.length} ref{filtered.length!==1?'s':''}</span>
        </div>

        {/* ── ADD FORM ── */}
        {panelTab==='add'&&(
          <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid rgba(99,102,241,0.25)`,marginBottom:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <h3 style={{margin:0,fontSize:'14px',fontWeight:700,color:txt}}>➕ Add Reference</h3>
              <button onClick={()=>setPanelTab('list')} style={{background:'none',border:'none',cursor:'pointer',color:mut,fontSize:'16px'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'9px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Title *</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={iSt} placeholder="Paper or book title"/>
              </div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Authors</label>
                <input value={form.authors} onChange={e=>setForm(p=>({...p,authors:e.target.value}))} style={iSt} placeholder="Last, F.; Last2, F2"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Year</label>
                <input value={form.year} onChange={e=>setForm(p=>({...p,year:e.target.value}))} style={iSt} placeholder="2024"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Type</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as RefType}))} style={{...iSt,cursor:'pointer'}}>
                  {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Citation Key</label>
                <input value={form.citationKey} onChange={e=>setForm(p=>({...p,citationKey:e.target.value}))} style={iSt} placeholder="author2024title"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Journal / Venue</label>
                <input value={form.journal||''} onChange={e=>setForm(p=>({...p,journal:e.target.value}))} style={iSt} placeholder="Nature, NeurIPS…"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>DOI</label>
                <input value={form.doi||''} onChange={e=>setForm(p=>({...p,doi:e.target.value}))} style={iSt} placeholder="10.xxxx/xxxxx"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>URL</label>
                <input value={form.url||''} onChange={e=>setForm(p=>({...p,url:e.target.value}))} style={iSt} placeholder="https://…"/></div>
              <div><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Vol / No / Pages</label>
                <div style={{display:'flex',gap:'4px'}}>
                  <input value={form.volume||''} onChange={e=>setForm(p=>({...p,volume:e.target.value}))} style={{...iSt,width:'30%'}} placeholder="Vol"/>
                  <input value={form.issue||''} onChange={e=>setForm(p=>({...p,issue:e.target.value}))} style={{...iSt,width:'30%'}} placeholder="No"/>
                  <input value={form.pages||''} onChange={e=>setForm(p=>({...p,pages:e.target.value}))} style={{...iSt,width:'40%'}} placeholder="1-10"/>
                </div></div>
              <div style={{gridColumn:'1/-1'}}><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Tags (comma-separated)</label>
                <input value={form.tags.join(', ')} onChange={e=>setForm(p=>({...p,tags:e.target.value.split(',').map(t=>t.trim()).filter(Boolean)}))} style={iSt} placeholder="deep-learning, NLP"/></div>
              <div style={{gridColumn:'1/-1'}}><label style={{fontSize:'11px',color:mut,display:'block',marginBottom:'3px'}}>Abstract / Notes</label>
                <textarea value={form.abstract||''} onChange={e=>setForm(p=>({...p,abstract:e.target.value}))} rows={3} style={{...iSt,resize:'vertical',fontFamily:'inherit'}} placeholder="Abstract…"/></div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'12px',justifyContent:'flex-end'}}>
              <button onClick={()=>setPanelTab('list')} style={{padding:'7px 16px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'12px'}}>Cancel</button>
              <button onClick={addRef} disabled={!form.title.trim()} style={{padding:'7px 18px',borderRadius:'8px',border:'none',background:form.title.trim()?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(99,102,241,0.3)',color:'#fff',cursor:form.title.trim()?'pointer':'default',fontWeight:700,fontSize:'12px'}}>Save Reference</button>
            </div>
          </div>
        )}

        {/* ── IMPORT PANEL ── */}
        {panelTab==='import'&&(
          <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid rgba(99,102,241,0.25)`,marginBottom:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <h3 style={{margin:0,fontSize:'14px',fontWeight:700,color:txt}}>📥 Import BibTeX</h3>
              <button onClick={()=>setPanelTab('list')} style={{background:'none',border:'none',cursor:'pointer',color:mut,fontSize:'16px'}}>✕</button>
            </div>
            <p style={{fontSize:'12px',color:mut,marginTop:0,marginBottom:'8px'}}>Paste BibTeX or load a .bib file. Multiple entries supported.</p>
            <textarea value={bibtexInput} onChange={e=>{setBibtexInput(e.target.value);setImportPreview(parseBibTeX(e.target.value));}}
              rows={8} style={{...iSt,resize:'vertical',fontFamily:'monospace',fontSize:'12px'}}
              placeholder={'@article{key,\n  title = {Title},\n  author = {Last, First},\n  year = {2024},\n}'}/>
            {importPreview.length>0&&(
              <div style={{marginTop:'8px',padding:'10px',borderRadius:'8px',background:isDark?'rgba(99,102,241,0.08)':'rgba(99,102,241,0.04)',border:`1px solid rgba(99,102,241,0.2)`}}>
                <div style={{fontSize:'11px',color:'#6366f1',fontWeight:600,marginBottom:'4px'}}>Preview: {importPreview.length} entr{importPreview.length===1?'y':'ies'} detected</div>
                {importPreview.slice(0,4).map((p,i)=><div key={i} style={{fontSize:'11px',color:mut}}>• [{p.citationKey}] {p.title}</div>)}
                {importPreview.length>4&&<div style={{fontSize:'11px',color:mut}}>…and {importPreview.length-4} more</div>}
              </div>
            )}
            <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
              <label style={{padding:'7px 14px',borderRadius:'8px',border:`1px solid ${bdr}`,color:mut,cursor:'pointer',fontSize:'12px',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                📂 Open .bib file
                <input ref={fileRef} type="file" accept=".bib,.txt" style={{display:'none'}}
                  onChange={e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>{const t=ev.target?.result as string;setBibtexInput(t);setImportPreview(parseBibTeX(t));};rd.readAsText(f);}}/>
              </label>
              <div style={{marginLeft:'auto',display:'flex',gap:'6px'}}>
                <button onClick={()=>setPanelTab('list')} style={{padding:'7px 14px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,cursor:'pointer',fontSize:'12px'}}>Cancel</button>
                <button onClick={importBibTeX} disabled={!importPreview.length}
                  style={{padding:'7px 18px',borderRadius:'8px',border:'none',background:importPreview.length?'#6366f1':'rgba(99,102,241,0.3)',color:'#fff',cursor:importPreview.length?'pointer':'default',fontWeight:600,fontSize:'12px'}}>
                  Import {importPreview.length>0?`(${importPreview.length})`:''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SPLIT: LIST + DETAIL ── */}
        <div style={{display:'grid',gridTemplateColumns:sel?'1fr 360px':'1fr',gap:'12px',alignItems:'start'}}>

          {/* Reference list */}
          <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
            {filtered.length===0&&(
              <div style={{padding:'48px',textAlign:'center',color:mut}}>
                <div style={{fontSize:'36px',marginBottom:'8px'}}>📭</div>
                <div style={{fontWeight:600}}>No references match your filters</div>
              </div>
            )}
            {filtered.map(ref=>{
              const cfg=TYPE_CFG[ref.type];
              return(
                <div key={ref.id} onClick={()=>setSelId(ref.id)}
                  style={{padding:'12px 14px',borderRadius:'10px',border:`1px solid ${selId===ref.id?'rgba(99,102,241,0.4)':bdr}`,
                    background:selId===ref.id?'rgba(99,102,241,0.06)':cbg,cursor:'pointer',transition:'all 0.12s'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                    <span style={{fontSize:'16px',flexShrink:0,marginTop:'1px'}}>{cfg.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ref.title}</div>
                      <div style={{fontSize:'11px',color:mut,marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ref.authors}</div>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'4px'}}>
                        <span style={{fontSize:'9px',padding:'1px 6px',borderRadius:'8px',background:`${cfg.color}15`,color:cfg.color}}>{cfg.label}</span>
                        {ref.year&&<span style={{fontSize:'9px',padding:'1px 6px',borderRadius:'8px',background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',color:mut}}>{ref.year}</span>}
                        {ref.journal&&<span style={{fontSize:'9px',padding:'1px 6px',borderRadius:'8px',background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',color:mut}}>{ref.journal}</span>}
                        {ref.tags.slice(0,2).map(t=><span key={t} style={{fontSize:'9px',padding:'1px 6px',borderRadius:'8px',background:'rgba(99,102,241,0.1)',color:'#6366f1'}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{fontSize:'10px',color:mut,whiteSpace:'nowrap',flexShrink:0}}>[{ref.citationKey}]</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {sel&&(
            <div style={{padding:'18px',borderRadius:'14px',background:cbg,border:`1px solid rgba(99,102,241,0.2)`,position:'sticky',top:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                <span style={{fontSize:'20px'}}>{TYPE_CFG[sel.type].icon}</span>
                <div style={{display:'flex',gap:'5px'}}>
                  <button onClick={()=>{setForm({type:sel.type,title:sel.title,authors:sel.authors,year:sel.year,journal:sel.journal||'',volume:sel.volume||'',issue:sel.issue||'',pages:sel.pages||'',publisher:sel.publisher||'',doi:sel.doi||'',url:sel.url||'',abstract:sel.abstract||'',tags:sel.tags,notes:sel.notes,citationKey:sel.citationKey});setPanelTab('add');}} style={{padding:'4px 10px',borderRadius:'7px',border:`1px solid ${bdr}`,background:'transparent',cursor:'pointer',color:mut,fontSize:'11px'}}>✏️ Edit</button>
                  <button onClick={()=>{upd(p=>p.filter(r=>r.id!==sel.id));setSelId(null);}} style={{padding:'4px 10px',borderRadius:'7px',border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.07)',cursor:'pointer',color:'#ef4444',fontSize:'11px'}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:'14px',fontWeight:700,color:txt,marginBottom:'4px',lineHeight:'1.3'}}>{sel.title}</div>
              <div style={{fontSize:'11px',color:mut,marginBottom:'8px'}}>{sel.authors}</div>
              {sel.journal&&<div style={{fontSize:'11px',color:mut,marginBottom:'2px'}}>📖 {sel.journal}{sel.volume?`, ${sel.volume}`:''}{sel.issue?`(${sel.issue})`:''}{sel.pages?`, pp. ${sel.pages}`:''}</div>}
              {sel.year&&<div style={{fontSize:'11px',color:mut,marginBottom:'2px'}}>📅 {sel.year}</div>}
              {sel.doi&&<a href={`https://doi.org/${sel.doi}`} target="_blank" rel="noopener noreferrer" style={{display:'block',fontSize:'11px',color:'#6366f1',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🔗 doi:{sel.doi}</a>}
              {sel.url&&!sel.doi&&<a href={sel.url} target="_blank" rel="noopener noreferrer" style={{display:'block',fontSize:'11px',color:'#6366f1',marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🌐 {sel.url}</a>}
              {sel.abstract&&<div style={{marginTop:'8px',fontSize:'11px',color:mut,lineHeight:'1.5',maxHeight:'80px',overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical'}}>{sel.abstract}</div>}
              {sel.tags.length>0&&<div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginTop:'8px'}}>{sel.tags.map(t=><span key={t} style={{fontSize:'9px',padding:'2px 6px',borderRadius:'8px',background:'rgba(99,102,241,0.1)',color:'#6366f1'}}>{t}</span>)}</div>}

              {/* Citation panel */}
              <div style={{marginTop:'12px',paddingTop:'10px',borderTop:`1px solid ${bdr}`}}>
                <div style={{fontSize:'11px',fontWeight:600,color:txt,marginBottom:'6px'}}>Cite As:</div>
                <div style={{display:'flex',gap:'4px',marginBottom:'8px'}}>
                  {(['apa','mla','bibtex'] as const).map(f=>(
                    <button key={f} onClick={()=>setCiteFmt(f)}
                      style={{padding:'3px 8px',borderRadius:'6px',border:`1px solid ${citeFmt===f?'#6366f1':bdr}`,
                        background:citeFmt===f?'rgba(99,102,241,0.12)':'transparent',
                        color:citeFmt===f?'#6366f1':mut,fontSize:'10px',cursor:'pointer',fontWeight:citeFmt===f?700:400}}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div style={{padding:'10px',borderRadius:'8px',background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',fontSize:'11px',color:txt,fontFamily:citeFmt==='bibtex'?'monospace':'inherit',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:'140px',overflowY:'auto',lineHeight:'1.5'}}>{citation}</div>
                <button onClick={()=>copyText(citation,'cite')}
                  style={{marginTop:'6px',width:'100%',padding:'6px',borderRadius:'7px',border:`1px solid ${bdr}`,background:'transparent',color:copied==='cite'?'#22c55e':mut,cursor:'pointer',fontSize:'11px',fontWeight:600,transition:'color 0.2s'}}>
                  {copied==='cite'?'✓ Copied!':'📋 Copy Citation'}
                </button>
                <button onClick={()=>copyText(`[@${sel.citationKey}]`,'key')}
                  style={{marginTop:'4px',width:'100%',padding:'6px',borderRadius:'7px',border:`1px solid ${bdr}`,background:'transparent',color:copied==='key'?'#22c55e':mut,cursor:'pointer',fontSize:'11px',transition:'color 0.2s'}}>
                  {copied==='key'?'✓ Copied!':'🔑 Insert Citation Key'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}


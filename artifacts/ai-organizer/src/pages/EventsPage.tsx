/**
 * EventsPage — /events  (self-contained, localStorage only)
 */
import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageShell } from '../components/layout/PageShell';

type EType = 'webinar'|'workshop'|'conference'|'meetup'|'hackathon'|'networking';
type EMode = 'online'|'in-person'|'hybrid';
interface Ev { id:string;title:string;description:string;type:EType;mode:EMode;date:string;time:string;location:string;organizer:string;tags:string[];maxAttendees:number;attendees:string[];rsvped:boolean; }
interface Grp { id:string;name:string;description:string;icon:string;members:number;topic:string;joined:boolean; }

const ET:Record<EType,{label:string;icon:string;color:string}>={webinar:{label:'Webinar',icon:'🖥️',color:'#3b82f6'},workshop:{label:'Workshop',icon:'🔧',color:'#8b5cf6'},conference:{label:'Conference',icon:'🎙️',color:'#6366f1'},meetup:{label:'Meetup',icon:'☕',color:'#f59e0b'},hackathon:{label:'Hackathon',icon:'💻',color:'#ec4899'},networking:{label:'Networking',icon:'🤝',color:'#22c55e'}};
const S_EV:Ev[]=[
  {id:'e1',title:'AI in Academic Research — Live Panel',description:'Leading AI researchers discuss how ML transforms academic workflows, peer review, and scientific discovery.',type:'webinar',mode:'online',date:'2025-02-15',time:'18:00',location:'Zoom',organizer:'Think!Hub',tags:['AI','Research'],maxAttendees:500,attendees:['Alice','Bob','Carol'],rsvped:false},
  {id:'e2',title:'Open Source Research Tools Workshop',description:'Hands-on workshop covering Zotero, LaTeX, Git for researchers, and collaborative writing.',type:'workshop',mode:'hybrid',date:'2025-02-22',time:'10:00',location:'Athens Tech Hub / Zoom',organizer:'Dr. Nikos Stavros',tags:['Open Source','Tools'],maxAttendees:50,attendees:['Dave','Eve'],rsvped:false},
  {id:'e3',title:'Mediterranean Startup Summit 2025',description:'Annual gathering of 500+ founders, investors, and researchers.',type:'conference',mode:'in-person',date:'2025-03-08',time:'09:00',location:'Thessaloniki Convention Center',organizer:'StartupMed',tags:['Startup','Investment'],maxAttendees:500,attendees:['Frank','Grace'],rsvped:false},
  {id:'e4',title:'PhD Researchers Networking Night',description:'Monthly informal gathering for PhD students and early-career researchers.',type:'networking',mode:'in-person',date:'2025-02-10',time:'19:00',location:'Café Episteme, Athens',organizer:'GR Researchers Network',tags:['PhD','Social'],maxAttendees:40,attendees:['Iris','Jack'],rsvped:false},
  {id:'e5',title:'Climate Data Science Hackathon',description:'48-hour hackathon to build open tools for climate data analysis.',type:'hackathon',mode:'hybrid',date:'2025-03-15',time:'09:00',location:'University of Patras / Online',organizer:'ClimateHub',tags:['Climate','Hackathon'],maxAttendees:100,attendees:['Karen'],rsvped:false},
  {id:'e6',title:'Research Methodology Meetup',description:'Monthly meetup for researchers to discuss methodology challenges and reproducibility.',type:'meetup',mode:'online',date:'2025-02-18',time:'17:00',location:'Google Meet',organizer:'Open Research Community',tags:['Methodology','Stats'],maxAttendees:30,attendees:['Leo','Mia'],rsvped:false},
];
const S_GR:Grp[]=[
  {id:'g1',name:'ML & AI Researchers',description:'Community for researchers applying machine learning.',icon:'🧠',members:1240,topic:'Machine Learning',joined:false},
  {id:'g2',name:'Open Science Advocates',description:'Promoting open-access publishing and reproducible research.',icon:'🔓',members:876,topic:'Open Science',joined:false},
  {id:'g3',name:'PhD Survivors',description:'Support and advice for PhD students navigating academia.',icon:'🎓',members:2100,topic:'PhD & Academia',joined:false},
  {id:'g4',name:'Climate Research Network',description:'Interdisciplinary group for climate scientists and policy researchers.',icon:'🌍',members:654,topic:'Climate Science',joined:false},
  {id:'g5',name:'Tech Founders & Researchers',description:'Where academic research meets startup building.',icon:'🚀',members:987,topic:'Startups',joined:false},
  {id:'g6',name:'Data Visualization Lab',description:'Sharing tools and inspiration for scientific data visualization.',icon:'📊',members:543,topic:'Data Viz',joined:false},
];

const SK_E='events_v1',SK_G='groups_v1';
function loadE():Ev[]{try{const r=localStorage.getItem(SK_E);if(r)return JSON.parse(r);}catch{}return S_EV;}
function saveE(d:Ev[]){try{localStorage.setItem(SK_E,JSON.stringify(d));}catch{}}
function loadG():Grp[]{try{const r=localStorage.getItem(SK_G);if(r)return JSON.parse(r);}catch{}return S_GR;}
function saveG(d:Grp[]){try{localStorage.setItem(SK_G,JSON.stringify(d));}catch{}}
function fmtD(d:string){try{return new Date(d).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'});}catch{return d;}}
function dUntil(d:string){const diff=Math.ceil((new Date(d).getTime()-Date.now())/86400000);return diff<0?'Past':diff===0?'Today':diff===1?'Tomorrow':`In ${diff}d`;}

export default function EventsPage(){
  const{isDark}=useTheme();
  const isMobile=useIsMobile();
  const[events,setEvents]=useState<Ev[]>(loadE);
  const[groups,setGroups]=useState<Grp[]>(loadG);
  const[tab,setTab]=useState<'events'|'groups'>('events');
  const[typeF,setTypeF]=useState<EType|'all'>('all');
  const[modeF,setModeF]=useState<EMode|'all'>('all');
  const[search,setSearch]=useState('');
  const[rsvpOnly,setRsvpOnly]=useState(false);
  const[sel,setSel]=useState<Ev|null>(null);
  const[showCreate,setShowCreate]=useState(false);
  const[showCreateGroup,setShowCreateGroup]=useState(false);
  const[form,setForm]=useState({title:'',description:'',type:'meetup' as EType,mode:'online' as EMode,date:'',time:'18:00',location:'',tags:''});
  const[groupForm,setGroupForm]=useState({name:'',description:'',icon:'🌟',topic:''});

  const bdr='hsl(var(--border))',txt='hsl(var(--foreground))',mut='hsl(var(--muted-foreground))',cbg='hsl(var(--card))';
  const iSt:React.CSSProperties={width:'100%',padding:'8px 12px',borderRadius:'10px',fontSize:'13px',border:`1px solid ${bdr}`,background:'hsl(var(--muted) / 0.4)',color:txt,outline:'none',boxSizing:'border-box'};

  const filtered=useMemo(()=>{
    let l=events;
    if(search.trim()){const q=search.toLowerCase();l=l.filter(e=>e.title.toLowerCase().includes(q)||e.tags.some(t=>t.toLowerCase().includes(q)));}
    if(typeF!=='all')l=l.filter(e=>e.type===typeF);
    if(modeF!=='all')l=l.filter(e=>e.mode===modeF);
    if(rsvpOnly)l=l.filter(e=>e.rsvped);
    return l.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());
  },[events,search,typeF,modeF,rsvpOnly]);

  const toggleRsvp=(id:string)=>{
    setEvents(p=>{const n=p.map(e=>{if(e.id!==id)return e;const rsvped=!e.rsvped;return{...e,rsvped,attendees:rsvped?[...e.attendees,'You']:e.attendees.filter(a=>a!=='You')};});saveE(n);return n;});
    setSel(prev=>prev?.id===id?{...prev,rsvped:!prev.rsvped,attendees:prev.rsvped?prev.attendees.filter(a=>a!=='You'):[...prev.attendees,'You']}:prev);
  };

  const toggleJoin=(id:string)=>setGroups(p=>{const n=p.map(g=>g.id===id?{...g,joined:!g.joined,members:g.joined?g.members-1:g.members+1}:g);saveG(n);return n;});

  const handleCreate=()=>{
    if(!form.title.trim()||!form.date)return;
    const e:Ev={...form,id:`e-${Date.now()}`,tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean),maxAttendees:100,attendees:[],rsvped:false,organizer:'You'};
    setEvents(p=>{const n=[e,...p];saveE(n);return n;});
    setSel(e);setShowCreate(false);
    setForm({title:'',description:'',type:'meetup',mode:'online',date:'',time:'18:00',location:'',tags:''});
  };

  const handleCreateGroup=()=>{
    if(!groupForm.name.trim())return;
    const g:Grp={id:`g-${Date.now()}`,name:groupForm.name,description:groupForm.description,icon:groupForm.icon||'🌟',members:1,topic:groupForm.topic||'General',joined:true};
    setGroups(p=>{const n=[g,...p];saveG(n);return n;});
    setShowCreateGroup(false);
    setGroupForm({name:'',description:'',icon:'🌟',topic:''});
  };

  const TB=(k:typeof tab,lbl:string)=>(
    <button onClick={()=>setTab(k)} style={{padding:'8px 18px',borderRadius:'10px',fontSize:'13px',fontWeight:tab===k?700:400,cursor:'pointer',border:`1px solid ${tab===k?'hsl(var(--primary) / 0.45)':bdr}`,background:tab===k?'hsl(var(--primary) / 0.1)':'transparent',color:tab===k?'hsl(var(--primary))':mut}}>{lbl}</button>
  );

  const modeColor=(m:EMode)=>m==='online'?'#3b82f6':m==='in-person'?'#22c55e':'#f59e0b';
  const modeIcon=(m:EMode)=>m==='online'?'🌐':m==='in-person'?'📍':'🔀';
  const dueColor=(due:string)=>due==='Past'?'#6b7280':due==='Today'?'#ef4444':due==='Tomorrow'?'#f59e0b':'#22c55e';

  return(
    <PageShell>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:isMobile?'16px 12px':'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'22px',flexWrap:'wrap',gap:'12px'}}>
          <div><h1 style={{margin:0,fontSize:'24px',fontWeight:800,color:txt}}>📅 Events &amp; Groups</h1><p style={{margin:'4px 0 0',fontSize:'13px',color:mut}}>Discover events, workshops, conferences and communities</p></div>
          <div style={{display:'flex',gap:'8px'}}>
            {tab==='events'&&<button onClick={()=>setShowCreate(true)} style={{padding:'9px 20px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>+ Create Event</button>}
            {tab==='groups'&&<button onClick={()=>setShowCreateGroup(true)} style={{padding:'9px 20px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>+ Create Group</button>}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'22px'}}>{TB('events',`Events (${events.length})`)}{TB('groups',`Groups (${groups.length})`)}</div>

        {/* Upcoming Events Countdown Strip — reverse flow from SciConnect */}
        {tab==='events'&&(()=>{
          const upcoming=events.filter(e=>dUntil(e.date)!=='Past').sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).slice(0,3);
          if(upcoming.length===0)return null;
          return(
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':`repeat(${Math.min(upcoming.length,3)},1fr)`,gap:'10px',marginBottom:'18px'}}>
              {upcoming.map(ev=>{
                const cfg=ET[ev.type];const due=dUntil(ev.date);
                const daysNum=Math.ceil((new Date(ev.date).getTime()-Date.now())/86400000);
                return(
                  <div key={ev.id} onClick={()=>{setTab('events');setSel(ev);}} style={{padding:'14px 16px',borderRadius:'12px',cursor:'pointer',background:isDark?'rgba(99,102,241,0.06)':'rgba(99,102,241,0.04)',border:`1px solid rgba(99,102,241,0.18)`,display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:42,height:42,borderRadius:'10px',background:`${cfg.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{cfg.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</div>
                      <div style={{fontSize:'10px',color:mut,marginTop:'2px'}}>{fmtD(ev.date)} · {ev.location}</div>
                    </div>
                    <div style={{textAlign:'center',flexShrink:0}}>
                      <div style={{fontSize:'18px',fontWeight:800,color:daysNum<=1?'#ef4444':daysNum<=7?'#f59e0b':'#22c55e',lineHeight:1}}>{daysNum<=0?'⏰':daysNum}</div>
                      <div style={{fontSize:'9px',fontWeight:600,color:mut,textTransform:'uppercase',letterSpacing:'0.03em'}}>{due}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {tab==='events'&&(
          <div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'16px',padding:'12px 16px',background:'hsl(var(--muted) / 0.3)',borderRadius:'10px',border:`1px solid ${bdr}`}}>
              <div style={{position:'relative',flex:'1 1 180px'}}>
                <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',opacity:0.4}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events..." style={{...iSt,paddingLeft:'30px'}}/>
              </div>
              <select value={typeF} onChange={e=>setTypeF(e.target.value as any)} style={{...iSt,width:'auto',cursor:'pointer'}}>
                <option value="all">All Types</option>
                {(Object.keys(ET) as EType[]).map(k=><option key={k} value={k}>{ET[k].icon} {ET[k].label}</option>)}
              </select>
              <select value={modeF} onChange={e=>setModeF(e.target.value as any)} style={{...iSt,width:'auto',cursor:'pointer'}}>
                <option value="all">All Modes</option>
                <option value="online">🌐 Online</option>
                <option value="in-person">📍 In-person</option>
                <option value="hybrid">🔀 Hybrid</option>
              </select>
              <label style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:mut,cursor:'pointer',userSelect:'none'}}>
                <input type="checkbox" checked={rsvpOnly} onChange={e=>setRsvpOnly(e.target.checked)} style={{accentColor:'#6366f1'}}/> My RSVPs
              </label>
              <span style={{fontSize:'12px',color:mut,marginLeft:'auto'}}>{filtered.length} event{filtered.length!==1?'s':''}</span>
            </div>

            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':sel?'300px 1fr':'repeat(auto-fill,minmax(300px,1fr))',gap:'16px',alignItems:'start'}}>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:sel?'70vh':'none',overflowY:sel?'auto':'visible'}}>
                {filtered.length===0&&<div style={{padding:'40px',textAlign:'center',color:mut}}><div style={{fontSize:'32px',marginBottom:'10px'}}>📅</div><div style={{fontWeight:600}}>No events found</div></div>}
                {filtered.map(ev=>{
                  const cfg=ET[ev.type];const isSel=sel?.id===ev.id;const due=dUntil(ev.date);
                  return(
                    <div key={ev.id} onClick={()=>setSel(isSel?null:ev)} style={{padding:'14px',borderRadius:'12px',cursor:'pointer',borderTop:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`,borderRight:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`,borderBottom:`1px solid ${isSel?'rgba(99,102,241,0.45)':bdr}`,background:isSel?(isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)'):cbg,opacity:due==='Past'?0.6:1,borderLeft:`3px solid ${isSel?'#6366f1':'transparent'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'13px',fontWeight:600,color:txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</div>
                          <div style={{fontSize:'11px',color:mut,marginTop:'2px'}}>📅 {fmtD(ev.date)} · {ev.location}</div>
                        </div>
                        <span style={{fontSize:'10px',fontWeight:700,padding:'3px 7px',borderRadius:'8px',background:`${dueColor(due)}15`,color:dueColor(due),whiteSpace:'nowrap',flexShrink:0}}>{due}</span>
                      </div>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                        <span style={{padding:'2px 7px',borderRadius:'10px',fontSize:'10px',fontWeight:600,background:`${cfg.color}18`,color:cfg.color}}>{cfg.icon} {cfg.label}</span>
                        <span style={{padding:'2px 7px',borderRadius:'10px',fontSize:'10px',background:`${modeColor(ev.mode)}15`,color:modeColor(ev.mode)}}>{modeIcon(ev.mode)} {ev.mode}</span>
                        {ev.rsvped&&<span style={{padding:'2px 7px',borderRadius:'10px',fontSize:'10px',background:'rgba(99,102,241,0.1)',color:'#6366f1'}}>✓ RSVP</span>}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'11px',color:mut}}>👥 {ev.attendees.length}/{ev.maxAttendees}</span>
                        {due!=='Past'&&<button onClick={e=>{e.stopPropagation();toggleRsvp(ev.id);}} style={{padding:'5px 12px',borderRadius:'7px',fontSize:'11px',fontWeight:600,cursor:'pointer',border:`1px solid ${ev.rsvped?'rgba(99,102,241,0.35)':bdr}`,background:ev.rsvped?'rgba(99,102,241,0.12)':'transparent',color:ev.rsvped?(isDark?'#a5b4fc':'#5b5bd6'):mut}}>{ev.rsvped?'✓ Going':'RSVP'}</button>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {sel&&(
                <div style={{background:cbg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'24px',position:'sticky',top:'24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:'12px',marginBottom:'16px'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>
                        <span style={{padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:600,background:`${ET[sel.type].color}18`,color:ET[sel.type].color}}>{ET[sel.type].icon} {ET[sel.type].label}</span>
                        <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',background:`${modeColor(sel.mode)}15`,color:modeColor(sel.mode)}}>{modeIcon(sel.mode)} {sel.mode}</span>
                        {sel.rsvped&&<span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',background:'rgba(99,102,241,0.1)',color:'#6366f1'}}>✓ Going</span>}
                      </div>
                      <h2 style={{margin:'0 0 6px',fontSize:'18px',fontWeight:700,color:txt}}>{sel.title}</h2>
                      <div style={{fontSize:'13px',color:mut}}>By <strong style={{color:txt}}>{sel.organizer}</strong></div>
                    </div>
                    <button onClick={()=>setSel(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:mut,padding:0,flexShrink:0}}>×</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',padding:'12px',background:'hsl(var(--muted) / 0.3)',borderRadius:'10px',border:`1px solid ${bdr}`,marginBottom:'16px'}}>
                    {([['📅','Date',fmtD(sel.date)],['⏰','Time',sel.time],['📍','Location',sel.location],['👥','Capacity',`${sel.attendees.length}/${sel.maxAttendees}`]] as [string,string,string][]).map(([ic,lb,vl])=>(
                      <div key={lb}><div style={{fontSize:'10px',fontWeight:600,color:mut,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:'2px'}}>{ic} {lb}</div><div style={{fontSize:'13px',color:txt,fontWeight:500}}>{vl}</div></div>
                    ))}
                  </div>
                  <p style={{margin:'0 0 14px',fontSize:'14px',color:txt,lineHeight:1.7,opacity:0.85}}>{sel.description}</p>
                  {sel.tags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'14px'}}>{sel.tags.map(tag=><span key={tag} style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',background:isDark?'rgba(255,255,255,0.06)':'rgba(47,41,65,0.06)',border:`1px solid ${bdr}`,color:mut}}>#{tag}</span>)}</div>}
                  {sel.attendees.length>0&&<div style={{marginBottom:'14px'}}><div style={{fontSize:'12px',fontWeight:600,color:mut,marginBottom:'7px'}}>👥 Attendees ({sel.attendees.length})</div><div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{sel.attendees.slice(0,15).map(a=><span key={a} style={{padding:'3px 8px',borderRadius:'10px',fontSize:'11px',background:isDark?'rgba(255,255,255,0.06)':'rgba(47,41,65,0.04)',border:`1px solid ${bdr}`,color:txt}}>{a}</span>)}{sel.attendees.length>15&&<span style={{fontSize:'11px',color:mut}}>+{sel.attendees.length-15}</span>}</div></div>}
                  {dUntil(sel.date)!=='Past'&&<button onClick={()=>toggleRsvp(sel.id)} style={{width:'100%',padding:'11px',borderRadius:'10px',border:'none',background:sel.rsvped?'rgba(99,102,241,0.15)':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:sel.rsvped?(isDark?'#a5b4fc':'#5b5bd6'):'#fff',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>{sel.rsvped?'✓ Going — Cancel RSVP':'📅 RSVP to this event'}</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {tab==='groups'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:'16px'}}>
            {groups.map(g=>(
              <div key={g.id} style={{background:cbg,border:`1px solid ${g.joined?'hsl(var(--primary) / 0.35)':bdr}`,borderRadius:'10px',padding:'18px',display:'flex',flexDirection:'column',gap:'10px'}}>
                <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                  <div style={{width:44,height:44,borderRadius:'12px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{g.icon}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:'14px',color:txt,marginBottom:'2px'}}>{g.name}</div><div style={{fontSize:'11px',color:mut}}>👥 {g.members.toLocaleString()} · {g.topic}</div></div>
                  {g.joined&&<span style={{fontSize:'11px',color:'#22c55e',fontWeight:600}}>✓</span>}
                </div>
                <p style={{margin:0,fontSize:'12px',color:mut,lineHeight:1.6,flex:1}}>{g.description}</p>
                <button onClick={()=>toggleJoin(g.id)} style={{padding:'8px',borderRadius:'8px',border:`1px solid ${g.joined?'rgba(99,102,241,0.35)':bdr}`,background:g.joined?'rgba(99,102,241,0.1)':'transparent',color:g.joined?(isDark?'#a5b4fc':'#5b5bd6'):mut,fontWeight:600,fontSize:'12px',cursor:'pointer'}}>{g.joined?'✓ Leave Group':'Join Group'}</button>
              </div>
            ))}
          </div>
        )}

        {showCreateGroup&&(
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={e=>{if(e.target===e.currentTarget)setShowCreateGroup(false);}}>
            <div style={{width:'100%',maxWidth:'460px',background:'hsl(var(--card))',borderRadius:'10px',border:`1px solid ${bdr}`,boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{margin:0,fontSize:'16px',fontWeight:700,color:txt}}>+ Create Group</h2>
                <button onClick={()=>setShowCreateGroup(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:mut}}>×</button>
              </div>
              <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:'12px'}}>
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <input value={groupForm.icon} onChange={e=>setGroupForm(f=>({...f,icon:e.target.value}))} placeholder="Icon (emoji)" style={{...iSt,width:'70px',textAlign:'center',fontSize:'20px'}}/>
                  <input value={groupForm.name} onChange={e=>setGroupForm(f=>({...f,name:e.target.value}))} placeholder="Group name *" style={{...iSt,flex:1}}/>
                </div>
                <textarea value={groupForm.description} onChange={e=>setGroupForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3} style={{...iSt,resize:'vertical'}}/>
                <input value={groupForm.topic} onChange={e=>setGroupForm(f=>({...f,topic:e.target.value}))} placeholder="Topic (e.g. Machine Learning, Open Science)" style={iSt}/>
                <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
                  <button onClick={()=>setShowCreateGroup(false)} style={{padding:'8px 18px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,fontSize:'13px',cursor:'pointer'}}>Cancel</button>
                  <button onClick={handleCreateGroup} disabled={!groupForm.name.trim()} style={{padding:'8px 22px',borderRadius:'8px',border:'none',background:groupForm.name?'linear-gradient(135deg,#6366f1,#8b5cf6)':bdr,color:groupForm.name?'#fff':mut,fontSize:'13px',fontWeight:600,cursor:groupForm.name?'pointer':'not-allowed'}}>Create</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreate&&(
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false);}}>
            <div style={{width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto',background:'hsl(var(--card))',borderRadius:'10px',border:`1px solid ${bdr}`,boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{margin:0,fontSize:'16px',fontWeight:700,color:txt}}>+ Create Event</h2>
                <button onClick={()=>setShowCreate(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:mut}}>×</button>
              </div>
              <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:'12px'}}>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event title *" style={iSt}/>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3} style={{...iSt,resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px'}}>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as EType}))} style={{...iSt,cursor:'pointer'}}>
                    {(Object.keys(ET) as EType[]).map(k=><option key={k} value={k}>{ET[k].icon} {ET[k].label}</option>)}
                  </select>
                  <select value={form.mode} onChange={e=>setForm(f=>({...f,mode:e.target.value as EMode}))} style={{...iSt,cursor:'pointer'}}>
                    <option value="online">🌐 Online</option>
                    <option value="in-person">📍 In-person</option>
                    <option value="hybrid">🔀 Hybrid</option>
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px'}}>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={iSt}/>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={iSt}/>
                </div>
                <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location / Link" style={iSt}/>
                <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Tags (comma-separated)" style={iSt}/>
                <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
                  <button onClick={()=>setShowCreate(false)} style={{padding:'8px 18px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,fontSize:'13px',cursor:'pointer'}}>Cancel</button>
                  <button onClick={handleCreate} disabled={!form.title.trim()||!form.date} style={{padding:'8px 22px',borderRadius:'8px',border:'none',background:form.title&&form.date?'linear-gradient(135deg,#6366f1,#8b5cf6)':bdr,color:form.title&&form.date?'#fff':mut,fontSize:'13px',fontWeight:600,cursor:form.title&&form.date?'pointer':'not-allowed'}}>Create</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

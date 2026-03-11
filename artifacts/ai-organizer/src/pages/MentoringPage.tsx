/**
 * MentoringPage — /mentoring  (self-contained, localStorage only)
 */
import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageShell } from '../components/layout/PageShell';

interface Mentor { id:string;name:string;role:string;expertise:string[];bio:string;avatar:string;rating:number;sessionCount:number;availability:string;price:string;topics:string[]; }
interface Session { id:string;mentorId:string;mentorName:string;date:string;time:string;notes:string;status:'upcoming'|'completed'|'cancelled'; }
interface Review { id:string;mentorId:string;author:string;rating:number;text:string;at:number; }

const MENTORS: Mentor[] = [
  { id:'m1',name:'Dr. Elena Vasiliou',role:'Senior ML Researcher @ Google',expertise:['Machine Learning','NLP'],bio:'10+ yrs ML research. 40+ papers. Helping early-career researchers navigate academia & industry.',avatar:'🧠',rating:4.9,sessionCount:87,availability:'Mon/Wed/Fri',price:'Free',topics:['Career','Research design','ML fundamentals'] },
  { id:'m2',name:'Kostas Papadimitriou',role:'CTO & Serial Entrepreneur',expertise:['Product Management','Startups'],bio:'3 startups, ex-Google PM. Helping technical founders build products people want.',avatar:'🚀',rating:4.7,sessionCount:143,availability:'Tue/Thu',price:'€30/hr',topics:['Startup strategy','Technical leadership','Product-market fit'] },
  { id:'m3',name:'Prof. Maria Nikolaou',role:'Professor of Data Science',expertise:['Statistics','Academic Writing'],bio:'Head of Data Science at U. Athens. Helping PhD students with methodology & publication.',avatar:'📊',rating:4.8,sessionCount:62,availability:'Flexible',price:'Free',topics:['PhD guidance','Statistics','Grant writing'] },
  { id:'m4',name:'Dimitris Christodoulou',role:'Angel Investor & Advisor',expertise:['Investment','HealthTech'],bio:'20+ investments in tech/health. Former banker helping founders navigate fundraising.',avatar:'💰',rating:4.6,sessionCount:55,availability:'Weekends',price:'€50/hr',topics:['Fundraising','Pitch deck','Due diligence'] },
  { id:'m5',name:'Anna Theodoridou',role:'UX Lead @ Meta',expertise:['UX/UI Design','Design Systems'],bio:'10 yrs designing at scale. Passionate about accessible design & career growth.',avatar:'🎨',rating:4.9,sessionCount:91,availability:'Mon/Tue/Thu',price:'€25/hr',topics:['Portfolio review','UX process','Career growth'] },
];

const SK_S='mentoring_sessions_v1', SK_R='mentoring_reviews_v1';
function loadS(): Session[] { try{const r=localStorage.getItem(SK_S);if(r)return JSON.parse(r);}catch{}return []; }
function saveS(d:Session[]) { try{localStorage.setItem(SK_S,JSON.stringify(d));}catch{} }
function loadR(): Review[] { try{const r=localStorage.getItem(SK_R);if(r)return JSON.parse(r);}catch{}return []; }
function saveR(d:Review[]) { try{localStorage.setItem(SK_R,JSON.stringify(d));}catch{} }

function Stars({n,size=12}:{n:number;size?:number}) {
  return <span style={{fontSize:size}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.round(n)?'#f59e0b':'rgba(245,158,11,0.2)'}}>★</span>)}</span>;
}

// Expertise match score — reverse flow from SciConnect Mentorship.tsx
const MY_INTERESTS = ['Machine Learning','NLP','Research design','Statistics','Product-market fit'];
function computeMatchScore(mentor: Mentor): number {
  const allMentorTopics = [...mentor.expertise, ...mentor.topics].map(t => t.toLowerCase());
  const mySet = new Set(MY_INTERESTS.map(i => i.toLowerCase()));
  const overlap = allMentorTopics.filter(t => mySet.has(t)).length;
  let score = Math.min(50, overlap * 18);
  if (mentor.rating >= 4.8) score += 20;
  else if (mentor.rating >= 4.5) score += 10;
  if (mentor.price === 'Free') score += 15;
  if (mentor.sessionCount >= 80) score += 15;
  else if (mentor.sessionCount >= 50) score += 8;
  return Math.min(100, score);
}
function MatchBadge({score}:{score:number}) {
  const color = score >= 80 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#6b7280';
  return (
    <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'8px',background:`${color}15`,border:`1px solid ${color}30`,flexShrink:0}} title={`${score}% expertise match`}>
      <span style={{fontSize:'11px',fontWeight:800,color}}>{score}%</span>
      <span style={{fontSize:'9px',color,fontWeight:600}}>match</span>
    </div>
  );
}

export default function MentoringPage() {
  const {isDark}=useTheme();
  const isMobile=useIsMobile();
  const [sessions,setSessions]=useState<Session[]>(loadS);
  const [reviews,setReviews]=useState<Review[]>(loadR);
  const [tab,setTab]=useState<'find'|'sessions'|'become'>('find');
  const [search,setSearch]=useState('');
  const [topicF,setTopicF]=useState('all');
  const [selM,setSelM]=useState<Mentor|null>(null);
  const [bForm,setBForm]=useState({date:'',time:'09:00',notes:''});
  const [booked,setBooked]=useState(false);
  const [revForm,setRevForm]=useState({mentorId:'',rating:5,text:''});
  const [showRev,setShowRev]=useState<string|null>(null);
  const [editNotes,setEditNotes]=useState<string|null>(null);
  const [noteDraft,setNoteDraft]=useState('');

  const bdr='hsl(var(--border))', txt='hsl(var(--foreground))', mut='hsl(var(--muted-foreground))', cbg='hsl(var(--card))';
  const iSt:React.CSSProperties={width:'100%',padding:'8px 12px',borderRadius:'10px',fontSize:'13px',border:`1px solid ${bdr}`,background:'hsl(var(--muted) / 0.4)',color:txt,outline:'none',boxSizing:'border-box'};
  const colors = { bgSecondary: 'hsl(var(--card))' };

  const allTopics=useMemo(()=>{const s=new Set<string>();MENTORS.forEach(m=>m.topics.forEach(tp=>s.add(tp)));return['all',...Array.from(s).sort()];},[]);

  const filtered=useMemo(()=>{
    let l=MENTORS;
    if(search.trim()){const q=search.toLowerCase();l=l.filter(m=>m.name.toLowerCase().includes(q)||m.expertise.some(e=>e.toLowerCase().includes(q))||m.topics.some(tp=>tp.toLowerCase().includes(q)));}
    if(topicF!=='all')l=l.filter(m=>m.topics.includes(topicF));
    return l;
  },[search,topicF]);

  const bookSession=()=>{
    if(!selM||!bForm.date)return;
    const s:Session={id:`s-${Date.now()}`,mentorId:selM.id,mentorName:selM.name,date:bForm.date,time:bForm.time,notes:bForm.notes,status:'upcoming'};
    setSessions(p=>{const n=[...p,s];saveS(n);return n;});
    setBooked(true);
    setTimeout(()=>{setBooked(false);setSelM(null);setBForm({date:'',time:'09:00',notes:''});},2000);
  };

  const addReview=()=>{
    if(!revForm.mentorId||!revForm.text.trim())return;
    const r:Review={id:`r-${Date.now()}`,mentorId:revForm.mentorId,author:'You',rating:revForm.rating,text:revForm.text,at:Date.now()};
    setReviews(p=>{const n=[...p,r];saveR(n);return n;});
    setShowRev(null);setRevForm({mentorId:'',rating:5,text:''});
  };

  const tabBtn=(k:typeof tab,lbl:string)=>(
    <button onClick={()=>setTab(k)} style={{padding:'8px 18px',borderRadius:'10px',fontSize:'13px',fontWeight:tab===k?700:400,cursor:'pointer',border:`1px solid ${tab===k?'hsl(var(--primary) / 0.45)':bdr}`,background:tab===k?'hsl(var(--primary) / 0.1)':'transparent',color:tab===k?'hsl(var(--primary))':mut}}>{lbl}</button>
  );

  return (
    <PageShell>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:isMobile?'16px 12px':'24px'}}>
        <div style={{marginBottom:'22px'}}>
          <h1 style={{margin:0,fontSize:'24px',fontWeight:800,color:txt}}>🎓 Mentoring</h1>
          <p style={{margin:'4px 0 0',fontSize:'13px',color:mut}}>Connect with experienced mentors in your field</p>
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>
          {tabBtn('find','Find a Mentor')}
          {tabBtn('sessions',`My Sessions${sessions.length>0?` (${sessions.length})`:''}`)}
          {tabBtn('become','Become a Mentor')}
        </div>

        {/* FIND */}
        {tab==='find'&&(
          <div>
            <div style={{display:'flex',gap:'8px',marginBottom:'18px',flexWrap:'wrap'}}>
              <div style={{position:'relative',flex:'1 1 200px'}}>
                <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',opacity:0.4}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mentors..." style={{...iSt,paddingLeft:'30px'}}/>
              </div>
              <select value={topicF} onChange={e=>setTopicF(e.target.value)} style={{...iSt,width:'auto',cursor:'pointer'}}>
                {allTopics.map(tp=><option key={tp} value={tp}>{tp==='all'?'All Topics':tp}</option>)}
              </select>
              <span style={{fontSize:'12px',color:mut,alignSelf:'center'}}>{filtered.length} mentor{filtered.length!==1?'s':''}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
              {filtered.map(m=>{
                const mRevs=reviews.filter(r=>r.mentorId===m.id);
                const avgRating=mRevs.length>0?mRevs.reduce((a,r)=>a+r.rating,0)/mRevs.length:m.rating;
                return (
                  <div key={m.id} style={{background:cbg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'18px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                      <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{m.avatar}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'14px',color:txt}}>{m.name}</div>
                        <div style={{fontSize:'11px',color:mut,marginBottom:'4px'}}>{m.role}</div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <Stars n={avgRating}/>
                          <span style={{fontSize:'11px',color:mut}}>{avgRating.toFixed(1)} ({mRevs.length>0?mRevs.length:m.sessionCount} sessions)</span>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px',flexShrink:0}}>
                        <MatchBadge score={computeMatchScore(m)}/>
                        <span style={{fontSize:'12px',fontWeight:600,color:m.price==='Free'?'#22c55e':txt}}>{m.price}</span>
                      </div>
                    </div>
                    <p style={{margin:0,fontSize:'12px',color:mut,lineHeight:1.6}}>{m.bio}</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                      {m.expertise.map(e=><span key={e} style={{padding:'3px 8px',borderRadius:'10px',fontSize:'10px',background:'hsl(var(--primary) / 0.1)',border:'1px solid hsl(var(--primary) / 0.2)',color:'hsl(var(--primary))'}}>{e}</span>)}
                    </div>
                    <div style={{fontSize:'11px',color:mut}}>📅 {m.availability}</div>
                    <div style={{display:'flex',gap:'6px',marginTop:'4px'}}>
                      <button onClick={()=>{setSelM(m);}} style={{flex:1,padding:'8px',borderRadius:'8px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Book Session</button>
                      <button onClick={()=>{setShowRev(m.id);setRevForm(f=>({...f,mentorId:m.id}));}} style={{padding:'8px 12px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,fontSize:'12px',cursor:'pointer'}}>⭐ Review</button>
                    </div>
                    {reviews.filter(r=>r.mentorId===m.id).slice(-2).map(r=>(
                      <div key={r.id} style={{padding:'8px 10px',borderRadius:'10px',background:'hsl(var(--muted) / 0.3)',border:`1px solid ${bdr}`}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}><Stars n={r.rating} size={10}/><span style={{fontSize:'10px',color:mut}}>{r.author}</span></div>
                        <p style={{margin:0,fontSize:'11px',color:txt,opacity:0.8}}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MY SESSIONS */}
        {tab==='sessions'&&(
          <div>
            {sessions.length===0?(
              <div style={{padding:'60px',textAlign:'center',color:mut}}>
                <div style={{fontSize:'40px',marginBottom:'12px'}}>📅</div>
                <div style={{fontWeight:600,marginBottom:'6px'}}>No sessions yet</div>
                <button onClick={()=>setTab('find')} style={{padding:'9px 20px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Find a Mentor</button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {sessions.map(s=>{
                  const statusColor=s.status==='upcoming'?'#22c55e':s.status==='completed'?'#6366f1':'#ef4444';
                  return (
                    <div key={s.id} style={{background:cbg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'16px 20px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px',flexWrap:'wrap'}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:'14px',color:txt,marginBottom:'4px'}}>{s.mentorName}</div>
                          <div style={{fontSize:'12px',color:mut}}>📅 {s.date} at {s.time}</div>
                        </div>
                        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                          <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:`${statusColor}15`,color:statusColor}}>{s.status}</span>
                          <select value={s.status} onChange={e=>{const st=e.target.value as Session['status'];setSessions(p=>{const n=p.map(x=>x.id===s.id?{...x,status:st}:x);saveS(n);return n;});}} style={{...iSt,width:'auto',fontSize:'11px',padding:'4px 8px',cursor:'pointer'}}>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button onClick={()=>setSessions(p=>{const n=p.filter(x=>x.id!==s.id);saveS(n);return n;})} style={{padding:'4px 8px',borderRadius:'6px',border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',cursor:'pointer',fontSize:'11px'}}>🗑</button>
                        </div>
                      </div>
                      {editNotes===s.id?(
                        <div style={{marginTop:'10px',display:'flex',gap:'6px'}}>
                          <input value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} placeholder="Session notes..." style={{...iSt,flex:1}}/>
                          <button onClick={()=>{setSessions(p=>{const n=p.map(x=>x.id===s.id?{...x,notes:noteDraft}:x);saveS(n);return n;});setEditNotes(null);}} style={{padding:'8px 14px',borderRadius:'8px',border:'none',background:'rgba(99,102,241,0.8)',color:'#fff',fontSize:'12px',cursor:'pointer'}}>Save</button>
                          <button onClick={()=>setEditNotes(null)} style={{padding:'8px 12px',borderRadius:'8px',border:`1px solid ${bdr}`,background:'transparent',color:mut,fontSize:'12px',cursor:'pointer'}}>✕</button>
                        </div>
                      ):(
                        <div style={{marginTop:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
                          {s.notes&&<p style={{margin:0,flex:1,fontSize:'12px',color:mut,fontStyle:'italic'}}>"{s.notes}"</p>}
                          <button onClick={()=>{setEditNotes(s.id);setNoteDraft(s.notes);}} style={{padding:'5px 10px',borderRadius:'7px',border:`1px solid ${bdr}`,background:'transparent',color:mut,fontSize:'11px',cursor:'pointer'}}>✏️ {s.notes?'Edit':'Add notes'}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BECOME */}
        {tab==='become'&&(
          <div style={{maxWidth:'560px',background:cbg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'28px'}}>
            <h2 style={{margin:'0 0 8px',fontSize:'18px',fontWeight:700,color:txt}}>🎓 Become a Mentor</h2>
            <p style={{margin:'0 0 20px',fontSize:'13px',color:mut,lineHeight:1.6}}>Share your expertise with the community. Fill in your profile and we'll feature you in the mentor directory.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {(['Full name *','Current role *','Bio / Background *','Expertise (comma-separated) *','Topics you can cover *','Availability','Price (Free / €per hour)'] as const).map((ph,i)=>
                i===2?<textarea key={ph} placeholder={ph} rows={3} style={{...iSt,resize:'vertical'}}/>:<input key={ph} placeholder={ph} style={iSt}/>
              )}
              <button style={{padding:'10px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>Submit Application</button>
            </div>
          </div>
        )}

        {/* Book Modal */}
        {selM&&(
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={e=>{if(e.target===e.currentTarget)setSelM(null);}}>
            <div style={{width:'100%',maxWidth:'440px',background:colors.bgSecondary,borderRadius:'10px',border:`1px solid ${bdr}`,boxShadow:'0 20px 60px rgba(0,0,0,0.4)',overflow:'hidden'}}>
              <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{margin:0,fontSize:'16px',fontWeight:700,color:txt}}>📅 Book with {selM.name}</h2>
                <button onClick={()=>setSelM(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:mut}}>×</button>
              </div>
              {booked?(
                <div style={{padding:'40px',textAlign:'center'}}>
                  <div style={{fontSize:'40px',marginBottom:'10px'}}>✅</div>
                  <div style={{fontWeight:700,color:txt}}>Session booked!</div>
                </div>
              ):(
                <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px'}}>
                    <div><label style={{fontSize:'12px',color:mut,display:'block',marginBottom:'4px'}}>Date *</label><input type="date" value={bForm.date} onChange={e=>setBForm(f=>({...f,date:e.target.value}))} style={iSt}/></div>
                    <div><label style={{fontSize:'12px',color:mut,display:'block',marginBottom:'4px'}}>Time</label><input type="time" value={bForm.time} onChange={e=>setBForm(f=>({...f,time:e.target.value}))} style={iSt}/></div>
                  </div>
                  <div><label style={{fontSize:'12px',color:mut,display:'block',marginBottom:'4px'}}>What do you want to discuss?</label><textarea value={bForm.notes} onChange={e=>setBForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="Topics, questions, goals..." style={{...iSt,resize:'vertical'}}/></div>
                  <button onClick={bookSession} disabled={!bForm.date} style={{padding:'10px',borderRadius:'10px',border:'none',background:bForm.date?'linear-gradient(135deg,#6366f1,#8b5cf6)':bdr,color:bForm.date?'#fff':mut,fontWeight:700,fontSize:'14px',cursor:bForm.date?'pointer':'not-allowed'}}>Confirm Booking</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showRev&&(
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={e=>{if(e.target===e.currentTarget)setShowRev(null);}}>
            <div style={{width:'100%',maxWidth:'400px',background:colors.bgSecondary,borderRadius:'10px',border:`1px solid ${bdr}`,boxShadow:'0 20px 60px rgba(0,0,0,0.4)',overflow:'hidden'}}>
              <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${bdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{margin:0,fontSize:'16px',fontWeight:700,color:txt}}>⭐ Leave a Review</h2>
                <button onClick={()=>setShowRev(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:mut}}>×</button>
              </div>
              <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:'12px'}}>
                <div>
                  <label style={{fontSize:'12px',color:mut,display:'block',marginBottom:'6px'}}>Rating</label>
                  <div style={{display:'flex',gap:'4px'}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setRevForm(f=>({...f,rating:n}))} style={{background:'none',border:'none',cursor:'pointer',fontSize:'24px',color:n<=revForm.rating?'#f59e0b':'rgba(245,158,11,0.2)',padding:'0 2px'}}>★</button>
                    ))}
                  </div>
                </div>
                <div><label style={{fontSize:'12px',color:mut,display:'block',marginBottom:'4px'}}>Your review *</label><textarea value={revForm.text} onChange={e=>setRevForm(f=>({...f,text:e.target.value}))} rows={3} placeholder="Share your experience..." style={{...iSt,resize:'vertical'}}/></div>
                <button onClick={addReview} disabled={!revForm.text.trim()} style={{padding:'10px',borderRadius:'10px',border:'none',background:revForm.text.trim()?'linear-gradient(135deg,#6366f1,#8b5cf6)':bdr,color:revForm.text.trim()?'#fff':mut,fontWeight:700,fontSize:'14px',cursor:revForm.text.trim()?'pointer':'not-allowed'}}>Submit Review</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

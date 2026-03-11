import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useUserSkills, PROF_COLORS, SUGGESTED_SKILLS, ProfLevel } from "../../context/UserSkillsContext";
import { Wrench, Check, UserPlus, GraduationCap } from "lucide-react";

export function SkillsPanel() {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const {
    skillsProfile, addSkill: ctxAddSkill, removeSkill, setSkillProf,
    setAvailableForCollab, setAvailableAsMentor, setRole,
  } = useUserSkills();

  const [showEdit, setShowEdit] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProf, setNewProf] = useState<ProfLevel>("intermediate");

  const addSkill = (name: string, proficiency: ProfLevel) => {
    if (!name.trim()) return;
    ctxAddSkill(name, proficiency);
    setNewName("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-shadow duration-300 hover:shadow-lg">
      {/* Role input */}
      <div className="mb-3">
        <input
          value={skillsProfile.role}
          onChange={e => setRole(e.target.value)}
          placeholder="Your role (e.g. Researcher, Engineer, Founder…)"
          className="w-full px-3 py-2 rounded-lg text-xs border border-border bg-input text-foreground outline-none
            transition-all duration-200 focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="m-0 text-sm font-bold text-foreground flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          Skills
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer group">
            <input type="checkbox" checked={skillsProfile.availableForCollab}
              onChange={e => setAvailableForCollab(e.target.checked)}
              className="accent-success" />
            <span className={`font-semibold flex items-center gap-1 transition-colors duration-200 ${skillsProfile.availableForCollab ? "text-success" : "text-muted-foreground group-hover:text-foreground"}`}>
              <UserPlus className="w-3 h-3" />
              {skillsProfile.availableForCollab ? "Open to collab" : "Not available"}
            </span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer group">
            <input type="checkbox" checked={skillsProfile.availableAsMentor}
              onChange={e => setAvailableAsMentor(e.target.checked)}
              className="accent-primary" />
            <span className={`font-semibold flex items-center gap-1 transition-colors duration-200 ${skillsProfile.availableAsMentor ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
              <GraduationCap className="w-3 h-3" />
              {skillsProfile.availableAsMentor ? "Mentoring" : "Not mentoring"}
            </span>
          </label>
          <button onClick={() => setShowEdit(v => !v)} className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border transition-all duration-200
            ${showEdit
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:border-primary/20"
            }`}>
            {showEdit ? <><Check className="w-3 h-3 inline mr-1" />Done</> : "+ Edit"}
          </button>
        </div>
      </div>

      {/* Skills display */}
      {!showEdit ? (
        skillsProfile.skills.length === 0 ? (
          <div className="text-xs text-muted-foreground mb-3">No skills added yet — click Edit to add</div>
        ) : (
          <div className={`grid gap-2.5 mb-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {skillsProfile.skills.map((s, i) => {
              const profPct: Record<ProfLevel, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
              const pct = profPct[s.proficiency];
              return (
                <div key={s.name} className="group cursor-default animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground transition-colors duration-200 group-hover:text-primary">{s.name}</span>
                    <span className="text-[10px] font-semibold capitalize transition-transform duration-200 group-hover:scale-105" style={{ color: PROF_COLORS[s.proficiency] }}>
                      {s.proficiency} · {pct}%
                    </span>
                  </div>
                  <div className="h-[5px] rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: PROF_COLORS[s.proficiency] }} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="animate-fade-in">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skillsProfile.skills.map(s => (
              <span key={s.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border
                transition-all duration-200 hover:scale-105 hover:shadow-sm"
                style={{ background: `${PROF_COLORS[s.proficiency]}18`, borderColor: `${PROF_COLORS[s.proficiency]}35`, color: PROF_COLORS[s.proficiency] }}>
                {s.name}
                <select value={s.proficiency} onChange={e => setSkillProf(s.name, e.target.value as ProfLevel)}
                  className="bg-transparent border-none cursor-pointer text-[10px] text-inherit p-0 outline-none">
                  {(["beginner", "intermediate", "advanced", "expert"] as ProfLevel[]).map(l => <option key={l} value={l}>{l[0].toUpperCase()}</option>)}
                </select>
                <button onClick={() => removeSkill(s.name)} className="bg-transparent border-none cursor-pointer text-inherit p-0 text-[13px] leading-none
                  transition-transform duration-150 hover:scale-125">×</button>
              </span>
            ))}
            {skillsProfile.skills.length === 0 && <span className="text-xs text-muted-foreground">No skills added yet</span>}
          </div>

          {/* Add skill */}
          <div className="flex gap-1.5 mb-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addSkill(newName, newProf); }}
              placeholder="Add a skill..." list="profile-skills-list"
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-border bg-input text-foreground outline-none
                transition-all duration-200 focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
            <datalist id="profile-skills-list">
              {SUGGESTED_SKILLS.filter(s => !skillsProfile.skills.find(x => x.name === s.name)).map(s => <option key={s.name} value={s.name} />)}
            </datalist>
            <select value={newProf} onChange={e => setNewProf(e.target.value as ProfLevel)}
              className="px-2 py-1.5 rounded-lg text-[11px] border border-border bg-input text-foreground outline-none cursor-pointer">
              {(["beginner", "intermediate", "advanced", "expert"] as ProfLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => addSkill(newName, newProf)}
              className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none bg-primary text-primary-foreground font-semibold
                transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95">+</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_SKILLS.filter(s => !skillsProfile.skills.find(x => x.name === s.name)).slice(0, 8).map(s => (
              <button key={s.name} onClick={() => addSkill(s.name, newProf)}
                className="px-2 py-1 rounded-xl text-[10px] cursor-pointer border border-border bg-transparent text-muted-foreground
                  transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:-translate-y-0.5">
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

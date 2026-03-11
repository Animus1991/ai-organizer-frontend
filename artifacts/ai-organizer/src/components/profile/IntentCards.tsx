import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useUserSkills, INTENT_LABELS, IntentType } from "../../context/UserSkillsContext";
import { Target, Check } from "lucide-react";

export function IntentCards() {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const { addIntent, removeIntent, hasIntent } = useUserSkills();
  const [expandedIntent, setExpandedIntent] = useState<IntentType | null>(null);
  const [intentDesc, setIntentDesc] = useState("");

  const toggleIntent = (type: IntentType) => {
    if (hasIntent(type)) {
      removeIntent(type);
      if (expandedIntent === type) setExpandedIntent(null);
    } else {
      setExpandedIntent(type);
      setIntentDesc("");
    }
  };

  const confirmIntent = (type: IntentType) => {
    addIntent(type, intentDesc.trim() || undefined);
    setExpandedIntent(null);
    setIntentDesc("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-shadow duration-300 hover:shadow-lg">
      <h3 className="m-0 mb-3.5 text-sm font-bold text-foreground flex items-center gap-2">
        <Target className="w-4 h-4 text-muted-foreground" />
        What I'm looking for
      </h3>
      <div className={`grid gap-1.5 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        {(Object.keys(INTENT_LABELS) as IntentType[]).map(type => {
          const cfg = INTENT_LABELS[type];
          const isActive = hasIntent(type);
          const isExpanded = expandedIntent === type;
          return (
            <div key={type}>
              <button
                onClick={() => toggleIntent(type)}
                className={`w-full text-left px-2.5 py-[7px] border cursor-pointer flex items-center gap-1.5
                  transition-all duration-200 ease-out
                  hover:shadow-sm
                  ${isExpanded ? "rounded-t-lg" : "rounded-lg"}
                  ${isActive
                    ? "bg-primary/5 border-primary/25 hover:bg-primary/10"
                    : "bg-transparent border-border hover:bg-muted/30 hover:-translate-y-0.5"
                  }`}
              >
                <span className="text-[13px] transition-transform duration-200 group-hover:scale-110">{cfg.icon}</span>
                <span className={`text-[11px] flex-1 transition-colors duration-200 ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>{cfg.label}</span>
                {isActive && <Check className="w-3 h-3 text-primary animate-scale-in" />}
              </button>
              {isExpanded && (
                <div className="px-2 py-1.5 rounded-b-lg border border-t-0 border-primary/25 bg-muted/20 animate-fade-in">
                  <input
                    autoFocus value={intentDesc} onChange={e => setIntentDesc(e.target.value)}
                    placeholder="Brief note (optional)..."
                    onKeyDown={e => { if (e.key === "Enter") confirmIntent(type); if (e.key === "Escape") setExpandedIntent(null); }}
                    className="w-full px-2 py-1.5 rounded-md text-[11px] border border-border bg-input text-foreground outline-none mb-1.5"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => confirmIntent(type)}
                      className="flex-1 py-1 rounded text-[10px] cursor-pointer border border-primary/25 bg-primary/10 text-primary font-semibold
                        transition-colors duration-200 hover:bg-primary/20">
                      Add
                    </button>
                    <button onClick={() => setExpandedIntent(null)}
                      className="px-2 py-1 rounded text-[10px] cursor-pointer border border-border bg-transparent text-muted-foreground
                        transition-colors duration-200 hover:bg-muted/50">
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

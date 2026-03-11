/**
 * ProfileEditForm — Extracted edit panel for academic profile fields.
 * Handles bio, position, institution, department, website, ORCID,
 * expertise tags, and research interest tags.
 */
import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { AcademicProfile } from "./ProfileHeader";
import { Pencil, Plus, X, Save } from "lucide-react";

interface ProfileEditFormProps {
  profile: AcademicProfile;
  onSave: (profile: AcademicProfile) => void;
  onCancel: () => void;
}

const FIELDS: { field: keyof AcademicProfile; placeholder: string }[] = [
  { field: "position", placeholder: "Position (e.g. PhD Researcher)" },
  { field: "institution", placeholder: "Institution" },
  { field: "department", placeholder: "Department" },
  { field: "website", placeholder: "Website URL" },
  { field: "orcid", placeholder: "ORCID ID" },
];

export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<AcademicProfile>(profile);
  const [newTag, setNewTag] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const addTag = (field: "expertise" | "researchInterests", value: string) => {
    if (!value.trim()) return;
    setDraft(d => ({ ...d, [field]: [...d[field], value.trim()] }));
    if (field === "expertise") setNewTag(""); else setNewInterest("");
  };

  const removeTag = (field: "expertise" | "researchInterests", idx: number) => {
    setDraft(d => ({ ...d, [field]: d[field].filter((_, i) => i !== idx) }));
  };

  return (
    <div className="mb-8 p-6 bg-primary/5 rounded-2xl border border-primary/20">
      <h3 className="m-0 mb-5 text-base font-bold text-foreground flex items-center gap-2">
        <Pencil className="w-4 h-4" />
        {t("profile.editProfile") || "Edit Academic Profile"}
      </h3>

      {/* Text fields */}
      <div className={`grid gap-3 mb-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        {FIELDS.map(({ field, placeholder }) => (
          <input
            key={field}
            value={draft[field] as string}
            onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
            placeholder={placeholder}
            className="px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm w-full outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
        ))}
      </div>

      {/* Bio */}
      <textarea
        value={draft.bio}
        onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
        placeholder="Bio — describe your research focus and background..."
        rows={3}
        className="px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm w-full resize-y mb-3 outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
      />

      {/* Expertise tags */}
      <TagSection
        label="Expertise Tags"
        tags={draft.expertise}
        newValue={newTag}
        onChange={setNewTag}
        onAdd={v => addTag("expertise", v)}
        onRemove={i => removeTag("expertise", i)}
        colorClass="primary"
      />

      {/* Research interests */}
      <TagSection
        label="Research Interests"
        tags={draft.researchInterests}
        newValue={newInterest}
        onChange={setNewInterest}
        onAdd={v => addTag("researchInterests", v)}
        onRemove={i => removeTag("researchInterests", i)}
        colorClass="success"
      />

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onSave(draft)}
          className="px-6 py-2.5 bg-primary border-none rounded-lg text-primary-foreground font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Save className="w-3.5 h-3.5" />
          {t("action.save") || "Save Profile"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 bg-transparent border border-border rounded-lg text-muted-foreground text-sm cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {t("action.cancel") || "Cancel"}
        </button>
      </div>
    </div>
  );
}

/* ── Tag section sub-component ─────────────────────────────────── */
function TagSection({
  label, tags, newValue, onChange, onAdd, onRemove, colorClass,
}: {
  label: string;
  tags: string[];
  newValue: string;
  onChange: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  colorClass: "primary" | "success";
}) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border
              ${colorClass === "primary"
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-success/15 text-success border-success/30"
              }`}
          >
            {tag}
            <button
              onClick={() => onRemove(i)}
              className={`bg-transparent border-none cursor-pointer p-0 leading-none
                ${colorClass === "primary" ? "text-primary" : "text-success"}`}
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAdd(newValue)}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        />
        <button
          onClick={() => onAdd(newValue)}
          className={`px-3.5 py-2 rounded-lg text-sm cursor-pointer font-medium flex items-center gap-1 border transition-colors
            ${colorClass === "primary"
              ? "bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
              : "bg-success/20 border-success/30 text-success hover:bg-success/30"
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

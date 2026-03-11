/**
 * CollabProposalModal — collaboration proposal form
 * v2: i18n-ready labels, tighter spacing
 */
import React, { useState } from "react";
import { X, Plus, Handshake, Check } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { ROLE_LABELS, SCOPE_LABELS } from "../constants";
import { saveProposals } from "../helpers";
import type { CollabProposal, ProposalRole, ProposalScope } from "../types";

interface Props {
  targetId: string;
  targetName: string;
  proposals: CollabProposal[];
  onProposalsChange: (p: CollabProposal[]) => void;
  onClose: () => void;
}

export const CollabProposalModal: React.FC<Props> = ({
  targetId, targetName, proposals, onProposalsChange, onClose,
}) => {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    role: "collaborator" as ProposalRole,
    scope: "project" as ProposalScope,
    timeframe: "",
    compensation: "",
    message: "",
    milestoneInput: "",
    milestones: [] as string[],
  });

  const addMilestone = () => {
    if (!form.milestoneInput.trim()) return;
    setForm((f) => ({ ...f, milestones: [...f.milestones, f.milestoneInput.trim()], milestoneInput: "" }));
  };

  const send = () => {
    if (!form.message.trim()) return;
    const p: CollabProposal = {
      id: `p-${Date.now()}`, toUserId: targetId, toUserName: targetName,
      role: form.role, scope: form.scope, timeframe: form.timeframe,
      compensation: form.compensation, message: form.message,
      milestones: form.milestones, sentAt: Date.now(),
    };
    const updated = [...proposals, p];
    saveProposals(updated);
    onProposalsChange(updated);
    setSent(true);
    setTimeout(() => onClose(), 1800);
  };

  const selectClass = "w-full px-2.5 py-1.5 rounded-lg text-xs border border-border bg-muted/30 text-foreground outline-none cursor-pointer";
  const inputClass = "w-full px-2.5 py-1.5 rounded-lg text-xs border border-border bg-muted/30 text-foreground outline-none box-border";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[500px] max-h-[85vh] overflow-y-auto bg-popover rounded-xl border border-border shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <h2 className="m-0 text-sm font-bold text-foreground inline-flex items-center gap-2">
            <Handshake size={16} className="text-success" />
            {t("community.proposeCollab") || "Propose Collaboration"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-2.5">
              <Check size={24} className="text-success" />
            </div>
            <div className="font-bold text-sm text-foreground">
              {t("community.proposalSent") || `Proposal sent to ${targetName}!`}
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground -mt-0.5">
              {t("community.proposingTo") || "Proposing collaboration with"}{" "}
              <strong className="text-foreground">{targetName}</strong>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">{t("community.role") || "Role"}</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as ProposalRole }))} className={selectClass}>
                  {(Object.keys(ROLE_LABELS) as ProposalRole[]).map((k) => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">{t("community.scope") || "Scope"}</label>
                <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as ProposalScope }))} className={selectClass}>
                  {(Object.keys(SCOPE_LABELS) as ProposalScope[]).map((k) => <option key={k} value={k}>{SCOPE_LABELS[k]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">{t("community.timeframe") || "Timeframe"}</label>
                <input value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 3 months" className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">{t("community.compensation") || "Compensation"}</label>
                <input value={form.compensation} onChange={(e) => setForm((f) => ({ ...f, compensation: e.target.value }))} placeholder="Co-authorship, paid…" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">{t("community.message") || "Message"} *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t("community.messagePlaceholder") || "Describe your collaboration idea, goals, and why this would be a good fit..."}
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">{t("community.milestones") || "Milestones"} ({t("common.optional") || "optional"})</label>
              {form.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 mb-1">
                  <span className="flex-1 px-2 py-1 rounded-lg text-[11px] bg-muted/30 border border-border text-foreground">• {m}</span>
                  <button onClick={() => setForm((f) => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))} className="p-0.5 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5">
                <input
                  value={form.milestoneInput}
                  onChange={(e) => setForm((f) => ({ ...f, milestoneInput: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMilestone(); } }}
                  placeholder={t("community.addMilestone") || "Add milestone..."}
                  className={`flex-1 ${inputClass}`}
                />
                <button onClick={addMilestone} className="px-2.5 py-1.5 rounded-lg border-none bg-primary text-primary-foreground text-xs cursor-pointer font-semibold inline-flex items-center gap-1">
                  <Plus size={11} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-0.5">
              <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-border bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors">
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={send}
                disabled={!form.message.trim()}
                className={`px-5 py-2 rounded-lg border-none text-xs font-bold transition-colors ${
                  form.message.trim()
                    ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {t("community.sendProposal") || "Send Proposal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

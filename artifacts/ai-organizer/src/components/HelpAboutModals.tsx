// src/components/HelpAboutModals.tsx
// Help and About Modal Dialogs — Tailwind + HSL semantic tokens

import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { HelpCircle, Info, Rocket, Compass, Keyboard, Sparkles, X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  "🚀": <Rocket className="w-5 h-5 text-primary" />,
  "🧭": <Compass className="w-5 h-5 text-primary" />,
  "⌨️": <Keyboard className="w-5 h-5 text-primary" />,
  "✨": <Sparkles className="w-5 h-5 text-primary" />,
};

// Help Modal
export const HelpModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const helpSections = [
    {
      title: t("help.gettingStarted"), icon: "🚀",
      items: [
        { title: t("help.uploadDocs"), desc: t("help.uploadDocsDesc") },
        { title: t("help.organizeDocs"), desc: t("help.organizeDocsDesc") },
        { title: t("help.searchContent"), desc: t("help.searchContentDesc") },
      ],
    },
    {
      title: t("help.navigation"), icon: "🧭",
      items: [
        { title: t("nav.home"), desc: t("help.homeDesc") },
        { title: t("nav.library"), desc: t("help.libraryDesc") },
        { title: t("nav.research"), desc: t("help.researchDesc") },
        { title: t("nav.workspace"), desc: t("help.workspaceDesc") },
      ],
    },
    {
      title: t("help.keyboardShortcuts"), icon: "⌨️",
      items: [
        { title: "Ctrl+K", desc: t("help.shortcutSearch") },
        { title: "Ctrl+S", desc: t("help.shortcutSave") },
        { title: "Ctrl+/", desc: t("help.shortcutHelp") },
        { title: "Escape", desc: t("help.shortcutClose") },
      ],
    },
    {
      title: t("help.features"), icon: "✨",
      items: [
        { title: t("help.aiAnalysis"), desc: t("help.aiAnalysisDesc") },
        { title: t("help.segmentation"), desc: t("help.segmentationDesc") },
        { title: t("help.export"), desc: t("help.exportDesc") },
        { title: t("help.collaboration"), desc: t("help.collaborationDesc") },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[700px] max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-6 border-b border-border flex items-center justify-between bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("help.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("help.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">
          {helpSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="flex items-center gap-2.5 text-base font-semibold text-foreground mb-3">
                {sectionIcons[section.icon] || <span>{section.icon}</span>}
                {section.title}
              </h3>
              <div className="space-y-2.5">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="px-4 py-3.5 bg-muted/30 border border-border rounded-xl">
                    <div className="text-sm font-semibold text-foreground mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("help.moreInfo")}</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

// About Modal
export const AboutModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const features = [
    { icon: "📄", label: t("about.featureDocs") },
    { icon: "🔬", label: t("about.featureResearch") },
    { icon: "🤖", label: t("about.featureAI") },
    { icon: "📊", label: t("about.featureAnalytics") },
    { icon: "🔍", label: t("about.featureSearch") },
    { icon: "🌐", label: t("about.featureMultilang") },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[500px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with logo */}
        <div className="px-7 py-8 text-center bg-gradient-to-br from-primary/15 to-primary/5">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl shadow-lg shadow-primary/30">
            🔬
          </div>
          <h2 className="text-2xl font-bold text-foreground">AI Research Organizer</h2>
          <p className="text-sm text-muted-foreground mt-2">{t("about.tagline")}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-card border border-border rounded-lg">
            <span className="text-primary font-semibold text-sm">v1.0.0</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">{t("about.stable")}</span>
          </div>
        </div>

        {/* Features */}
        <div className="px-7 py-5">
          <h3 className="text-sm font-semibold text-foreground mb-3.5">{t("about.features")}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2.5 px-3.5 py-3 bg-muted/30 border border-border rounded-xl">
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-7 py-4 border-t border-border bg-muted/20 space-y-2">
          {[
            { label: t("about.developer"), value: "Think!Hub Team" },
            { label: t("about.license"), value: "MIT License" },
            { label: t("about.copyright"), value: "© 2024-2026" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-xs text-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default { HelpModal, AboutModal };

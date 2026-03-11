import { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";

export function FooterHelp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  const buttonExplanations = [
    {
      category: t("help.slotManagement"),
      buttons: [
        {
          name: t("help.lockUnlock.name"),
          description: t("help.lockUnlock.desc"),
          usage: t("help.lockUnlock.usage")
        },
        {
          name: t("action.edit"),
          description: t("help.edit.desc"),
          usage: t("help.edit.usage")
        },
        {
          name: t("help.close.name"),
          description: t("help.close.desc"),
          usage: t("help.close.usage")
        }
      ]
    },
    {
      category: t("help.topBarControls"),
      buttons: [
        {
          name: t("help.notepad.name"),
          description: t("help.notepad.desc"),
          usage: t("help.notepad.usage")
        },
        {
          name: t("workspace.compare"),
          description: t("help.compare.desc"),
          usage: t("help.compare.usage")
        },
        {
          name: t("workspace.undo"),
          description: t("help.undo.desc"),
          usage: t("help.undo.usage")
        },
        {
          name: t("help.stickyOnOff.name"),
          description: t("help.stickyOnOff.desc"),
          usage: t("help.stickyOnOff.usage")
        }
      ]
    },
    {
      category: t("help.floatingNotepad"),
      buttons: [
        {
          name: t("help.wrapNoWrap.name"),
          description: t("help.wrapNoWrap.desc"),
          usage: t("help.wrapNoWrap.usage")
        },
        {
          name: t("help.copy.name"),
          description: t("help.copy.desc"),
          usage: t("help.copy.usage")
        },
        {
          name: t("workspace.clear"),
          description: t("help.clearNotepad.desc"),
          usage: t("help.clearNotepad.usage")
        },
        {
          name: t("help.download.name"),
          description: t("help.download.desc"),
          usage: t("help.download.usage")
        },
        {
          name: t("help.dock.name"),
          description: t("help.dock.desc"),
          usage: t("help.dock.usage")
        },
        {
          name: t("help.minimizeMaximize.name"),
          description: t("help.minimizeMaximize.desc"),
          usage: t("help.minimizeMaximize.usage")
        },
        {
          name: t("help.stickyNotepad.name"),
          description: t("help.stickyNotepad.desc"),
          usage: t("help.stickyNotepad.usage")
        },
        {
          name: t("help.closeNotepad.name"),
          description: t("help.closeNotepad.desc"),
          usage: t("help.closeNotepad.usage")
        }
      ]
    },
    {
      category: t("help.segmentsSearch"),
      buttons: [
        {
          name: t("help.pin.name"),
          description: t("help.pin.desc"),
          usage: t("help.pin.usage")
        },
        {
          name: t("help.export.name"),
          description: t("help.export.desc"),
          usage: t("help.export.usage")
        },
        {
          name: t("help.openAllSelected.name"),
          description: t("help.openAllSelected.desc"),
          usage: t("help.openAllSelected.usage")
        }
      ]
    },
    {
      category: t("help.advancedFeatures"),
      buttons: [
        {
          name: t("help.manualConfirmFeature.name"),
          description: t("help.manualConfirmFeature.desc"),
          usage: t("help.manualConfirmFeature.usage")
        },
        {
          name: t("help.clickSelectFeature.name"),
          description: t("help.clickSelectFeature.desc"),
          usage: t("help.clickSelectFeature.usage")
        }
      ]
    }
  ];

  return (
    <div className="footerHelp">
      <div className="footerHelpHeader" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="footerHelpTitle">📚 {t("workspace.buttonGuide")}</div>
        <div className="footerHelpToggle">{isExpanded ? "▼" : "▶"}</div>
      </div>
      
      {isExpanded && (
        <div className="footerHelpContent">
          <div className="footerHelpIntro">
            <p>{t("help.intro")}</p>
          </div>
          
          {buttonExplanations.map((category, categoryIndex) => (
            <div key={categoryIndex} className="helpCategory">
              <h4 className="helpCategoryTitle">{category.category}</h4>
              <div className="helpButtons">
                {category.buttons.map((button, buttonIndex) => (
                  <div key={buttonIndex} className="helpButton">
                    <div className="helpButtonName">{button.name}</div>
                    <div className="helpButtonDescription">{button.description}</div>
                    <div className="helpButtonUsage">
                      <strong>{t("help.usage")}</strong> {button.usage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="footerHelpTips">
            <h4>💡 {t("help.proTips")}</h4>
            <ul>
              <li>{t("help.tip.lock")}</li>
              <li>{t("help.tip.compare")}</li>
              <li>{t("help.tip.notepads")}</li>
              <li>{t("help.tip.undo")}</li>
              <li>{t("help.tip.pinned")}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

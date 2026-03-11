import React from "react";
import { useSettings } from "../../../hooks/useSettings";
import { useLanguage } from "../../../context/LanguageContext";
import { SettingGroup, ToggleSetting, SelectSetting } from "../primitives";

export default function GeneralSection() {
  const { settings, updateSettings } = useSettings();
  const { t } = useLanguage();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="Auto Save">
        <ToggleSetting
          label="Enable Auto Save"
          description="Automatically save your work at regular intervals"
          value={settings.autoSave}
          onChange={(v) => updateSettings({ autoSave: v })}
        />
        {settings.autoSave && (
          <SelectSetting
            label="Save Interval"
            value={String(settings.autoSaveInterval)}
            options={[
              { value: "15", label: "15 seconds" },
              { value: "30", label: "30 seconds" },
              { value: "60", label: "1 minute" },
              { value: "120", label: "2 minutes" },
            ]}
            onChange={(v) => updateSettings({ autoSaveInterval: Number(v) })}
          />
        )}
      </SettingGroup>
      <SettingGroup title="Default Start Page">
        <SelectSetting
          label="When opening the app, start on"
          value={settings.defaultStartPage}
          options={[
            { value: "/", label: t("nav.home") },
            { value: "/library", label: t("nav.library") },
            { value: "/research", label: t("nav.research") },
          ]}
          onChange={(v) => updateSettings({ defaultStartPage: v })}
        />
      </SettingGroup>
    </div>
  );
}

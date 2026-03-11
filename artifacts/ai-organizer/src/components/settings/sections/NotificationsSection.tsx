import React from "react";
import { useSettings } from "../../../hooks/useSettings";
import { SettingGroup, ToggleSetting } from "../primitives";

export default function NotificationsSection() {
  const { settings, updateSettings } = useSettings();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="Notification Preferences">
        <ToggleSetting
          label="Desktop Notifications"
          description="Show system notifications for important updates"
          value={settings.desktopNotifications}
          onChange={(v) => updateSettings({ desktopNotifications: v })}
        />
        <ToggleSetting
          label="Email Notifications"
          description="Receive email updates about your research"
          value={settings.emailNotifications}
          onChange={(v) => updateSettings({ emailNotifications: v })}
        />
        <ToggleSetting
          label="Sound Effects"
          description="Play sounds for notifications and actions"
          value={settings.soundEnabled}
          onChange={(v) => updateSettings({ soundEnabled: v })}
        />
        <ToggleSetting
          label="Show Preview"
          description="Display content preview in notifications"
          value={settings.showPreviewInNotifications}
          onChange={(v) => updateSettings({ showPreviewInNotifications: v })}
        />
      </SettingGroup>
    </div>
  );
}

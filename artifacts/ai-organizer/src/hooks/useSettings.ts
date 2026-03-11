import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useNotifications } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import type { UserSettings } from "../types/settings";
import { defaultSettings } from "../types/settings";

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>("user_settings", defaultSettings);
  const { addNotification } = useNotifications();
  const { t } = useLanguage();

  const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    addNotification({ type: "success", title: t("status.saved"), message: "Settings updated", duration: 2000 });
  }, [setSettings, addNotification, t]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
    addNotification({ type: "success", title: t("status.saved"), message: "Settings updated", duration: 2000 });
  }, [setSettings, addNotification, t]);

  return { settings, updateSetting, updateSettings };
}

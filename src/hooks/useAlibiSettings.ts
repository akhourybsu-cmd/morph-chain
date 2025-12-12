import { useState, useEffect } from 'react';

interface AlibiSettings {
  showTimer: boolean;
  autoDeduction: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'alibi_settings';

const defaultSettings: AlibiSettings = {
  showTimer: true,
  autoDeduction: true,
  soundEnabled: true,
};

export function useAlibiSettings() {
  const [settings, setSettings] = useState<AlibiSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load alibi settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save alibi settings:', e);
    }
  }, [settings]);

  const setShowTimer = (value: boolean) => {
    setSettings(prev => ({ ...prev, showTimer: value }));
  };

  const setAutoDeduction = (value: boolean) => {
    setSettings(prev => ({ ...prev, autoDeduction: value }));
  };

  const setSoundEnabled = (value: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled: value }));
  };

  return {
    ...settings,
    setShowTimer,
    setAutoDeduction,
    setSoundEnabled,
  };
}

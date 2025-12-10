import { useState, useEffect } from 'react';

export interface RushSettings {
  soundEnabled: boolean;
}

const STORAGE_KEY = 'morph-rush-settings';

const DEFAULT_SETTINGS: RushSettings = {
  soundEnabled: true,
};

export const useRushSettings = () => {
  const [settings, setSettings] = useState<RushSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof RushSettings>(
    key: K,
    value: RushSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSound = () => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  return {
    settings,
    updateSetting,
    toggleSound,
  };
};

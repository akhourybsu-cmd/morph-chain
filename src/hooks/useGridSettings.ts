import { useState, useEffect } from 'react';

export interface GridSettings {
  animations: boolean;
  soundEnabled: boolean;
  soundHaptics: boolean;
  colorblindMode: boolean;
}

const STORAGE_KEY = 'morph-grid-settings';

const DEFAULT_SETTINGS: GridSettings = {
  animations: true,
  soundEnabled: true,
  soundHaptics: true,
  colorblindMode: false,
};

export const useGridSettings = () => {
  const [settings, setSettings] = useState<GridSettings>(() => {
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

  const updateSetting = <K extends keyof GridSettings>(
    key: K,
    value: GridSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
  };
};

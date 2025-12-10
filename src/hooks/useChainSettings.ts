import { useState, useEffect } from 'react';

export interface ChainSettings {
  soundEnabled: boolean;
}

const STORAGE_KEY = 'morph-chain-settings';

const DEFAULT_SETTINGS: ChainSettings = {
  soundEnabled: true,
};

export const useChainSettings = () => {
  const [settings, setSettings] = useState<ChainSettings>(() => {
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

  const updateSetting = <K extends keyof ChainSettings>(
    key: K,
    value: ChainSettings[K]
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

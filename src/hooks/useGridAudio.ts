import { useCallback, useEffect, useRef } from 'react';
import { useGridSettings } from './useGridSettings';
import {
  playTileSelect as _playTileSelect,
  playBacktrack as _playBacktrack,
  playInvalidMove as _playInvalidMove,
  playWordSubmit as _playWordSubmit,
  playTileUpgrade as _playTileUpgrade,
  initAudio,
} from '@/lib/grid/audioManager';

export const useGridAudio = () => {
  const { settings } = useGridSettings();
  const initialized = useRef(false);

  // Initialize audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!initialized.current) {
        initAudio();
        initialized.current = true;
      }
    };

    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const playTileSelect = useCallback((chainIndex: number) => {
    if (settings.soundEnabled) {
      _playTileSelect(chainIndex);
    }
  }, [settings.soundEnabled]);

  const playBacktrack = useCallback(() => {
    if (settings.soundEnabled) {
      _playBacktrack();
    }
  }, [settings.soundEnabled]);

  const playInvalidMove = useCallback(() => {
    if (settings.soundEnabled) {
      _playInvalidMove();
    }
  }, [settings.soundEnabled]);

  const playWordSubmit = useCallback((wordLength: number) => {
    if (settings.soundEnabled) {
      _playWordSubmit(wordLength);
    }
  }, [settings.soundEnabled]);

  const playTileUpgrade = useCallback((fromTier: 'orange' | 'blue' = 'orange') => {
    if (settings.soundEnabled) {
      _playTileUpgrade(fromTier);
    }
  }, [settings.soundEnabled]);

  return {
    playTileSelect,
    playBacktrack,
    playInvalidMove,
    playWordSubmit,
    playTileUpgrade,
  };
};

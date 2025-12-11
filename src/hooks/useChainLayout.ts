import { useState, useEffect, useCallback } from 'react';

interface ChainLayoutConfig {
  tileSize: number;
  inputTileSize: number;
  gap: number;
  horizontalPadding: number;
  keyboardVisible: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
  isIOS: boolean;
}

export function useChainLayout(wordLength: 4 | 5): ChainLayoutConfig {
  const [config, setConfig] = useState<ChainLayoutConfig>({
    tileSize: 40,
    inputTileSize: 48,
    gap: 4,
    horizontalPadding: 16,
    keyboardVisible: false,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    isIOS: false,
  });

  const calculateLayout = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Safe areas (iOS notch and home indicator)
    const safeAreaTop = isIOS ? 47 : 0;
    const safeAreaBottom = isIOS ? 34 : 0;
    
    // Check if keyboard is likely visible (viewport height shrank significantly)
    const initialHeight = window.screen.height;
    const keyboardVisible = isIOS && vh < initialHeight * 0.7;
    
    // Calculate available width for tiles (account for padding and gaps)
    const horizontalPadding = vw < 360 ? 12 : 16;
    const gap = 4;
    
    // For puzzle display: start word + arrow + goal word
    // Each word needs: (wordLength * tileSize) + ((wordLength - 1) * gap)
    // Total: 2 * (wordLength * tileSize + (wordLength - 1) * gap) + arrow space (~40px) + padding
    
    // For input: wordLength tiles + gaps
    // Available width = vw - (2 * horizontalPadding)
    // Input row: wordLength * inputTileSize + (wordLength - 1) * gap
    
    const availableWidth = vw - (2 * horizontalPadding);
    
    // Calculate max tile size that fits the input row
    // inputRowWidth = wordLength * inputTileSize + (wordLength - 1) * gap
    // inputRowWidth <= availableWidth
    // inputTileSize <= (availableWidth - (wordLength - 1) * gap) / wordLength
    const maxInputTileSize = Math.floor((availableWidth - (wordLength - 1) * gap) / wordLength);
    
    // For puzzle display (start + arrow + goal side by side)
    // Each word: wordLength * tileSize + (wordLength - 1) * gap
    // Total: 2 * wordWidth + arrowSpace (~48px) + gap between sections (~24px)
    const arrowAndGapSpace = 72; // arrow + spacing
    const maxPuzzleTileSize = Math.floor(
      (availableWidth - arrowAndGapSpace - 2 * (wordLength - 1) * gap) / (2 * wordLength)
    );
    
    // Use responsive sizing based on screen width
    let tileSize: number;
    let inputTileSize: number;
    
    if (vw < 360) {
      // Very small screens
      tileSize = wordLength === 5 ? 32 : 36;
      inputTileSize = wordLength === 5 ? 40 : 44;
    } else if (vw < 400) {
      // Small screens
      tileSize = wordLength === 5 ? 36 : 40;
      inputTileSize = wordLength === 5 ? 44 : 48;
    } else if (vw < 480) {
      // Medium screens
      tileSize = wordLength === 5 ? 40 : 44;
      inputTileSize = wordLength === 5 ? 48 : 52;
    } else {
      // Larger screens
      tileSize = wordLength === 5 ? 44 : 48;
      inputTileSize = wordLength === 5 ? 52 : 56;
    }
    
    // Ensure tiles don't overflow
    tileSize = Math.min(tileSize, maxPuzzleTileSize);
    inputTileSize = Math.min(inputTileSize, maxInputTileSize);
    
    // Set CSS custom properties
    document.documentElement.style.setProperty('--chain-tile-size', `${tileSize}px`);
    document.documentElement.style.setProperty('--chain-input-tile-size', `${inputTileSize}px`);
    document.documentElement.style.setProperty('--chain-gap', `${gap}px`);
    document.documentElement.style.setProperty('--chain-h-padding', `${horizontalPadding}px`);
    
    setConfig({
      tileSize,
      inputTileSize,
      gap,
      horizontalPadding,
      keyboardVisible,
      safeAreaTop,
      safeAreaBottom,
      isIOS,
    });
  }, [wordLength]);

  useEffect(() => {
    calculateLayout();
    
    const handleResize = () => {
      calculateLayout();
    };
    
    // Listen for resize and orientation changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Also listen for visual viewport changes (keyboard show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [calculateLayout]);

  return config;
}

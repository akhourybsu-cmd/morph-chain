import { useEffect, useState } from 'react';

interface GridLayoutDimensions {
  tileSize: number;
  gridSize: number;
}

export const useGridLayout = () => {
  const [dimensions, setDimensions] = useState<GridLayoutDimensions>({
    tileSize: 64,
    gridSize: 340
  });

  useEffect(() => {
    const calculateDimensions = () => {
      // Get actual viewport height - use visualViewport for iOS accuracy
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // Detect iOS for additional safety buffer
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      
      // iOS safe area estimation (notch + home indicator)
      // These are approximate values since CSS env() can't be read directly
      const safeTop = isIOS ? 47 : 0; // Notch area
      const safeBottom = isIOS ? 34 : 0; // Home indicator
      
      // Fixed element heights - accurate measurements
      const headerH = 56; // h-14 = 56px
      const infoStripH = 40; // h-10 = 40px
      const gridPaddingY = 32; // py-4 top + bottom = 32px
      const gridGaps = 12 * 4; // 4 gaps between 5 tiles (gap-3 = 12px)
      
      // Bottom controls: WordLengthTracker(24) + Legend(24) + WordPreview(48) + GameControls(48) + gaps(12*3) + padding(16+12)
      const bottomBarH = 24 + 24 + 48 + 48 + 36 + 28; // ~208px
      
      // iOS-specific additional buffer for edge cases
      const iosSafetyBuffer = isIOS ? 24 : 0;
      
      const totalFixed = headerH + infoStripH + bottomBarH + gridPaddingY + safeTop + safeBottom + iosSafetyBuffer;
      const usableHeight = viewportHeight - totalFixed;
      
      // Get viewport width with conservative padding
      const vw = window.innerWidth;
      const sidePadding = vw < 400 ? 32 : 48;
      const usableWidth = Math.min(vw - sidePadding, 520);
      
      // Calculate tile size that fits both constraints
      const tileSizeFromHeight = Math.floor((usableHeight - gridGaps) / 5);
      const tileSizeFromWidth = Math.floor((usableWidth - gridGaps) / 5);
      
      // Use smaller of the two, with adaptive min/max bounds
      const minSize = vw < 380 ? 40 : 46;
      const maxSize = 68;
      
      const calculatedTileSize = Math.max(
        minSize,
        Math.min(
          maxSize,
          Math.min(tileSizeFromHeight, tileSizeFromWidth)
        )
      );
      
      const calculatedGridSize = calculatedTileSize * 5 + gridGaps;
      
      setDimensions({
        tileSize: calculatedTileSize,
        gridSize: calculatedGridSize
      });
      
      // Update CSS custom property for use in components
      document.documentElement.style.setProperty('--tile-size', `${calculatedTileSize}px`);
      document.documentElement.style.setProperty('--grid-size', `${calculatedGridSize}px`);
    };
    
    // Calculate on mount and resize
    calculateDimensions();
    
    const handleResize = () => {
      requestAnimationFrame(calculateDimensions);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return dimensions;
};

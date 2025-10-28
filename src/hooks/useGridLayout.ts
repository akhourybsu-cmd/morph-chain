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
      // Get actual viewport height (critical for iOS)
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // Account for iOS safe area insets
      const computedStyle = getComputedStyle(document.documentElement);
      const safeTop = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
      const safeBottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');
      
      // Fixed element heights
      const headerH = 56; // Actual h-14 in pixels
      const bottomBarH = 56 + 48 + 12; // Controls + WordPreview + gap
      const dateBarH = 36;
      const verticalPadding = 24; // Reduced for iOS
      const gridGaps = 12 * 4; // 4 gaps between 5 tiles (gap-3)
      
      const usableHeight = viewportHeight - headerH - bottomBarH - dateBarH - verticalPadding - gridGaps - safeTop - safeBottom;
      
      // Get viewport width with more conservative padding
      const vw = window.innerWidth;
      const sidePadding = vw < 400 ? 32 : 48; // More padding on small screens
      const usableWidth = Math.min(vw - sidePadding, 520); // Max 520px wide
      
      // Calculate tile size that fits both constraints
      const tileSizeFromHeight = Math.floor(usableHeight / 5);
      const tileSizeFromWidth = Math.floor((usableWidth - gridGaps) / 5);
      
      // Use smaller of the two, with adaptive min/max bounds
      const minSize = vw < 380 ? 42 : 48; // Even smaller for iOS small screens
      const maxSize = 72; // Reduced for better fit
      
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

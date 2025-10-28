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
      // Get safe viewport height (accounts for mobile browsers)
      const vh = window.innerHeight * 0.01;
      const svh = vh * 100;
      
      // Account for header (64px), bottom bar (88px), padding/gaps
      const headerH = 64;
      const bottomBarH = 88;
      const dateBarH = 36;
      const verticalPadding = 48; // Increased padding for better spacing
      const gridGaps = 12 * 4; // 4 gaps between 5 tiles (gap-3)
      
      const usableHeight = svh - headerH - bottomBarH - dateBarH - verticalPadding - gridGaps;
      
      // Get viewport width with more conservative padding
      const vw = window.innerWidth;
      const sidePadding = vw < 400 ? 32 : 48; // More padding on small screens
      const usableWidth = Math.min(vw - sidePadding, 520); // Max 520px wide
      
      // Calculate tile size that fits both constraints
      const tileSizeFromHeight = Math.floor(usableHeight / 5);
      const tileSizeFromWidth = Math.floor((usableWidth - gridGaps) / 5);
      
      // Use smaller of the two, with adaptive min/max bounds
      const minSize = vw < 380 ? 48 : 54; // Smaller min for very small screens
      const maxSize = 80; // Slightly reduced max
      
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  return dimensions;
};

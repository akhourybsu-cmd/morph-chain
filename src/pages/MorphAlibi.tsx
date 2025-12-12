import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAlibiGame } from '@/hooks/useAlibiGame';
import { useAlibiSettings } from '@/hooks/useAlibiSettings';
import { AlibiPrestigeHeader } from '@/components/alibi/AlibiPrestigeHeader';
import { AlibiMenuSheet } from '@/components/alibi/AlibiMenuSheet';
import { AlibiHowToPlay } from '@/components/alibi/AlibiHowToPlay';
import { LogicGrid } from '@/components/alibi/LogicGrid';
import { GridTabs } from '@/components/alibi/GridTabs';
import { CluePanel } from '@/components/alibi/CluePanel';
import { GameControls } from '@/components/alibi/GameControls';
import { AlibiResultsPanel } from '@/components/alibi/AlibiResultsPanel';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';
import { Flame } from 'lucide-react';
import { loadStats } from '@/lib/alibi/storage';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function MorphAlibi() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'practice' ? 'practice' : 'daily';
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  const { showTimer } = useAlibiSettings();
  const stats = loadStats();

  const {
    puzzle,
    grids,
    activeGrid,
    setActiveGrid,
    elapsedTime,
    consistencyChecks,
    isSolved,
    moveHistory,
    lastConsistencyMessage,
    toggleCell,
    undo,
    runConsistencyCheck,
    resetGame,
  } = useAlibiGame({ mode });

  if (!puzzle || !grids) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'hsl(var(--alibi-page-bg))' }}
      >
        <div 
          className="animate-pulse text-lg font-serif"
          style={{ color: 'hsl(var(--alibi-text-muted))' }}
        >
          Loading puzzle...
        </div>
      </div>
    );
  }

  const currentGrid = grids[activeGrid];

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{ background: 'hsl(var(--alibi-page-bg))' }}
    >
      {/* Masthead Header */}
      <AlibiPrestigeHeader
        onMenuClick={() => setMenuOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
        themeToggle={<PrestigeThemeToggle colorVar="--alibi-text-muted" />}
      />

      {/* Secondary Metadata Line */}
      <div 
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid hsl(var(--alibi-divider) / 0.5)' }}
      >
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-medium"
            style={{ color: 'hsl(var(--alibi-text-secondary))' }}
          >
            #{puzzle.index}
          </span>
          {stats.currentStreak > 0 && (
            <span 
              className="flex items-center gap-0.5 text-xs"
              style={{ color: 'hsl(var(--alibi-accent))' }}
            >
              <Flame className="h-3 w-3" />
              {stats.currentStreak}
            </span>
          )}
        </div>
        
        {showTimer && !isSolved && (
          <span 
            className="text-xs font-mono"
            style={{ color: 'hsl(var(--alibi-text-muted))' }}
          >
            {formatTime(elapsedTime)}
          </span>
        )}
        
        <span 
          className="text-[10px] px-2 py-0.5 rounded-full lowercase"
          style={{ 
            background: 'hsl(var(--alibi-divider) / 0.5)',
            color: 'hsl(var(--alibi-text-muted))'
          }}
        >
          {puzzle.difficulty}
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">
        {isSolved ? (
          /* Results Panel */
          <AlibiResultsPanel
            puzzle={puzzle}
            elapsedTime={elapsedTime}
            consistencyChecks={consistencyChecks}
            isPractice={mode === 'practice'}
            onPlayAgain={mode === 'practice' ? resetGame : undefined}
          />
        ) : (
          /* Game Interface - clear vertical rhythm */
          <div className="space-y-6">
            {/* Segmented Control Tabs */}
            <GridTabs activeGrid={activeGrid} onGridChange={setActiveGrid} />

            {/* Logic Grid - no card wrapper, breathing room */}
            <LogicGrid
              grid={currentGrid}
              onCellClick={(row, col) => toggleCell(activeGrid, row, col)}
              disabled={isSolved}
            />

            {/* Utility Tool Bar */}
            <GameControls
              onUndo={undo}
              onConsistencyCheck={runConsistencyCheck}
              canUndo={moveHistory.length > 0}
              consistencyChecks={consistencyChecks}
              disabled={isSolved}
            />

            {/* Consistency Message */}
            {lastConsistencyMessage && (
              <div 
                className="text-center text-sm py-2 animate-fade-in"
                style={{ color: 'hsl(var(--alibi-accent))' }}
              >
                {lastConsistencyMessage}
              </div>
            )}

            {/* Divider */}
            <div 
              className="w-12 mx-auto"
              style={{ borderTop: '1px solid hsl(var(--alibi-divider))' }}
            />

            {/* Clues Section - editorial column */}
            <CluePanel clues={puzzle.clues} />

            {/* Divider */}
            <div 
              className="w-full"
              style={{ borderTop: '1px solid hsl(var(--alibi-divider))' }}
            />

            {/* Final Question - conclusive emphasis */}
            <div className="text-center py-4">
              <span 
                className="block text-[10px] tracking-[0.15em] uppercase mb-2"
                style={{ color: 'hsl(var(--alibi-text-muted))' }}
              >
                Final Question
              </span>
              <p 
                className="font-serif text-base md:text-lg"
                style={{ color: 'hsl(var(--alibi-text-primary))' }}
              >
                {puzzle.finalQuestion}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Menu Sheet */}
      <AlibiMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />

      {/* How to Play Modal */}
      <AlibiHowToPlay open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

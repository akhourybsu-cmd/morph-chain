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
          className="animate-pulse text-lg"
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
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--alibi-page-bg))' }}
    >
      {/* Header */}
      <AlibiPrestigeHeader
        onMenuClick={() => setMenuOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
        themeToggle={<PrestigeThemeToggle colorVar="--alibi-text-muted" />}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
        {/* Puzzle Info Bar */}
        <div 
          className="flex items-center justify-between mb-4 pb-3"
          style={{ borderBottom: '1px solid hsl(var(--alibi-divider))' }}
        >
          <div className="flex items-center gap-3">
            <span 
              className="text-sm font-medium"
              style={{ color: 'hsl(var(--alibi-text-primary))' }}
            >
              Alibi #{puzzle.index}
            </span>
            {stats.currentStreak > 0 && (
              <span 
                className="flex items-center gap-1 text-sm"
                style={{ color: 'hsl(var(--alibi-accent))' }}
              >
                <Flame className="h-4 w-4" />
                {stats.currentStreak}
              </span>
            )}
          </div>
          
          {showTimer && !isSolved && (
            <span 
              className="text-sm font-mono"
              style={{ color: 'hsl(var(--alibi-text-muted))' }}
            >
              {formatTime(elapsedTime)}
            </span>
          )}
          
          <span 
            className="text-xs px-2 py-1 rounded"
            style={{ 
              background: 'hsl(var(--alibi-accent) / 0.1)',
              color: 'hsl(var(--alibi-accent))'
            }}
          >
            {puzzle.difficulty}
          </span>
        </div>

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
          /* Game Interface */
          <div className="space-y-4">
            {/* Grid Tabs */}
            <GridTabs activeGrid={activeGrid} onGridChange={setActiveGrid} />

            {/* Logic Grid */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                background: 'hsl(var(--alibi-card-bg))',
                border: '1px solid hsl(var(--alibi-card-border))'
              }}
            >
              <LogicGrid
                grid={currentGrid}
                onCellClick={(row, col) => toggleCell(activeGrid, row, col)}
                disabled={isSolved}
              />
            </div>

            {/* Consistency Message */}
            {lastConsistencyMessage && (
              <div 
                className="text-center text-sm py-2 px-4 rounded-lg animate-fade-in"
                style={{ 
                  background: 'hsl(var(--alibi-accent) / 0.1)',
                  color: 'hsl(var(--alibi-accent))'
                }}
              >
                {lastConsistencyMessage}
              </div>
            )}

            {/* Game Controls */}
            <GameControls
              onUndo={undo}
              onConsistencyCheck={runConsistencyCheck}
              canUndo={moveHistory.length > 0}
              consistencyChecks={consistencyChecks}
              disabled={isSolved}
            />

            {/* Clue Panel */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                background: 'hsl(var(--alibi-card-bg))',
                border: '1px solid hsl(var(--alibi-card-border))'
              }}
            >
              <CluePanel clues={puzzle.clues} />
            </div>

            {/* Final Question */}
            <div 
              className="text-center p-4 rounded-lg"
              style={{ 
                background: 'hsl(var(--alibi-accent) / 0.05)',
                border: '1px solid hsl(var(--alibi-accent) / 0.2)'
              }}
            >
              <p 
                className="text-sm font-medium"
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

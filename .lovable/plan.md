

# Morph Code — Super Gamified Enhancements

## What's Missing for a "Gamified" Feel

The current Morph Code has solid mechanics but feels flat visually — no XP system, no player progression, no streak tracking, no particle effects, no animated transitions between phases, and no "juice" (the small delightful touches that make games feel alive). Here's what to add:

## Enhancements

### 1. XP Bar + Level System
Add a persistent XP bar below the header that fills after each match. Players earn XP for wins (100), losses (25), solves (50), and streaks (bonus multiplier). Show a level badge next to names (Lv. 3, Lv. 7, etc.). Stored in `morphcode_player_stats`.

- New component: `XPBar.tsx` — animated progress bar with level indicator
- Show on lobby + results screen
- Database: add `xp` and `level` columns to `morphcode_player_stats`

### 2. Win Streak Tracker + Streak Flames
Track consecutive wins. Show a flame icon + count on the lobby and VS screen when on a streak (e.g., "🔥 4"). Streaks give XP multipliers (2x at 3 streak, 3x at 5).

- Add `current_streak` column to `morphcode_player_stats`
- Show streak badge in `MorphcodeLobby`, `VersusScreen`, `MatchScoreBar`

### 3. Confetti + Particle Celebration on Win
When a round or match is won, fire a burst of colored particles (using CSS keyframe animations — no library needed). Symbols from the solved sequence fly outward with physics-like easing.

- New component: `CodeCelebration.tsx` — CSS-only confetti burst
- Triggered in `RoundResults` on win

### 4. Animated Phase Transitions
Currently phases just swap instantly. Add smooth transitions:
- Lobby → Setup: card slides up, pool symbols stagger in one by one
- Setup → Playing: sequence slots "lock" with a padlock animation, board slides in
- Playing → Round End: board fades, results card scales in from center

- Wrap phase content in transition containers with CSS animations

### 5. "Rank" Title System
Based on total wins, show a rank title: Novice (0), Decoder (5), Cipher (15), Cryptographer (30), Grandmaster (50). Displayed on VS screen and lobby.

- Computed from existing stats, no new DB columns needed
- Helper function `getRankTitle(wins: number)` in types or matchService

### 6. Guess Feedback Enhancement — Animated Pips
Instead of static `2⬤ 1◐` text, show feedback as animated colored dots that pop in sequentially with a stagger delay. Exact pips glow green, shifted glow gold, misses appear gray.

- New component: `FeedbackPips.tsx` — replaces inline text in `GuessBoard`
- Each pip animates in with 100ms stagger

### 7. Timer Ring (Circular Progress)
Replace the text-only timer with a circular countdown ring around the turn indicator. Fills from full to empty, changes color at thresholds (green → yellow → red). Adds visual urgency.

- New component: `TurnTimer.tsx` — SVG circle with `stroke-dashoffset` animation
- Replaces the `{timeLeft}s` badge in `GuessBoard`

### 8. "Rematch" Button on Results
After a match ends, show a "Rematch" button that creates a new match and auto-invites the same opponent (using their user ID). Much more engaging than going back to the lobby.

- Add `createRematch(opponentId)` to `matchService`
- Show in `RoundResults` when `matchOver` is true

---

## Files

| File | Change |
|------|--------|
| `src/components/morphcode/XPBar.tsx` | **New** — XP progress bar + level badge |
| `src/components/morphcode/CodeCelebration.tsx` | **New** — CSS confetti/particle burst |
| `src/components/morphcode/FeedbackPips.tsx` | **New** — animated guess feedback dots |
| `src/components/morphcode/TurnTimer.tsx` | **New** — SVG circular countdown |
| `src/lib/morphcode/types.ts` | Add rank title helper, XP constants |
| `src/lib/morphcode/matchService.ts` | Add `updateXP()`, `createRematch()`, streak logic |
| `src/components/morphcode/GuessBoard.tsx` | Use FeedbackPips + TurnTimer |
| `src/components/morphcode/RoundResults.tsx` | Add CodeCelebration, XP gain display, rematch button |
| `src/components/morphcode/VersusScreen.tsx` | Show rank titles + streak flames |
| `src/components/morphcode/MorphcodeLobby.tsx` | Show XP bar, rank, streak |
| `src/components/morphcode/MatchScoreBar.tsx` | Show rank badges + streak |
| `src/components/morphcode/SequenceBuilder.tsx` | Staggered symbol pool entry animation |
| `src/pages/MorphCode.tsx` | Phase transition wrappers |
| **Migration** | Add `xp`, `level`, `current_streak` to `morphcode_player_stats` |


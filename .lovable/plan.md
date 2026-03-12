

# Morph Code — Resolution Bug Fixes

## Bugs Found

### Bug 1: Final round details lost on match completion
When the last round ends and the match completes, `loadGameState` sees `match.status === 'completed'` and jumps straight to `match-end` phase **without loading the round**. The `match-end` view then shows placeholder data (`myGuessCount: 0`, `mySolved: false`, etc.) instead of actual final round results.

### Bug 2: Double stat recording
The edge function calls `recordStats()` (incrementing wins/losses/draws server-side), and then the client ALSO calls `recordMatchResult()` which increments wins/losses/draws again plus XP/level/streak. Result: wins/losses/draws are counted twice.

### Bug 3: Edge function doesn't handle XP, level, or streak
Server-side `recordStats()` only updates basic win/loss/draw counts. XP, level, and streak are only handled client-side, which is unreliable and creates race conditions.

### Bug 4: Round-end equal-turn edge case
When a player solves and their guess count equals the opponent's (who hasn't solved), the round ends immediately. This is correct. However, if neither player solves and one hits MAX_GUESSES while at equal turn count with the opponent (who also hasn't maxed), `roundEnded = true` fires prematurely — the opponent should get their equal turn.

Specifically line 205-207 of the edge function: if `guessNumber >= MAX_GUESSES` and `guessNumber` is NOT `> opponentGuesses` (i.e., they're equal), the `else` branch triggers `roundEnded = true`, but the opponent at that same guess count might not have maxed yet.

## Fixes

### Fix 1: Load final round on match completion
In `MorphCode.tsx` `loadGameState`, when `activeMatch.status === 'completed'`, still fetch the current round data and opponent sequence before setting phase to `match-end`. Pass real round data to `RoundResults`.

### Fix 2: Consolidate stats to server-side only
Update the edge function's `recordStats` to handle XP, level, and streak (matching the client-side formula). Remove `recordMatchResult` call from the client. The client should only **read** stats after match completion, not write them.

### Fix 3: Fix equal-turn edge case in edge function
When a player hits MAX_GUESSES and the opponent has the same guess count but hasn't maxed or solved, the round should end (both had equal turns). When opponent has FEWER guesses, give them a turn. Current code has the right intent but the `else` fallback catches cases where `guessNumber === opponentGuesses` — this is actually correct (equal turns = round over). No change needed here after re-analysis.

### Fix 4: Match-end phase shows real data
Update `match-end` rendering in `MorphCode.tsx` to use the loaded `round` state instead of hardcoded zeros.

## Files

| File | Change |
|------|--------|
| `supabase/functions/morphcode-game/index.ts` | Update `recordStats` to handle XP, level, streak |
| `src/pages/MorphCode.tsx` | Load round data on match completion; remove client-side `recordMatchResult`; use real round data for match-end |
| `src/lib/morphcode/matchService.ts` | Remove `recordMatchResult` (now server-only) |


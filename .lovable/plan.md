

# Morph Code — Final Comprehensive Polish Pass

## Issues Found

### 1. How To Play modal shows outdated feedback icons
The modal still uses colored dot icons (⬤ and ◐) to explain feedback, but the actual game now uses numeric badges (`2 ✓` / `1 ~`). This creates confusion for new players.

### 2. Celebration effect timing bug
In `RoundResults.tsx`, the `showCelebration` state is set in the same render cycle as the check, so the cleanup timeout may not trigger. The `useEffect` checks `showCelebration` after setting it, but since state updates are async, the cleanup branch (`if (showCelebration)`) will never execute on the first render — it reads the stale `false` value.

### 3. GuessBoard doesn't show feedback when player is solved but opponent still playing
When `mySolved` is true and it's not my turn, the board shows the "Opponent is thinking" indicator but doesn't clearly indicate the player is done and just watching. The solved state could be more visually distinct.

### 4. Edge function: match update runs before round update
In `submit_guess`, the match update (`morphcode_matches`) is written before the round update (`morphcode_rounds`) on line 319 vs 322. If the client receives the realtime match update first and fetches the round, it may still see `status: 'active'`. Swapping the order ensures the round is finalized before the match status changes.

### 5. Minor: RoundResults XP calculation for draws is wrong
Line 68: `isDraw ? XP_SOLVE : XP_LOSS` — but draws should use `XP_SOLVE` (50), which is correct. However the display says "+50 XP" for a draw which is actually intended as a consolation. This is fine semantically but the variable name `XP_SOLVE` is misleading in a draw context. Low priority — no code change needed.

### 6. MatchScoreBar renders 2 dots but rounds_to_win is 2 (best of 3)
The score bar shows 2 dots per side (matching `rounds_to_win = 2`), which is correct.

## Fixes

### Fix 1: Update How To Play to match new feedback style
Replace the dot icons with the actual badge format used in-game (`✓` for exact, `~` for shifted), styled as inline badges matching `FeedbackPips`.

### Fix 2: Fix celebration timeout race condition
Move the celebration timeout into a separate `useEffect` that watches `showCelebration`.

### Fix 3: Better solved state in GuessBoard
Add a "You solved it!" banner with a checkmark when `mySolved` is true and it's not the player's turn, replacing the generic "Opponent's turn" text. Already partially done — the text says "✓ Solved!" — but add a more prominent visual treatment.

### Fix 4: Swap round/match update order in edge function
Write `morphcode_rounds` update before `morphcode_matches` update so realtime listeners see consistent state.

## File Summary

| File | Change |
|------|--------|
| `src/components/morphcode/MorphcodeHowToPlay.tsx` | Update feedback examples to use badge format |
| `src/components/morphcode/RoundResults.tsx` | Fix celebration timeout race |
| `supabase/functions/morphcode-game/index.ts` | Swap round/match update order |
| `src/components/morphcode/GuessBoard.tsx` | Better visual for solved state |


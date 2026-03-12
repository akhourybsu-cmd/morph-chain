

# Morph Code — Game Polish, Realtime Stability & Responsive Fixes

## Problems Identified

### 1. Constant refreshing / flickering during live play
Every realtime Postgres change (match update, round update, guess insert) triggers a full `loadGameState()` which re-fetches the match, round, AND all guesses from scratch. This causes:
- UI flicker as state momentarily clears and repopulates
- Multiple simultaneous fetches when several DB changes fire at once (e.g. round update + match update together)
- The `loadGameState` callback depends on `hasShownVersus`, causing the realtime channel to unsubscribe/resubscribe every time that flag changes

### 2. Symbol icons are inconsistent
The symbols use a mix of emoji (`🔥`, `👁`) and Unicode text characters (`●`, `▲`, `◆`, `〰`). Emoji render larger and with color on most devices, while text characters are monochrome and smaller. This creates visual inconsistency.

### 3. Lobby layout / centering
Generally clean, but the "waiting for opponent" and "searching" states could be better centered vertically. The FriendsList polling every 10 seconds is wasteful when there's no change — should use realtime subscription instead.

### 4. Game mechanics review
The core mechanics are solid (alternating turns, equal-turn rule, tiebreakers). One fun issue: when it's NOT your turn, the UI shows nothing interactive — just "Opponent's turn" text. There's no live indicator of opponent progress.

---

## Plan

### Fix 1: Debounce realtime updates + stabilize subscriptions
**`MorphCode.tsx`**
- Add a debounce (300ms) to `loadGameState` calls from realtime events, so rapid-fire DB changes only trigger one fetch
- Remove `hasShownVersus` from the `loadGameState` `useCallback` dependency array — use a ref instead to prevent channel re-subscriptions
- Stabilize the realtime channel by keying it on `match.id` only (not on the callback reference)

### Fix 2: Replace inconsistent emoji symbols with uniform SVG icons
**`types.ts`** — Change all `SYMBOL_DISPLAY` entries to use consistent single-character symbols that render uniformly:
- circle: `●`, triangle: `▲`, wave: `∿`, flame: `✦`, eye: `◉`, shard: `◆`

**`SymbolSlot.tsx`** — Add distinct background color tints per symbol so they're visually distinguishable even without relying on emoji rendering. Each symbol gets a subtle colored background instead of all being the same card-bg.

### Fix 3: Show live opponent activity during play
**`GuessBoard.tsx`** — When it's NOT your turn:
- Show a pulsing "Opponent is thinking..." indicator with an animated timer
- Show the opponent's guess count updating in real-time as new guesses arrive (already works via realtime, just needs better visual treatment)

### Fix 4: Replace FriendsList polling with realtime
**`FriendsList.tsx`** — Replace the 10-second `setInterval(loadData)` with a realtime subscription on `app_activity` for challenge notifications. Keep the friends list itself on a longer poll (30s) since it changes rarely.

### Fix 5: Improve lobby vertical centering
**`MorphcodeLobby.tsx`** — Use `min-h-[calc(100vh-3.5rem)]` with `justify-center` for the waiting/queuing states so they appear centered on screen instead of stuck to the top.

### Fix 6: Minor gameplay UX improvements
- **`GuessBoard.tsx`**: Show remaining guesses counter (`3 of 8`)
- **`MatchScoreBar.tsx`**: Show opponent's display name instead of "Opp"
- **`RoundResults.tsx`**: Always show opponent's sequence after round ends (currently only if `opponentSequence` is passed, but it never is — need to fetch it)

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/MorphCode.tsx` | Debounced realtime, stabilize subscriptions with refs |
| `src/lib/morphcode/types.ts` | Replace emoji with uniform Unicode symbols |
| `src/components/morphcode/SymbolSlot.tsx` | Add per-symbol color tints for visual distinction |
| `src/components/morphcode/GuessBoard.tsx` | Opponent thinking indicator, guess counter |
| `src/components/morphcode/FriendsList.tsx` | Realtime challenge subscription instead of polling |
| `src/components/morphcode/MorphcodeLobby.tsx` | Better vertical centering for waiting states |
| `src/components/morphcode/MatchScoreBar.tsx` | Show opponent display name |
| `src/components/morphcode/RoundResults.tsx` | Fetch & show opponent sequence on round end |
| `src/lib/morphcode/matchService.ts` | Add `getOpponentSequence()` helper |




# Morph Clash Performance Optimizations

## Issues Identified

1. **Edge function returns partial data** — `submit_move` doesn't return the full updated match object, forcing a second DB round-trip via `refreshMatch`
2. **HUD fetches last move from DB on every render** — separate query to `clash_moves` on each `match` change, even though the store already has `lastMoveResult`
3. **Realtime debounce too conservative** — 800ms action ignore window + 300ms debounce = up to 1.1s delay for opponent moves to appear
4. **Lobby loads sequentially** — `getFriends()` and `getPendingChallenges()` are called after auth resolves, but not parallelized with match list loading
5. **Bot move delay too long** — 1500ms artificial delay before triggering bot move feels sluggish
6. **ClashBoard re-renders on every selection** — `isAdjacent` check and `.some()` / `.findIndex()` called per tile per render (25 tiles × n selections)
7. **No optimistic ownership update** — after submit, tiles don't visually change until the server responds (or refresh completes)
8. **Dictionary loading on cold start** — first move after cold start waits for ~170KB dictionary fetch

## Plan

### 1. Return full match from edge function (biggest win)
**File:** `supabase/functions/grid-duel-game/index.ts`
- After updating `clash_matches`, re-select the full row and include it in the `submit_move` response as `match`
- Also do this for `skip_turn` and `forfeit` actions
- This eliminates the `refreshMatch` call after every action

### 2. Remove redundant last-move DB query from HUD
**File:** `src/components/clash/ClashHUD.tsx`
- Remove the `useEffect` that queries `clash_moves` on every `moves_a`/`moves_b` change
- Instead, store `lastPlayedWord` in the Zustand store (set from `submit_move` response AND from realtime refresh)
- For initial load, do a single fetch only on mount, not on every move count change

### 3. Reduce realtime delays
**File:** `src/stores/clashStore.ts`
- Reduce action ignore window from 800ms → 400ms
- Reduce debounce from 300ms → 150ms
- Reduce bot move delay from 1500ms → 800ms

### 4. Add optimistic ownership update
**File:** `src/stores/clashStore.ts`
- In `submitMove`, before calling the edge function, optimistically update `match.ownership` for the selected tiles to the current player's color
- Revert if the server returns an error

### 5. Parallelize lobby data loading
**File:** `src/pages/MorphClash.tsx`
- In `refreshMatchList`, the match list and profile fetches are already parallelized, but friends/challenges in ClashLobby load independently
- Pass pre-fetched data or trigger all fetches simultaneously

### 6. Pre-warm dictionary on edge function deploy
**File:** `supabase/functions/grid-duel-game/index.ts`
- Trigger `loadTWL06()` at module level (outside the request handler) so it starts loading during cold start before the first request arrives

### Files Modified
1. `supabase/functions/grid-duel-game/index.ts` — Return full match in responses; pre-warm dictionary
2. `src/stores/clashStore.ts` — Optimistic ownership; store last word; reduce delays; skip redundant refreshes
3. `src/components/clash/ClashHUD.tsx` — Use store for last word instead of separate DB query
4. `src/pages/MorphClash.tsx` — Minor: parallelize lobby data


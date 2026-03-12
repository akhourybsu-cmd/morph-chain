

# Morph Clash — Polish & Bug Fix Audit

After reviewing every Clash component, the store, the edge function, and the CSS tokens, here are the issues found and the fixes needed.

## Issues Found

### 1. Board flashes/refreshes on submit (critical UX)
`submitMove()` sets `loading: true`, calls the edge function, then calls `loadMatch()` which sets `loading: true` AGAIN and resets `selected: []`. Meanwhile, the realtime subscription also fires `loadMatch()` from the DB update — causing a **triple state churn** (submit loading → loadMatch loading → realtime loadMatch). This makes the board visibly flash/jump.

**Fix**: Optimistic update pattern:
- `submitMove` applies the response data (new ownership, tile counts) directly to the store state instead of re-fetching
- Add a `silentLoadMatch` that doesn't set `loading` or reset `selected` — used by realtime and post-submit sync
- Add a short debounce skip flag so realtime doesn't double-fetch right after a user action

### 2. Error not captured correctly in ClashActionBar
`handleSubmit` reads `error` from the store destructure (line 12), but after `await submitMove()`, the closure still holds the old `error` value. The error set inside `submitMove` won't be visible.

**Fix**: Read error from `useClashStore.getState().error` after the await, or have `submitMove` return the error string.

### 3. `loadMatch` always resets selection
If realtime fires while a player is mid-selection (choosing tiles for a word), all their selected tiles get wiped because `loadMatch` sets `selected: []`.

**Fix**: Only reset selection when the match data actually changes turns (current_turn changed) or status changed. Otherwise preserve selection.

### 4. ClashMenuSheet uses wrong `currentGame`
Line 35: `currentGame="morphcode"` — should be `"clash"`.

### 5. Missing "opponent's turn" visual feedback
When it's not your turn, tiles just have `opacity-90` and `cursor-default`. There's no clear visual indicator. Add a subtle overlay or label.

### 6. No loading state for initial match load
When tapping a match from the list, there's no skeleton/spinner shown while `loadMatch` fetches. The screen is blank.

## Implementation Plan

### A. Store refactor (`clashStore.ts`)
- Split `loadMatch` into two: keep current for initial load, add `refreshMatch` (silent, no loading/selection reset)
- `submitMove`: return `{ success: boolean; error?: string }` instead of just boolean. Apply response data optimistically to `match` state without re-fetching
- Add `lastFetchTime` to skip realtime triggers within 500ms of a user action
- Realtime handler uses `refreshMatch` instead of `loadMatch`
- `refreshMatch` preserves `selected` unless `current_turn` changed

### B. ClashActionBar fix
- Read error from return value of `submitMove` instead of store closure
- Add brief "locked in" visual feedback: disable button immediately, show checkmark briefly on success before clearing

### C. ClashBoard polish
- Add subtle "Not your turn" overlay text when `!isMyTurn && match.status === 'active'`
- Add tile claim animation: tiles that were just claimed (from `lastMoveResult`) get a brief scale-up + color transition

### D. ClashMenuSheet fix
- Change `currentGame="morphcode"` to `currentGame="clash"`

### E. Loading skeleton
- Add a simple skeleton in `MorphClash.tsx` when `match` is being loaded (store `loading` is true but `match` is null)

**Files modified**: `clashStore.ts`, `ClashActionBar.tsx`, `ClashBoard.tsx`, `ClashMenuSheet.tsx`, `MorphClash.tsx`

No database changes needed. No edge function changes needed — the server logic is solid.


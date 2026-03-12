

# Morph Code — Critical Bug Fixes

## Bugs Found

### 1. **RLS blocks ALL match joining** (CRITICAL)
The `morphcode_matches` UPDATE policy requires `auth.uid() = player_a OR auth.uid() = player_b`. When a user tries to join a match (via code or direct challenge), they call `finalizeJoin` which updates the match to set `player_b`. But since they aren't `player_b` *yet*, the RLS policy silently blocks the update. **No match can ever be joined.**

**Fix:** Add a new RLS UPDATE policy that allows authenticated users to update a match with status `'waiting'` if they are setting themselves as `player_b`. Alternatively, use a database function with `SECURITY DEFINER` to handle the join.

### 2. **Completed matches are invisible to `getActiveMatch`** (CRITICAL)
`getActiveMatch` filters by `status IN ('waiting', 'setup', 'active')`. When the edge function marks a match as `'completed'`, the realtime subscription fires `loadGameState`, which calls `getActiveMatch` — which returns `null`. The user is dumped to the lobby without ever seeing the results screen.

**Fix:** Add `'completed'` to the `getActiveMatch` status filter, but only if `completed_at` is recent (e.g., last 5 minutes) to avoid showing stale matches forever. Or filter for completed matches separately.

### 3. **`declineChallenge` silently fails** (MODERATE)
`declineChallenge` updates the match status to `'expired'`, but the challenged user is not `player_a` or `player_b`, so the RLS UPDATE policy blocks it. The challenge never actually gets declined.

**Fix:** Handled by the same SECURITY DEFINER function approach as bug #1, or by adding a specific RLS policy.

### 4. **No max round limit — infinite match on repeated draws** (MODERATE)
If rounds keep ending in draws, neither player's win count increments. The match never reaches `rounds_to_win` and continues indefinitely.

**Fix:** Add a max round cap (e.g., 5 rounds). If reached without a winner, determine winner by total guesses across all rounds, or declare a draw.

### 5. **`handleNextRound` records stats too late** (MINOR)
In `MorphCode.tsx`, when `match.status === 'completed'`, `handleNextRound` tries to record match results then resets state to lobby. But if realtime already cleared the match (bug #2), the user never gets to click "Back to Lobby" and stats are never recorded.

**Fix:** Record stats immediately when a match completion is detected, not on button click.

---

## Implementation Plan

### Migration: Fix RLS + Add join function + Max round cap
```sql
-- 1. Security definer function for joining matches
CREATE OR REPLACE FUNCTION public.join_match(p_match_id uuid)
RETURNS uuid AS $$
  -- validates match is 'waiting', user isn't player_a, sets player_b + creates round 1
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Security definer function for declining/expiring matches  
CREATE OR REPLACE FUNCTION public.expire_match(p_match_id uuid)
RETURNS boolean AS $$
  -- validates match is 'waiting', expires it
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `matchService.ts` changes
- `finalizeJoin` → call `join_match` RPC instead of direct update
- `declineChallenge` → call `expire_match` RPC
- `getActiveMatch` → include `'completed'` in status filter with a recency check (`completed_at > now() - 5 min`)
- `cancelMatch` stale match cleanup → use `expire_match` RPC for non-owned matches

### `morphcode-game/index.ts` (edge function)
- Add max round enforcement (cap at 5 rounds)
- When max rounds reached with no winner: compare total round wins, then total guesses, declare winner or draw
- Record match stats server-side when match completes (so stats aren't lost if client disconnects)

### `MorphCode.tsx`
- Record match result when detecting completion in `loadGameState`, not on button click
- Prevent `loadGameState` from clearing match data when match is recently completed

### Files Modified
- **Migration**: `join_match` + `expire_match` security definer functions
- `src/lib/morphcode/matchService.ts` — use RPCs, fix `getActiveMatch` filter
- `supabase/functions/morphcode-game/index.ts` — max round cap, server-side stats recording
- `src/pages/MorphCode.tsx` — fix completion handling, record stats on detection


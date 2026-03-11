

# Morph Code — Header Fix, Exit Logic, Stat Tracking, VS Screen

## Issues Identified

1. **Header misalignment**: The header layout uses 3-column flex with spacers correctly, but the left column has 2 items (menu + theme toggle) while the right has only 1, causing the logo to shift off-center. Chain header solves this by having 2 items on the right too (sound + help).
2. **Stuck on join code screen**: No cancel/back button when viewing a created invite code. No ability to cancel a waiting match or forfeit. `getActiveMatch` always returns an active/waiting match with no escape.
3. **No stat tracking**: No wins/losses/draws tracking exists.
4. **No VS screen**: When a match is found, it jumps directly to setup with no intro animation.

---

## 1. Fix Header Centering

Add a spacer/invisible button on the right side to balance the left column's 2 items, OR wrap the right side in a div with the same width as the left. Following the Chain pattern: put the right items in a `flex items-center gap-1` div matching the left div's width.

**File**: `MorphcodeHeader.tsx`
- Wrap right side in a `div` with `flex items-center gap-1` matching left
- Add invisible spacer or move theme toggle to right side to balance

## 2. Cancel/Leave Match Logic

**matchService.ts** — Add `cancelMatch(matchId)` function:
- If match status is `waiting`, delete the match
- If match status is `setup`/`active`, set status to `forfeited`

**MorphcodeLobby.tsx** — Add "Cancel" button below the invite code card:
- Calls `cancelMatch`, then `onMatchCancelled` callback to reset to lobby

**MorphCode.tsx** — Add `onCancelMatch` handler:
- Calls cancelMatch, clears match/round state, sets phase to `lobby`
- Pass cancel handler down to lobby and waiting screens

## 3. Stat Tracking (Wins/Losses/Draws)

**Database migration** — Create `morphcode_stats` table:
```sql
CREATE TABLE morphcode_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- NO, avoid FK to auth.users
);
```

Actually, use this pattern (no FK to auth.users):
```sql
CREATE TABLE morphcode_stats (
  user_id uuid PRIMARY KEY NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
- RLS: Users can view all stats (for VS screen), upsert own stats
- Update stats in the edge function's round-completion logic, or client-side after match ends

**matchService.ts** — Add `getPlayerStats(userId)` and `recordMatchResult(winnerId, loserId, isDraw)` functions.

**MatchScoreBar.tsx** — Show W-L-D record beneath each player label ("You" / "Opp").

## 4. VS Screen Animation

**New component**: `VersusScreen.tsx`
- Full-screen overlay shown when match transitions from `waiting` → `setup`
- Shows "Player A" vs "Player B" with display names / initials
- Shows each player's W-L-D record underneath
- Animated entrance: players slide in from left/right, "VS" pulses in center
- Auto-dismisses after 3 seconds or tap to skip
- Uses `--code-*` prestige tokens

**MorphCode.tsx** — Add `versus` phase:
- When match first enters `setup` and round 1 starts, show VS screen
- After VS screen dismisses, transition to `setup` phase

**GamePhase type** — Add `'versus'` to the union.

---

## Implementation Order

1. Fix header centering (balance left/right columns)
2. Add `cancelMatch` to matchService + cancel buttons in lobby/waiting states
3. Create `morphcode_stats` table + RLS
4. Add stat read/write functions in matchService
5. Show W-L-D in MatchScoreBar under player labels
6. Build VersusScreen component with animation
7. Wire VS screen into MorphCode page phase logic


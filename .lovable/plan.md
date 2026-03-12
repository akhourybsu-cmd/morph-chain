

# Morph Code — Direct Challenge System + Match Logic Fixes

## Problems

1. **Challenge button is broken**: Clicking "Challenge" on a friend just calls `createMatch()` which generates an invite code — but the friend never sees it. There's no notification, no in-app challenge indicator. The challenger is silently moved to a waiting state while the friend has no idea.

2. **Stale match cleanup**: `createMatch` doesn't expire previous "waiting" matches for the user, so `getActiveMatch` can return old stale matches, trapping the user.

3. **No direct join-by-match-ID**: The only way to join is `joinMatchByCode` (via a 6-char code). There's no `joinMatchById` for direct challenge acceptance.

## Solution: In-App Challenge Flow

Replace the code-sharing challenge flow with a direct challenge system using the `app_activity` table (already exists with proper RLS).

### Flow
1. **Challenger clicks "Challenge"** → Creates a match → Posts an `app_activity` entry with `activity_type: 'challenge'` and `payload: { match_id, invite_code }` for the friend
2. **Friend's FriendsList polls** for incoming challenges → Shows a "⚔ Challenge from [Name]" row with Accept/Decline buttons
3. **Friend clicks Accept** → Joins the match by ID directly → Match transitions to `setup`
4. **Friend clicks Decline** → Deletes the activity entry and cancels/expires the match

### Database Changes
- **New RLS policy on `app_activity`**: Need to allow DELETE for challenge entries (currently blocked by `false` policy). Instead, add a column or use a separate approach — actually, we can mark challenges as `dismissed` by inserting a response activity. Or simpler: just filter out accepted challenges client-side since the match status changes to `setup`/`active`.
- No new tables needed. Use existing `app_activity` for challenge notifications.

### Implementation

#### 1. `matchService.ts` — Fix & Extend
- **`createMatch`**: Before inserting, expire any existing `waiting` matches by this user
- **`challengeFriend(friendUserId)`**: Creates match + inserts `app_activity` with `game: 'morphcode'`, `activity_type: 'challenge'`, `payload: { match_id }`
- **`joinMatchById(matchId)`**: Like `joinMatchByCode` but by ID directly
- **`getIncomingChallenges()`**: Query `app_activity` where game='morphcode', activity_type='challenge', and the match is still in 'waiting' status, filtered to entries from friends
- **`declineChallenge(activityId, matchId)`**: Expires the match

#### 2. `FriendsList.tsx` — Show Challenges
- Poll for incoming challenges alongside friend list refresh (every 15s already)
- Show challenge entries above the friend list as a "Challenge Received" section with Accept/Decline buttons
- Accept calls `joinMatchById` → triggers `onChallengeMatch`
- Decline calls `declineChallenge`

#### 3. `MorphCode.tsx` — No changes needed
The existing realtime subscription + `loadGameState` already handles match state transitions. When a friend accepts, the match moves to `setup`, triggering the VS screen.

#### 4. Handle the `app_activity` DELETE RLS issue
Current policy blocks all deletes. Two options:
- **Option A**: Don't delete — just let challenges become stale (match status changes to non-waiting, so they stop showing)
- **Option B**: Add a new policy allowing users to delete challenge activities addressed to them

**Decision: Option A** — No migration needed. Filter challenges by checking the match is still `status: 'waiting'`. Once accepted/expired, it naturally disappears.

Actually, we DO need the challenger's activity to be visible to the friend. The current `app_activity` SELECT policy requires a `morphcode_friends` relationship with `status: 'accepted'` — that's already correct since challenges go to friends.

### Files Modified
- `src/lib/morphcode/matchService.ts` — Add `challengeFriend`, `joinMatchById`, `getIncomingChallenges`, fix `createMatch` stale cleanup
- `src/components/morphcode/FriendsList.tsx` — Show incoming challenges with Accept/Decline, wire up challenge button to `challengeFriend`

### Implementation Order
1. Fix `createMatch` to expire stale waiting matches first
2. Add `challengeFriend`, `joinMatchById`, `getIncomingChallenges` to matchService
3. Update `FriendsList` to poll for challenges and show Accept/Decline UI
4. Update challenge button to use `challengeFriend` instead of raw `createMatch`


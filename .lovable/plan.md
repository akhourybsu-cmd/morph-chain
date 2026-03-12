

# Remove Invite Codes — Direct Challenge Join Buttons Only

## What Changes

Both Morph Code and Morph Clash currently have two ways to start matches: invite codes (create code, share, enter code) and direct friend challenges (via the friends list). We're removing the code-based flow entirely. The only way to start a match is by challenging a friend from your friends list (or finding a random opponent in Morph Code).

## Changes by File

### 1. `src/components/clash/ClashLobby.tsx`
- Remove the "Create Match" button and the "Join a match" code input section entirely
- Remove `inviteCode` state, `handleJoin`, `handleJoinWithCode` functions
- Remove the `initialJoinCode` prop handling
- Keep: sign-in prompt, pending challenges section, online friends with "Challenge" buttons
- The only way to start a Clash match is by challenging a friend or accepting a challenge

### 2. `src/components/clash/ClashBoard.tsx`
- Remove the "Waiting for opponent" banner that shows the invite code (lines 95-130)
- Replace with a simpler "Waiting for opponent to accept..." message (no code display, no share button)
- Remove `copyCode` and `handleShare` functions

### 3. `src/pages/MorphClash.tsx`
- Remove `joinCode` search param handling (lines 26-33)
- Remove `initialJoinCode` prop from `ClashLobby`
- Simplify `handleMatchFound` (no more join code clearing)

### 4. `src/components/morphcode/MorphcodeLobby.tsx`
- Remove "Create Private Match" button and the "Join a match" code input section
- Remove `createdCode`, `inviteCode` state and related handlers
- Remove the waiting/code display screen
- Keep: sign-in prompt, friends list (already has challenge buttons), random opponent queue
- The "or" divider stays between Friends and Random Opponent

### 5. `src/pages/MorphCode.tsx`
- Remove `existingInviteCode` and `existingMatchId` props from the `MorphcodeLobby` in the waiting phase (lines 301-309)
- When match status is `waiting`, show a simple "Waiting for opponent to accept..." state instead of re-rendering the lobby with a code

### 6. `src/lib/clash/matchService.ts`
- `challengeFriend`: still creates a match internally (codes are still generated server-side for DB purposes), but no longer surfaces the code to the UI
- `joinClashByCode`: keep for backwards compatibility but it won't be called from UI
- Remove the code-copy/share-related exports from the type if needed

### 7. `src/lib/morphcode/matchService.ts`
- `challengeFriend`: already works via direct match ID — no changes needed
- `createMatch`: still used internally by `challengeFriend` — keep but won't be called directly from UI

## What Stays
- Friend codes (for adding friends) — these are different from match invite codes
- The `app_activity` challenge system (challenge → accept/decline)
- Random opponent queue in Morph Code
- The underlying invite_code column in the DB (no migration needed, just unused in UI)

## Summary
6-7 files modified. No database changes. The lobby for both games becomes: Friends list with Challenge buttons + pending challenges with Accept/Decline. Morph Code also keeps the random queue option.


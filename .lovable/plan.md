

# Show Pending Matches in List with Board Preview

## What's Happening Now
When you create a match, you're stuck on the invite code screen until someone joins. You can hit back, and the match appears in your list as "Waiting for opponent," but tapping it just shows the invite code screen again — not the board.

## What Changes

### 1. Tapping a waiting match shows the board (read-only) + invite banner
Instead of re-showing the lobby/code screen when you tap a pending match, show the actual grid board in a read-only state with a persistent banner at the top displaying the invite code, share button, and "Waiting for opponent to join..." message.

### 2. Auto-return to list after creating a match
After creating a match and copying/sharing the code, automatically navigate back to the match list instead of keeping the user on the code screen. The new match appears at the top of the list with "Waiting for opponent."

### 3. Realtime subscription keeps working
The match is already subscribed to realtime updates. When the opponent joins, the match status flips to `active`, the banner disappears, and the board becomes playable — whether you're viewing it or not.

## Technical Changes

**`MorphClash.tsx`** — Change `showBoard` to include `waiting` status:
```typescript
const showBoard = match && ['active', 'completed', 'waiting'].includes(match.status);
```
Remove the `showWaiting` path that re-renders the lobby.

**`ClashBoard.tsx`** — Add a "Waiting for opponent" banner with invite code + share button when `match.status === 'waiting'`. Board renders but tiles are non-interactive.

**`ClashLobby.tsx`** — After match creation, call a new `onMatchCreatedAndShared` callback that loads the match into the list view and subscribes to realtime, rather than staying on the code screen.

**`ClashHUD.tsx`** — Handle waiting state gracefully (show "—" for opponent tiles, no turn indicator).

Four files modified, no database changes.


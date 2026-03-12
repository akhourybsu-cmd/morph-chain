

# Add Bot Opponents for Morph Code and Morph Clash

## Overview
Add a "Play vs Bot" option to both game lobbies. The bot will be implemented server-side in the existing edge functions, using a fixed bot UUID. After each player move, the client triggers the bot's response via a `bot_move` action.

## Database Changes

**Migration**: Add `is_bot_match` column to both match tables:
```sql
ALTER TABLE morphcode_matches ADD COLUMN is_bot_match boolean NOT NULL DEFAULT false;
ALTER TABLE clash_matches ADD COLUMN is_bot_match boolean NOT NULL DEFAULT false;
```

## Bot Identity
Use a fixed sentinel UUID for the bot: `00000000-0000-0000-0000-b07b07b07b07`. This never needs to authenticate -- the edge functions use the admin/service client for bot moves.

## Edge Function Changes

### `morphcode-game/index.ts` -- Add 2 new actions:

**`create_bot_match`**: Creates a match with the bot as player_b, auto-creates round 1, and locks the bot's sequence (random 4 unique symbols from the pool). Returns the match ID ready for the player to lock their sequence.

**`bot_guess`**: Called by the client after the player's guess when it's the bot's turn. The bot uses a simple strategy:
- Round 1: random valid guess
- Subsequent: eliminate symbols that got 0 exact+shifted, prefer symbols that got feedback
- This gives a "medium difficulty" opponent that solves in 4-6 guesses typically

### `grid-duel-game/index.ts` -- Add 2 new actions:

**`create_bot_match`**: Creates a Clash match with the bot as player_b, immediately sets status to `active`, assigns a random first turn, sets `is_bot_match = true`. If the bot goes first, automatically plays the bot's first move.

**`bot_move`**: Called by the client after the player submits a move (when the new `current_turn` is the bot). The bot:
1. DFS all adjacent paths of length 4-6 on the grid
2. For each path, forms the word from tile chars
3. Validates each candidate against `admin_dictionary` (batch query for efficiency)
4. Scores candidates by: tiles claimed from opponent > neutral tiles claimed > word length
5. Picks the best word and submits it using the same `applyOwnership` + `morphAfterMove` logic
6. Falls back to skip if no valid word found (unlikely but safe)

## Client Changes

### `MorphcodeLobby.tsx`
Add a "Play vs Bot" button card (with a Bot/Cpu icon) between the Friends section and the "Find Random Opponent" section. On click, calls a new `createBotMatch()` function from matchService, then triggers `onMatchFound`.

### `ClashLobby.tsx`
Add a "Play vs Bot" button card at the bottom of the lobby (after friends list or empty state). Same pattern.

### `src/lib/morphcode/matchService.ts`
Add `createBotMatch()`: calls the edge function with `action: 'create_bot_match'`, returns the match ID.
Add `triggerBotGuess(roundId)`: calls the edge function with `action: 'bot_guess'`.

### `src/lib/clash/matchService.ts`
Add `createClashBotMatch()`: calls the edge function with `action: 'create_bot_match'`, returns the match ID.
Add `triggerClashBotMove(matchId)`: calls the edge function with `action: 'bot_move'`.

### `src/pages/MorphCode.tsx`
After submitting a guess, if `match.is_bot_match` and the round's `current_turn` switches to the bot UUID, automatically call `triggerBotGuess(round.id)` with a small delay (1-2s) for UX feel.

### `src/pages/MorphClash.tsx` / `src/stores/clashStore.ts`
After `submitMove` succeeds, if `match.is_bot_match` and `current_turn` is now the bot UUID, call `triggerClashBotMove(match.id)` with a 1-2s delay.

### Display Names
When displaying player names, check if the player ID matches the bot UUID and show "Bot" instead of looking up a profile.

## Files Modified
1. `supabase/functions/morphcode-game/index.ts` -- bot_match + bot_guess actions
2. `supabase/functions/grid-duel-game/index.ts` -- bot_match + bot_move actions
3. `src/lib/morphcode/matchService.ts` -- createBotMatch, triggerBotGuess
4. `src/lib/clash/matchService.ts` -- createClashBotMatch, triggerClashBotMove
5. `src/components/morphcode/MorphcodeLobby.tsx` -- Play vs Bot button
6. `src/components/clash/ClashLobby.tsx` -- Play vs Bot button
7. `src/pages/MorphCode.tsx` -- auto-trigger bot guess
8. `src/stores/clashStore.ts` -- auto-trigger bot move
9. DB migration -- add is_bot_match columns


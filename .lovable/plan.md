

# Last Word Played + Results Word History for Morph Clash

## 1. Last Word Played (during gameplay)

Add a subtle banner below the HUD showing the most recent word played and by whom. This queries `clash_moves` for the latest move in the match and updates on each refresh.

**In `ClashHUD.tsx`:**
- After component mounts and on each `match` change, query `clash_moves` table ordered by `move_number desc`, limit 1
- Display a small row below the turn indicator: `"Last word: FLAME (You)"` or `"Last word: GRID (Bot)"` styled with the player's color
- If no moves yet, show nothing
- The `lastMoveResult` from the store can also be used for the immediate optimistic display after submitting

## 2. Results Screen — Side-by-Side Word Lists

On the completed match screen, fetch all `clash_moves` for the match and split them by `player_id` into two columns.

**In `ClashResults.tsx`:**
- On mount, query `clash_moves` where `match_id = match.id`, ordered by `move_number asc`
- Split into `myWords` and `oppWords` arrays based on `player_id`
- Render a two-column layout below the score, each column header colored with the player's color
- Words displayed as a numbered vertical list; skips shown as "—" in italic
- Scroll area if many words

## Technical Details

### Data source
The `clash_moves` table already stores every move with `word`, `player_id`, and `move_number`. No schema changes needed.

### Files modified
1. **`src/components/clash/ClashHUD.tsx`** — Add `useEffect` to fetch latest move, render "Last word" row below turn indicator
2. **`src/components/clash/ClashResults.tsx`** — Fetch all moves on mount, render side-by-side word columns


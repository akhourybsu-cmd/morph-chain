

# Sort Match List by Turn Priority + Show Opponent Names

## What Changes
The ClashMatchList will:
1. **Sort matches**: "Your turn" matches first, then "Opponent's turn", then "Waiting"
2. **Show opponent's name** instead of "Opponent's turn" (e.g. "Alex's turn")
3. **Subtle glow** on "Your turn" cards to make them pop

## Technical Approach

### `src/components/clash/ClashMatchList.tsx`
- Accept a new `opponentNames` prop: `Record<string, string>` mapping user IDs to display names
- Sort `matches` array: my-turn first, then opponent-turn, then waiting
- In `getMatchLabel()`: replace "Opponent's turn" with `"{name}'s turn"` using the names map; fall back to "Opponent's turn" if name not found; show "Bot's turn" for bot matches
- Add a subtle box-shadow glow on my-turn cards using the `--clash-accent` color variable (e.g. `boxShadow: '0 0 8px hsl(var(--clash-accent) / 0.3)'`)

### `src/pages/MorphClash.tsx`
- After fetching `activeMatches`, collect all opponent user IDs from the match list
- Batch-fetch display names from `user_profiles` table
- Pass the resulting `opponentNames` map to `ClashMatchList`

### Sorting Logic
```
1. Active + my turn (sorted by updated_at desc)
2. Active + opponent's turn
3. Waiting
4. Completed (already separate array, appended at end)
```

### Files Modified
1. `src/components/clash/ClashMatchList.tsx` — sorting, glow, opponent name display
2. `src/pages/MorphClash.tsx` — fetch opponent names, pass as prop


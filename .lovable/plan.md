

# Morph Clash — Ruleset Refinement + Invite/Challenge System

## Ruleset Refinements

After reviewing the current implementation, here are the proposed changes:

### Current Issues with Ruleset
1. **"Contested" state is confusing** — the two-touch steal mechanic adds complexity without much strategic depth. Simplify: using an opponent's tile flips it to yours but costs you that tile's "letter contribution" (word still counts, but that tile doesn't get claimed — it stays opponent's unless 3+ opponent tiles are used).
2. **10 moves each is too few** — with a 5×5 grid and min 4-letter words, 10 moves means most of the board will be unclaimed. Increase to **12 moves each** (24 total).
3. **No "pass" option** — if a player can't find a word, they're stuck. Add a **skip turn** action (costs 1 move).
4. **No word reuse prevention** — both players could play the same word. Add a **used words list** tracked on the match.

### Revised Ownership Model (Simpler)
- **Neutral tiles** → claimed by you when used
- **Your tiles** → stay yours (reinforced)
- **Opponent tiles** → flip to yours when used (direct steal, no contested state)
- Remove "contested" state entirely — cleaner, more aggressive, more fun

### Revised Win Conditions
- 24 total moves (12 each) or all 25 tiles claimed
- Domination at 18+ tiles (instant win, unchanged)
- Tiebreaker: total word-length score (unchanged)

## Invite & Challenge System (chess.com-style)

### Three Ways to Start a Match

1. **Share Link/Code** (existing) — create match → get 6-char code → share via text/clipboard. This already works.

2. **Share via Native Share** — add Web Share API integration so tapping "Share" opens the native share sheet (iMessage, WhatsApp, etc.) with a deep link like `https://morph-games.lovable.app/clash?join=ABC123`. When recipient opens the link, they're routed to the Clash page with the code pre-filled.

3. **Challenge a Friend In-App** — leverage the existing friends + `app_activity` system. From the lobby, show online friends with a "Challenge" button. Tapping it:
   - Creates the match via edge function
   - Posts a `challenge` activity to `app_activity` with `{ game: 'clash', matchId, inviteCode }`
   - Friend sees "⚔ Challenge Received" in the Clash lobby (polled or realtime)
   - Friend taps Accept → joins match directly
   - Friend taps Decline → match is cancelled

### Deep Link Handling
- Route `/clash?join=CODE` auto-fills the invite code in the lobby
- If user is logged in, auto-joins immediately
- If not logged in, shows login prompt then redirects back

## Technical Changes

### Edge Function Updates (`grid-duel-game`)
- Add `skip_turn` action
- Add `used_words` jsonb column tracking to prevent reuse
- Remove contested ownership logic, simplify to direct steal
- Update max moves constant from 10 → 12

### Database Migration
- Add `used_words` jsonb column (default `[]`) to `clash_matches`
- Remove reliance on "contested" state in ownership

### New/Modified Components
| Component | Change |
|-----------|--------|
| `ClashLobby.tsx` | Add native share button, deep link auto-join, friends challenge section |
| `ClashActionBar.tsx` | Add "Skip Turn" button |
| `MorphClash.tsx` | Read `?join=CODE` query param, pass to lobby |
| `FriendActivityFeed.tsx` | Add clash challenge rendering |
| `clashStore.ts` | Add `skipTurn` action |
| `matchService.ts` | Add `challengeFriend()` and `getPendingChallenges()` functions |

### Lobby Flow (Updated)
```text
┌─────────────────────────────────┐
│  Morph Clash Lobby              │
├─────────────────────────────────┤
│  ⚔ Challenge Received          │
│  [PlayerName] wants to play!    │
│  [Accept]  [Decline]            │
├─────────────────────────────────┤
│  Online Friends                 │
│  🟢 Alice         [Challenge]  │
│  🟢 Bob           [Challenge]  │
├─────────────────────────────────┤
│  [Create Match]                 │
│  [Join by Code: ______] [Join]  │
└─────────────────────────────────┘
```

### Share Flow
- "Create Match" → shows invite code + **Share** button
- Share button uses `navigator.share()` with URL `https://morph-games.lovable.app/clash?join=CODE`
- Fallback: clipboard copy (already exists)

## Implementation Order
1. Database migration (add `used_words` column)
2. Edge function updates (simplified ownership, skip turn, word reuse check)
3. Deep link handling in `MorphClash.tsx`
4. Lobby redesign with friend challenges + native share
5. Activity integration for challenge notifications


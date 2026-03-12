

# Morph Grid Duel — Head-to-Head Territory Control

## Game Concept

Two players share a single 5×5 letter grid and take alternating turns forming words. Each word you play **claims** the tiles you used in your color. The goal: **own more tiles than your opponent when the grid is fully claimed or moves run out.**

Think of it as **Go meets Boggle** — territory control through word-finding.

---

## Ruleset

### Setup
- Both players see the same 5×5 grid (generated from a shared seed)
- A coin flip decides who goes first
- All 25 tiles start **neutral** (gray)
- Each player has a color: **Blue** (Player A) and **Red** (Player B)

### Turns
- Players alternate turns (like chess)
- On your turn, trace adjacent tiles to form a valid word (min 4 letters)
- 60-second turn timer (live mode) or 24-hour (async)
- If the timer expires, your turn is skipped

### Tile Ownership & Claiming
Tiles have 3 ownership states: **Neutral → Yours → Opponent's**

- **Using neutral tiles**: They become **yours** immediately
- **Using your own tiles**: They stay yours (reinforced — immune to one steal attempt)
- **Using opponent's tiles**: They flip to **contested** (neutral) — you must use them again on a future turn to fully claim them
- This creates a push-pull dynamic where you can attack opponent territory but it takes two touches to fully steal

### Grid Morphing (adapted from solo)
- After each word, **used tiles get new random letters** (same morph mechanic)
- Orthogonal neighbors mutate slightly (same ripple mechanic)
- **Ownership persists through morphs** — only the letter changes, not who owns the tile
- No power tiles in Duel mode (keeps it balanced)

### Scoring & Win Condition
- Game ends when one of:
  1. **All 25 tiles are claimed** (no neutral tiles remain) — most tiles wins
  2. **20 total moves** are exhausted (10 per player) — most tiles wins
  3. **A player controls 18+ tiles** — instant win (domination)
- Tiebreaker: total word-length score (longer words = more points)

### Bonus Mechanics
- **Chain Bonus**: If you form a word using 3+ of your own tiles, gain +1 bonus claim on a random neutral tile
- **Long Word Bonus**: 6+ letter words claim 1 adjacent neutral tile as a bonus
- These bonuses only affect neutral tiles (can't auto-steal opponent tiles)

---

## Technical Architecture

### Backend (Edge Function + Realtime)
- Reuse the existing `morphcode-game` pattern: an edge function handles move validation server-side
- New tables: `grid_duel_matches`, `grid_duel_rounds`, `grid_duel_moves`
- Realtime subscription on match/round tables (same pattern as Morph Code)
- Server validates words against the dictionary, calculates morphs, updates ownership

### Database Tables

**`grid_duel_matches`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| player_a / player_b | uuid | Players |
| status | text | waiting/setup/active/completed |
| winner_id | uuid | nullable |
| grid_seed | text | Shared seed for grid generation |
| current_turn | uuid | Whose turn |
| tiles_a / tiles_b | integer | Tile counts |
| moves_a / moves_b | integer | Move counts |
| turn_time_seconds | integer | 60 or 86400 |
| invite_code | text | 6-char code |

**`grid_duel_moves`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| match_id | uuid | FK |
| player_id | uuid | Who played |
| move_number | integer | Sequential |
| word | text | The word formed |
| tiles_used | jsonb | Array of {row, col} |
| tiles_claimed | jsonb | Tiles that changed ownership |
| grid_snapshot | jsonb | Grid state after move |

### Frontend Components
- **GridDuelLobby**: Create/join match (reuse Morph Code lobby pattern)
- **GridDuelBoard**: Shared grid with color-coded tile ownership (blue/red/gray)
- **GridDuelHUD**: Score bar, turn indicator, timer
- **GridDuelResults**: End screen with territory map

### Pages & Routing
- New page: `/grid-duel` → `src/pages/GridDuel.tsx`
- New store: `src/stores/gridDuelStore.ts`
- New edge function: `supabase/functions/grid-duel-game/index.ts`
- New components in `src/components/grid-duel/`

### Visual Design
- Same NYT Prestige style as Morph Grid
- Player A tiles: soft blue (`hsl(210, 60%, 70%)`)
- Player B tiles: soft coral/red (`hsl(0, 60%, 70%)`)
- Neutral tiles: warm gray (existing orange/tier1 color)
- Contested tiles: striped/hatched pattern
- Turn indicator: glowing border around active player's avatar

---

## Implementation Order (6 tasks)

1. **Database migration** — Create `grid_duel_matches` and `grid_duel_moves` tables with RLS
2. **Edge function** — `grid-duel-game` handling create, join, submit_move, forfeit
3. **Game store** — `gridDuelStore.ts` with realtime subscription and local state
4. **Grid board component** — `GridDuelBoard` with ownership coloring and turn logic
5. **Lobby + HUD + Results** — Full game flow UI
6. **Routing + menu integration** — Add to game selector and navigation

---

## Why This Works

The existing Morph Grid mechanics (word tracing, grid morphing, dictionary validation) translate directly. The morphing creates emergent strategy: when tiles you own get new letters, you need to adapt. Opponent can strategically morph your territory to make your tiles harder to use. The "two-touch steal" mechanic prevents snowballing and creates comeback opportunities.




# Fix Morph Clash Word Validation — Use TWL06 Dictionary

## Problem
The Clash edge function (`grid-duel-game`) accepts **any combination of letters** as a valid word. Its `validateWord` function only checks basic structure (has vowel, has consonant, no triple letters) but never checks against the actual TWL06 Scrabble dictionary that all other games use.

Tile adjacency/connectivity is already correctly enforced on both client and server.

## Solution
Embed the TWL06 word list in the edge function and validate submitted words against it, matching how Morph Grid validates words.

## Changes

### `supabase/functions/grid-duel-game/index.ts`

1. **Load TWL06 dictionary at startup**: Read the TWL06 word list file and build an in-memory `Set<string>` of valid words. Since edge functions can't import from `src/lib`, we'll fetch the TWL06 file from a URL or bundle it. The most reliable approach: store the word list in a Deno-compatible format within the edge function directory, or fetch it from the project's public assets.

   Best approach: **Copy `twl06.txt` into the edge function directory** (`supabase/functions/grid-duel-game/twl06.txt`) and read it with `Deno.readTextFile` at startup.

2. **Replace `validateWord` function** (lines 133-170): Instead of the basic structural check, look up the word in the TWL06 set. Still check the `admin_dictionary` banned list, but the primary validation is dictionary membership.

3. **Update bot word finding** (`findBotWords`, line 247): The bot's DFS currently finds paths without checking if they form real words. Add a dictionary check so the bot only considers valid TWL06 words.

### New file: `supabase/functions/grid-duel-game/twl06.txt`
- Copy of `src/lib/twl06.txt` so the edge function can access it at runtime

### Updated `validateWord` logic:
```
1. Load TWL06 set (cached after first call)
2. Check word.toUpperCase() exists in TWL06 set
3. Check admin_dictionary ban list
4. If valid, track usage in admin_dictionary
5. Return true/false
```

### Updated `findBotWords` logic:
- After building a word from the DFS path, check it against the TWL06 set before adding to candidates
- This ensures the bot only plays real words

### Files
1. `supabase/functions/grid-duel-game/twl06.txt` — copy of dictionary
2. `supabase/functions/grid-duel-game/index.ts` — TWL06 loading + updated validateWord + bot word filter


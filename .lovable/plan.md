

# Fix TWL06 Dictionary Loading in Clash Edge Function

## Problem
Supabase edge functions **do not bundle co-located non-TypeScript files**. The `twl06.txt` file is never deployed alongside `index.ts`, so `Deno.readTextFile` always fails with "path not found". This is a platform limitation — no file-path fix will work.

## Solution
Fetch the TWL06 word list via HTTP from the project's own published app, then cache it in memory. This requires:

1. **Copy `twl06.txt` to `public/dict/twl06.txt`** so it's served as a static asset at `https://morph-games.lovable.app/dict/twl06.txt`
2. **Update `loadTWL06()` in the edge function** to use `fetch()` instead of `Deno.readTextFile()`, fetching from the app's published URL (constructed from `SUPABASE_URL` env var or hardcoded published URL)
3. **Delete `supabase/functions/grid-duel-game/twl06.txt`** since it's never deployed anyway

### Updated `loadTWL06()` logic:
```
1. If cached in memory, return immediately
2. Fetch https://morph-games.lovable.app/dict/twl06.txt via HTTP
3. Parse into Set<string>, cache in memory
4. Return the set
```

The fetch happens once per cold start (edge functions cache globals across warm invocations). Subsequent requests reuse the in-memory set.

### Fallback
If fetch fails, the function falls back to an empty set and structural validation only, rather than blocking all moves.

### Files Modified
1. `public/dict/twl06.txt` — copy of TWL06 word list (new static asset)
2. `supabase/functions/grid-duel-game/index.ts` — replace `Deno.readTextFile` with `fetch()` in `loadTWL06()`
3. `supabase/functions/grid-duel-game/twl06.txt` — delete (unused)


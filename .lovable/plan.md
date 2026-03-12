

# Fix TWL06 Dictionary Loading in Clash Edge Function

## Problem
The edge function logs show repeated errors:
```
Failed to load TWL06: NotFound: path not found: /var/tmp/sb-compile-edge-runtime/grid-duel-game/twl06.txt
WARNING: Do not use Deno.readTextFileSync inside the async callback.
```

Two issues:
1. `Deno.readTextFileSync` with `.pathname` resolves to a wrong path at runtime
2. Sync file reads inside async handlers are deprecated in edge functions

## Fix

### `supabase/functions/grid-duel-game/index.ts`

**Change `loadTWL06` from sync to async** (lines 14-37):
- Use `await Deno.readTextFile(new URL('./twl06.txt', import.meta.url))` — passing a `URL` object directly is the Deno-recommended pattern for co-located files
- Add a deduplication promise (`twl06Loading`) so concurrent requests don't load the file multiple times
- Make the function return `Promise<Set<string>>`

**Update `validateWord`** (line 163):
- Change `const dictionary = loadTWL06()` to `const dictionary = await loadTWL06()`

**Update `findBotWords`** (line 264-316):
- Make it `async` and change `const dictionary = loadTWL06()` to `const dictionary = await loadTWL06()`
- Update all callers of `findBotWords` to `await` it

### Files Modified
1. `supabase/functions/grid-duel-game/index.ts` — async dictionary loading + await in validateWord and findBotWords


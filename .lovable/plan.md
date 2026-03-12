

# Make Sandwich Menus Consistent and Fix Logo Navigation

## Issues Found

### Logo Navigation
- **ClashLogo** is NOT clickable — it's a plain `<div>` with no `useNavigate` or click handler. All other logos (Chain, Grid, Rush, Code, Measured, Alibi) correctly navigate to `/` on click.

### Menu Inconsistencies
Comparing all menus against the standard structure (Games → Account → Game-specific → Info):

| Menu | Width | User Icon | Auth Listener | Info Section | Separator Style |
|------|-------|-----------|----------------|--------------|-----------------|
| Chain | w-80 | Yes | Yes | No | inline style |
| Grid | w-80 | Yes | Yes | Yes (Rules, What's New) | class-based |
| Rush | w-80 | Yes | Yes | No | inline style |
| Clash | **w-72** | **No** | **No (no listener)** | **No** | mixed |
| Code | w-80 | Yes | Yes | Yes | class-based |
| Measured | w-80 | Yes | Yes | No | class-based |
| Alibi | w-80 | Yes | Yes | No | inline style |

**Key gaps:**
1. **Clash menu** is narrower (w-72 vs w-80), missing User icon, missing auth state listener, missing Info section
2. **Chain, Rush, Measured, Alibi** menus are missing an "Info" section (Rules + What's New links) that Grid and Code have
3. All menus should have the Info section for discoverability

## Changes

### 1. Fix ClashLogo — make it clickable
**File: `src/components/clash/ClashLogo.tsx`**
- Add `useNavigate`, wrap in a `<button>` with `onClick={() => navigate('/')}` and `aria-label="Go to home"`
- Match the pattern used by all other logos

### 2. Standardize ClashMenuSheet
**File: `src/components/clash/ClashMenuSheet.tsx`**
- Change width from `w-72` to `w-80`
- Add `onAuthStateChange` listener (currently only checks once)
- Add `User` icon next to Account button
- Add `HelpCircle` and `Sparkles` icons
- Add Info section (Rules + What's New) with separator, matching other menus
- Add proper padding/structure to match others (`space-y-5 py-4` pattern)

### 3. Add Info section to Chain, Rush, Measured, Alibi menus
**Files:**
- `src/components/GameMenuSheet.tsx` (Chain) — add Info section after settings
- `src/components/rush/RushMenuSheet.tsx` — add Info section after Rush-specific section
- `src/components/measured/MeasuredMenuSheet.tsx` — add Info section after Account
- `src/components/alibi/AlibiMenuSheet.tsx` — add Info section after Settings

Each Info section follows the same pattern:
```
<Separator />
<div>
  <h3>Info</h3>
  <button> <HelpCircle /> Rules </button>
  <button> <Sparkles /> What's New </button>
</div>
```
Using each game's own CSS variable prefix for colors.

### Files Modified (7)
1. `src/components/clash/ClashLogo.tsx` — make clickable
2. `src/components/clash/ClashMenuSheet.tsx` — full consistency pass
3. `src/components/GameMenuSheet.tsx` — add Info section
4. `src/components/rush/RushMenuSheet.tsx` — add Info section
5. `src/components/measured/MeasuredMenuSheet.tsx` — add Info section
6. `src/components/alibi/AlibiMenuSheet.tsx` — add Info section
7. `src/components/grid/GridMenuSheet.tsx` — already has Info section, no changes needed




# Morph Code — UI Polish: Tiles, Feedback, and Results Screen

## Changes

### 1. Simplify Symbol Tiles
Remove the text label from tiles entirely. Only show the emoji/symbol centered in the tile. Each symbol already has a distinct color — make it more prominent by increasing the background opacity and ensuring the emoji is large and centered. Remove `showLabel` prop usage everywhere.

**Files:** `SymbolSlot.tsx`, `GuessBoard.tsx`, `SequenceBuilder.tsx`

### 2. Redesign Feedback from Dots to Numeric Badges
The colored dots (green = exact, yellow = shifted) are misleading because they look positional (like Wordle) but represent counts. Replace the dots with clear numeric text badges:
- Show `2 exact · 1 close` as styled text chips instead of dot pips
- Use labeled text: e.g. a green badge "2 ✓" and a yellow badge "1 ~" so it's unambiguous
- Keeps the staggered animation

**File:** `FeedbackPips.tsx`

### 3. Redesign Round Results Screen
Current issues: sequences just pop in, no animation, no "your sequence" shown, layout feels like a data dump.

Fixes:
- Add a collapsible "Your Sequence" section using Collapsible component (default expanded) showing the player's own locked sequence
- Animate the opponent sequence reveal with a staggered flip/scale-in per symbol (not all at once)
- Add a proper card layout with labeled sections and visual hierarchy
- Stagger all sections in with sequential animation delays
- Center everything properly

**Files:** `RoundResults.tsx`, `MorphCode.tsx` (pass `mySequence` to RoundResults)

### 4. Pass My Sequence to Results
`RoundResults` needs access to the player's own sequence to display it. Thread `round.mySequence` from MorphCode through to the component.

**File:** `MorphCode.tsx`

---

## File Summary

| File | Change |
|------|--------|
| `src/components/morphcode/SymbolSlot.tsx` | Remove label rendering, increase symbol size, boost background color opacity |
| `src/components/morphcode/FeedbackPips.tsx` | Replace dots with labeled numeric badges ("2 ✓", "1 ~") |
| `src/components/morphcode/GuessBoard.tsx` | Remove `showLabel` from pool symbols |
| `src/components/morphcode/SequenceBuilder.tsx` | Remove `showLabel` from pool symbols |
| `src/components/morphcode/RoundResults.tsx` | Add collapsible "Your Sequence", staggered opponent reveal animation, better card layout |
| `src/pages/MorphCode.tsx` | Pass `mySequence` prop to RoundResults |


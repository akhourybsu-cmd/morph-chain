

# Polished Game Card Interaction + Page Transition Animations

## What changes

### 1. Game Card "Play" button reveal
When you tap/click a game card, instead of immediately navigating, the card expands slightly and a **"Play" pill button slides in from the right** (replacing the chevron), colored with the game's accent. A second tap on "Play" navigates. Tapping elsewhere or another card deselects the current one.

This gives a satisfying two-step interaction: **select → confirm**.

### 2. Page exit/enter transitions
Wrap route transitions so the home screen **fades + slides out left** when navigating to a game, and the game page **fades + slides in from the right**. This creates a seamless spatial flow.

## Technical approach

### GameCard changes (`src/pages/GameSelector.tsx`)

- Add `selectedGame` state to `GameSelector` (tracks which card is "active")
- First click on a card → sets it as selected (card gets accent border glow, slight scale-up)
- The chevron morphs into a "Play ▶" pill that slides in from the right with a CSS transition (`transform: translateX(100%) → translateX(0)`, `opacity: 0 → 1`, ~200ms ease-out)
- Clicking "Play" triggers navigation with a brief exit animation delay (~250ms)
- Clicking a different card switches selection; clicking outside deselects

### Card visual states:
```text
┌─────────────────────────────────────────┐
│ ▌ Morph Chain                    [⊙] › │  ← default (chevron visible)
│   Transform words one letter...         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ▌ Morph Chain                [⊙] Play ▶│  ← selected (Play slides in, border glows)
│   Transform words one letter...         │
└─────────────────────────────────────────┘
```

### Page transitions (`src/App.tsx` + new `src/components/PageTransition.tsx`)

- Create a `PageTransition` wrapper component that wraps each route's element
- Uses CSS animations: entering page fades+slides in from right, exiting page fades+slides out left
- Leverage `useLocation` and a transition state to coordinate the ~250ms animation
- No heavy libraries needed — pure CSS keyframes + React state

### New keyframes in `tailwind.config.ts`:
- `page-exit-left`: opacity 1→0, translateX(0 → -30px) over 200ms
- `page-enter-right`: opacity 0→1, translateX(30px → 0) over 250ms
- `play-slide-in`: opacity 0→1, translateX(20px → 0) over 200ms

### Files modified:
1. **`src/pages/GameSelector.tsx`** — Add `selectedGame` state, two-step tap interaction, Play pill slide-in
2. **`src/components/PageTransition.tsx`** — New wrapper for route enter/exit animations
3. **`src/App.tsx`** — Wrap game routes with `PageTransition`
4. **`tailwind.config.ts`** — Add new keyframes and animation utilities


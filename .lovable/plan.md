

# Responsive + Sound + Animations for Morph Code

## What's Changing

### 1. Sound Effects (Web Audio API)
Create `src/lib/morphcode/audioManager.ts` with sounds for every game event:
- **Symbol placed/removed** in slots — quick click/pop
- **Sequence locked** — rising 3-note confirmation chime
- **Guess submitted** — neutral blip
- **Code solved** — triumphant 4-note arpeggio
- **Match win** — celebratory fanfare
- **Match loss** — descending tone
- **Challenge received** — attention-getting double chime (plays when incoming challenge detected)
- **Timer warning** — escalating ticks at 30s and 10s
- **VS screen** — dramatic bass hit

Sound toggle added to `MorphcodeHeader` (Volume2/VolumeX icon), preference stored in localStorage.

### 2. Responsive Fixes (411px viewport)
- **SymbolSlot**: Smaller sizes on mobile — `sm: w-9 h-9`, `md: w-12 h-12`, `lg: w-14 h-14` (currently 10/14/16 — too large for 6 pool symbols in a row)
- **GuessBoard**: Tighter gaps, smaller font sizes on mobile
- **SequenceBuilder**: `max-w-xs` → `max-w-[90vw]` for symbol pool wrapping
- **MorphcodeLobby**: Already `max-w-sm`, looks fine — minor padding tweaks
- **MatchScoreBar**: Compact layout for narrow screens
- **FriendsList**: Challenge buttons use icon-only on mobile

### 3. Animations
- **Guess row entry**: Each new guess slides in with `animate-fade-in` 
- **Symbol slot fill**: Scale bounce when a symbol is placed (`scale-110 → scale-100` over 150ms)
- **Solve celebration**: Pulsing glow effect on the solved guess row
- **Round results**: Staggered fade-in for stats cards
- **Challenge card**: Subtle pulse animation on incoming challenge rows
- **Timer urgency**: Pulse animation on timer when ≤10s

## Files

| File | Change |
|------|--------|
| `src/lib/morphcode/audioManager.ts` | **New** — all sound effects |
| `src/components/morphcode/SymbolSlot.tsx` | Responsive sizes, place animation |
| `src/components/morphcode/GuessBoard.tsx` | Sound triggers, guess row animations, responsive gaps, timer sound |
| `src/components/morphcode/SequenceBuilder.tsx` | Sound triggers on place/remove/lock, responsive pool layout |
| `src/components/morphcode/VersusScreen.tsx` | VS hit sound |
| `src/components/morphcode/RoundResults.tsx` | Win/loss sounds, staggered fade-in |
| `src/components/morphcode/FriendsList.tsx` | Challenge received sound, pulse animation on challenge rows |
| `src/components/morphcode/MorphcodeHeader.tsx` | Sound toggle button |
| `src/pages/MorphCode.tsx` | Init audio, solve sound on guess result |


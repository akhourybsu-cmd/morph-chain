

# Morph Code Lobby — Prestige Polish

## Current Issues
- Redundant "MORPH CODE" title in lobby body (header already displays it)
- Header uses `w-20` fixed columns instead of Chain's `flex-1` spacer pattern for true centering
- Lobby lacks the editorial prestige feel — plain buttons without the card-based, typographic layout used by GameSelector
- No welcoming content for logged-out users — just buttons that redirect to login
- Friends section renders even when empty/loading, creating visual noise

## Changes

### 1. Header — Match Chain's Spacer Pattern
Replace `w-20` fixed columns with `flex-1` spacers flanking the logo, matching `ChainPrestigeHeader` exactly. This ensures perfect centering regardless of content width.

### 2. Lobby Redesign — Editorial Layout
- **Remove** the redundant "MORPH CODE" h1 title
- **Add** a prestige masthead section: tagline in italic Playfair ("A letter changes everything" style), brief description in Inter
- **Restyle action buttons** as prestige cards instead of raw buttons:
  - "Create Private Match" becomes a card with icon, title, and subtitle
  - "Join by Code" input gets a proper label and refined card wrapper
  - "Find Random Opponent" becomes a secondary card
- **Add** a sign-in prompt card for logged-out users (instead of silently redirecting)
- **Divider** styled as thin editorial rule with "or" label

### 3. Friends Section Polish
- Collapse friends into an expandable section when no friends are online (reduce visual weight)
- Add a subtle animated pulse on online status dots
- Friend code display gets a more prominent prestige card treatment

### 4. Waiting/Queuing States
- Invite code card: increase code font size, add a subtle border animation while waiting
- Queuing card: add "Searching..." with animated dots instead of just a spinner

### Files Modified
- `src/components/morphcode/MorphcodeHeader.tsx` — switch to flex-1 spacer centering
- `src/components/morphcode/MorphcodeLobby.tsx` — full prestige redesign
- `src/components/morphcode/FriendsList.tsx` — polish and collapse logic


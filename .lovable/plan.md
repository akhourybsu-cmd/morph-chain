

# Morph Code — Prestige Polish + Friends System + Bug Fixes

## Summary

Morph Code currently lacks the NYT Prestige design system used by Chain and Grid, has broken invite codes (edge function not registered in config.toml), and no friends system. This plan addresses all three in priority order.

---

## 1. Prestige Theme System (Priority: Highest)

**Problem:** Morph Code uses raw `hsl(var(--foreground))` / generic shadcn tokens instead of dedicated prestige CSS variables like Chain (`--chain-*`) and Grid (`--grid-*`).

**Changes:**

### CSS Variables (index.css)
Add `--code-*` prestige tokens for both light and dark modes, following the exact pattern of Chain/Grid:
- `--code-page-bg`, `--code-card-bg`, `--code-card-border`, `--code-divider`
- `--code-text-primary`, `--code-text-secondary`, `--code-text-muted`
- `--code-accent: 280 70% 55%` (violet — already the game's accent color)
- `--code-pill-bg`, `--code-success`, `--code-error`
- Dark mode variants matching the same deep charcoal palette as Chain/Grid

### Header — Match Chain/Grid 3-Column Architecture
Rewrite `MorphcodeHeader` to use the standard layout:
- Left: Menu button (hamburger) + PrestigeThemeToggle
- Center: `MorphCodeLogo` component (Playfair Display serif, "Morph" in primary + "Code" in violet accent)
- Right: HelpCircle button
- Fixed `h-14 md:h-16`, border-bottom using `--code-card-border`
- Add a `MorphCodeMenuSheet` (side drawer with GamesNavigation, profile link, settings)

### Logo Component
Create `src/components/morphcode/MorphCodeLogo.tsx` following `ChainLogo.tsx` pattern exactly — Playfair Display, split-color "Morph Code".

### Menu Sheet
Create `src/components/morphcode/MorphCodeMenuSheet.tsx` following `GridMenuSheet` pattern with GamesNavigation at top.

### All Components Restyled
Restyle every Morphcode component (`MorphcodeLobby`, `SequenceBuilder`, `GuessBoard`, `MatchScoreBar`, `RoundResults`, `SymbolSlot`, `MorphcodeHowToPlay`) to use `--code-*` variables instead of generic `--foreground` / `--card` / `--border`.

### Symbol Tiles
Refine `SymbolSlot` to be flatter — remove heavy gradients and `text-shadow`, use subtle borders and softer backgrounds matching the prestige tile aesthetic. Prestige symbols should feel like refined game pieces, not arcade buttons.

---

## 2. Invite Code Bug Fix (Priority: High)

**Problem:** The `morphcode-game` edge function is missing from `supabase/config.toml`, which means it may not deploy or may require JWT verification by default, causing `lock_sequence`, `submit_guess`, and `create_next_round` calls to fail silently.

**Fix:** Add to config.toml:
```toml
[functions.morphcode-game]
verify_jwt = false
```
(JWT is validated manually in the function code.)

Additionally, the lobby's "created code" display state has a bug: when creating a match and getting `createdCode`, the lobby correctly shows it, but reloading the page while in `waiting` status re-renders `MorphcodeLobby` without `createdCode` state. Need to pass `match.inviteCode` from the parent page down to the lobby when `match.status === 'waiting'`, so the code persists across page refreshes.

---

## 3. Friends System (Priority: Medium)

**Database:**
- Create `morphcode_friends` table: `id`, `user_id`, `friend_id`, `status` (pending/accepted/blocked), `created_at`
- RLS: Users can view/manage their own friend entries
- Create `morphcode_friend_presence` table: `user_id`, `last_seen_at`, `is_online` (heartbeat-based, updated every 30s)
- Enable realtime on `morphcode_friend_presence`

**Friend Management:**
- Add friend by sharing a "friend code" (derived from user profile, e.g., first 8 chars of user_id or a generated code stored on `user_profiles`)
- Accept/decline friend requests
- Friends list in the Morph Code menu sheet

**Quick Invite Flow:**
- In the lobby, show a "Friends Online" section above the current buttons
- Each online friend shows as a small avatar/initials row with a "Challenge" button
- Tapping "Challenge" auto-creates a private match and sends a realtime notification to the friend
- Friend sees a toast/banner "X challenged you!" with Accept/Decline
- On accept, both enter the match automatically

**Presence System:**
- On mount of MorphCode page, upsert presence row with current timestamp
- Heartbeat interval every 30s
- Consider "online" if `last_seen_at` within 60s
- Subscribe to realtime changes on friend presence rows

---

## 4. Edge Function Hardening

- Add rate limiting to `submit_guess` (prevent spam)
- Add turn timer enforcement server-side: if `turn_started_at + 90s < now()`, reject the guess and auto-forfeit
- Validate `round_id` belongs to the correct match for the user

---

## Implementation Order

1. Add `--code-*` CSS variables (light + dark)
2. Fix config.toml for edge function
3. Create MorphCodeLogo, MorphCodeMenuSheet
4. Restyle MorphcodeHeader to 3-column prestige layout
5. Restyle all game components with prestige tokens
6. Fix invite code persistence bug (pass `match.inviteCode` to lobby)
7. Create friends tables + RLS
8. Build friends UI in lobby + presence system
9. Edge function hardening


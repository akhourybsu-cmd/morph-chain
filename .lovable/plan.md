

# App-Wide Friends System + Social Features

## Current State
- Friends system exists but is **Morph Code-only** — the `FriendsList` component, `friendsService.ts`, and `morphcode_friends`/`morphcode_presence` tables are all scoped to that game
- The `morphcode_friends` table name itself signals game-specificity
- No social features exist in Chain, Grid, or Rush results panels — sharing is clipboard/native share only
- Profile page has no friends section
- Side menus across games have no friends entry point

## Vision
Promote the friends system to an **app-wide** feature. Friends you add once are visible everywhere: in game menus, on your profile, and in results screens where you can share scores directly with friends via in-app activity feed.

---

## Phase 1: Rename + Generalize Friends Infrastructure

### Database Migration
- Create new `app_friends` table (same schema as `morphcode_friends` but with a clearer name) and migrate data
- Create `app_presence` table (same as `morphcode_presence`)
- Alternatively, since the tables already exist and work, simply **alias** them in the service layer — rename the service file from `morphcode/friendsService.ts` to a shared `lib/social/friendsService.ts` and keep using the same tables. This avoids a migration.

**Decision: Keep existing tables, move the service to a shared location.** The table names `morphcode_friends` and `morphcode_presence` are internal — users never see them.

### New Files
- `src/lib/social/friendsService.ts` — move from `src/lib/morphcode/friendsService.ts`, same logic
- `src/lib/social/activityService.ts` — new: post score shares, fetch friend activity
- `src/components/social/FriendsPanel.tsx` — generic, theme-agnostic friends panel (uses CSS variable props)
- `src/components/social/FriendActivityFeed.tsx` — shows recent friend scores/completions
- `src/components/social/ShareToFriendsButton.tsx` — button for results panels

### Database: Activity Feed Table
```sql
CREATE TABLE app_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL,        -- 'chain', 'grid', 'rush', 'morphcode'
  activity_type text NOT NULL DEFAULT 'score', -- 'score', 'achievement', 'challenge'
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: Users can insert own, friends can view
```

---

## Phase 2: Integrate into Every Game Surface

### Side Menus (all games)
Add a "Friends" section to `SideMenu`, `GridMenuSheet`, `MorphCodeMenuSheet`, chain menu, and rush menu — showing online friend count badge and linking to a friends panel/modal.

### Profile Page
Add a "Friends" tab/section to `ProfilePage.tsx`:
- Shows friend code, friend list, add friend input
- Shows friend activity feed (recent scores from friends)

### Results Panels
Add a "Share with Friends" button to:
- `ChainResultsPanel` — posts chain score to activity feed
- `EndScreen` (Grid) — posts grid completion
- `RushResultsPanel` / `PrestigeResultsPanel` — posts rush score
- `MorphCode` match results — posts win/loss

When tapped, it posts the score to `app_activity` and shows a toast "Shared with friends!"

### Friends Activity Feed
- On the home `GameSelector` page, if logged in, show a small "Friend Activity" section below the game tiles
- Shows last 5 friend scores: "Alice solved Chain in 4 moves · 2h ago"
- Tapping a friend's score navigates to that game

---

## Phase 3: Challenge from Anywhere

### Challenge Button on Friend Rows
When viewing friends in any menu, online friends show a "Challenge" button that creates a Morph Code match and deep-links the friend (via realtime notification or activity feed entry with type `challenge`).

---

## Files Modified
- `src/lib/social/friendsService.ts` — new (moved from morphcode)
- `src/lib/social/activityService.ts` — new
- `src/components/social/FriendsPanel.tsx` — new (generic, themed)
- `src/components/social/ShareToFriendsButton.tsx` — new
- `src/components/social/FriendActivityFeed.tsx` — new
- `src/components/layout/SideMenu.tsx` — add friends section
- `src/pages/ProfilePage.tsx` — add friends tab
- `src/pages/GameSelector.tsx` — add friend activity section
- `src/components/chain/ChainResultsPanel.tsx` — add share-to-friends button
- `src/components/grid/EndScreen.tsx` — add share-to-friends button
- `src/components/rush/PrestigeResultsPanel.tsx` — add share-to-friends button
- `src/components/morphcode/MorphcodeLobby.tsx` — update import path
- `src/pages/MorphCode.tsx` — update import path
- Migration: `app_activity` table + RLS

## Implementation Order
1. Create `app_activity` table with RLS (friends can read, users insert own)
2. Move friends service to `src/lib/social/` and create activity service
3. Build generic `FriendsPanel` and `ShareToFriendsButton` components
4. Add friends section to `SideMenu` and `ProfilePage`
5. Add share-to-friends buttons to all results panels
6. Build `FriendActivityFeed` and add to `GameSelector`
7. Update Morph Code imports to use shared service


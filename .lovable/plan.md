

# Add "Manage Friends" Button to Game Lobbies

## What
Add an "Add Friends" button to both the Morph Code and Morph Clash lobbies that navigates users to `/profile?tab=friends`, where they can share their friend code and input others'. This makes it easy to grow their friend list without leaving the game context.

## Changes

### `src/components/clash/ClashLobby.tsx`
- In the friends section header (line ~170), add an "Add Friends" link/button next to the "Friends" label that navigates to `/profile?tab=friends`
- In the empty state (line ~225), turn the "Add friends from your profile" text into a tappable button that navigates to `/profile?tab=friends`

### `src/components/morphcode/MorphcodeLobby.tsx`
- Below the `FriendsList` component (line ~89), add a small "Add Friends" button card that navigates to `/profile?tab=friends`
- Style it as a subtle secondary action consistent with the prestige code theme

### `src/components/morphcode/FriendsList.tsx`
- Add an "Add Friends" link in the friends list header or empty state that navigates to `/profile?tab=friends`

Both lobbies will use `useNavigate` from react-router-dom. The button will use a `UserPlus` icon from lucide-react for clarity.


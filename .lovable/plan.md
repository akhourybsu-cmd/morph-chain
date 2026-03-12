

# Invite & Join Logic Audit — Fixes

After tracing every match-start path across both games, here's what I found:

## Paths Audited

| Game | Entry Point | Flow | Status |
|------|-------------|------|--------|
| Clash | Friend challenge (ClashLobby) | `challengeFriend` → `createClashMatch` → `postActivity` | OK |
| Clash | Accept challenge (ClashLobby) | `joinClashByCode(challenge.inviteCode)` → code lookup → RPC | **BUG** |
| Clash | Decline challenge (ClashLobby) | `cancelClashMatch(matchId)` | OK |
| Clash | Select from match list | `loadMatch(matchId)` + `subscribeToMatch` | OK |
| Code | Friend challenge (FriendsList) | `challengeFriend` → `createMatch` → `postActivity` | OK |
| Code | Accept challenge (FriendsList) | `joinMatchById(matchId)` → `join_match` RPC | OK |
| Code | Decline challenge (FriendsList) | `declineChallenge(matchId)` → `expire_match` RPC | OK |
| Code | Random queue | `joinQueue` → find opponent or enter queue | OK |
| Code | Rematch | `createRematch` → `postActivity` | OK |

## Bug Found

**Clash accept challenge uses invite code lookup instead of match ID.** `ClashLobby.handleAcceptChallenge` calls `joinClashByCode(challenge.inviteCode)`, which does a DB query to find the match by code, then calls the `join_clash_match` RPC. We already have the `matchId` in the challenge payload — this extra lookup is fragile and unnecessary.

## Fix

### 1. Add `joinClashMatchById` to `src/lib/clash/matchService.ts`
Direct wrapper around the `join_clash_match` RPC — no code lookup needed:
```typescript
export async function joinClashMatchById(matchId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('join_clash_match', { p_match_id: matchId });
  if (error) return null;
  return data as string;
}
```

### 2. Update `ClashLobby.tsx` — `handleAcceptChallenge`
Change from `joinClashByCode(challenge.inviteCode)` to `joinClashMatchById(challenge.matchId)`. Import the new function.

Two files modified, no database changes.


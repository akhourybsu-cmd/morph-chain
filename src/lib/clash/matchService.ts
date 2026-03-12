import { supabase } from '@/integrations/supabase/client';
import { postActivity } from '@/lib/social/activityService';

export async function createClashMatch(): Promise<{ matchId: string; inviteCode: string } | null> {
  const { data, error } = await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'create_match' },
  });

  if (error || data?.error) return null;
  return { matchId: data.matchId, inviteCode: data.inviteCode };
}

export async function joinClashMatchById(matchId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('join_clash_match', { p_match_id: matchId });
  if (error) return null;
  return data as string;
}

export async function joinClashByCode(code: string): Promise<string | null> {
  const { data: match } = await supabase
    .from('clash_matches')
    .select('id')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (!match) return null;

  const { data, error } = await supabase.rpc('join_clash_match', {
    p_match_id: match.id,
  });

  if (error) return null;
  return data as string;
}



export async function cancelClashMatch(matchId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'cancel_match', match_id: matchId },
  });

  return !error && data?.success;
}

export async function getMyActiveClashMatch(): Promise<string | null> {
  const matches = await getMyActiveClashMatches();
  return matches.length > 0 ? matches[0].id : null;
}

export interface ClashMatchSummary {
  id: string;
  status: string;
  player_a: string;
  player_b: string | null;
  current_turn: string | null;
  tiles_a: number;
  tiles_b: number;
  moves_a: number;
  moves_b: number;
  invite_code: string | null;
  turn_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export async function getMyActiveClashMatches(): Promise<ClashMatchSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('clash_matches')
    .select('id, status, player_a, player_b, current_turn, tiles_a, tiles_b, moves_a, moves_b, invite_code, turn_deadline, created_at, updated_at')
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .in('status', ['waiting', 'active'])
    .order('updated_at', { ascending: false })
    .limit(20);

  return (data as ClashMatchSummary[]) || [];
}

export async function getMyRecentCompletedMatch(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('clash_matches')
    .select('id')
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .eq('status', 'completed')
    .gte('completed_at', fiveMinAgo)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  return data?.id || null;
}

export async function getMyRecentCompletedMatches(): Promise<ClashMatchSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('clash_matches')
    .select('id, status, player_a, player_b, current_turn, tiles_a, tiles_b, moves_a, moves_b, invite_code, turn_deadline, created_at, updated_at')
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .eq('status', 'completed')
    .gte('updated_at', oneHourAgo)
    .order('updated_at', { ascending: false })
    .limit(5);

  return (data as ClashMatchSummary[]) || [];
}

/**
 * Challenge a friend directly — creates a match and posts a challenge activity
 */
export async function challengeFriend(friendUserId: string): Promise<{ matchId: string; inviteCode: string } | null> {
  const result = await createClashMatch();
  if (!result) return null;

  // Post challenge activity so friend sees it
  await postActivity('clash', 'challenge', {
    matchId: result.matchId,
    inviteCode: result.inviteCode,
  });

  return result;
}

/**
 * Get pending clash challenges from friends
 */
export async function getPendingChallenges(): Promise<Array<{
  activityId: string;
  fromUserId: string;
  fromName: string;
  matchId: string;
  inviteCode: string;
  createdAt: string;
}>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get friend activity of type 'challenge' for clash
  const { data: activities } = await supabase
    .from('app_activity')
    .select('id, user_id, payload, created_at')
    .eq('game', 'clash')
    .eq('activity_type', 'challenge')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!activities || activities.length === 0) return [];

  // Filter to only challenges where the match is still waiting
  const results: Array<{
    activityId: string;
    fromUserId: string;
    fromName: string;
    matchId: string;
    inviteCode: string;
    createdAt: string;
  }> = [];

  for (const act of activities) {
    if (act.user_id === user.id) continue; // Skip own challenges
    const payload = act.payload as { matchId?: string; inviteCode?: string };
    if (!payload.matchId) continue;

    // Check if match is still waiting
    const { data: match } = await supabase
      .from('clash_matches')
      .select('id, status, player_a')
      .eq('id', payload.matchId)
      .eq('status', 'waiting')
      .single();

    if (!match) continue;

    // Get display name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', act.user_id)
      .single();

    results.push({
      activityId: act.id,
      fromUserId: act.user_id,
      fromName: profile?.display_name || 'A friend',
      matchId: payload.matchId,
      inviteCode: payload.inviteCode || '',
      createdAt: act.created_at,
    });
  }

  return results;
}

/**
 * Skip the current turn (costs 1 move)
 */
// --- Bot Match ---

export const CLASH_BOT_UUID = '00000000-0000-0000-0000-b07b07b07b07';

export async function createClashBotMatch(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'create_bot_match' },
  });
  if (error || data?.error) return null;
  return data.matchId;
}

export async function triggerClashBotMove(matchId: string): Promise<void> {
  await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'bot_move', match_id: matchId },
  });
}

export function isClashBotPlayer(playerId: string | null): boolean {
  return playerId === CLASH_BOT_UUID;
}

/**
 * Skip the current turn (costs 1 move)
 */
export async function skipClashTurn(matchId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'skip_turn', match_id: matchId },
  });

  return !error && data?.success;
}

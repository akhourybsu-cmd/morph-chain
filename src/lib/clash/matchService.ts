import { supabase } from '@/integrations/supabase/client';

export async function createClashMatch(): Promise<{ matchId: string; inviteCode: string } | null> {
  const { data, error } = await supabase.functions.invoke('grid-duel-game', {
    body: { action: 'create_match' },
  });

  if (error || data?.error) return null;
  return { matchId: data.matchId, inviteCode: data.inviteCode };
}

export async function joinClashByCode(code: string): Promise<string | null> {
  // Find match by invite code
  const { data: match } = await supabase
    .from('clash_matches')
    .select('id')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (!match) return null;

  // Use RPC to join
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check for active or waiting matches
  const { data } = await supabase
    .from('clash_matches')
    .select('id, status')
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .in('status', ['waiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.id || null;
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

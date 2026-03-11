import { supabase } from '@/integrations/supabase/client';

export interface Friend {
  id: string;
  friendUserId: string;
  displayName: string | null;
  friendCode: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  isOnline: boolean;
  isSentByMe: boolean;
}

/**
 * Get current user's friend code, creating profile if needed
 */
export async function getMyFriendCode(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('friend_code')
    .eq('user_id', user.id)
    .single();

  if (data?.friend_code) return data.friend_code;

  // Create profile if missing
  const { data: created } = await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id })
    .select('friend_code')
    .single();

  return created?.friend_code || null;
}

/**
 * Send a friend request by friend code
 */
export async function sendFriendRequest(friendCode: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in' };

  // Look up the user by friend code
  const { data: target } = await supabase
    .from('user_profiles')
    .select('user_id, display_name')
    .eq('friend_code', friendCode.toUpperCase())
    .single();

  if (!target) return { success: false, error: 'Friend code not found' };
  if (target.user_id === user.id) return { success: false, error: "That's your own code!" };

  // Check if already friends
  const { data: existing } = await supabase
    .from('morphcode_friends')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${user.id})`)
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === 'accepted') return { success: false, error: 'Already friends!' };
    if (existing.status === 'pending') return { success: false, error: 'Request already pending' };
  }

  const { error } = await supabase
    .from('morphcode_friends')
    .insert({ user_id: user.id, friend_id: target.user_id, status: 'pending' });

  if (error) return { success: false, error: 'Failed to send request' };
  return { success: true };
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('morphcode_friends')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  return !error;
}

/**
 * Remove a friend or decline a request
 */
export async function removeFriend(friendshipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('morphcode_friends')
    .delete()
    .eq('id', friendshipId);
  return !error;
}

/**
 * Get friends list with online status
 */
export async function getFriends(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from('morphcode_friends')
    .select('id, user_id, friend_id, status')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (!friendships || friendships.length === 0) return [];

  const friendUserIds = friendships.map(f =>
    f.user_id === user.id ? f.friend_id : f.user_id
  );

  // Get profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, friend_code')
    .in('user_id', friendUserIds);

  // Get presence
  const { data: presenceData } = await supabase
    .from('morphcode_presence')
    .select('user_id, last_seen_at, is_online')
    .in('user_id', friendUserIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  const presenceMap = new Map((presenceData || []).map(p => [p.user_id, p]));

  return friendships.map(f => {
    const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
    const profile = profileMap.get(friendUserId);
    const presence = presenceMap.get(friendUserId);
    const isOnline = presence?.is_online && presence?.last_seen_at
      ? (Date.now() - new Date(presence.last_seen_at).getTime()) < 60000
      : false;

    return {
      id: f.id,
      friendUserId,
      displayName: profile?.display_name || null,
      friendCode: profile?.friend_code || null,
      status: f.status as Friend['status'],
      isOnline,
      isSentByMe: f.user_id === user.id,
    };
  });
}

/**
 * Update presence heartbeat
 */
export async function updatePresence(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('morphcode_presence')
    .upsert({
      user_id: user.id,
      last_seen_at: new Date().toISOString(),
      is_online: true,
    });
}

/**
 * Set offline
 */
export async function setOffline(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('morphcode_presence')
    .update({ is_online: false })
    .eq('user_id', user.id);
}

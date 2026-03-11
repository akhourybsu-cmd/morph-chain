import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  userId: string;
  displayName: string | null;
  game: string;
  activityType: string;
  payload: Record<string, any>;
  createdAt: string;
}

/**
 * Post a score/activity to the feed (visible to friends)
 */
export async function postActivity(
  game: string,
  activityType: string,
  payload: Record<string, any>
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('app_activity')
    .insert({
      user_id: user.id,
      game,
      activity_type: activityType,
      payload,
    });

  return !error;
}

/**
 * Fetch recent friend activity (last 10 items)
 */
export async function getFriendActivity(limit = 10): Promise<ActivityItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get friend IDs
  const { data: friendships } = await supabase
    .from('morphcode_friends')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) return [];

  const friendIds = friendships.map(f =>
    f.user_id === user.id ? f.friend_id : f.user_id
  );

  // Fetch activity from friends
  const { data: activities } = await supabase
    .from('app_activity')
    .select('*')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!activities || activities.length === 0) return [];

  // Get display names
  const userIds = [...new Set(activities.map(a => a.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));

  return activities.map(a => ({
    id: a.id,
    userId: a.user_id,
    displayName: nameMap.get(a.user_id) || null,
    game: a.game,
    activityType: a.activity_type,
    payload: a.payload as Record<string, any>,
    createdAt: a.created_at,
  }));
}

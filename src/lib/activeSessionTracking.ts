import { supabase } from "@/integrations/supabase/client";
import { getDeviceToken } from "@/hooks/useDeviceToken";

export type GameType = 'chain' | 'rush' | 'grid' | 'alibi';

interface SessionParams {
  gameType: GameType;
  puzzleDate: string;
  wordLength?: number;
  mode?: string;
}

interface SessionUpdate {
  movesCount?: number;
  completed?: boolean;
  won?: boolean;
}

/**
 * Start or update an active session
 * Works for both guests and authenticated users
 */
export async function startActiveSession(params: SessionParams): Promise<void> {
  const deviceToken = getDeviceToken();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const { error } = await supabase
      .from('active_sessions')
      .upsert({
        device_token: deviceToken,
        game_type: params.gameType,
        puzzle_date: params.puzzleDate,
        word_length: params.wordLength || null,
        mode: params.mode || null,
        user_id: user?.id || null,
        last_activity_at: new Date().toISOString(),
      }, {
        onConflict: 'device_token,game_type,puzzle_date,word_length,mode',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error starting active session:', error);
    }
  } catch (err) {
    console.error('Exception starting active session:', err);
  }
}

/**
 * Update activity timestamp (heartbeat)
 */
export async function updateSessionActivity(params: SessionParams, update?: SessionUpdate): Promise<void> {
  const deviceToken = getDeviceToken();

  try {
    const updateData: Record<string, unknown> = {
      last_activity_at: new Date().toISOString(),
    };

    if (update?.movesCount !== undefined) {
      updateData.moves_count = update.movesCount;
    }
    if (update?.completed !== undefined) {
      updateData.completed = update.completed;
    }
    if (update?.won !== undefined) {
      updateData.won = update.won;
    }

    let query = supabase
      .from('active_sessions')
      .update(updateData)
      .eq('device_token', deviceToken)
      .eq('game_type', params.gameType)
      .eq('puzzle_date', params.puzzleDate);

    if (params.wordLength) {
      query = query.eq('word_length', params.wordLength);
    }
    if (params.mode) {
      query = query.eq('mode', params.mode);
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating session activity:', error);
    }
  } catch (err) {
    console.error('Exception updating session activity:', err);
  }
}

/**
 * Complete a session (mark as finished)
 */
export async function completeActiveSession(
  params: SessionParams, 
  won: boolean, 
  movesCount: number
): Promise<void> {
  await updateSessionActivity(params, {
    completed: true,
    won,
    movesCount,
  });
}

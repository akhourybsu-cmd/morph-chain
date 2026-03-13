import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { triggerClashBotMove, CLASH_BOT_UUID } from '@/lib/clash/matchService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Ownership = 'neutral' | 'a' | 'b';

export interface ClashTile {
  id: string;
  char: string;
  isVowel: boolean;
  row: number;
  col: number;
}

export interface ClashMatch {
  id: string;
  player_a: string;
  player_b: string | null;
  status: string;
  winner_id: string | null;
  grid_state: ClashTile[][];
  ownership: Record<string, Ownership>;
  current_turn: string | null;
  tiles_a: number;
  tiles_b: number;
  moves_a: number;
  moves_b: number;
  total_word_length_a: number;
  total_word_length_b: number;
  turn_deadline: string | null;
  invite_code: string | null;
  used_words: string[];
  created_at: string;
  completed_at: string | null;
  is_bot_match: boolean;
}

interface SubmitResult {
  success: boolean;
  error?: string;
  word?: string;
}

interface LastWordInfo {
  word: string;
  player_id: string;
}

interface ClashState {
  match: ClashMatch | null;
  selected: { row: number; col: number }[];
  userId: string | null;
  loading: boolean;
  error: string | null;
  lastMoveResult: {
    word: string;
    claimed: string[];
    bonusClaims: string[];
  } | null;
  lastPlayedWord: LastWordInfo | null;
  channel: RealtimeChannel | null;
  lastActionTime: number;

  setUserId: (id: string | null) => void;
  loadMatch: (matchId: string) => Promise<void>;
  refreshMatch: (matchId: string) => Promise<void>;
  selectTile: (row: number, col: number) => void;
  clearSelection: () => void;
  submitMove: () => Promise<SubmitResult>;
  skipTurn: () => Promise<boolean>;
  forfeit: () => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  unsubscribe: () => void;
  clearMatch: () => void;
  clearLastMoveResult: () => void;
}

function isAdjacent(a: { row: number; col: number }, b: { row: number; col: number }): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 && !(a.row === b.row && a.col === b.col);
}

// Fetch last played word for a match (used on initial load only)
async function fetchLastWord(matchId: string): Promise<LastWordInfo | null> {
  const { data } = await supabase
    .from('clash_moves')
    .select('word, player_id')
    .eq('match_id', matchId)
    .neq('word', '[SKIP]')
    .order('move_number', { ascending: false })
    .limit(1)
    .single();
  return data ? { word: data.word, player_id: data.player_id } : null;
}

export const useClashStore = create<ClashState>((set, get) => ({
  match: null,
  selected: [],
  userId: null,
  loading: false,
  error: null,
  lastMoveResult: null,
  lastPlayedWord: null,
  channel: null,
  lastActionTime: 0,

  setUserId: (id) => set({ userId: id }),

  // Full load — sets loading spinner, resets selection. Used for initial match open.
  loadMatch: async (matchId) => {
    set({ loading: true, error: null });
    const [matchRes, lastWord] = await Promise.all([
      supabase.from('clash_matches').select('*').eq('id', matchId).single(),
      fetchLastWord(matchId),
    ]);

    if (matchRes.error || !matchRes.data) {
      set({ loading: false, error: 'Match not found' });
      return;
    }

    set({
      match: matchRes.data as unknown as ClashMatch,
      loading: false,
      selected: [],
      lastPlayedWord: lastWord,
      lastMoveResult: null,
    });
  },

  // Silent refresh — no loading spinner, preserves selection unless turn changed.
  refreshMatch: async (matchId) => {
    const { data, error } = await supabase
      .from('clash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !data) return;

    const newMatch = data as unknown as ClashMatch;
    const { match: currentMatch, selected } = get();

    const turnChanged = currentMatch?.current_turn !== newMatch.current_turn;
    const statusChanged = currentMatch?.status !== newMatch.status;
    const movesChanged = currentMatch?.moves_a !== newMatch.moves_a || currentMatch?.moves_b !== newMatch.moves_b;

    const updates: Partial<ClashState> = {
      match: newMatch,
      selected: (turnChanged || statusChanged) ? [] : selected,
    };

    // If moves changed and we don't have a recent optimistic lastMoveResult, fetch last word
    if (movesChanged && !get().lastMoveResult) {
      const lastWord = await fetchLastWord(matchId);
      if (lastWord) updates.lastPlayedWord = lastWord;
    }

    set(updates as any);
  },

  selectTile: (row, col) => {
    const { selected, match } = get();
    if (!match) return;

    const coord = { row, col };
    const last = selected[selected.length - 1];

    if (last && last.row === row && last.col === col) {
      set({ selected: selected.slice(0, -1) });
      return;
    }

    if (selected.some(s => s.row === row && s.col === col)) return;
    if (selected.length > 0 && !isAdjacent(last, coord)) return;

    set({ selected: [...selected, coord] });
  },

  clearSelection: () => set({ selected: [] }),

  submitMove: async (): Promise<SubmitResult> => {
    const { match, selected, userId } = get();
    if (!match || !userId || selected.length < 4) {
      return { success: false, error: 'Invalid selection' };
    }

    const word = selected.map(s => match.grid_state[s.row][s.col].char).join('');
    const isPlayerA = userId === match.player_a;
    const player = isPlayerA ? 'a' : 'b';

    // Optimistic ownership update
    const optimisticOwnership = { ...match.ownership };
    for (const s of selected) {
      const id = `${s.row}-${s.col}`;
      if (optimisticOwnership[id] !== player) {
        optimisticOwnership[id] = player as Ownership;
      }
    }

    set({
      loading: true,
      error: null,
      lastActionTime: Date.now(),
      match: { ...match, ownership: optimisticOwnership },
    });

    const { data, error } = await supabase.functions.invoke('grid-duel-game', {
      body: {
        action: 'submit_move',
        match_id: match.id,
        tiles_used: selected,
      },
    });

    if (error || data?.error) {
      const errMsg = data?.error || 'Submit failed';
      // Revert optimistic update
      set({ loading: false, error: errMsg, match });
      return { success: false, error: errMsg };
    }

    // Use server-returned match if available
    const updatedMatch = data.match as ClashMatch | undefined;

    set({
      loading: false,
      selected: [],
      lastMoveResult: {
        word: data.word || word,
        claimed: data.claimed || [],
        bonusClaims: data.bonus_claims || [],
      },
      lastPlayedWord: { word: data.word || word, player_id: userId },
      ...(updatedMatch ? { match: updatedMatch as unknown as ClashMatch } : {}),
    });

    // If the edge function didn't return the full match, do a silent refresh
    if (!updatedMatch) {
      await get().refreshMatch(match.id);
    }

    // Auto-trigger bot move if it's the bot's turn
    const currentMatch = get().match;
    if (currentMatch && currentMatch.is_bot_match && currentMatch.current_turn === CLASH_BOT_UUID && currentMatch.status === 'active') {
      setTimeout(async () => {
        await triggerClashBotMove(currentMatch.id);
        get().refreshMatch(currentMatch.id);
      }, 800);
    }

    return { success: true, word: data.word || word };
  },

  skipTurn: async () => {
    const { match } = get();
    if (!match) return false;

    set({ loading: true, error: null, lastActionTime: Date.now() });

    const { data, error } = await supabase.functions.invoke('grid-duel-game', {
      body: { action: 'skip_turn', match_id: match.id },
    });

    if (error || data?.error) {
      set({ loading: false, error: data?.error || 'Skip failed' });
      return false;
    }

    // Use server-returned match if available
    const updatedMatch = data.match as ClashMatch | undefined;
    set({
      loading: false,
      selected: [],
      ...(updatedMatch ? { match: updatedMatch as unknown as ClashMatch } : {}),
    });

    if (!updatedMatch) {
      await get().refreshMatch(match.id);
    }

    // Auto-trigger bot move after skip
    const currentMatch = get().match;
    if (currentMatch && currentMatch.is_bot_match && currentMatch.current_turn === CLASH_BOT_UUID && currentMatch.status === 'active') {
      setTimeout(async () => {
        await triggerClashBotMove(currentMatch.id);
        get().refreshMatch(currentMatch.id);
      }, 800);
    }

    return true;
  },

  forfeit: async () => {
    const { match } = get();
    if (!match) return;

    set({ lastActionTime: Date.now() });
    const { data } = await supabase.functions.invoke('grid-duel-game', {
      body: { action: 'forfeit', match_id: match.id },
    });

    const updatedMatch = data?.match as ClashMatch | undefined;
    if (updatedMatch) {
      set({ match: updatedMatch as unknown as ClashMatch });
    } else {
      await get().refreshMatch(match.id);
    }
  },

  subscribeToMatch: (matchId) => {
    const { channel: existing } = get();
    if (existing) existing.unsubscribe();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel(`clash-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clash_matches',
        filter: `id=eq.${matchId}`,
      }, () => {
        // Skip realtime refresh if we just did a user action within 400ms
        const timeSinceAction = Date.now() - get().lastActionTime;
        if (timeSinceAction < 400) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          get().refreshMatch(matchId);
        }, 150);
      })
      .subscribe();

    set({ channel });
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  clearMatch: () => {
    get().unsubscribe();
    set({ match: null, selected: [], error: null, lastMoveResult: null, lastPlayedWord: null });
  },

  clearLastMoveResult: () => set({ lastMoveResult: null }),
}));

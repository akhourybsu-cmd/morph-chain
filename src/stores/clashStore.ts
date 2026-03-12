// Zustand store for Morph Clash — async head-to-head territory control
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Ownership = 'neutral' | 'a' | 'b' | 'contested';

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
  created_at: string;
  completed_at: string | null;
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
  channel: RealtimeChannel | null;

  // Actions
  setUserId: (id: string | null) => void;
  loadMatch: (matchId: string) => Promise<void>;
  selectTile: (row: number, col: number) => void;
  clearSelection: () => void;
  submitMove: () => Promise<boolean>;
  forfeit: () => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  unsubscribe: () => void;
  clearMatch: () => void;
  clearLastMoveResult: () => void;
}

function isAdjacent(a: { row: number; col: number }, b: { row: number; col: number }): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 && !(a.row === b.row && a.col === b.col);
}

export const useClashStore = create<ClashState>((set, get) => ({
  match: null,
  selected: [],
  userId: null,
  loading: false,
  error: null,
  lastMoveResult: null,
  channel: null,

  setUserId: (id) => set({ userId: id }),

  loadMatch: async (matchId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('clash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !data) {
      set({ loading: false, error: 'Match not found' });
      return;
    }

    set({
      match: data as unknown as ClashMatch,
      loading: false,
      selected: [],
    });
  },

  selectTile: (row, col) => {
    const { selected, match } = get();
    if (!match) return;

    const coord = { row, col };
    const last = selected[selected.length - 1];

    // Undo last selection
    if (last && last.row === row && last.col === col) {
      set({ selected: selected.slice(0, -1) });
      return;
    }

    // Already selected
    if (selected.some(s => s.row === row && s.col === col)) return;

    // Check adjacency
    if (selected.length > 0 && !isAdjacent(last, coord)) return;

    set({ selected: [...selected, coord] });
  },

  clearSelection: () => set({ selected: [] }),

  submitMove: async () => {
    const { match, selected, userId } = get();
    if (!match || !userId || selected.length < 4) return false;

    set({ loading: true, error: null });

    const { data, error } = await supabase.functions.invoke('grid-duel-game', {
      body: {
        action: 'submit_move',
        match_id: match.id,
        tiles_used: selected,
      },
    });

    if (error || data?.error) {
      set({ loading: false, error: data?.error || 'Submit failed' });
      return false;
    }

    set({
      loading: false,
      selected: [],
      lastMoveResult: {
        word: data.word,
        claimed: data.claimed,
        bonusClaims: data.bonus_claims,
      },
    });

    // Reload match to get updated state
    await get().loadMatch(match.id);
    return true;
  },

  forfeit: async () => {
    const { match } = get();
    if (!match) return;

    await supabase.functions.invoke('grid-duel-game', {
      body: { action: 'forfeit', match_id: match.id },
    });

    await get().loadMatch(match.id);
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
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          get().loadMatch(matchId);
        }, 300);
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
    set({ match: null, selected: [], error: null, lastMoveResult: null });
  },

  clearLastMoveResult: () => set({ lastMoveResult: null }),
}));

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRID_SIZE = 5;
const MAX_MOVES_PER_PLAYER = 10;
const DOMINATION_THRESHOLD = 18;
const MIN_WORD_LENGTH = 4;

// Seeded RNG (matches client)
class SeededRandom {
  private state: number;
  constructor(seed: string) {
    this.state = 0;
    for (let i = 0; i < seed.length; i++) {
      this.state = ((this.state << 5) - this.state + seed.charCodeAt(i)) | 0;
    }
    if (this.state === 0) this.state = 1;
  }
  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }
  choice<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }
}

const VOWELS = ['A','E','I','O','U'];
const VOWEL_POOL = ['A','A','A','E','E','E','E','E','I','I','I','O','O','O','U','U'];
const CONSONANT_POOL = ['B','C','D','F','G','H','K','L','L','M','N','N','P','R','R','S','S','S','T','T','T','W','Y'];

interface Tile {
  id: string;
  char: string;
  isVowel: boolean;
  row: number;
  col: number;
}

type Ownership = 'neutral' | 'a' | 'b' | 'contested';

interface GridState {
  tiles: Tile[][];
  ownership: Record<string, Ownership>; // tileId -> owner
}

function generateGrid(seed: string): GridState {
  const rng = new SeededRandom(seed);
  const tiles: Tile[][] = [];
  const ownership: Record<string, Ownership> = {};
  
  const totalCells = GRID_SIZE * GRID_SIZE;
  const targetVowels = Math.floor(totalCells * 0.4);
  
  const vowelPositions = new Set<string>();
  while (vowelPositions.size < targetVowels) {
    const r = rng.nextInt(0, GRID_SIZE);
    const c = rng.nextInt(0, GRID_SIZE);
    vowelPositions.add(`${r}-${c}`);
  }
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const gridRow: Tile[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const id = `${row}-${col}`;
      const isVowel = vowelPositions.has(id);
      const char = isVowel ? rng.choice(VOWEL_POOL) : rng.choice(CONSONANT_POOL);
      gridRow.push({ id, char, isVowel, row, col });
      ownership[id] = 'neutral';
    }
    tiles.push(gridRow);
  }
  
  return { tiles, ownership };
}

function morphAfterMove(tiles: Tile[][], usedCoords: {row:number,col:number}[], rng: SeededRandom): Tile[][] {
  const newTiles = tiles.map(row => row.map(t => ({...t})));
  const usedSet = new Set(usedCoords.map(c => `${c.row}-${c.col}`));
  
  // Replace used tiles
  for (const coord of usedCoords) {
    const tile = newTiles[coord.row][coord.col];
    const isVowel = rng.next() < 0.4;
    tile.char = isVowel ? rng.choice(VOWEL_POOL) : rng.choice(CONSONANT_POOL);
    tile.isVowel = isVowel;
  }
  
  // Neighbor ripple
  for (const coord of usedCoords) {
    const dirs = [{row:-1,col:0},{row:1,col:0},{row:0,col:-1},{row:0,col:1}];
    for (const d of dirs) {
      const nr = coord.row + d.row;
      const nc = coord.col + d.col;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      if (usedSet.has(`${nr}-${nc}`)) continue;
      
      const neighbor = newTiles[nr][nc];
      if (rng.next() < 0.4) {
        const isVowel = rng.next() < 0.4;
        neighbor.char = isVowel ? rng.choice(VOWEL_POOL) : rng.choice(CONSONANT_POOL);
        neighbor.isVowel = isVowel;
      }
    }
  }
  
  return newTiles;
}

function isAdjacent(a: {row:number,col:number}, b: {row:number,col:number}): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 && !(a.row === b.row && a.col === b.col);
}

function validatePath(coords: {row:number,col:number}[]): boolean {
  if (coords.length < MIN_WORD_LENGTH) return false;
  const seen = new Set<string>();
  for (let i = 0; i < coords.length; i++) {
    const key = `${coords[i].row}-${coords[i].col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (i > 0 && !isAdjacent(coords[i-1], coords[i])) return false;
  }
  return true;
}

// Simple word validation using edge function call to validate-word
async function validateWord(word: string, supabaseUrl: string, serviceKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/validate-word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ word }),
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

function applyOwnership(
  ownership: Record<string, Ownership>,
  usedCoords: {row:number,col:number}[],
  player: 'a' | 'b'
): { newOwnership: Record<string, Ownership>; claimed: string[]; bonusClaims: string[] } {
  const opponent = player === 'a' ? 'b' : 'a';
  const newOwnership = { ...ownership };
  const claimed: string[] = [];
  let ownTilesUsed = 0;
  
  for (const coord of usedCoords) {
    const id = `${coord.row}-${coord.col}`;
    const current = newOwnership[id];
    
    if (current === 'neutral' || current === 'contested') {
      newOwnership[id] = player;
      claimed.push(id);
    } else if (current === player) {
      // Reinforced — stays yours
      ownTilesUsed++;
    } else if (current === opponent) {
      // Two-touch steal: flip to contested first
      newOwnership[id] = 'contested';
      claimed.push(id);
    }
  }
  
  // Bonus: Chain bonus (3+ own tiles used → +1 random neutral)
  const bonusClaims: string[] = [];
  if (ownTilesUsed >= 3) {
    const neutralTiles = Object.entries(newOwnership)
      .filter(([, v]) => v === 'neutral')
      .map(([k]) => k);
    if (neutralTiles.length > 0) {
      const rng = new SeededRandom(Date.now().toString());
      const bonusTile = rng.choice(neutralTiles);
      newOwnership[bonusTile] = player;
      bonusClaims.push(bonusTile);
    }
  }
  
  // Bonus: Long word (6+ letters) → claim 1 adjacent neutral
  if (usedCoords.length >= 6) {
    const adjacentNeutrals = new Set<string>();
    for (const coord of usedCoords) {
      const dirs = [{row:-1,col:0},{row:1,col:0},{row:0,col:-1},{row:0,col:1}];
      for (const d of dirs) {
        const nr = coord.row + d.row;
        const nc = coord.col + d.col;
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
        const nId = `${nr}-${nc}`;
        if (newOwnership[nId] === 'neutral') adjacentNeutrals.add(nId);
      }
    }
    if (adjacentNeutrals.size > 0) {
      const rng = new SeededRandom((Date.now() + 1).toString());
      const arr = Array.from(adjacentNeutrals);
      const bonusTile = rng.choice(arr);
      newOwnership[bonusTile] = player;
      bonusClaims.push(bonusTile);
    }
  }
  
  return { newOwnership, claimed, bonusClaims };
}

function countTiles(ownership: Record<string, Ownership>): { a: number; b: number; neutral: number; contested: number } {
  let a = 0, b = 0, neutral = 0, contested = 0;
  for (const v of Object.values(ownership)) {
    if (v === 'a') a++;
    else if (v === 'b') b++;
    else if (v === 'neutral') neutral++;
    else if (v === 'contested') contested++;
  }
  return { a, b, neutral, contested };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...params } = await req.json();

    // ─── CREATE MATCH ───
    if (action === 'create_match') {
      // Expire any existing waiting matches by this player
      await adminClient.from('clash_matches')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('player_a', user.id)
        .eq('status', 'waiting');

      const seed = `clash-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const gridState = generateGrid(seed);

      const { data, error } = await adminClient.from('clash_matches').insert({
        player_a: user.id,
        grid_seed: seed,
        grid_state: gridState.tiles,
        ownership: gridState.ownership,
        invite_code: inviteCode,
        status: 'waiting',
      }).select('id, invite_code').single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to create match' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ matchId: data.id, inviteCode: data.invite_code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── SUBMIT MOVE ───
    if (action === 'submit_move') {
      const { match_id, tiles_used } = params;
      // tiles_used: [{row, col}, ...]

      if (!Array.isArray(tiles_used) || tiles_used.length < MIN_WORD_LENGTH) {
        return new Response(JSON.stringify({ error: 'Word too short (min 4 letters)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!validatePath(tiles_used)) {
        return new Response(JSON.stringify({ error: 'Invalid tile path' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: match, error: matchErr } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (matchErr || !match) {
        return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (match.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Match not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (match.current_turn !== user.id) {
        return new Response(JSON.stringify({ error: 'Not your turn' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Check turn deadline
      if (match.turn_deadline && new Date(match.turn_deadline).getTime() < Date.now()) {
        // Skip turn, switch to opponent
        const opponent = user.id === match.player_a ? match.player_b : match.player_a;
        await adminClient.from('clash_matches').update({
          current_turn: opponent,
          turn_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', match_id);
        return new Response(JSON.stringify({ error: 'Turn expired' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isPlayerA = user.id === match.player_a;
      const myMoves = isPlayerA ? match.moves_a : match.moves_b;

      if (myMoves >= MAX_MOVES_PER_PLAYER) {
        return new Response(JSON.stringify({ error: 'Max moves reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Reconstruct word from grid
      const gridTiles = match.grid_state as Tile[][];
      const word = tiles_used.map((c: {row:number,col:number}) => gridTiles[c.row][c.col].char).join('');

      // Validate word
      const isValid = await validateWord(word, supabaseUrl, supabaseServiceKey);
      if (!isValid) {
        return new Response(JSON.stringify({ error: `"${word}" is not a valid word` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Apply ownership changes
      const player = isPlayerA ? 'a' : 'b' as const;
      const { newOwnership, claimed, bonusClaims } = applyOwnership(
        match.ownership as Record<string, Ownership>,
        tiles_used,
        player
      );

      // Morph grid
      const rng = new SeededRandom(`${match.grid_seed}-move-${myMoves + 1}-${player}`);
      const newTiles = morphAfterMove(gridTiles, tiles_used, rng);

      // Count tiles
      const counts = countTiles(newOwnership);
      const newMovesA = isPlayerA ? match.moves_a + 1 : match.moves_a;
      const newMovesB = isPlayerA ? match.moves_b : match.moves_b + 1;
      const totalMoves = newMovesA + newMovesB;

      // Record move
      await adminClient.from('clash_moves').insert({
        match_id,
        player_id: user.id,
        move_number: totalMoves,
        word,
        tiles_used,
        tiles_claimed: claimed,
        bonus_claims: bonusClaims,
        grid_snapshot: newTiles,
        ownership_snapshot: newOwnership,
      });

      // Check win conditions
      let matchEnded = false;
      let winnerId: string | null = null;

      // Domination (18+ tiles)
      if (counts.a >= DOMINATION_THRESHOLD) {
        matchEnded = true;
        winnerId = match.player_a;
      } else if (counts.b >= DOMINATION_THRESHOLD) {
        matchEnded = true;
        winnerId = match.player_b;
      }
      // All tiles claimed (no neutral or contested)
      else if (counts.neutral === 0 && counts.contested === 0) {
        matchEnded = true;
        if (counts.a > counts.b) winnerId = match.player_a;
        else if (counts.b > counts.a) winnerId = match.player_b;
        // else draw — winnerId stays null
      }
      // Max moves exhausted
      else if (newMovesA >= MAX_MOVES_PER_PLAYER && newMovesB >= MAX_MOVES_PER_PLAYER) {
        matchEnded = true;
        if (counts.a > counts.b) winnerId = match.player_a;
        else if (counts.b > counts.a) winnerId = match.player_b;
        // Tiebreaker: total word length
        else {
          const twlA = isPlayerA ? (match.total_word_length_a + word.length) : match.total_word_length_a;
          const twlB = isPlayerA ? match.total_word_length_b : (match.total_word_length_b + word.length);
          if (twlA > twlB) winnerId = match.player_a;
          else if (twlB > twlA) winnerId = match.player_b;
        }
      }

      const opponent = isPlayerA ? match.player_b : match.player_a;

      const matchUpdate: Record<string, unknown> = {
        grid_state: newTiles,
        ownership: newOwnership,
        tiles_a: counts.a,
        tiles_b: counts.b,
        moves_a: newMovesA,
        moves_b: newMovesB,
        total_word_length_a: isPlayerA ? match.total_word_length_a + word.length : match.total_word_length_a,
        total_word_length_b: isPlayerA ? match.total_word_length_b : match.total_word_length_b + word.length,
        current_turn: matchEnded ? null : opponent,
        turn_deadline: matchEnded ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (matchEnded) {
        matchUpdate.status = 'completed';
        matchUpdate.winner_id = winnerId;
        matchUpdate.completed_at = new Date().toISOString();
      }

      await adminClient.from('clash_matches').update(matchUpdate).eq('id', match_id);

      return new Response(JSON.stringify({
        word,
        claimed,
        bonus_claims: bonusClaims,
        tiles_a: counts.a,
        tiles_b: counts.b,
        match_ended: matchEnded,
        winner_id: winnerId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── FORFEIT ───
    if (action === 'forfeit') {
      const { match_id } = params;

      const { data: match } = await adminClient
        .from('clash_matches')
        .select('player_a, player_b, status')
        .eq('id', match_id)
        .single();

      if (!match || match.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Match not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (user.id !== match.player_a && user.id !== match.player_b) {
        return new Response(JSON.stringify({ error: 'Not in this match' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const winnerId = user.id === match.player_a ? match.player_b : match.player_a;

      await adminClient.from('clash_matches').update({
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
        current_turn: null,
        updated_at: new Date().toISOString(),
      }).eq('id', match_id);

      return new Response(JSON.stringify({ success: true, winner_id: winnerId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── CANCEL (waiting match) ───
    if (action === 'cancel_match') {
      const { match_id } = params;
      
      await adminClient.from('clash_matches').update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('id', match_id).eq('player_a', user.id).eq('status', 'waiting');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Grid Duel error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

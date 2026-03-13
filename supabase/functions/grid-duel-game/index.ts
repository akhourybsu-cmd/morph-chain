import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRID_SIZE = 5;
const MAX_MOVES_PER_PLAYER = 12;
const DOMINATION_THRESHOLD = 18;
const MIN_WORD_LENGTH = 4;
const BOT_UUID = '00000000-0000-0000-0000-b07b07b07b07';

// ─── TWL06 Dictionary ───
let twl06Set: Set<string> | null = null;
let twl06Loading: Promise<Set<string>> | null = null;

// Pre-warm dictionary at module level (starts loading during cold start)
const _preWarm = loadTWL06();

async function loadTWL06(): Promise<Set<string>> {
  if (twl06Set) return twl06Set;
  if (twl06Loading) return twl06Loading;

  twl06Loading = (async () => {
    try {
      const res = await fetch('https://morph-games.lovable.app/dict/twl06.txt');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.text();
      twl06Set = new Set<string>();
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const word = lines[i].trim().toUpperCase();
        if (i === 0 && word.includes('TWL06')) continue;
        if (!word || !/^[A-Z]+$/.test(word)) continue;
        twl06Set.add(word);
      }
      console.log(`TWL06 loaded via fetch: ${twl06Set.size} words`);
      return twl06Set;
    } catch (err) {
      console.error('Failed to fetch TWL06:', err);
      twl06Set = new Set();
      return twl06Set;
    }
  })();

  return twl06Loading;
}

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

const VOWEL_POOL = ['A','A','A','E','E','E','E','E','I','I','I','O','O','O','U','U'];
const CONSONANT_POOL = ['B','C','D','F','G','H','K','L','L','M','N','N','P','R','R','S','S','S','T','T','T','W','Y'];

interface Tile {
  id: string;
  char: string;
  isVowel: boolean;
  row: number;
  col: number;
}

type Ownership = 'neutral' | 'a' | 'b';

interface GridState {
  tiles: Tile[][];
  ownership: Record<string, Ownership>;
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
  
  for (const coord of usedCoords) {
    const tile = newTiles[coord.row][coord.col];
    const isVowel = rng.next() < 0.4;
    tile.char = isVowel ? rng.choice(VOWEL_POOL) : rng.choice(CONSONANT_POOL);
    tile.isVowel = isVowel;
  }
  
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

async function validateWord(word: string, adminClient: any): Promise<boolean> {
  try {
    const upper = word.toUpperCase();
    
    // Check against TWL06 dictionary
    const dictionary = await loadTWL06();
    if (!dictionary.has(upper)) return false;

    // Check banned in admin_dictionary
    const { data: banned } = await adminClient
      .from('admin_dictionary')
      .select('is_banned')
      .eq('word', upper)
      .eq('is_banned', true)
      .single();
    if (banned) return false;

    // Track usage
    await adminClient.from('admin_dictionary').upsert({
      word: upper,
      word_length: upper.length,
      frequency_score: 1,
      last_seen: new Date().toISOString().split('T')[0],
    }, { onConflict: 'word', ignoreDuplicates: false });

    return true;
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
    
    if (current === 'neutral') {
      newOwnership[id] = player;
      claimed.push(id);
    } else if (current === player) {
      ownTilesUsed++;
    } else if (current === opponent) {
      newOwnership[id] = player;
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

function countTiles(ownership: Record<string, Ownership>): { a: number; b: number; neutral: number } {
  let a = 0, b = 0, neutral = 0;
  for (const v of Object.values(ownership)) {
    if (v === 'a') a++;
    else if (v === 'b') b++;
    else neutral++;
  }
  return { a, b, neutral };
}

// ─── Bot Word Finding ───
async function findBotWords(tiles: Tile[][], ownership: Record<string, Ownership>, usedWords: string[]): Promise<{ path: {row:number,col:number}[]; word: string; score: number }[]> {
  const candidates: { path: {row:number,col:number}[]; word: string; score: number }[] = [];
  const usedSet = new Set(usedWords.map(w => w.toUpperCase()));
  const dictionary = await loadTWL06();

  function dfs(path: {row:number,col:number}[], visited: Set<string>) {
    if (path.length >= MIN_WORD_LENGTH && path.length <= 6) {
      const word = path.map(c => tiles[c.row][c.col].char).join('');
      const upper = word.toUpperCase();
      if (!usedSet.has(upper) && dictionary.has(upper)) {
        // Score: prefer stealing opponent tiles, then neutral, then length
        let score = 0;
        for (const c of path) {
          const id = `${c.row}-${c.col}`;
          const own = ownership[id];
          if (own === 'a') score += 3; // steal from player
          else if (own === 'neutral') score += 1;
        }
        score += path.length * 0.5;
        candidates.push({ path: [...path], word, score });
      }
    }
    if (path.length >= 6) return;

    const last = path[path.length - 1];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = last.row + dr;
        const nc = last.col + dc;
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
        const key = `${nr}-${nc}`;
        if (visited.has(key)) continue;
        visited.add(key);
        path.push({ row: nr, col: nc });
        dfs(path, visited);
        path.pop();
        visited.delete(key);
      }
    }
  }

  // Start DFS from every cell
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const visited = new Set<string>();
      visited.add(`${r}-${c}`);
      dfs([{ row: r, col: c }], visited);
    }
  }

  return candidates;
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
        used_words: [],
      }).select('id, invite_code').single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to create match' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ matchId: data.id, inviteCode: data.invite_code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── CREATE BOT MATCH ───
    if (action === 'create_bot_match') {
      // Expire stale waiting matches
      await adminClient.from('clash_matches')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('player_a', user.id)
        .eq('status', 'waiting');

      const seed = `clash-bot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const gridState = generateGrid(seed);
      const firstTurn = Math.random() < 0.5 ? user.id : BOT_UUID;

      const { data, error } = await adminClient.from('clash_matches').insert({
        player_a: user.id,
        player_b: BOT_UUID,
        grid_seed: seed,
        grid_state: gridState.tiles,
        ownership: gridState.ownership,
        status: 'active',
        current_turn: firstTurn,
        turn_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used_words: [],
        is_bot_match: true,
      }).select('id').single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Failed to create bot match' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // If bot goes first, play the bot's first move immediately
      if (firstTurn === BOT_UUID) {
        await executeBotMove(adminClient, data.id);
      }

      return new Response(JSON.stringify({ matchId: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── BOT MOVE ───
    if (action === 'bot_move') {
      const { match_id } = params;

      const { data: match } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!match || !match.is_bot_match || match.current_turn !== BOT_UUID || match.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Not bot turn or not bot match' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = await executeBotMove(adminClient, match_id);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── SUBMIT MOVE ───
    if (action === 'submit_move') {
      const { match_id, tiles_used } = params;

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

      if (match.turn_deadline && new Date(match.turn_deadline).getTime() < Date.now()) {
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

      const gridTiles = match.grid_state as Tile[][];
      const word = tiles_used.map((c: {row:number,col:number}) => gridTiles[c.row][c.col].char).join('');

      // Check word reuse
      const usedWords = (match.used_words as string[]) || [];
      if (usedWords.includes(word.toUpperCase())) {
        return new Response(JSON.stringify({ error: `"${word}" has already been played` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isValid = await validateWord(word, adminClient);
      if (!isValid) {
        return new Response(JSON.stringify({ error: `"${word}" is not a valid word` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const player = isPlayerA ? 'a' : 'b' as const;
      const { newOwnership, claimed, bonusClaims } = applyOwnership(
        match.ownership as Record<string, Ownership>,
        tiles_used,
        player
      );

      const rng = new SeededRandom(`${match.grid_seed}-move-${myMoves + 1}-${player}`);
      const newTiles = morphAfterMove(gridTiles, tiles_used, rng);

      const counts = countTiles(newOwnership);
      const newMovesA = isPlayerA ? match.moves_a + 1 : match.moves_a;
      const newMovesB = isPlayerA ? match.moves_b : match.moves_b + 1;
      const totalMoves = newMovesA + newMovesB;

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

      let matchEnded = false;
      let winnerId: string | null = null;

      if (counts.a >= DOMINATION_THRESHOLD) {
        matchEnded = true;
        winnerId = match.player_a;
      } else if (counts.b >= DOMINATION_THRESHOLD) {
        matchEnded = true;
        winnerId = match.player_b;
      } else if (counts.neutral === 0) {
        matchEnded = true;
        if (counts.a > counts.b) winnerId = match.player_a;
        else if (counts.b > counts.a) winnerId = match.player_b;
      } else if (newMovesA >= MAX_MOVES_PER_PLAYER && newMovesB >= MAX_MOVES_PER_PLAYER) {
        matchEnded = true;
        if (counts.a > counts.b) winnerId = match.player_a;
        else if (counts.b > counts.a) winnerId = match.player_b;
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
        used_words: [...usedWords, word.toUpperCase()],
        updated_at: new Date().toISOString(),
      };

      if (matchEnded) {
        matchUpdate.status = 'completed';
        matchUpdate.winner_id = winnerId;
        matchUpdate.completed_at = new Date().toISOString();
      }

      await adminClient.from('clash_matches').update(matchUpdate).eq('id', match_id);

      // Re-fetch the full updated match to return to client
      const { data: updatedMatch } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      return new Response(JSON.stringify({
        word,
        claimed,
        bonus_claims: bonusClaims,
        tiles_a: counts.a,
        tiles_b: counts.b,
        match_ended: matchEnded,
        winner_id: winnerId,
        is_bot_match: !!match.is_bot_match,
        bot_turn: !matchEnded && opponent === BOT_UUID,
        match: updatedMatch || undefined,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── SKIP TURN ───
    if (action === 'skip_turn') {
      const { match_id } = params;

      const { data: match, error: matchErr } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (matchErr || !match || match.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Match not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (match.current_turn !== user.id) {
        return new Response(JSON.stringify({ error: 'Not your turn' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isPlayerA = user.id === match.player_a;
      const myMoves = isPlayerA ? match.moves_a : match.moves_b;

      if (myMoves >= MAX_MOVES_PER_PLAYER) {
        return new Response(JSON.stringify({ error: 'Max moves reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const newMovesA = isPlayerA ? match.moves_a + 1 : match.moves_a;
      const newMovesB = isPlayerA ? match.moves_b : match.moves_b + 1;
      const opponent = isPlayerA ? match.player_b : match.player_a;

      // Check if match ends after skip
      let matchEnded = false;
      let winnerId: string | null = null;

      if (newMovesA >= MAX_MOVES_PER_PLAYER && newMovesB >= MAX_MOVES_PER_PLAYER) {
        matchEnded = true;
        const counts = countTiles(match.ownership as Record<string, Ownership>);
        if (counts.a > counts.b) winnerId = match.player_a;
        else if (counts.b > counts.a) winnerId = match.player_b;
        else {
          if (match.total_word_length_a > match.total_word_length_b) winnerId = match.player_a;
          else if (match.total_word_length_b > match.total_word_length_a) winnerId = match.player_b;
        }
      }

      // Record skip as a move
      const totalMoves = newMovesA + newMovesB;
      await adminClient.from('clash_moves').insert({
        match_id,
        player_id: user.id,
        move_number: totalMoves,
        word: '[SKIP]',
        tiles_used: [],
        tiles_claimed: [],
        bonus_claims: [],
        grid_snapshot: match.grid_state,
        ownership_snapshot: match.ownership,
      });

      const matchUpdate: Record<string, unknown> = {
        moves_a: newMovesA,
        moves_b: newMovesB,
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

      // Re-fetch the full updated match
      const { data: updatedMatch } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        match_ended: matchEnded,
        winner_id: winnerId,
        is_bot_match: !!match.is_bot_match,
        bot_turn: !matchEnded && opponent === BOT_UUID,
        match: updatedMatch || undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

      // Re-fetch the full updated match
      const { data: updatedMatch } = await adminClient
        .from('clash_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      return new Response(JSON.stringify({ success: true, winner_id: winnerId, match: updatedMatch || undefined }), {
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

// ─── Execute Bot Move (reusable) ───
async function executeBotMove(
  adminClient: any,
  matchId: string,
): Promise<{ success: boolean; word?: string; skipped?: boolean; match_ended?: boolean }> {
  const { data: match } = await adminClient
    .from('clash_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match || match.current_turn !== BOT_UUID || match.status !== 'active') {
    return { success: false };
  }

  const gridTiles = match.grid_state as Tile[][];
  const usedWords = (match.used_words as string[]) || [];
  const botMoves = match.moves_b;

  if (botMoves >= MAX_MOVES_PER_PLAYER) {
    return { success: false };
  }

  // Find all possible words via DFS
  const candidates = await findBotWords(gridTiles, match.ownership as Record<string, Ownership>, usedWords);

  // Validate top candidates against dictionary (batch check top 30 by score)
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, 30);

  let bestMove: { path: {row:number,col:number}[]; word: string } | null = null;

  for (const cand of topCandidates) {
    const isValid = await validateWord(cand.word, adminClient);
    if (isValid) {
      bestMove = cand;
      break;
    }
  }

  if (!bestMove) {
    // Skip turn if no valid word found
    const newMovesB = botMoves + 1;
    const newMovesA = match.moves_a;
    let matchEnded = false;
    let winnerId: string | null = null;

    if (newMovesA >= MAX_MOVES_PER_PLAYER && newMovesB >= MAX_MOVES_PER_PLAYER) {
      matchEnded = true;
      const counts = countTiles(match.ownership as Record<string, Ownership>);
      if (counts.a > counts.b) winnerId = match.player_a;
      else if (counts.b > counts.a) winnerId = match.player_b;
    }

    const totalMoves = newMovesA + newMovesB;
    await adminClient.from('clash_moves').insert({
      match_id: matchId,
      player_id: BOT_UUID,
      move_number: totalMoves,
      word: '[SKIP]',
      tiles_used: [],
      tiles_claimed: [],
      bonus_claims: [],
      grid_snapshot: match.grid_state,
      ownership_snapshot: match.ownership,
    });

    const update: Record<string, unknown> = {
      moves_b: newMovesB,
      current_turn: matchEnded ? null : match.player_a,
      turn_deadline: matchEnded ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (matchEnded) {
      update.status = 'completed';
      update.winner_id = winnerId;
      update.completed_at = new Date().toISOString();
    }
    await adminClient.from('clash_matches').update(update).eq('id', matchId);

    return { success: true, skipped: true, match_ended: matchEnded };
  }

  // Execute the move
  const { newOwnership, claimed, bonusClaims } = applyOwnership(
    match.ownership as Record<string, Ownership>,
    bestMove.path,
    'b'
  );

  const rng = new SeededRandom(`${match.grid_seed}-move-${botMoves + 1}-b`);
  const newTiles = morphAfterMove(gridTiles, bestMove.path, rng);

  const counts = countTiles(newOwnership);
  const newMovesA = match.moves_a;
  const newMovesB = botMoves + 1;
  const totalMoves = newMovesA + newMovesB;

  await adminClient.from('clash_moves').insert({
    match_id: matchId,
    player_id: BOT_UUID,
    move_number: totalMoves,
    word: bestMove.word,
    tiles_used: bestMove.path,
    tiles_claimed: claimed,
    bonus_claims: bonusClaims,
    grid_snapshot: newTiles,
    ownership_snapshot: newOwnership,
  });

  let matchEnded = false;
  let winnerId: string | null = null;

  if (counts.b >= DOMINATION_THRESHOLD) {
    matchEnded = true;
    winnerId = match.player_b;
  } else if (counts.a >= DOMINATION_THRESHOLD) {
    matchEnded = true;
    winnerId = match.player_a;
  } else if (counts.neutral === 0) {
    matchEnded = true;
    if (counts.a > counts.b) winnerId = match.player_a;
    else if (counts.b > counts.a) winnerId = match.player_b;
  } else if (newMovesA >= MAX_MOVES_PER_PLAYER && newMovesB >= MAX_MOVES_PER_PLAYER) {
    matchEnded = true;
    if (counts.a > counts.b) winnerId = match.player_a;
    else if (counts.b > counts.a) winnerId = match.player_b;
  }

  const matchUpdate: Record<string, unknown> = {
    grid_state: newTiles,
    ownership: newOwnership,
    tiles_a: counts.a,
    tiles_b: counts.b,
    moves_b: newMovesB,
    total_word_length_b: match.total_word_length_b + bestMove.word.length,
    current_turn: matchEnded ? null : match.player_a,
    turn_deadline: matchEnded ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    used_words: [...usedWords, bestMove.word.toUpperCase()],
    updated_at: new Date().toISOString(),
  };

  if (matchEnded) {
    matchUpdate.status = 'completed';
    matchUpdate.winner_id = winnerId;
    matchUpdate.completed_at = new Date().toISOString();
  }

  await adminClient.from('clash_matches').update(matchUpdate).eq('id', matchId);

  return { success: true, word: bestMove.word, match_ended: matchEnded };
}

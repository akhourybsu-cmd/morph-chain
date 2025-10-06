import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Word filters (same as client-side)
const HARDCODED_BANLIST = new Set([
  // Profanity and slurs (keeping PG-13 examples minimal)
  "DAMN", "HELL", "ARSE", "CRAP", "PISS", "SHIT", "FUCK", "CUNT",
  // Racial slurs
  "NAZI", "JAPS", "GOOK", "PAKI",
  // Sexual content
  "PORN", "ORGY", "DILDO", "BDSM", "SLUTS", "WHORE", "PIMP",
]);

const ARCHAIC_WORDS = new Set([
  "THOU", "THEE", "THINE", "HATH", "DOTH", "SHALT", "WHILST", 
  "WHENCE", "WHITHER", "HITHER", "THITHER", "YEA", "NAY", 
  "FORSOOTH", "PRITHEE", "METHINKS", "MAYHAP", "BETWIXT", 
  "SAITH", "GOETH", "WAST", "WERT", "DOST", "DIDST", "TWAS", 
  "YONDER", "VERILY", "ALAS", "HARK", "ANON", "ERE", "UNTO", 
  "THENCE", "WHEREFORE", "PERCHANCE", "WOULDST", "CANST", 
  "SHOULDST", "COULDST", "FAIN", "WONT", "MAYST", "MIGHTST", 
  "OUGHTEST", "NEEDST", "SHANT", "WONT", "AINT", "TWIXT"
]);

const PROPER_NOUNS = new Set([
  "MARY", "JOHN", "JACK", "JANE", "KATE", "DAVE", "MIKE", "LUKE", 
  "PAUL", "MARK", "ANNE", "EMMA", "LISA", "SARA", "ADAM", "RYAN", 
  "ERIC", "CHAD", "BRAD", "TINA", "GINA", "NINA", "CARL", "KARL",
  "ROME", "PERU", "CUBA", "IRAQ", "IRAN", "SYRIA", "CHINA", "JAPAN", 
  "INDIA", "ITALY", "SPAIN", "WALES", "CONGO", "KENYA", "GHANA", "HAITI",
]);

const SLANG_WORDS = new Set([
  "YOLO", "SWAG", "DOPE", "LEGIT", "HYPE", "SALTY", "SICK", 
  "LIT", "FAM", "WOKE", "FLEX", "VIBES", "LOWKEY", "HIGHKEY", 
  "GOAT", "STAN", "SIMP", "BASED", "CRINGE", "BOOMER", "KAREN", 
  "BRUH", "YEET", "THICC", "SHOOK"
]);

const TECHNICAL_JARGON = new Set([
  "HTTP", "HTML", "JSON", "AJAX", "BLOB", "MQTT", "SMTP", "IMAP", 
  "LDAP", "DHCP", "SNMP", "ICMP", "VLAN", "VPN", "VOIP", "BIOS", 
  "UEFI", "RAID", "SCSI", "SATA", "NVMe", "PCIe", "DDR", "GPU", 
  "CPU", "RAM", "SSD", "HDD", "USB", "HDMI", "DVI", "VGA"
]);

function filterModernEnglish(words: Set<string>): Set<string> {
  const filtered = new Set<string>();
  for (const word of words) {
    if (
      HARDCODED_BANLIST.has(word) ||
      ARCHAIC_WORDS.has(word) ||
      PROPER_NOUNS.has(word) ||
      SLANG_WORDS.has(word) ||
      TECHNICAL_JARGON.has(word)
    ) {
      continue;
    }
    filtered.add(word);
  }
  return filtered;
}

// Optimized BFS with bidirectional search for large puzzles
function findShortestPath(
  start: string,
  goal: string,
  validWords: Set<string>,
  allowTwoLetterChange: boolean = false
): { solvable: boolean; minMoves: number; path: string[] } {
  if (start === goal) {
    return { solvable: true, minMoves: 0, path: [start] };
  }

  const wordLength = start.length;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Generate neighbors efficiently
  function getNeighbors(word: string, visited: Set<string>): string[] {
    const neighbors: string[] = [];
    
    // One-letter changes
    for (let i = 0; i < wordLength; i++) {
      for (const letter of letters) {
        if (letter === word[i]) continue;
        const candidate = word.substring(0, i) + letter + word.substring(i + 1);
        if (validWords.has(candidate) && !visited.has(candidate)) {
          neighbors.push(candidate);
        }
      }
    }
    
    // Two-letter changes (if allowed - enumerate all combinations)
    if (allowTwoLetterChange) {
      for (let i = 0; i < wordLength; i++) {
        for (let j = i + 1; j < wordLength; j++) {
          for (const letter1 of letters) {
            if (letter1 === word[i]) continue;
            for (const letter2 of letters) {
              if (letter2 === word[j]) continue;
              const candidate = 
                word.substring(0, i) + letter1 + 
                word.substring(i + 1, j) + letter2 + 
                word.substring(j + 1);
              if (validWords.has(candidate) && !visited.has(candidate)) {
                neighbors.push(candidate);
              }
            }
          }
        }
      }
    }
    
    return neighbors;
  }

  // Bidirectional BFS for better performance
  const forwardQueue = [{ word: start, path: [start] }];
  const backwardQueue = [{ word: goal, path: [goal] }];
  const forwardVisited = new Map<string, string[]>([[start, [start]]]);
  const backwardVisited = new Map<string, string[]>([[goal, [goal]]]);

  while (forwardQueue.length > 0 && backwardQueue.length > 0) {
    // Always expand the smaller frontier
    if (forwardQueue.length <= backwardQueue.length) {
      const current = forwardQueue.shift()!;
      const neighbors = getNeighbors(current.word, new Set(forwardVisited.keys()));
      
      for (const nextWord of neighbors) {
        const newPath = [...current.path, nextWord];
        
        // Check if we've met the backward search
        if (backwardVisited.has(nextWord)) {
          const backPath = backwardVisited.get(nextWord)!;
          const fullPath = [...newPath, ...backPath.slice(1).reverse()];
          return {
            solvable: true,
            minMoves: fullPath.length - 1,
            path: fullPath
          };
        }
        
        forwardVisited.set(nextWord, newPath);
        forwardQueue.push({ word: nextWord, path: newPath });
      }
    } else {
      const current = backwardQueue.shift()!;
      const neighbors = getNeighbors(current.word, new Set(backwardVisited.keys()));
      
      for (const nextWord of neighbors) {
        const newPath = [...current.path, nextWord];
        
        // Check if we've met the forward search
        if (forwardVisited.has(nextWord)) {
          const forwardPath = forwardVisited.get(nextWord)!;
          const fullPath = [...forwardPath, ...newPath.slice(1).reverse()];
          return {
            solvable: true,
            minMoves: fullPath.length - 1,
            path: fullPath
          };
        }
        
        backwardVisited.set(nextWord, newPath);
        backwardQueue.push({ word: nextWord, path: newPath });
      }
    }
  }
  
  return { solvable: false, minMoves: -1, path: [] };
}

// Load word dictionary from the same source as the game
async function loadDictionary(wordLength: number): Promise<Set<string>> {
  try {
    // Fetch the word list from the repository
    const response = await fetch(
      'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch dictionary');
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    const wordsRaw = new Set<string>();
    
    for (const line of lines) {
      const word = line.trim().toUpperCase();
      if (word.length === wordLength) {
        wordsRaw.add(word);
      }
    }
    
    // Apply the same filters as the game
    const filtered = filterModernEnglish(wordsRaw);
    console.log(`Loaded ${filtered.size} words for ${wordLength}L (before filtering: ${wordsRaw.size})`);
    
    return filtered;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return new Set();
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { startWord, goalWord, wordLength, allowTwoLetterChange = false } = await req.json();

    if (!startWord || !goalWord || !wordLength) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking solvability: ${startWord} -> ${goalWord} (${wordLength}L)`);

    // Load dictionary for this word length (same as game uses)
    const validWords = await loadDictionary(wordLength);
    
    if (validWords.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No dictionary available for this word length. Please populate the dictionary first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure both words are in the dictionary
    validWords.add(startWord.toUpperCase());
    validWords.add(goalWord.toUpperCase());

    console.log(`Dictionary loaded: ${validWords.size} words`);

    // Run BFS to find shortest path
    const startTime = Date.now();
    const result = findShortestPath(
      startWord.toUpperCase(),
      goalWord.toUpperCase(),
      validWords,
      allowTwoLetterChange
    );
    const duration = Date.now() - startTime;

    console.log(`Solvability check completed in ${duration}ms`);
    console.log(`Result: ${result.solvable ? 'SOLVABLE' : 'UNSOLVABLE'}, minMoves: ${result.minMoves}`);

    return new Response(
      JSON.stringify({
        solvable: result.solvable,
        minMoves: result.minMoves,
        path: result.path,
        pathLength: result.path.length,
        computeTime: duration,
        dictionarySize: validWords.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-puzzle-solvability:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

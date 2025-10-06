import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side banlist (proprietary filtering logic)
const ARCHAIC_WORDS = new Set([
  "PEASE", "CHARE", "YCLEPT", "NAE", "GAOL", "THEE", "THOU", "THINE",
  "HATH", "DOTH", "TWAS", "SHALT", "WHENCE", "HITHER", "THITHER",
  "YEA", "NAY", "ERE", "FORE", "AUGHT", "NAUGHT", "BETWIXT",
]);

const PROPER_NOUNS = new Set([
  "TESLA", "PARIS", "LONDON", "APPLE", "GOOGLE", "IPHONE", "AMAZON",
  "NETFLIX", "ZOOM", "UBER", "LYFT", "BOEING", "FORD", "HONDA",
  "PEPSI", "COKE", "DISNEY", "XBOX", "CHINA", "JAPAN", "INDIA",
]);

const SLANG_WORDS = new Set([
  "FOMO", "LOL", "OMG", "WTF", "BTW", "THX", "PLS", "YOLO",
  "SELFIE", "GONNA", "WANNA", "GOTTA", "DUNNO", "KINDA", "SORTA",
]);

const TECHNICAL_JARGON = new Set([
  "ETHYLS", "BENZOL", "PHENOL", "ALKYL", "MOIETY", "INTARSIA",
  "SERIFS", "BEZIER", "CODEC", "MUTEX", "REGEX",
]);

const HARDCODED_BANLIST = new Set([
  ...ARCHAIC_WORDS,
  ...PROPER_NOUNS,
  ...SLANG_WORDS,
  ...TECHNICAL_JARGON,
]);

function validateWordStructure(word: string): { valid: boolean; reason?: string } {
  const upper = word.toUpperCase();
  
  // Check for excessive letter repetition
  const letterCounts = new Map<string, number>();
  for (const char of upper) {
    letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
    if (letterCounts.get(char)! >= 3) {
      return { valid: false, reason: 'Invalid word structure' };
    }
  }
  
  // Check for vowel/consonant diversity
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  const hasVowel = Array.from(upper).some(c => vowels.has(c));
  const hasConsonant = Array.from(upper).some(c => !vowels.has(c));
  
  if (!hasVowel || !hasConsonant) {
    return { valid: false, reason: 'Invalid word structure' };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting (more generous for word validation)
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'validate-word',
      _max_requests: 500,
      _window_minutes: 15
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { word, wordLength } = await req.json();

    if (!word || !wordLength) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Missing parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperWord = word.toUpperCase();

    // Check hardcoded banlist
    if (HARDCODED_BANLIST.has(upperWord)) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Word not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check word structure
    const structureCheck = validateWordStructure(upperWord);
    if (!structureCheck.valid) {
      return new Response(
        JSON.stringify({ valid: false, reason: structureCheck.reason }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check database banlist
    const { data: bannedWord } = await supabase
      .from('admin_dictionary')
      .select('is_banned')
      .eq('word', upperWord)
      .eq('is_banned', true)
      .single();

    if (bannedWord) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Word not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track word usage (async, don't wait)
    supabase
      .from('admin_dictionary')
      .upsert({
        word: upperWord,
        word_length: wordLength,
        frequency_score: 1,
        last_seen: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'word',
        ignoreDuplicates: false
      })
      .then(() => {
        // Increment frequency if exists
        supabase.rpc('increment_word_frequency', { _word: upperWord });
      });

    // Word is valid
    return new Response(
      JSON.stringify({ valid: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-word:', error);
    return new Response(
      JSON.stringify({ valid: false, reason: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

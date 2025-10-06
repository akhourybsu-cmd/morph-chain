import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded banlist from wordFilters.ts
const BANLIST = new Set([
  "PEASE", "CHARE", "YCLEPT", "NAE", "GAOL", "THEE", "THOU", "THINE",
  "HATH", "DOTH", "TWAS", "SHALT", "WHENCE", "HITHER", "THITHER",
  "YEA", "NAY", "ERE", "FORE", "AUGHT", "NAUGHT", "BETWIXT",
  "TESLA", "PARIS", "LONDON", "APPLE", "GOOGLE", "IPHONE", "AMAZON",
  "NETFLIX", "ZOOM", "UBER", "LYFT", "BOEING", "FORD", "HONDA",
  "PEPSI", "COKE", "DISNEY", "XBOX", "CHINA", "JAPAN", "INDIA",
  "FOMO", "LOL", "OMG", "WTF", "BTW", "THX", "PLS", "YOLO",
  "SELFIE", "GONNA", "WANNA", "GOTTA", "DUNNO", "KINDA", "SORTA",
  "ETHYLS", "BENZOL", "PHENOL", "ALKYL", "MOIETY", "INTARSIA",
  "SERIFS", "BEZIER", "CODEC", "MUTEX", "REGEX",
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { puzzles } = await req.json();
    
    console.log('Populating dictionary from puzzles:', puzzles?.length || 0);

    const uniqueWords = new Set<string>();
    
    // Extract unique words from puzzles
    for (const puzzle of puzzles) {
      uniqueWords.add(puzzle.start.toUpperCase());
      uniqueWords.add(puzzle.goal.toUpperCase());
    }

    console.log('Unique words found:', uniqueWords.size);

    const wordsToInsert = Array.from(uniqueWords).map(word => ({
      word: word.toUpperCase(),
      word_length: word.length,
      is_banned: BANLIST.has(word.toUpperCase()),
      ban_reason: BANLIST.has(word.toUpperCase()) ? 'Hardcoded banlist' : null,
      first_seen: new Date().toISOString().split('T')[0],
    }));

    // Insert words in batches
    const batchSize = 100;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < wordsToInsert.length; i += batchSize) {
      const batch = wordsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('admin_dictionary')
        .upsert(batch, { 
          onConflict: 'word',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error inserting batch:', error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Dictionary populated: ${inserted} words inserted, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted,
        skipped,
        total: uniqueWords.size 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in populate-dictionary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

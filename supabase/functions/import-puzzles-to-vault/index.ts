import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { puzzles } = await req.json();

    if (!puzzles || !Array.isArray(puzzles)) {
      return new Response(
        JSON.stringify({ error: 'Invalid puzzle data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Importing ${puzzles.length} puzzles to vault...`);

    let imported = 0;
    let skipped = 0;

    // Import puzzles in batches
    for (let i = 0; i < puzzles.length; i += 50) {
      const batch = puzzles.slice(i, i + 50);
      
      const puzzleRecords = batch.map((p: any, idx: number) => ({
        word_length: p.wordLength || p.start?.length || 4,
        start_word: p.start,
        goal_word: p.goal,
        min_distance: p.minDist || p.minDistance || 3,
        puzzle_index: p.index !== undefined ? p.index : (i + idx),
        theme_tags: p.themes || p.tags || [],
        is_active: true,
        created_by: user.id
      }));

      const { data, error } = await supabase
        .from('admin_puzzle_vault')
        .upsert(puzzleRecords, {
          onConflict: 'word_length,puzzle_index',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Batch import error:', error);
        skipped += batch.length;
      } else {
        imported += batch.length;
      }
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped,
        message: `Successfully imported ${imported} puzzles to secure vault`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-puzzles-to-vault:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

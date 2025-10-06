import { supabase } from "@/integrations/supabase/client";

/**
 * Track word usage in the dictionary
 */
export const trackWordUsage = async (word: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const upperWord = word.toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  try {
    // First, check if word exists
    const { data: existing } = await supabase
      .from('admin_dictionary')
      .select('id, frequency_score, first_seen')
      .eq('word', upperWord)
      .maybeSingle();

    if (existing) {
      // Update existing word
      await supabase
        .from('admin_dictionary')
        .update({
          last_seen: today,
          frequency_score: (existing.frequency_score || 0) + 1,
        })
        .eq('id', existing.id);
    } else {
      // Insert new word
      await supabase
        .from('admin_dictionary')
        .insert({
          word: upperWord,
          word_length: word.length,
          first_seen: today,
          last_seen: today,
          frequency_score: 1,
        });
    }
  } catch (error) {
    console.error('Error tracking word usage:', error);
  }
};

/**
 * Submit a word dispute/complaint
 */
export const submitWordDispute = async (word: string, reason: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'User must be authenticated to dispute words' };
  }

  const upperWord = word.toUpperCase();

  try {
    // Check if word exists in dictionary
    const { data: existing } = await supabase
      .from('admin_dictionary')
      .select('id, complaint_count')
      .eq('word', upperWord)
      .maybeSingle();

    if (existing) {
      // Increment complaint count
      const { error } = await supabase
        .from('admin_dictionary')
        .update({
          complaint_count: (existing.complaint_count || 0) + 1,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new entry with complaint
      const { error } = await supabase
        .from('admin_dictionary')
        .insert({
          word: upperWord,
          word_length: word.length,
          complaint_count: 1,
          first_seen: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
    }

    // Log the audit trail
    await supabase
      .from('admin_audit_log')
      .insert({
        user_id: user.id,
        action: 'word_disputed',
        entity_type: 'dictionary',
        entity_id: existing?.id,
        details: { word: upperWord, reason },
      });

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting word dispute:', error);
    return { error: error.message };
  }
};

/**
 * Fetch banned words from database (with caching)
 */
const CACHE_KEY = 'banned_words_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const fetchBannedWords = async (): Promise<Set<string>> => {
  try {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { words, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return new Set(words);
      }
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('admin_dictionary')
      .select('word')
      .eq('is_banned', true);

    if (error) throw error;

    const bannedWords = new Set(data.map(row => row.word.toUpperCase()));

    // Update cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      words: Array.from(bannedWords),
      timestamp: Date.now(),
    }));

    return bannedWords;
  } catch (error) {
    console.error('Error fetching banned words:', error);
    return new Set();
  }
};

/**
 * Clear banned words cache
 */
export const clearBannedWordsCache = () => {
  localStorage.removeItem(CACHE_KEY);
};

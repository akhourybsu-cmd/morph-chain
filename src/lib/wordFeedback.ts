import { supabase } from "@/integrations/supabase/client";

/**
 * Submit word feedback/complaint to the word_feedback table
 * This replaces direct writes to admin_dictionary for better security
 */
export const submitWordFeedback = async (
  word: string,
  reason: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const upperWord = word.toUpperCase();
    
    const { error } = await supabase
      .from('word_feedback')
      .insert({
        user_id: user.id,
        word: upperWord,
        word_length: upperWord.length,
        reason: reason,
        status: 'pending'
      });

    if (error) {
      console.error("Error submitting word feedback:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception submitting word feedback:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
};

/**
 * Get user's submitted feedback
 */
export const getUserFeedback = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('word_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user feedback:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching user feedback:", err);
    return [];
  }
};

/**
 * Get pending feedback count for admins
 */
export const getPendingFeedbackCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('word_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error("Error fetching pending feedback count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Exception fetching pending feedback count:", err);
    return 0;
  }
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          completed: boolean | null
          device_token: string
          game_type: string
          id: string
          last_activity_at: string
          mode: string | null
          moves_count: number | null
          puzzle_date: string
          started_at: string
          user_id: string | null
          won: boolean | null
          word_length: number | null
        }
        Insert: {
          completed?: boolean | null
          device_token: string
          game_type: string
          id?: string
          last_activity_at?: string
          mode?: string | null
          moves_count?: number | null
          puzzle_date: string
          started_at?: string
          user_id?: string | null
          won?: boolean | null
          word_length?: number | null
        }
        Update: {
          completed?: boolean | null
          device_token?: string
          game_type?: string
          id?: string
          last_activity_at?: string
          mode?: string | null
          moves_count?: number | null
          puzzle_date?: string
          started_at?: string
          user_id?: string | null
          won?: boolean | null
          word_length?: number | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      admin_dictionary: {
        Row: {
          ban_reason: string | null
          complaint_count: number | null
          created_at: string
          first_seen: string | null
          frequency_score: number | null
          id: string
          is_banned: boolean
          last_seen: string | null
          updated_at: string
          word: string
          word_length: number
        }
        Insert: {
          ban_reason?: string | null
          complaint_count?: number | null
          created_at?: string
          first_seen?: string | null
          frequency_score?: number | null
          id?: string
          is_banned?: boolean
          last_seen?: string | null
          updated_at?: string
          word: string
          word_length: number
        }
        Update: {
          ban_reason?: string | null
          complaint_count?: number | null
          created_at?: string
          first_seen?: string | null
          frequency_score?: number | null
          id?: string
          is_banned?: boolean
          last_seen?: string | null
          updated_at?: string
          word?: string
          word_length?: number
        }
        Relationships: []
      }
      admin_puzzle_vault: {
        Row: {
          created_at: string | null
          created_by: string | null
          generated_at: string | null
          generation_batch: string | null
          goal_word: string
          id: string
          is_active: boolean | null
          last_served_date: string | null
          min_distance: number
          puzzle_index: number
          quality_score: number | null
          start_word: string
          theme_tags: string[] | null
          word_length: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          generated_at?: string | null
          generation_batch?: string | null
          goal_word: string
          id?: string
          is_active?: boolean | null
          last_served_date?: string | null
          min_distance: number
          puzzle_index: number
          quality_score?: number | null
          start_word: string
          theme_tags?: string[] | null
          word_length: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          generated_at?: string | null
          generation_batch?: string | null
          goal_word?: string
          id?: string
          is_active?: boolean | null
          last_served_date?: string | null
          min_distance?: number
          puzzle_index?: number
          quality_score?: number | null
          start_word?: string
          theme_tags?: string[] | null
          word_length?: number
        }
        Relationships: []
      }
      admin_puzzles: {
        Row: {
          avg_branching_factor: number | null
          created_at: string
          created_by: string | null
          goal_word: string
          health_score: number | null
          id: string
          max_moves: number
          min_distance: number
          puzzle_index: number | null
          scheduled_date: string | null
          shortest_path_count: number | null
          start_word: string
          status: Database["public"]["Enums"]["puzzle_status"]
          theme_tags: string[] | null
          updated_at: string
          variant: Database["public"]["Enums"]["puzzle_variant"]
          word_length: number
        }
        Insert: {
          avg_branching_factor?: number | null
          created_at?: string
          created_by?: string | null
          goal_word: string
          health_score?: number | null
          id?: string
          max_moves: number
          min_distance: number
          puzzle_index?: number | null
          scheduled_date?: string | null
          shortest_path_count?: number | null
          start_word: string
          status?: Database["public"]["Enums"]["puzzle_status"]
          theme_tags?: string[] | null
          updated_at?: string
          variant: Database["public"]["Enums"]["puzzle_variant"]
          word_length: number
        }
        Update: {
          avg_branching_factor?: number | null
          created_at?: string
          created_by?: string | null
          goal_word?: string
          health_score?: number | null
          id?: string
          max_moves?: number
          min_distance?: number
          puzzle_index?: number | null
          scheduled_date?: string | null
          shortest_path_count?: number | null
          start_word?: string
          status?: Database["public"]["Enums"]["puzzle_status"]
          theme_tags?: string[] | null
          updated_at?: string
          variant?: Database["public"]["Enums"]["puzzle_variant"]
          word_length?: number
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          endpoint: string
          id: string
          last_request: string | null
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          last_request?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          last_request?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      arcade_completions: {
        Row: {
          completed_at: string
          date_local: string
          id: string
          moves: number
          session_id: string
          user_id: string
          word_chain: Json
        }
        Insert: {
          completed_at?: string
          date_local: string
          id?: string
          moves: number
          session_id: string
          user_id: string
          word_chain?: Json
        }
        Update: {
          completed_at?: string
          date_local?: string
          id?: string
          moves?: number
          session_id?: string
          user_id?: string
          word_chain?: Json
        }
        Relationships: []
      }
      arcade_daily: {
        Row: {
          created_at: string
          date_local: string
          goal_word: string
          id: string
          min_distance: number
          puzzle_number: number
          start_word: string
        }
        Insert: {
          created_at?: string
          date_local: string
          goal_word: string
          id?: string
          min_distance: number
          puzzle_number: number
          start_word: string
        }
        Update: {
          created_at?: string
          date_local?: string
          goal_word?: string
          id?: string
          min_distance?: number
          puzzle_number?: number
          start_word?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          key: string
          rollout_percentage: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          rollout_percentage?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          rollout_percentage?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      grid_daily_leaderboard: {
        Row: {
          completed_at: string
          created_at: string
          date_local: string
          id: string
          initials: string | null
          moves: number
          rank: number | null
          time_to_complete_ms: number | null
          user_id: string
          words_used: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          date_local: string
          id?: string
          initials?: string | null
          moves: number
          rank?: number | null
          time_to_complete_ms?: number | null
          user_id: string
          words_used: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          date_local?: string
          id?: string
          initials?: string | null
          moves?: number
          rank?: number | null
          time_to_complete_ms?: number | null
          user_id?: string
          words_used?: number
        }
        Relationships: []
      }
      grid_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          date_local: string
          id: string
          moves: number
          session_id: string
          started_at: string
          time_to_complete_ms: number | null
          user_id: string
          won: boolean | null
          words_used: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          date_local: string
          id?: string
          moves?: number
          session_id: string
          started_at?: string
          time_to_complete_ms?: number | null
          user_id: string
          won?: boolean | null
          words_used?: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          date_local?: string
          id?: string
          moves?: number
          session_id?: string
          started_at?: string
          time_to_complete_ms?: number | null
          user_id?: string
          won?: boolean | null
          words_used?: number
        }
        Relationships: []
      }
      player_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          hints_used: number | null
          id: string
          invalid_guesses: number | null
          moves: Json
          puzzle_date: string
          session_id: string
          started_at: string
          user_id: string
          won: boolean | null
          word_length: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          invalid_guesses?: number | null
          moves?: Json
          puzzle_date: string
          session_id: string
          started_at?: string
          user_id: string
          won?: boolean | null
          word_length: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          invalid_guesses?: number | null
          moves?: Json
          puzzle_date?: string
          session_id?: string
          started_at?: string
          user_id?: string
          won?: boolean | null
          word_length?: number
        }
        Relationships: []
      }
      prism_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_text: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_text?: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rush_daily: {
        Row: {
          created_at: string
          date_local: string
          health_score: number | null
          id: string
          puzzle_number: number
          start_degree: number | null
          start_word: string
          status: string
        }
        Insert: {
          created_at?: string
          date_local: string
          health_score?: number | null
          id?: string
          puzzle_number: number
          start_degree?: number | null
          start_word: string
          status?: string
        }
        Update: {
          created_at?: string
          date_local?: string
          health_score?: number | null
          id?: string
          puzzle_number?: number
          start_degree?: number | null
          start_word?: string
          status?: string
        }
        Relationships: []
      }
      rush_runs: {
        Row: {
          created_at: string
          date_local: string
          finished_at: string | null
          hard_mode: boolean
          id: string
          initials: string | null
          invalid_count: number
          mode: string
          multiplier_max: number
          official_status: string
          score: number
          scout_used: boolean
          session_id: string
          started_at: string
          undo_used: boolean
          user_id: string
          words: Json
        }
        Insert: {
          created_at?: string
          date_local: string
          finished_at?: string | null
          hard_mode?: boolean
          id?: string
          initials?: string | null
          invalid_count?: number
          mode: string
          multiplier_max?: number
          official_status?: string
          score?: number
          scout_used?: boolean
          session_id: string
          started_at?: string
          undo_used?: boolean
          user_id: string
          words?: Json
        }
        Update: {
          created_at?: string
          date_local?: string
          finished_at?: string | null
          hard_mode?: boolean
          id?: string
          initials?: string | null
          invalid_count?: number
          mode?: string
          multiplier_max?: number
          official_status?: string
          score?: number
          scout_used?: boolean
          session_id?: string
          started_at?: string
          undo_used?: boolean
          user_id?: string
          words?: Json
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_config_status: {
        Row: {
          id: string
          is_enabled: boolean
          last_checked_at: string
          notes: string | null
          setting_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          last_checked_at?: string
          notes?: string | null
          setting_name: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_enabled?: boolean
          last_checked_at?: string
          notes?: string | null
          setting_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_path: string | null
          default_initials: string | null
          display_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          default_initials?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          default_initials?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          settings: Json
          stats: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          stats?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          stats?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
          word: string
          word_length: number
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          word: string
          word_length: number
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          word?: string
          word_length?: number
        }
        Relationships: []
      }
    }
    Views: {
      arcade_daily_leaderboard: {
        Row: {
          completed_at: string | null
          date_local: string | null
          initials: string | null
          moves: number | null
          rank: number | null
          user_id: string | null
        }
        Relationships: []
      }
      rush_best_runs: {
        Row: {
          date_local: string | null
          finished_at: string | null
          hard_mode: boolean | null
          id: string | null
          initials: string | null
          invalid_count: number | null
          mode: string | null
          multiplier_max: number | null
          score: number | null
          session_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      rush_daily_leaderboard: {
        Row: {
          date_local: string | null
          finished_at: string | null
          hard_mode: boolean | null
          initials: string | null
          mode: string | null
          multiplier_max: number | null
          rank: number | null
          score: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_arcade_completions: {
        Row: {
          avg_moves: number | null
          best_moves: number | null
          total_completions: number | null
          unique_completers: number | null
          worst_moves: number | null
        }
        Relationships: []
      }
      v_chain_completions: {
        Row: {
          avg_moves_to_win: number | null
          best_moves: number | null
          total_completed: number | null
          total_won: number | null
          unique_completers: number | null
          unique_winners: number | null
          word_length: number | null
          worst_moves: number | null
        }
        Relationships: []
      }
      v_grid_completions: {
        Row: {
          avg_moves: number | null
          avg_time_seconds: number | null
          best_moves: number | null
          total_completions: number | null
          unique_completers: number | null
          worst_moves: number | null
        }
        Relationships: []
      }
      v_my_stats: {
        Row: {
          chain_avg_time_ms: number | null
          chain_best_moves: number | null
          chain_plays: number | null
          chain_wins: number | null
          grid_avg_time_ms: number | null
          grid_best_moves: number | null
          grid_plays: number | null
          grid_wins: number | null
          rush_avg_score: number | null
          rush_best_multiplier: number | null
          rush_best_score: number | null
          rush_plays: number | null
          rush_time_ms: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_overall_activity: {
        Row: {
          game: string | null
          sessions_completed: number | null
          sessions_started: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_rush_completions: {
        Row: {
          avg_max_multiplier: number | null
          avg_score: number | null
          best_multiplier: number | null
          hard_mode: boolean | null
          max_score: number | null
          mode: string | null
          total_completed: number | null
          total_runs: number | null
          unique_completers: number | null
          unique_players: number | null
        }
        Relationships: []
      }
      v_user_engagement: {
        Row: {
          chain_days_played: number | null
          grid_days_played: number | null
          last_active_date: string | null
          rush_days_played: number | null
          total_days_played: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_stats_all: {
        Row: {
          chain_avg_time_ms: number | null
          chain_best_moves: number | null
          chain_plays: number | null
          chain_wins: number | null
          grid_avg_time_ms: number | null
          grid_best_moves: number | null
          grid_plays: number | null
          grid_wins: number | null
          rush_avg_score: number | null
          rush_best_multiplier: number | null
          rush_best_score: number | null
          rush_plays: number | null
          rush_time_ms: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_stats_chain: {
        Row: {
          avg_time_ms: number | null
          best_moves: number | null
          plays: number | null
          user_id: string | null
          wins: number | null
        }
        Relationships: []
      }
      v_user_stats_grid: {
        Row: {
          avg_time_ms: number | null
          best_moves: number | null
          plays: number | null
          user_id: string | null
          wins: number | null
        }
        Relationships: []
      }
      v_user_stats_rush: {
        Row: {
          avg_score: number | null
          best_multiplier: number | null
          best_score: number | null
          plays: number | null
          total_ms: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _endpoint: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      get_arcade_daily_leaderboard: {
        Args: { p_date: string; p_limit?: number }
        Returns: {
          completed_at: string
          initials: string
          moves: number
          rank: number
          user_id: string
        }[]
      }
      get_grid_daily_leaderboard: {
        Args: { p_date: string; p_limit?: number }
        Returns: {
          completed_at: string
          initials: string
          moves: number
          rank: number
          time_to_complete_ms: number
          user_id: string
          words_used: number
        }[]
      }
      get_rush_daily_leaderboard: {
        Args: { p_date: string; p_limit?: number; p_mode: string }
        Returns: {
          hard_mode: boolean
          initials: string
          multiplier_max: number
          rank: number
          score: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "beta_tester"
      puzzle_status: "draft" | "preview" | "live" | "disabled" | "completed"
      puzzle_variant: "delta1" | "delta2" | "delta2_first"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "beta_tester"],
      puzzle_status: ["draft", "preview", "live", "disabled", "completed"],
      puzzle_variant: ["delta1", "delta2", "delta2_first"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          approved_count: number | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          errors: Json | null
          findings_count: number | null
          flagged_count: number | null
          generated_count: number | null
          id: string
          rejected_count: number | null
          run_id: string
        }
        Insert: {
          approved_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          findings_count?: number | null
          flagged_count?: number | null
          generated_count?: number | null
          id?: string
          rejected_count?: number | null
          run_id: string
        }
        Update: {
          approved_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          findings_count?: number | null
          flagged_count?: number | null
          generated_count?: number | null
          id?: string
          rejected_count?: number | null
          run_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_at: string
          performed_by: string | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          row_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip: string | null
          metadata: Json
          parent_id: string
          provider: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json
          parent_id: string
          provider?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json
          parent_id?: string
          provider?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          criteria_world: number | null
          description: string
          icon: string
          id: string
          name: string
          rarity: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria_type: string
          criteria_value: number
          criteria_world?: number | null
          description: string
          icon: string
          id?: string
          name: string
          rarity?: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          criteria_world?: number | null
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      child_badges: {
        Row: {
          badge_id: string
          child_id: string
          earned_at: string
          id: string
        }
        Insert: {
          badge_id: string
          child_id: string
          earned_at?: string
          id?: string
        }
        Update: {
          badge_id?: string
          child_id?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_badges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          age_band: string
          avatar_config: Json | null
          created_at: string
          daily_time_limit_minutes: number | null
          deactivated_at: string | null
          display_name: string
          games_played_this_week: number
          games_reset_week: string
          id: string
          level: number
          parent_id: string
          preferences: Json | null
          prompts_reset_date: string
          prompts_used_today: number
          spark_coins: number
          streak_count: number
          streak_last_date: string | null
          streak_shield: boolean
          updated_at: string
          xp: number
          xp_awarded_today: number
          xp_reset_date: string
        }
        Insert: {
          age: number
          age_band: string
          avatar_config?: Json | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          deactivated_at?: string | null
          display_name: string
          games_played_this_week?: number
          games_reset_week?: string
          id?: string
          level?: number
          parent_id: string
          preferences?: Json | null
          prompts_reset_date?: string
          prompts_used_today?: number
          spark_coins?: number
          streak_count?: number
          streak_last_date?: string | null
          streak_shield?: boolean
          updated_at?: string
          xp?: number
          xp_awarded_today?: number
          xp_reset_date?: string
        }
        Update: {
          age?: number
          age_band?: string
          avatar_config?: Json | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          deactivated_at?: string | null
          display_name?: string
          games_played_this_week?: number
          games_reset_week?: string
          id?: string
          level?: number
          parent_id?: string
          preferences?: Json | null
          prompts_reset_date?: string
          prompts_used_today?: number
          spark_coins?: number
          streak_count?: number
          streak_last_date?: string | null
          streak_shield?: boolean
          updated_at?: string
          xp?: number
          xp_awarded_today?: number
          xp_reset_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          content_body: string
          created_at: string
          difficulty: string
          estimated_minutes: number
          game_config: Json | null
          id: string
          is_agent_generated: boolean
          is_free: boolean
          published_at: string | null
          quiz_questions: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_check: Json | null
          slug: string
          sort_order: number
          source_urls: string[] | null
          status: string
          target_age_band: string
          title: string
          type: string
          update_reason: string | null
          updated_by: string | null
          world: number
          xp_reward: number
        }
        Insert: {
          content_body?: string
          created_at?: string
          difficulty?: string
          estimated_minutes?: number
          game_config?: Json | null
          id?: string
          is_agent_generated?: boolean
          is_free?: boolean
          published_at?: string | null
          quiz_questions?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_check?: Json | null
          slug?: string
          sort_order?: number
          source_urls?: string[] | null
          status?: string
          target_age_band: string
          title: string
          type: string
          update_reason?: string | null
          updated_by?: string | null
          world: number
          xp_reward?: number
        }
        Update: {
          content_body?: string
          created_at?: string
          difficulty?: string
          estimated_minutes?: number
          game_config?: Json | null
          id?: string
          is_agent_generated?: boolean
          is_free?: boolean
          published_at?: string | null
          quiz_questions?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_check?: Json | null
          slug?: string
          sort_order?: number
          source_urls?: string[] | null
          status?: string
          target_age_band?: string
          title?: string
          type?: string
          update_reason?: string | null
          updated_by?: string | null
          world?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          agent_run_id: string | null
          content_json: Json
          content_type: string | null
          difficulty: string
          game_id: string | null
          generated_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_check: Json
          source_urls: string[] | null
          status: string
          target_age_band: string
          title: string
          type: string
          world: number
        }
        Insert: {
          agent_run_id?: string | null
          content_json: Json
          content_type?: string | null
          difficulty?: string
          game_id?: string | null
          generated_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_check: Json
          source_urls?: string[] | null
          status?: string
          target_age_band: string
          title: string
          type: string
          world: number
        }
        Update: {
          agent_run_id?: string | null
          content_json?: Json
          content_type?: string | null
          difficulty?: string
          game_id?: string | null
          generated_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_check?: Json
          source_urls?: string[] | null
          status?: string
          target_age_band?: string
          title?: string
          type?: string
          world?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          parent_id: string
          salt: string
          used_at: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          parent_id: string
          salt: string
          used_at?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          parent_id?: string
          salt?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_backup_codes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          coppa_consent_at: string | null
          created_at: string
          dunning_last_sent_at: string | null
          dunning_stage: number | null
          dunning_started_at: string | null
          dunning_tier_before: string | null
          email: string
          email_verified_at: string | null
          full_name: string | null
          grace_period_ends_at: string | null
          id: string
          is_admin: boolean
          oauth_last_provider: string | null
          oauth_last_used_at: string | null
          onboarding_complete: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_period_end: string | null
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          coppa_consent_at?: string | null
          created_at?: string
          dunning_last_sent_at?: string | null
          dunning_stage?: number | null
          dunning_started_at?: string | null
          dunning_tier_before?: string | null
          email: string
          email_verified_at?: string | null
          full_name?: string | null
          grace_period_ends_at?: string | null
          id: string
          is_admin?: boolean
          oauth_last_provider?: string | null
          oauth_last_used_at?: string | null
          onboarding_complete?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          coppa_consent_at?: string | null
          created_at?: string
          dunning_last_sent_at?: string | null
          dunning_stage?: number | null
          dunning_started_at?: string | null
          dunning_tier_before?: string | null
          email?: string
          email_verified_at?: string | null
          full_name?: string | null
          grace_period_ends_at?: string | null
          id?: string
          is_admin?: boolean
          oauth_last_provider?: string | null
          oauth_last_used_at?: string | null
          onboarding_complete?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      passkey_challenges: {
        Row: {
          challenge: string
          created_at: string
          expected_origin: string
          expected_rp_id: string
          expires_at: string
          kind: string
          parent_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expected_origin: string
          expected_rp_id: string
          expires_at?: string
          kind: string
          parent_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expected_origin?: string
          expected_rp_id?: string
          expires_at?: string
          kind?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passkey_challenges_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      passkey_credentials: {
        Row: {
          aaguid: string | null
          attestation_format: string
          backed_up: boolean
          counter: number
          created_at: string
          device_type: string
          forge_attested: boolean
          id: string
          last_used_at: string | null
          nickname: string
          parent_id: string
          public_key: string
          revoked_at: string | null
          transports: string[]
        }
        Insert: {
          aaguid?: string | null
          attestation_format?: string
          backed_up?: boolean
          counter?: number
          created_at?: string
          device_type: string
          forge_attested?: boolean
          id: string
          last_used_at?: string | null
          nickname?: string
          parent_id: string
          public_key: string
          revoked_at?: string | null
          transports?: string[]
        }
        Update: {
          aaguid?: string | null
          attestation_format?: string
          backed_up?: boolean
          counter?: number
          created_at?: string
          device_type?: string
          forge_attested?: boolean
          id?: string
          last_used_at?: string | null
          nickname?: string
          parent_id?: string
          public_key?: string
          revoked_at?: string | null
          transports?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "passkey_credentials_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          attempts: number
          child_id: string
          completed: boolean
          completed_at: string | null
          content_id: string
          created_at: string
          id: string
          score: number | null
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          attempts?: number
          child_id: string
          completed?: boolean
          completed_at?: string | null
          content_id: string
          created_at?: string
          id?: string
          score?: number | null
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          attempts?: number
          child_id?: string
          completed?: boolean
          completed_at?: string | null
          content_id?: string
          created_at?: string
          id?: string
          score?: number | null
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_history: {
        Row: {
          age_band: string
          child_id: string
          created_at: string
          id: string
          moderation_passed: boolean
          prompt: string
          response: string
          temperature: number
        }
        Insert: {
          age_band: string
          child_id: string
          created_at?: string
          id?: string
          moderation_passed?: boolean
          prompt: string
          response: string
          temperature?: number
        }
        Update: {
          age_band?: string
          child_id?: string
          created_at?: string
          id?: string
          moderation_passed?: boolean
          prompt?: string
          response?: string
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          child_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
        }
        Insert: {
          child_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Update: {
          child_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          parent_id: string | null
          processed: boolean
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          parent_id?: string | null
          processed?: boolean
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          parent_id?: string | null
          processed?: boolean
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events_detail: {
        Row: {
          created_at: string
          data: Json
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_detail_stripe_event_id_fkey"
            columns: ["stripe_event_id"]
            isOneToOne: true
            referencedRelation: "subscription_events"
            referencedColumns: ["stripe_event_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_is_anonymous: { Args: never; Returns: boolean }
      cleanup_expired_passkey_challenges: { Args: never; Returns: number }
      cleanup_old_prompts: { Args: never; Returns: undefined }
      cleanup_orphaned_subscription_events: { Args: never; Returns: number }
      get_lab_progress: {
        Args: { p_age_band: string; p_child_id: string; p_world: number }
        Returns: {
          completed_items: number
          percent: number
          total_items: number
        }[]
      }
      get_parent_dashboard: {
        Args: { p_parent_id: string }
        Returns: {
          age_band: string
          badges_earned: number
          child_id: string
          daily_time_limit_minutes: number
          display_name: string
          games_played: number
          last_active: string
          lessons_completed: number
          level: number
          quizzes_passed: number
          streak_count: number
          streak_last_date: string
          total_time_minutes: number
          xp: number
        }[]
      }
      mfa_backup_codes_remaining: {
        Args: { p_parent_id: string }
        Returns: number
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

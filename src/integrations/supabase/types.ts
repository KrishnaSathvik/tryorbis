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
      backlog_items: {
        Row: {
          created_at: string
          demand_score: number | null
          id: string
          idea_name: string
          notes: Json
          overall_score: number | null
          source: string
          source_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demand_score?: number | null
          id?: string
          idea_name: string
          notes?: Json
          overall_score?: number | null
          source: string
          source_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demand_score?: number | null
          id?: string
          idea_name?: string
          notes?: Json
          overall_score?: number | null
          source?: string
          source_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      generator_runs: {
        Row: {
          budget_scope: string | null
          category: string
          competition_density: Json | null
          created_at: string
          defensibility: Json | null
          feature_gap_map: Json | null
          gtm_strategy: Json | null
          icp: Json | null
          id: string
          idea_suggestions: Json
          market_timing: Json | null
          persona: string
          platform: string | null
          platform_risk: Json | null
          pricing_benchmarks: Json | null
          problem_clusters: Json
          region: string | null
          user_id: string
          workaround_detection: Json | null
          wtp_signals: Json | null
        }
        Insert: {
          budget_scope?: string | null
          category: string
          competition_density?: Json | null
          created_at?: string
          defensibility?: Json | null
          feature_gap_map?: Json | null
          gtm_strategy?: Json | null
          icp?: Json | null
          id?: string
          idea_suggestions?: Json
          market_timing?: Json | null
          persona: string
          platform?: string | null
          platform_risk?: Json | null
          pricing_benchmarks?: Json | null
          problem_clusters?: Json
          region?: string | null
          user_id: string
          workaround_detection?: Json | null
          wtp_signals?: Json | null
        }
        Update: {
          budget_scope?: string | null
          category?: string
          competition_density?: Json | null
          created_at?: string
          defensibility?: Json | null
          feature_gap_map?: Json | null
          gtm_strategy?: Json | null
          icp?: Json | null
          id?: string
          idea_suggestions?: Json
          market_timing?: Json | null
          persona?: string
          platform?: string | null
          platform_risk?: Json | null
          pricing_benchmarks?: Json | null
          problem_clusters?: Json
          region?: string | null
          user_id?: string
          workaround_detection?: Json | null
          wtp_signals?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          credits_reset_at: string | null
          device_fingerprint: string | null
          display_name: string
          email: string | null
          id: string
          max_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          credits_reset_at?: string | null
          device_fingerprint?: string | null
          display_name?: string
          email?: string | null
          id?: string
          max_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          credits_reset_at?: string | null
          device_fingerprint?: string | null
          display_name?: string
          email?: string | null
          id?: string
          max_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          created_at: string
          error_message: string | null
          error_type: string | null
          function_name: string
          id: string
          latency_ms: number
          provider: string | null
          status: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          function_name: string
          id?: string
          latency_ms?: number
          provider?: string | null
          status?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          function_name?: string
          id?: string
          latency_ms?: number
          provider?: string | null
          status?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      validation_reports: {
        Row: {
          competition_density: Json | null
          competitors: Json
          cons: Json
          created_at: string
          defensibility: Json | null
          evidence_links: Json
          feature_gap_map: Json | null
          gap_opportunities: Json
          gtm_strategy: Json | null
          icp: Json | null
          id: string
          idea_text: string
          kill_test: string | null
          market_sizing: Json | null
          market_timing: Json | null
          mvp_wedge: string | null
          platform_risk: Json | null
          pricing_benchmarks: Json | null
          pros: Json
          scores: Json
          user_id: string
          verdict: string
          workaround_detection: Json | null
          wtp_signals: Json | null
        }
        Insert: {
          competition_density?: Json | null
          competitors?: Json
          cons?: Json
          created_at?: string
          defensibility?: Json | null
          evidence_links?: Json
          feature_gap_map?: Json | null
          gap_opportunities?: Json
          gtm_strategy?: Json | null
          icp?: Json | null
          id?: string
          idea_text: string
          kill_test?: string | null
          market_sizing?: Json | null
          market_timing?: Json | null
          mvp_wedge?: string | null
          platform_risk?: Json | null
          pricing_benchmarks?: Json | null
          pros?: Json
          scores?: Json
          user_id: string
          verdict: string
          workaround_detection?: Json | null
          wtp_signals?: Json | null
        }
        Update: {
          competition_density?: Json | null
          competitors?: Json
          cons?: Json
          created_at?: string
          defensibility?: Json | null
          evidence_links?: Json
          feature_gap_map?: Json | null
          gap_opportunities?: Json
          gtm_strategy?: Json | null
          icp?: Json | null
          id?: string
          idea_text?: string
          kill_test?: string | null
          market_sizing?: Json | null
          market_timing?: Json | null
          mvp_wedge?: string | null
          platform_risk?: Json | null
          pricing_benchmarks?: Json | null
          pros?: Json
          scores?: Json
          user_id?: string
          verdict?: string
          workaround_detection?: Json | null
          wtp_signals?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_old_request_logs: { Args: never; Returns: undefined }
      try_deduct_credit: { Args: { p_user_id: string }; Returns: boolean }
      try_deduct_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: boolean
      }
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

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_settings: {
        Row: {
          club_location: string | null
          club_name: string
          club_short_name: string | null
          default_meeting_location_id: string | null
          id: string
          logo_path: string | null
          member_classes_enabled: boolean
          season_end_month: number
          season_start_month: number
          timezone: string
          updated_at: string
        }
        Insert: {
          club_location?: string | null
          club_name?: string
          club_short_name?: string | null
          default_meeting_location_id?: string | null
          id?: string
          logo_path?: string | null
          member_classes_enabled?: boolean
          season_end_month?: number
          season_start_month?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          club_location?: string | null
          club_name?: string
          club_short_name?: string | null
          default_meeting_location_id?: string | null
          id?: string
          logo_path?: string | null
          member_classes_enabled?: boolean
          season_end_month?: number
          season_start_month?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_settings_default_meeting_location_id_fkey"
            columns: ["default_meeting_location_id"]
            isOneToOne: false
            referencedRelation: "meeting_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_categories: {
        Row: {
          competition_id: string
          id: string
          name: string
        }
        Insert: {
          competition_id: string
          id?: string
          name: string
        }
        Update: {
          competition_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_default_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      competition_defaults: {
        Row: {
          allow_decimals: boolean
          capture_date_amount: number
          capture_date_unit: string
          hide_exif_data: boolean
          hide_member_names: boolean
          id: string
          image_long_edge_custom: number | null
          image_long_edge_preset: string
          image_reuse_rule: string
          judge_comments_min_chars: number
          judging_method: string
          max_entries_per_category: number | null
          max_entries_per_member: number
          require_capture_date: boolean
          require_judge_comments: boolean
          results_visibility: string
          results_visibility_delay_hours: number
          score_aggregation: string
          score_max: number
          score_min: number
          score_min_to_publish: number
          score_min_to_publish_enabled: boolean
          updated_at: string
          withdrawal_frees_slot: boolean
        }
        Insert: {
          allow_decimals?: boolean
          capture_date_amount?: number
          capture_date_unit?: string
          hide_exif_data?: boolean
          hide_member_names?: boolean
          id?: string
          image_long_edge_custom?: number | null
          image_long_edge_preset?: string
          image_reuse_rule?: string
          judge_comments_min_chars?: number
          judging_method?: string
          max_entries_per_category?: number | null
          max_entries_per_member?: number
          require_capture_date?: boolean
          require_judge_comments?: boolean
          results_visibility?: string
          results_visibility_delay_hours?: number
          score_aggregation?: string
          score_max?: number
          score_min?: number
          score_min_to_publish?: number
          score_min_to_publish_enabled?: boolean
          updated_at?: string
          withdrawal_frees_slot?: boolean
        }
        Update: {
          allow_decimals?: boolean
          capture_date_amount?: number
          capture_date_unit?: string
          hide_exif_data?: boolean
          hide_member_names?: boolean
          id?: string
          image_long_edge_custom?: number | null
          image_long_edge_preset?: string
          image_reuse_rule?: string
          judge_comments_min_chars?: number
          judging_method?: string
          max_entries_per_category?: number | null
          max_entries_per_member?: number
          require_capture_date?: boolean
          require_judge_comments?: boolean
          results_visibility?: string
          results_visibility_delay_hours?: number
          score_aggregation?: string
          score_max?: number
          score_min?: number
          score_min_to_publish?: number
          score_min_to_publish_enabled?: boolean
          updated_at?: string
          withdrawal_frees_slot?: boolean
        }
        Relationships: []
      }
      competition_templates: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitions: {
        Row: {
          allow_half_points: boolean
          allow_notes_to_judge: boolean
          anonymise_exif: boolean
          anonymise_members: boolean
          archived_at: string | null
          award_types: Json
          awards_enabled: boolean
          blind_judging: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          capture_date_window_months: number | null
          closes_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_reuse_rule: string
          judge_instructions: string | null
          judging_at: string | null
          judging_closes_at: string | null
          judging_opens_at: string | null
          max_entries_per_category: number | null
          max_long_edge: number
          opens_at: string | null
          preset: string
          reminders_sent: Json
          require_capture_date: boolean
          require_feedback: boolean
          results_at: string | null
          results_event_type: string | null
          score_aggregation: string
          score_max: number
          score_min: number
          short_title: string | null
          status: Database["public"]["Enums"]["competition_status"]
          submission_limit: number
          template_id: string | null
          title: string
          withdrawal_frees_slot: boolean
        }
        Insert: {
          allow_half_points?: boolean
          allow_notes_to_judge?: boolean
          anonymise_exif?: boolean
          anonymise_members?: boolean
          archived_at?: string | null
          award_types?: Json
          awards_enabled?: boolean
          blind_judging?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capture_date_window_months?: number | null
          closes_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_reuse_rule?: string
          judge_instructions?: string | null
          judging_at?: string | null
          judging_closes_at?: string | null
          judging_opens_at?: string | null
          max_entries_per_category?: number | null
          max_long_edge?: number
          opens_at?: string | null
          preset?: string
          reminders_sent?: Json
          require_capture_date?: boolean
          require_feedback?: boolean
          results_at?: string | null
          results_event_type?: string | null
          score_aggregation?: string
          score_max?: number
          score_min?: number
          short_title?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          submission_limit?: number
          template_id?: string | null
          title: string
          withdrawal_frees_slot?: boolean
        }
        Update: {
          allow_half_points?: boolean
          allow_notes_to_judge?: boolean
          anonymise_exif?: boolean
          anonymise_members?: boolean
          archived_at?: string | null
          award_types?: Json
          awards_enabled?: boolean
          blind_judging?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capture_date_window_months?: number | null
          closes_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_reuse_rule?: string
          judge_instructions?: string | null
          judging_at?: string | null
          judging_closes_at?: string | null
          judging_opens_at?: string | null
          max_entries_per_category?: number | null
          max_long_edge?: number
          opens_at?: string | null
          preset?: string
          reminders_sent?: Json
          require_capture_date?: boolean
          require_feedback?: boolean
          results_at?: string | null
          results_event_type?: string | null
          score_aggregation?: string
          score_max?: number
          score_min?: number
          short_title?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          submission_limit?: number
          template_id?: string | null
          title?: string
          withdrawal_frees_slot?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "competitions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string
          description: string | null
          exif_data: Json | null
          exif_unique_id: string | null
          file_size: number | null
          height_px: number | null
          id: string
          owner_id: string
          p_hash: string | null
          p_hash_status: string
          storage_path: string
          title: string
          width_px: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exif_data?: Json | null
          exif_unique_id?: string | null
          file_size?: number | null
          height_px?: number | null
          id?: string
          owner_id: string
          p_hash?: string | null
          p_hash_status?: string
          storage_path: string
          title: string
          width_px?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exif_data?: Json | null
          exif_unique_id?: string | null
          file_size?: number | null
          height_px?: number | null
          id?: string
          owner_id?: string
          p_hash?: string | null
          p_hash_status?: string
          storage_path?: string
          title?: string
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_category_awards: {
        Row: {
          category_id: string
          completed_at: string
          judge_token_id: string
        }
        Insert: {
          category_id: string
          completed_at?: string
          judge_token_id: string
        }
        Update: {
          category_id?: string
          completed_at?: string
          judge_token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_category_awards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_category_awards_judge_token_id_fkey"
            columns: ["judge_token_id"]
            isOneToOne: false
            referencedRelation: "judge_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_directory: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      judge_tokens: {
        Row: {
          access_code: string
          competition_id: string
          created_at: string
          id: string
          invitation_sent_at: string | null
          judge_email: string
          judge_name: string
          submitted_at: string | null
          token: string
        }
        Insert: {
          access_code?: string
          competition_id: string
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          judge_email: string
          judge_name: string
          submitted_at?: string | null
          token?: string
        }
        Update: {
          access_code?: string
          competition_id?: string
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          judge_email?: string
          judge_name?: string
          submitted_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_tokens_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      member_classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          published_at: string | null
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          published_at?: string | null
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          camera_brands: string[]
          created_at: string
          display_name: string
          experience_level: string | null
          first_name: string | null
          id: string
          last_name: string | null
          member_number: number
          membership_class: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          role: Database["public"]["Enums"]["user_role"] | null
          shooting_interests: string[]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          camera_brands?: string[]
          created_at?: string
          display_name: string
          experience_level?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          member_number?: number
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          role?: Database["public"]["Enums"]["user_role"] | null
          shooting_interests?: string[]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          camera_brands?: string[]
          created_at?: string
          display_name?: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          member_number?: number
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          role?: Database["public"]["Enums"]["user_role"] | null
          shooting_interests?: string[]
        }
        Relationships: []
      }
      scores: {
        Row: {
          award_id: string | null
          created_at: string
          flagged: boolean
          id: string
          judge_token_id: string
          notes: string | null
          rank: number | null
          score: number
          submission_id: string
        }
        Insert: {
          award_id?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          judge_token_id: string
          notes?: string | null
          rank?: number | null
          score: number
          submission_id: string
        }
        Update: {
          award_id?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          judge_token_id?: string
          notes?: string | null
          rank?: number | null
          score?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_judge_token_id_fkey"
            columns: ["judge_token_id"]
            isOneToOne: false
            referencedRelation: "judge_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          category_id: string
          competition_id: string
          duplicate_warning_override: boolean
          duplicate_warning_shown: boolean
          id: string
          image_id: string
          member_id: string
          notes: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
        }
        Insert: {
          category_id: string
          competition_id: string
          duplicate_warning_override?: boolean
          duplicate_warning_shown?: boolean
          id?: string
          image_id: string
          member_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
        }
        Update: {
          category_id?: string
          competition_id?: string
          duplicate_warning_override?: boolean
          duplicate_warning_shown?: boolean
          id?: string
          image_id?: string
          member_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_approved_member: { Args: never; Returns: boolean }
    }
    Enums: {
      calendar_event_type:
        | "competition"
        | "regular_meeting"
        | "board_meeting"
        | "field_trip"
        | "other"
        | "submission_open"
        | "submission_closed"
      competition_status:
        | "draft"
        | "open"
        | "judging"
        | "closed"
        | "judging_on_hold"
        | "cancelled"
        | "results_pending"
        | "results_published"
      membership_status:
        | "pending"
        | "approved"
        | "active"
        | "expired"
        | "paused"
        | "complimentary"
        | "banned"
        | "cancelled"
      submission_status: "submitted" | "withdrawn"
      user_role: "admin" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      calendar_event_type: [
        "competition",
        "regular_meeting",
        "board_meeting",
        "field_trip",
        "other",
        "submission_open",
        "submission_closed",
      ],
      competition_status: [
        "draft",
        "open",
        "judging",
        "closed",
        "judging_on_hold",
        "cancelled",
        "results_pending",
        "results_published",
      ],
      membership_status: [
        "pending",
        "approved",
        "active",
        "expired",
        "paused",
        "complimentary",
        "banned",
        "cancelled",
      ],
      submission_status: ["submitted", "withdrawn"],
      user_role: ["admin", "member"],
    },
  },
} as const

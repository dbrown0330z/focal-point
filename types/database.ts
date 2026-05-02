export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface RemindersSent {
  admin7Day:           boolean
  admin1Day:           boolean
  adminOnOpen:         boolean
  adminFollowUpCount:  number   // 0–3
  judge1Day:           boolean
  judgeClosingDay:     boolean
}

export type Database = {
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
      club_settings: {
        Row: {
          id: string
          club_name: string
          club_short_name: string | null
          club_location: string | null
          timezone: string
          logo_path: string | null
          season_start_month: number
          season_end_month: number
          member_classes_enabled: boolean
          default_meeting_location_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          club_name?: string
          club_short_name?: string | null
          club_location?: string | null
          timezone?: string
          logo_path?: string | null
          season_start_month?: number
          season_end_month?: number
          member_classes_enabled?: boolean
          default_meeting_location_id?: string | null
          updated_at?: string
        }
        Update: {
          club_name?: string
          club_short_name?: string | null
          club_location?: string | null
          timezone?: string
          logo_path?: string | null
          season_start_month?: number
          season_end_month?: number
          member_classes_enabled?: boolean
          default_meeting_location_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_locations: {
        Row: {
          id: string
          name: string
          address: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          address?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      member_classes: {
        Row: {
          id: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      competition_templates: {
        Row: {
          id: string
          name: string
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      competition_default_categories: {
        Row: {
          id:         string
          name:       string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?:         string
          name:        string
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?:       string
          sort_order?: number
        }
        Relationships: []
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
      competitions: {
        Row: {
          closes_at:            string | null
          created_at:           string
          description:          string | null
          id:                   string
          judging_at:           string | null
          judging_opens_at:     string | null
          judging_closes_at:    string | null
          reminders_sent:       RemindersSent
          opens_at:             string | null
          status:               Database["public"]["Enums"]["competition_status"]
          submission_limit:     number
          template_id:          string | null
          title:                string
          archived_at:          string | null
          cancelled_at:         string | null
          cancellation_reason:  string | null
          deleted_at:           string | null
          results_at:           string | null
          results_event_type:   string | null
          score_min:            number
          score_max:            number
          judge_instructions:   string | null
          preset:               string
          allow_half_points:    boolean
          anonymise_members:    boolean
          anonymise_exif:       boolean
          require_feedback:     boolean
          awards_enabled:       boolean
          award_types:          Json
          score_aggregation:    'sum' | 'average' | 'drop_extremes'
          blind_judging:        boolean
        }
        Insert: {
          closes_at?:            string | null
          created_at?:           string
          description?:          string | null
          id?:                   string
          judging_at?:           string | null
          judging_opens_at?:     string | null
          judging_closes_at?:    string | null
          reminders_sent?:       RemindersSent
          opens_at?:             string | null
          status?:               Database["public"]["Enums"]["competition_status"]
          submission_limit?:     number
          template_id?:          string | null
          title:                 string
          archived_at?:          string | null
          cancelled_at?:         string | null
          cancellation_reason?:  string | null
          deleted_at?:           string | null
          results_at?:           string | null
          results_event_type?:   string | null
          score_min?:            number
          score_max?:            number
          judge_instructions?:   string | null
          preset?:               string
          allow_half_points?:    boolean
          anonymise_members?:    boolean
          anonymise_exif?:       boolean
          require_feedback?:     boolean
          awards_enabled?:       boolean
          award_types?:          Json
          score_aggregation?:    'sum' | 'average' | 'drop_extremes'
          blind_judging?:        boolean
        }
        Update: {
          closes_at?:            string | null
          created_at?:           string
          description?:          string | null
          id?:                   string
          judging_at?:           string | null
          judging_opens_at?:     string | null
          judging_closes_at?:    string | null
          reminders_sent?:       RemindersSent
          opens_at?:             string | null
          status?:               Database["public"]["Enums"]["competition_status"]
          submission_limit?:     number
          template_id?:          string | null
          title?:                string
          archived_at?:          string | null
          cancelled_at?:         string | null
          cancellation_reason?:  string | null
          deleted_at?:           string | null
          results_at?:           string | null
          results_event_type?:   string | null
          score_min?:            number
          score_max?:            number
          judge_instructions?:   string | null
          preset?:               string
          allow_half_points?:    boolean
          anonymise_members?:    boolean
          anonymise_exif?:       boolean
          require_feedback?:     boolean
          awards_enabled?:       boolean
          award_types?:          Json
          score_aggregation?:    'sum' | 'average' | 'drop_extremes'
          blind_judging?:        boolean
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
          exif_data: Record<string, unknown> | null
          id: string
          owner_id: string
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exif_data?: Record<string, unknown> | null
          id?: string
          owner_id: string
          storage_path: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exif_data?: Record<string, unknown> | null
          id?: string
          owner_id?: string
          storage_path?: string
          title?: string
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
      judge_tokens: {
        Row: {
          competition_id:     string
          created_at:         string
          id:                 string
          judge_email:        string
          judge_name:         string
          token:              string
          invitation_sent_at: string | null
          access_code:        string
          submitted_at:       string | null
        }
        Insert: {
          competition_id:      string
          created_at?:         string
          id?:                 string
          judge_email:         string
          judge_name:          string
          token?:              string
          invitation_sent_at?: string | null
          access_code?:        string
          submitted_at?:       string | null
        }
        Update: {
          competition_id?:     string
          created_at?:         string
          id?:                 string
          judge_email?:        string
          judge_name?:         string
          token?:              string
          invitation_sent_at?: string | null
          access_code?:        string
          submitted_at?:       string | null
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
          created_at:     string
          id:             string
          judge_token_id: string
          notes:          string | null
          rank:           number | null
          score:          number
          flagged:        boolean
          submission_id:  string
          award_id:       string | null
        }
        Insert: {
          created_at?:     string
          id?:             string
          judge_token_id:  string
          notes?:          string | null
          rank?:           number | null
          score:           number
          flagged?:        boolean
          submission_id:   string
          award_id?:       string | null
        }
        Update: {
          created_at?:     string
          id?:             string
          judge_token_id?: string
          notes?:          string | null
          rank?:           number | null
          score?:          number
          flagged?:        boolean
          submission_id?:  string
          award_id?:       string | null
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
      judge_category_awards: {
        Row: {
          judge_token_id: string
          category_id:    string
          completed_at:   string
        }
        Insert: {
          judge_token_id: string
          category_id:    string
          completed_at?:  string
        }
        Update: {
          judge_token_id?: string
          category_id?:    string
          completed_at?:   string
        }
        Relationships: [
          {
            foreignKeyName: "judge_category_awards_judge_token_id_fkey"
            columns: ["judge_token_id"]
            isOneToOne: false
            referencedRelation: "judge_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_category_awards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          category_id: string
          competition_id: string
          id: string
          image_id: string
          member_id: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
        }
        Insert: {
          category_id: string
          competition_id: string
          id?: string
          image_id: string
          member_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
        }
        Update: {
          category_id?: string
          competition_id?: string
          id?: string
          image_id?: string
          member_id?: string
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
      competition_status: "draft" | "open" | "judging" | "judging_on_hold" | "closed" | "cancelled" | "results_pending" | "results_published"
      membership_status: "pending" | "approved" | "active" | "expired" | "paused" | "complimentary" | "banned" | "cancelled"
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
      competition_status: ["draft", "open", "judging", "judging_on_hold", "closed"],
      membership_status: ["pending", "approved", "active", "expired", "paused", "complimentary", "banned", "cancelled"],
      submission_status: ["submitted", "withdrawn"],
      user_role: ["admin", "member"],
    },
  },
} as const


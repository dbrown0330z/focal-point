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
      about_page_content: {
        Row: {
          body: string | null
          club_id: string | null
          heading: string | null
          id: string
          section_key: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          club_id?: string | null
          heading?: string | null
          id?: string
          section_key: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          club_id?: string | null
          heading?: string | null
          id?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "about_page_content_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "about_page_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "calendar_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          created_at: string
          id: string
          joined_at: string
          member_number: number | null
          membership_class: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          joined_at?: string
          member_number?: number | null
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          member_number?: number | null
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_settings: {
        Row: {
          club_id: string | null
          club_location: string | null
          club_name: string
          club_short_name: string | null
          contact_email: string | null
          default_meeting_location_id: string | null
          from_email: string | null
          homepage_blocks: Json | null
          id: string
          logo_path: string | null
          member_classes_enabled: boolean
          member_directory_visibility: string
          membership_terms_content: string | null
          membership_terms_file_name: string | null
          membership_terms_file_path: string | null
          membership_terms_reviewed: boolean
          membership_terms_source: string
          membership_terms_updated_at: string | null
          season_end_month: number
          season_start_month: number
          timezone: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          club_location?: string | null
          club_name?: string
          club_short_name?: string | null
          contact_email?: string | null
          default_meeting_location_id?: string | null
          from_email?: string | null
          homepage_blocks?: Json | null
          id?: string
          logo_path?: string | null
          member_classes_enabled?: boolean
          member_directory_visibility?: string
          membership_terms_content?: string | null
          membership_terms_file_name?: string | null
          membership_terms_file_path?: string | null
          membership_terms_reviewed?: boolean
          membership_terms_source?: string
          membership_terms_updated_at?: string | null
          season_end_month?: number
          season_start_month?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          club_location?: string | null
          club_name?: string
          club_short_name?: string | null
          contact_email?: string | null
          default_meeting_location_id?: string | null
          from_email?: string | null
          homepage_blocks?: Json | null
          id?: string
          logo_path?: string | null
          member_classes_enabled?: boolean
          member_directory_visibility?: string
          membership_terms_content?: string | null
          membership_terms_file_name?: string | null
          membership_terms_file_path?: string | null
          membership_terms_reviewed?: boolean
          membership_terms_source?: string
          membership_terms_updated_at?: string | null
          season_end_month?: number
          season_start_month?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_settings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_settings_default_meeting_location_id_fkey"
            columns: ["default_meeting_location_id"]
            isOneToOne: false
            referencedRelation: "meeting_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      competition_categories: {
        Row: {
          club_id: string | null
          competition_id: string
          id: string
          name: string
        }
        Insert: {
          club_id?: string | null
          competition_id: string
          id?: string
          name: string
        }
        Update: {
          club_id?: string | null
          competition_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_categories_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
          club_id: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_default_categories_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_defaults: {
        Row: {
          allow_decimals: boolean
          capture_date_amount: number
          capture_date_unit: string
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "competition_defaults_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_templates: {
        Row: {
          club_id: string | null
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
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
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "competitions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          club_id: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          club_id?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          club_id?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category_id: string | null
          club_id: string | null
          deleted_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          sort_order: number
          title: string
          uploaded_at: string
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          category_id?: string | null
          club_id?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          sort_order?: number
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          category_id?: string | null
          club_id?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          sort_order?: number
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "images_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
          club_id:    string | null
          created_at: string
          email:      string
          first_name: string | null
          id:         string
          last_name:  string | null
          name:       string
          phone:      string | null
          website:    string | null
        }
        Insert: {
          club_id?:    string | null
          created_at?: string
          email:       string
          first_name?: string | null
          id?:         string
          last_name?:  string | null
          name:        string
          phone?:      string | null
          website?:    string | null
        }
        Update: {
          club_id?:    string | null
          created_at?: string
          email?:      string
          first_name?: string | null
          id?:         string
          last_name?:  string | null
          name?:       string
          phone?:      string | null
          website?:    string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_directory_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_tokens: {
        Row: {
          access_code: string
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "judge_tokens_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
          club_id: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          address?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          address?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_locations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      member_classes: {
        Row: {
          club_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_classes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_custom_pages: {
        Row: {
          club_id: string | null
          content: string | null
          created_at: string
          document_id: string | null
          external_url: string | null
          id: string
          page_type: string
          parent_system: string | null
          slug: string
          sort_order: number
          status: string
          tab_id: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          club_id?: string | null
          content?: string | null
          created_at?: string
          document_id?: string | null
          external_url?: string | null
          id?: string
          page_type?: string
          parent_system?: string | null
          slug: string
          sort_order?: number
          status?: string
          tab_id?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          club_id?: string | null
          content?: string | null
          created_at?: string
          document_id?: string | null
          external_url?: string | null
          id?: string
          page_type?: string
          parent_system?: string | null
          slug?: string
          sort_order?: number
          status?: string
          tab_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "nav_custom_pages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nav_custom_pages_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "nav_custom_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_custom_tabs: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "nav_custom_tabs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          club_id: string | null
          content: string | null
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          club_id?: string | null
          content?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          club_id?: string | null
          content?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          club_id: string | null
          created_at: string
          id: string
          published_at: string | null
          title: string
        }
        Insert: {
          author_id: string
          body: string
          club_id?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          club_id?: string | null
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
          {
            foreignKeyName: "posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          camera_brands: string[]
          club_id: string | null
          created_at: string
          display_name: string
          email: string | null
          experience_level: string | null
          first_name: string | null
          id: string
          is_fp_admin: boolean
          joined_at: string | null
          last_name: string | null
          location: string | null
          member_number: number
          membership_class: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          shooting_interests: string[]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          camera_brands?: string[]
          club_id?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          experience_level?: string | null
          first_name?: string | null
          id: string
          is_fp_admin?: boolean
          joined_at?: string | null
          last_name?: string | null
          location?: string | null
          member_number?: number
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          shooting_interests?: string[]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          camera_brands?: string[]
          club_id?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          experience_level?: string | null
          first_name?: string | null
          id?: string
          is_fp_admin?: boolean
          joined_at?: string | null
          last_name?: string | null
          location?: string | null
          member_number?: number
          membership_class?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          shooting_interests?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          award_id: string | null
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
            foreignKeyName: "scores_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      sent_messages: {
        Row: {
          club_id: string | null
          html_body: string
          id: string
          recipient_count: number
          sent_at: string
          sent_by: string | null
          sent_to: string
          subject: string
        }
        Insert: {
          club_id?: string | null
          html_body: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          sent_to: string
          subject: string
        }
        Update: {
          club_id?: string | null
          html_body?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          sent_to?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          category_id: string
          club_id: string | null
          competition_id: string
          duplicate_warning_override: boolean
          duplicate_warning_shown: boolean
          id: string
          image_id: string
          member_id: string
          notes: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          title: string | null
        }
        Insert: {
          category_id: string
          club_id?: string | null
          competition_id: string
          duplicate_warning_override?: boolean
          duplicate_warning_shown?: boolean
          id?: string
          image_id: string
          member_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          title?: string | null
        }
        Update: {
          category_id?: string
          club_id?: string | null
          competition_id?: string
          duplicate_warning_override?: boolean
          duplicate_warning_shown?: boolean
          id?: string
          image_id?: string
          member_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          title?: string | null
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
            foreignKeyName: "submissions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      current_user_club_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_approved_member: { Args: never; Returns: boolean }
      is_club_admin: { Args: { p_club_id: string }; Returns: boolean }
      is_club_member: { Args: { p_club_id: string }; Returns: boolean }
      is_fp_admin: { Args: never; Returns: boolean }
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

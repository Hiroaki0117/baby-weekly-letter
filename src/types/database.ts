export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: "owner" | "member";
          display_name: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role: "owner" | "member";
          display_name?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: "owner" | "member";
          display_name?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          family_id: string;
          name: string | null;
          birth_date: string | null;
          gender: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      growth_records: {
        Row: {
          id: string;
          child_id: string;
          measured_date: string;
          height_cm: number | null;
          weight_kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          measured_date: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          measured_date?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_invitations: {
        Row: {
          id: string;
          family_id: string;
          invited_by: string;
          token: string;
          expires_at: string;
          used_by: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          invited_by: string;
          token: string;
          expires_at: string;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          invited_by?: string;
          token?: string;
          expires_at?: string;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          family_id: string;
          child_id: string;
          author_id: string;
          log_date: string;
          text: string;
          mood: "moved" | "happy" | "neutral" | "tired" | "sad";
          categories: string[];
          photo_storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          child_id: string;
          author_id: string;
          log_date?: string;
          text: string;
          mood: "moved" | "happy" | "neutral" | "tired" | "sad";
          categories?: string[];
          photo_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          child_id?: string;
          author_id?: string;
          log_date?: string;
          text?: string;
          mood?: "moved" | "happy" | "neutral" | "tired" | "sad";
          categories?: string[];
          photo_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      log_reactions: {
        Row: {
          id: string;
          log_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          family_id: string;
          child_id: string;
          week_start: string;
          week_end: string;
          content: string;
          generated_at: string;
          source_log_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          child_id: string;
          week_start: string;
          week_end: string;
          content: string;
          generated_at?: string;
          source_log_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          child_id?: string;
          week_start?: string;
          week_end?: string;
          content?: string;
          generated_at?: string;
          source_log_ids?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      monthly_reports: {
        Row: {
          id: string;
          family_id: string;
          child_id: string;
          month: string;
          content: string;
          generated_at: string;
          source_weekly_report_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          child_id: string;
          month: string;
          content: string;
          generated_at?: string;
          source_weekly_report_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          child_id?: string;
          month?: string;
          content?: string;
          generated_at?: string;
          source_weekly_report_ids?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          child_id: string;
          daily_log_id: string | null;
          title: string;
          milestone_date: string;
          category: string;
          memo: string | null;
          source: string;
          weekly_report_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          daily_log_id?: string | null;
          title: string;
          milestone_date: string;
          category?: string;
          memo?: string | null;
          source?: string;
          weekly_report_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          daily_log_id?: string | null;
          title?: string;
          milestone_date?: string;
          category?: string;
          memo?: string | null;
          source?: string;
          weekly_report_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_preferences: {
        Row: {
          id: string;
          user_id: string;
          tone: string;
          sections: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tone?: string;
          sections?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tone?: string;
          sections?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_family_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      verify_invitation: {
        Args: { invite_token: string };
        Returns: { family_id: string; family_name: string }[];
      };
      use_invitation: {
        Args: { invite_token: string; used_by_user: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}

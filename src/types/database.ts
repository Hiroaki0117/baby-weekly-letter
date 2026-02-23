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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name?: string | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string | null;
          birth_date?: string | null;
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
          author_id: string;
          log_date: string;
          text: string;
          mood: "happy" | "neutral" | "sad";
          categories: string[];
          photo_storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          author_id: string;
          log_date?: string;
          text: string;
          mood: "happy" | "neutral" | "sad";
          categories?: string[];
          photo_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          author_id?: string;
          log_date?: string;
          text?: string;
          mood?: "happy" | "neutral" | "sad";
          categories?: string[];
          photo_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          family_id: string;
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
          month: string;
          content: string;
          generated_at: string;
          source_weekly_report_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          month: string;
          content: string;
          generated_at?: string;
          source_weekly_report_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          month?: string;
          content?: string;
          generated_at?: string;
          source_weekly_report_ids?: string[];
          created_at?: string;
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

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
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
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
          user_id: string;
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
          user_id?: string;
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
          user_id: string;
          week_start: string;
          week_end: string;
          content: string;
          generated_at: string;
          source_log_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          week_end: string;
          content: string;
          generated_at?: string;
          source_log_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          week_end?: string;
          content?: string;
          generated_at?: string;
          source_log_ids?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

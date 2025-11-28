/**
 * Database types for Supabase
 *
 * TODO: Generate these types from your Supabase schema using:
 * npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
 *
 * For now, this file contains manually defined types based on the schema.
 */

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
      users: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'admin';
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      competitions: {
        Row: {
          id: string;
          title: string;
          description: string;
          problem_statement: string | null;
          competition_type: '3-phase' | '4-phase';
          participation_type: 'individual' | 'team';
          registration_start: string;
          registration_end: string;
          public_test_start: string;
          public_test_end: string;
          private_test_start: string | null;
          private_test_end: string | null;
          daily_submission_limit: number;
          total_submission_limit: number;
          max_file_size_mb: number;
          min_team_size: number | null;
          max_team_size: number | null;
          scoring_metric: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          problem_statement?: string | null;
          competition_type: '3-phase' | '4-phase';
          participation_type: 'individual' | 'team';
          registration_start: string;
          registration_end: string;
          public_test_start: string;
          public_test_end: string;
          private_test_start?: string | null;
          private_test_end?: string | null;
          daily_submission_limit?: number;
          total_submission_limit?: number;
          max_file_size_mb?: number;
          min_team_size?: number | null;
          max_team_size?: number | null;
          scoring_metric?: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          problem_statement?: string | null;
          competition_type?: '3-phase' | '4-phase';
          participation_type?: 'individual' | 'team';
          registration_start?: string;
          registration_end?: string;
          public_test_start?: string;
          public_test_end?: string;
          private_test_start?: string | null;
          private_test_end?: string | null;
          daily_submission_limit?: number;
          total_submission_limit?: number;
          max_file_size_mb?: number;
          min_team_size?: number | null;
          max_team_size?: number | null;
          scoring_metric?: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      submissions: {
        Row: {
          id: string;
          competition_id: string;
          user_id: string | null;
          team_id: string | null;
          submitted_by: string;
          phase: 'public' | 'private';
          file_path: string;
          file_name: string;
          file_size_bytes: number;
          score: number | null;
          is_best_score: boolean;
          validation_status: 'pending' | 'valid' | 'invalid';
          validation_errors: Json | null;
          submitted_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          competition_id: string;
          user_id?: string | null;
          team_id?: string | null;
          submitted_by: string;
          phase: 'public' | 'private';
          file_path: string;
          file_name: string;
          file_size_bytes: number;
          score?: number | null;
          is_best_score?: boolean;
          validation_status?: 'pending' | 'valid' | 'invalid';
          validation_errors?: Json | null;
          submitted_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          competition_id?: string;
          user_id?: string | null;
          team_id?: string | null;
          submitted_by?: string;
          phase?: 'public' | 'private';
          file_path?: string;
          file_name?: string;
          file_size_bytes?: number;
          score?: number | null;
          is_best_score?: boolean;
          validation_status?: 'pending' | 'valid' | 'invalid';
          validation_errors?: Json | null;
          submitted_at?: string;
          processed_at?: string | null;
        };
      };
      registrations: {
        Row: {
          id: string;
          competition_id: string;
          user_id: string | null;
          team_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          registered_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          competition_id: string;
          user_id?: string | null;
          team_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          registered_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          competition_id?: string;
          user_id?: string | null;
          team_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          registered_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          leader_id: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          leader_id: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          leader_id?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      test_datasets: {
        Row: {
          id: string;
          competition_id: string;
          phase: 'public' | 'private';
          file_path: string;
          file_name: string;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          phase: 'public' | 'private';
          file_path: string;
          file_name: string;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          phase?: 'public' | 'private';
          file_path?: string;
          file_name?: string;
          uploaded_at?: string;
          uploaded_by?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

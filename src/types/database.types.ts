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
      practice_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      practice_problems: {
        Row: {
          id: string;
          title: string;
          description: string;
          problem_statement: string | null;
          scoring_metric: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url: string | null;
          sample_submission_url: string | null;
          daily_submission_limit: number;
          total_submission_limit: number;
          max_file_size_mb: number;
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
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
          scoring_metric?: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url?: string | null;
          sample_submission_url?: string | null;
          daily_submission_limit?: number;
          total_submission_limit?: number;
          max_file_size_mb?: number;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
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
          scoring_metric?: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
          dataset_url?: string | null;
          sample_submission_url?: string | null;
          daily_submission_limit?: number;
          total_submission_limit?: number;
          max_file_size_mb?: number;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      practice_problem_tags: {
        Row: {
          problem_id: string;
          tag_id: string;
        };
        Insert: {
          problem_id: string;
          tag_id: string;
        };
        Update: {
          problem_id?: string;
          tag_id?: string;
        };
      };
      practice_test_datasets: {
        Row: {
          id: string;
          problem_id: string;
          file_path: string;
          file_name: string;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          file_path: string;
          file_name: string;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          file_path?: string;
          file_name?: string;
          uploaded_at?: string;
          uploaded_by?: string;
        };
      };
      practice_submissions: {
        Row: {
          id: string;
          problem_id: string;
          user_id: string;
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
          problem_id: string;
          user_id: string;
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
          problem_id?: string;
          user_id?: string;
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
    };
    Views: {
      practice_problem_submission_counts: {
        Row: {
          problem_id: string;
          participant_count: number;
          valid_submission_count: number;
          total_submission_count: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// CONVENIENCE TYPES
// ============================================================================

export type PracticeTag = Database['public']['Tables']['practice_tags']['Row'];
export type PracticeProblemRow = Database['public']['Tables']['practice_problems']['Row'];
export type PracticeSubmissionRow = Database['public']['Tables']['practice_submissions']['Row'];
export type PracticeTestDatasetRow = Database['public']['Tables']['practice_test_datasets']['Row'];

export type PracticeScoringMetric = PracticeProblemRow['scoring_metric'];
export type PracticeDifficulty = NonNullable<PracticeProblemRow['difficulty']>;

/** practice_problems joined with its tags */
export type PracticeProblemWithTags = PracticeProblemRow & {
  tags: PracticeTag[];
  participant_count?: number;
};

/** practice_submissions joined with user info for leaderboard */
export type PracticeLeaderboardEntry = {
  rank: number;
  user_id: string;
  user_name: string | null;
  score: number;
  submitted_at: string;
};

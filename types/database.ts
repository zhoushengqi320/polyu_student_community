export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      resource_categories: {
        Row: {
          id: string;
          label: string;
          sort_order: number;
          school_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          label: string;
          sort_order?: number;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          sort_order?: number;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          description: string | null;
          url: string;
          icon_url: string | null;
          sort_order: number;
          status: "draft" | "published" | "hidden" | "removed";
          school_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          title: string;
          description?: string | null;
          url: string;
          icon_url?: string | null;
          sort_order?: number;
          status?: "draft" | "published" | "hidden" | "removed";
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          title?: string;
          description?: string | null;
          url?: string;
          icon_url?: string | null;
          sort_order?: number;
          status?: "draft" | "published" | "hidden" | "removed";
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          department: string;
          faculty: string | null;
          level: string | null;
          credits: number | null;
          description: string | null;
          objectives: string | null;
          prerequisites: string | null;
          teaching_pattern: string | null;
          semester_offered: string | null;
          assessment_json: Json;
          pdf_url: string | null;
          pdf_storage_path: string | null;
          source_file_name: string | null;
          source_updated_at: string | null;
          overall_rating: number | null;
          difficulty_rating: number | null;
          review_count: number;
          top_tags: Json;
          school_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          department: string;
          faculty?: string | null;
          level?: string | null;
          credits?: number | null;
          description?: string | null;
          objectives?: string | null;
          prerequisites?: string | null;
          teaching_pattern?: string | null;
          semester_offered?: string | null;
          assessment_json?: Json;
          pdf_url?: string | null;
          pdf_storage_path?: string | null;
          source_file_name?: string | null;
          source_updated_at?: string | null;
          overall_rating?: number | null;
          difficulty_rating?: number | null;
          review_count?: number;
          top_tags?: Json;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          department?: string;
          faculty?: string | null;
          level?: string | null;
          credits?: number | null;
          description?: string | null;
          objectives?: string | null;
          prerequisites?: string | null;
          teaching_pattern?: string | null;
          semester_offered?: string | null;
          assessment_json?: Json;
          pdf_url?: string | null;
          pdf_storage_path?: string | null;
          source_file_name?: string | null;
          source_updated_at?: string | null;
          overall_rating?: number | null;
          difficulty_rating?: number | null;
          review_count?: number;
          top_tags?: Json;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_reviews: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          semester: string;
          teacher_name: string | null;
          overall_rating: number;
          difficulty_rating: number;
          workload_rating: number;
          grading_rating: number;
          exam_difficulty: number | null;
          teaching_rating: number;
          exam_type: string | null;
          assignment_type: string | null;
          attendance_required: string | null;
          content: string;
          review_text: string | null;
          tips: string | null;
          is_anonymous: boolean;
          tags: string[];
          status: "draft" | "published" | "hidden" | "removed";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          semester: string;
          teacher_name?: string | null;
          overall_rating: number;
          difficulty_rating: number;
          workload_rating: number;
          grading_rating: number;
          exam_difficulty?: number | null;
          teaching_rating: number;
          exam_type?: string | null;
          assignment_type?: string | null;
          attendance_required?: string | null;
          content: string;
          review_text?: string | null;
          tips?: string | null;
          is_anonymous?: boolean;
          tags?: string[];
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          semester?: string;
          teacher_name?: string | null;
          overall_rating?: number;
          difficulty_rating?: number;
          workload_rating?: number;
          grading_rating?: number;
          exam_difficulty?: number | null;
          teaching_rating?: number;
          exam_type?: string | null;
          assignment_type?: string | null;
          attendance_required?: string | null;
          content?: string;
          review_text?: string | null;
          tips?: string | null;
          is_anonymous?: boolean;
          tags?: string[];
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "verified_polyu_user" | "admin";
          status: "active" | "banned";
          school_id: string;
          polyu_verified_at: string | null;
          bio: string | null;
          grade: string | null;
          major: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "verified_polyu_user" | "admin";
          status?: "active" | "banned";
          school_id?: string;
          polyu_verified_at?: string | null;
          bio?: string | null;
          grade?: string | null;
          major?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "verified_polyu_user" | "admin";
          status?: "active" | "banned";
          school_id?: string;
          polyu_verified_at?: string | null;
          bio?: string | null;
          grade?: string | null;
          major?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          module: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
          category_id: string | null;
          user_id: string;
          title: string;
          content: string;
          excerpt: string | null;
          topics: string[];
          like_count: number;
          comment_count: number;
          view_count: number;
          hot_score: number;
          is_anonymous: boolean;
          status: "draft" | "published" | "hidden" | "removed";
          deleted_at: string | null;
          school_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
          category_id?: string | null;
          user_id: string;
          title: string;
          content: string;
          excerpt?: string | null;
          topics?: string[];
          like_count?: number;
          comment_count?: number;
          view_count?: number;
          hot_score?: number;
          is_anonymous?: boolean;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module?: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
          category_id?: string | null;
          user_id?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          topics?: string[];
          like_count?: number;
          comment_count?: number;
          view_count?: number;
          hot_score?: number;
          is_anonymous?: boolean;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guides_meta: {
        Row: {
          post_id: string;
          stage: string;
          category: string | null;
          target_audience: string | null;
          estimated_reading_time: number | null;
          last_verified_at: string | null;
          source_links: Json;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          post_id: string;
          stage: string;
          category?: string | null;
          target_audience?: string | null;
          estimated_reading_time?: number | null;
          last_verified_at?: string | null;
          source_links?: Json;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          post_id?: string;
          stage?: string;
          category?: string | null;
          target_audience?: string | null;
          estimated_reading_time?: number | null;
          last_verified_at?: string | null;
          source_links?: Json;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          parent_id: string | null;
          user_id: string;
          content: string;
          status: "draft" | "published" | "hidden" | "removed";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          parent_id?: string | null;
          user_id: string;
          content: string;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_type?: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id?: string;
          parent_id?: string | null;
          user_id?: string;
          content?: string;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          type: "like" | "favorite";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          type: "like" | "favorite";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id?: string;
          type?: "like" | "favorite";
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          reason: string;
          description: string | null;
          status: "pending" | "reviewing" | "resolved" | "dismissed";
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          reason: string;
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: "post" | "comment" | "course" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id?: string;
          reason?: string;
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_action_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_post_view_count: {
        Args: { post_id: string };
        Returns: undefined;
      };
      resolve_reports_for_target: {
        Args: {
          p_target_type: string;
          p_target_id: string;
          p_admin_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "user" | "verified_polyu_user" | "admin";
      user_status: "active" | "banned";
      content_status: "draft" | "published" | "hidden" | "removed";
      module_key: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
      target_type:
        | "post"
        | "comment"
        | "course"
        | "course_review"
        | "food_recommendation"
        | "buddy_post"
        | "profile";
      reaction_type: "like" | "favorite";
      report_status: "pending" | "reviewing" | "resolved" | "dismissed";
    };
    CompositeTypes: Record<string, never>;
  };
};

// 后续使用 `supabase gen types typescript` 生成完整类型后替换此文件

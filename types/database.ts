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
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          module: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
          category_id: string | null;
          user_id: string;
          title: string;
          content: string;
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
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          school_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          target_type: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          user_id: string;
          content: string;
          status: "draft" | "published" | "hidden" | "removed";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_type: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          user_id: string;
          content: string;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_type?: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id?: string;
          user_id?: string;
          content?: string;
          status?: "draft" | "published" | "hidden" | "removed";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          target_type: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          type: "like" | "favorite";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id: string;
          type: "like" | "favorite";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: "post" | "comment" | "course_review" | "food_recommendation" | "buddy_post" | "profile";
          target_id?: string;
          type?: "like" | "favorite";
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "user" | "verified_polyu_user" | "admin";
      user_status: "active" | "banned";
      content_status: "draft" | "published" | "hidden" | "removed";
      module_key: "courses" | "guides" | "food" | "resources" | "buddy" | "forum";
    };
  };
};

// 后续使用 `supabase gen types typescript` 生成完整类型后替换此文件

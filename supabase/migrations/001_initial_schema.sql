-- PolyUHub: 初始数据库结构
-- 运行方式: supabase db push 或在 Supabase SQL Editor 中按顺序执行

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.user_role AS ENUM (
  'user',
  'verified_polyu_user',
  'admin'
);

CREATE TYPE public.user_status AS ENUM (
  'active',
  'banned'
);

CREATE TYPE public.content_status AS ENUM (
  'draft',
  'published',
  'hidden',
  'removed'
);

CREATE TYPE public.report_status AS ENUM (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);

CREATE TYPE public.target_type AS ENUM (
  'post',
  'comment',
  'course_review',
  'food_recommendation',
  'buddy_post',
  'profile'
);

CREATE TYPE public.module_key AS ENUM (
  'courses',
  'guides',
  'food',
  'resources',
  'buddy',
  'forum'
);

CREATE TYPE public.reaction_type AS ENUM (
  'like',
  'favorite'
);

-- ============================================================
-- Utility: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  status public.user_status NOT NULL DEFAULT 'active',
  school_id TEXT NOT NULL DEFAULT 'polyu',
  polyu_verified_at TIMESTAMPTZ,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_username_length CHECK (char_length(username) >= 2),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (LOWER(username));
CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE INDEX profiles_status_idx ON public.profiles (status);
CREATE INDEX profiles_school_id_idx ON public.profiles (school_id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''),
    'user'
  );
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, final_username);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Resource Categories & Resources (模块 4: 常用网站导航)
-- ============================================================
CREATE TABLE public.resource_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER resource_categories_set_updated_at
  BEFORE UPDATE ON public.resource_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.resource_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resources_url_format CHECK (url ~ '^https?://')
);

CREATE INDEX resources_category_id_idx ON public.resources (category_id);
CREATE INDEX resources_status_idx ON public.resources (status);
CREATE INDEX resources_school_id_idx ON public.resources (school_id);
CREATE INDEX resources_sort_order_idx ON public.resources (sort_order);

CREATE TRIGGER resources_set_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Courses (模块 1: 课程评价)
-- ============================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  credits NUMERIC(3, 1),
  description TEXT,
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT courses_code_school_unique UNIQUE (code, school_id)
);

CREATE INDEX courses_code_idx ON public.courses (code);
CREATE INDEX courses_department_idx ON public.courses (department);

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  difficulty_rating SMALLINT NOT NULL CHECK (difficulty_rating BETWEEN 1 AND 5),
  workload_rating SMALLINT NOT NULL CHECK (workload_rating BETWEEN 1 AND 5),
  grading_rating SMALLINT NOT NULL CHECK (grading_rating BETWEEN 1 AND 5),
  teaching_rating SMALLINT NOT NULL CHECK (teaching_rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_reviews_user_course_unique UNIQUE (course_id, user_id)
);

CREATE INDEX course_reviews_course_id_idx ON public.course_reviews (course_id);
CREATE INDEX course_reviews_user_id_idx ON public.course_reviews (user_id);
CREATE INDEX course_reviews_status_idx ON public.course_reviews (status);
CREATE INDEX course_reviews_deleted_at_idx ON public.course_reviews (deleted_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER course_reviews_set_updated_at
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Posts (模块 2/6: 入学攻略 & 自由讨论区)
-- ============================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module public.module_key NOT NULL,
  category_id TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX posts_module_status_created_idx
  ON public.posts (module, status, created_at DESC);
CREATE INDEX posts_user_id_idx ON public.posts (user_id);
CREATE INDEX posts_category_id_idx ON public.posts (category_id);
CREATE INDEX posts_deleted_at_idx ON public.posts (deleted_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.guides_meta (
  post_id UUID PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX guides_meta_stage_idx ON public.guides_meta (stage);
CREATE INDEX guides_meta_is_pinned_idx ON public.guides_meta (is_pinned);

CREATE TRIGGER guides_meta_set_updated_at
  BEFORE UPDATE ON public.guides_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Buddy Posts (模块 5: 找搭子)
-- ============================================================
CREATE TABLE public.buddy_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_at TIMESTAMPTZ,
  location TEXT,
  max_members INT CHECK (max_members IS NULL OR max_members >= 2),
  status public.content_status NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX buddy_posts_activity_type_idx ON public.buddy_posts (activity_type);
CREATE INDEX buddy_posts_status_created_idx
  ON public.buddy_posts (status, created_at DESC);
CREATE INDEX buddy_posts_user_id_idx ON public.buddy_posts (user_id);
CREATE INDEX buddy_posts_deleted_at_idx ON public.buddy_posts (deleted_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER buddy_posts_set_updated_at
  BEFORE UPDATE ON public.buddy_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Food (模块 3: 美食推荐)
-- ============================================================
CREATE TABLE public.food_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  status public.content_status NOT NULL DEFAULT 'published',
  school_id TEXT NOT NULL DEFAULT 'polyu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX food_places_area_idx ON public.food_places (area);
CREATE INDEX food_places_status_idx ON public.food_places (status);

CREATE TRIGGER food_places_set_updated_at
  BEFORE UPDATE ON public.food_places
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.food_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.food_places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX food_recommendations_place_id_idx ON public.food_recommendations (place_id);
CREATE INDEX food_recommendations_user_id_idx ON public.food_recommendations (user_id);

CREATE TRIGGER food_recommendations_set_updated_at
  BEFORE UPDATE ON public.food_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Comments & Reactions (跨模块通用)
-- ============================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.target_type NOT NULL,
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'published',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comments_target_idx ON public.comments (target_type, target_id);
CREATE INDEX comments_user_id_idx ON public.comments (user_id);
CREATE INDEX comments_deleted_at_idx ON public.comments (deleted_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.target_type NOT NULL,
  target_id UUID NOT NULL,
  type public.reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reactions_unique UNIQUE (user_id, target_type, target_id, type)
);

CREATE INDEX reactions_target_idx ON public.reactions (target_type, target_id);
CREATE INDEX reactions_user_id_idx ON public.reactions (user_id);

-- ============================================================
-- Reports & Admin Logs
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reports_status_idx ON public.reports (status);
CREATE INDEX reports_target_idx ON public.reports (target_type, target_id);
CREATE INDEX reports_reporter_id_idx ON public.reports (reporter_id);

CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX admin_action_logs_admin_id_idx ON public.admin_action_logs (admin_id);
CREATE INDEX admin_action_logs_target_idx ON public.admin_action_logs (target_type, target_id);
CREATE INDEX admin_action_logs_created_at_idx ON public.admin_action_logs (created_at DESC);

-- ============================================================
-- Helper functions for RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'banned'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_verified_polyu_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (
        role IN ('verified_polyu_user', 'admin')
        OR polyu_verified_at IS NOT NULL
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_interact()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL
    AND NOT public.is_banned();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- PolyUHub: Row Level Security 策略

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Profiles
-- ============================================================
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND status = 'active')
  WITH CHECK (auth.uid() = id AND status = 'active');

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Resources (公开可读，管理员可写)
-- ============================================================
CREATE POLICY "resource_categories_select_public"
  ON public.resource_categories FOR SELECT
  USING (TRUE);

CREATE POLICY "resource_categories_admin_write"
  ON public.resource_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "resources_select_published"
  ON public.resources FOR SELECT
  USING (status = 'published');

CREATE POLICY "resources_admin_write"
  ON public.resources FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Courses (公开可读)
-- ============================================================
CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (TRUE);

CREATE POLICY "courses_admin_write"
  ON public.courses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Course Reviews
-- ============================================================
CREATE POLICY "course_reviews_select_published"
  ON public.course_reviews FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

CREATE POLICY "course_reviews_insert_verified"
  ON public.course_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified_polyu_user()
  );

CREATE POLICY "course_reviews_update_own"
  ON public.course_reviews FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

CREATE POLICY "course_reviews_admin_all"
  ON public.course_reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Posts (forum / guides)
-- ============================================================
CREATE POLICY "posts_select_published"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

CREATE POLICY "posts_insert_verified"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified_polyu_user()
  );

CREATE POLICY "posts_update_own"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

CREATE POLICY "posts_admin_all"
  ON public.posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "guides_meta_select_public"
  ON public.guides_meta FOR SELECT
  USING (TRUE);

CREATE POLICY "guides_meta_write_verified"
  ON public.guides_meta FOR ALL
  USING (public.is_verified_polyu_user() OR public.is_admin())
  WITH CHECK (public.is_verified_polyu_user() OR public.is_admin());

-- ============================================================
-- Buddy Posts
-- ============================================================
CREATE POLICY "buddy_posts_select_published"
  ON public.buddy_posts FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

CREATE POLICY "buddy_posts_insert_verified"
  ON public.buddy_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified_polyu_user()
  );

CREATE POLICY "buddy_posts_update_own"
  ON public.buddy_posts FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

CREATE POLICY "buddy_posts_admin_all"
  ON public.buddy_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Food
-- ============================================================
CREATE POLICY "food_places_select_published"
  ON public.food_places FOR SELECT
  USING (status = 'published');

CREATE POLICY "food_places_admin_write"
  ON public.food_places FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "food_recommendations_select_published"
  ON public.food_recommendations FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

CREATE POLICY "food_recommendations_insert_active"
  ON public.food_recommendations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_interact()
  );

CREATE POLICY "food_recommendations_update_own"
  ON public.food_recommendations FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

CREATE POLICY "food_recommendations_admin_all"
  ON public.food_recommendations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Comments & Reactions
-- ============================================================
CREATE POLICY "comments_select_published"
  ON public.comments FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

CREATE POLICY "comments_insert_active"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_interact()
  );

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

CREATE POLICY "comments_admin_all"
  ON public.comments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "reactions_select_public"
  ON public.reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "reactions_insert_active"
  ON public.reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_interact()
  );

CREATE POLICY "reactions_delete_own"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id AND public.can_interact());

-- ============================================================
-- Reports & Admin Logs
-- ============================================================
CREATE POLICY "reports_insert_active"
  ON public.reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND public.can_interact()
  );

CREATE POLICY "reports_select_own_or_admin"
  ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR public.is_admin()
  );

CREATE POLICY "reports_admin_update"
  ON public.reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_action_logs_admin_only"
  ON public.admin_action_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

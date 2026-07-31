-- 内容图片公开桶（攻略 / 学习 / 生活指南正文插图）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 公开读
DROP POLICY IF EXISTS "content_images_public_read" ON storage.objects;
CREATE POLICY "content_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-images');

-- 仅管理员可上传 / 更新 / 删除
DROP POLICY IF EXISTS "content_images_admin_insert" ON storage.objects;
CREATE POLICY "content_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "content_images_admin_update" ON storage.objects;
CREATE POLICY "content_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "content_images_admin_delete" ON storage.objects;
CREATE POLICY "content_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

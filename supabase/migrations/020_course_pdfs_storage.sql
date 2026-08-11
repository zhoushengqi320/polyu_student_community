-- 课程 PDF 公开桶（管理员上传，全站可访问）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course_pdfs',
  'course_pdfs',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "course_pdfs_public_read" ON storage.objects;
CREATE POLICY "course_pdfs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course_pdfs');

DROP POLICY IF EXISTS "course_pdfs_admin_insert" ON storage.objects;
CREATE POLICY "course_pdfs_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course_pdfs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "course_pdfs_admin_update" ON storage.objects;
CREATE POLICY "course_pdfs_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course_pdfs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "course_pdfs_admin_delete" ON storage.objects;
CREATE POLICY "course_pdfs_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course_pdfs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
    )
  );

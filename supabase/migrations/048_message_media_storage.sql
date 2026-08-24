-- 私信媒体 Storage（图片 5MB / 视频 50MB）

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media',
  'message-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "message_media_public_read" ON storage.objects;
CREATE POLICY "message_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-media');

-- 服务端经 admin 上传；客户端直传可后续加 authenticated insert policy

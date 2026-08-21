-- Seed operational whitelist emails for non-PolyU registration.
INSERT INTO public.email_whitelist (email, note)
SELECT v.email, v.note
FROM (
  VALUES
    ('teddy_111@163.com', '运营联系邮箱'),
    ('zsq060211@gmail.com', '团队邮箱')
) AS v(email, note)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.email_whitelist w
  WHERE lower(w.email) = lower(v.email)
);

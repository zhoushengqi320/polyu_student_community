-- 取消课程评价正文 10–5000 字数据库约束，字数改由产品侧自行控制
ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_review_text_length;

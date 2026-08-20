-- 将内容 status 保护扩展到课程评价与美食推荐，防止作者取消隐藏
DROP TRIGGER IF EXISTS course_reviews_protect_status ON public.course_reviews;
CREATE TRIGGER course_reviews_protect_status
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_status_columns();

DROP TRIGGER IF EXISTS food_recommendations_protect_status ON public.food_recommendations;
CREATE TRIGGER food_recommendations_protect_status
  BEFORE UPDATE ON public.food_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_status_columns();

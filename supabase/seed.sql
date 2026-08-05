-- PolyUHub：初始种子数据
-- 常用网站导航分类 + 理工大学常用链接

INSERT INTO public.resource_categories (id, label, sort_order) VALUES
  ('official', '官方系统', 0),
  ('academic', '学术资源', 1),
  ('tools', '实用工具', 2),
  ('career', '升学就业', 3),
  ('life', '生活服务', 4)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.resources (category_id, title, description, url, sort_order) VALUES
  (
    'official',
    '理工大学官网',
    '香港理工大学官方网站',
    'https://www.polyu.edu.hk',
    0
  ),
  (
    'official',
    '学生信息系统',
    '查询成绩、课表与选课',
    'https://www38.polyu.edu.hk/eStudent/',
    1
  ),
  (
    'official',
    '网上学习平台',
    '课程学习与作业提交',
    'https://learn.polyu.edu.hk',
    2
  ),
  (
    'academic',
    '理大图书馆',
    '图书馆资源与数据库',
    'https://www.lib.polyu.edu.hk',
    0
  ),
  (
    'academic',
    '学术注册处',
    '学籍与学术事务',
    'https://www.polyu.edu.hk/ar',
    1
  ),
  (
    'tools',
    '学生邮箱',
    '理大学生电子邮件',
    'https://outlook.office.com',
    0
  ),
  (
    'tools',
    '微软办公套件',
    '在线文档与协作工具',
    'https://www.office.com',
    1
  ),
  (
    'career',
    '职业策划及安放处',
    '就业与实习服务',
    'https://www.polyu.edu.hk/cpa',
    0
  ),
  (
    'career',
    '学生事务处',
    '学生活动与支援服务',
    'https://www.polyu.edu.hk/sao',
    1
  ),
  (
    'life',
    '校园地图',
    '理大校园位置导航',
    'https://www.polyu.edu.hk/cpa/campus-map',
    0
  ),
  (
    'life',
    '资讯科技服务台',
    '校园资讯科技支援',
    'https://www.polyu.edu.hk/its',
    1
  )
ON CONFLICT DO NOTHING;

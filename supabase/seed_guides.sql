-- PolyUHub: Freshman Guides seed data
-- Run after migrations and after at least one profile exists.

DO $$
DECLARE
  seed_user_id UUID;
BEGIN
  SELECT id INTO seed_user_id
  FROM public.profiles
  ORDER BY (role = 'admin') DESC, created_at ASC
  LIMIT 1;

  IF seed_user_id IS NULL THEN
    RAISE EXCEPTION 'No profile found. Please log in once or create an admin profile before running seed_guides.sql.';
  END IF;

  INSERT INTO public.posts (
    id,
    module,
    category_id,
    user_id,
    title,
    content,
    excerpt,
    topics,
    status,
    school_id
  )
  VALUES
    (
      '10000000-0000-4000-8000-000000000001',
      'guides',
      'admission',
      seed_user_id,
      'PolyU 申请材料清单',
      '# PolyU 申请材料清单

申请前建议先准备好身份证明、学历证明、成绩单、英语成绩、个人陈述和推荐信。

- 核对课程官网的 admission requirement
- 提前整理 PDF 版成绩单
- 文件命名保持清晰
- 提交后定期检查邮箱和申请系统

这篇攻略是测试数据，后续可以替换为更完整内容。',
      '申请前需要准备的基础材料和检查事项。',
      ARRAY['申请', '材料', '新生'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000002',
      'guides',
      'pre_arrival',
      seed_user_id,
      '来港前必带物品',
      '# 来港前必带物品

来港前不需要把所有东西都带齐，但这些物品建议提前准备：

- 证件原件和复印件
- 录取通知、住宿或租房资料
- 少量港币现金
- 常用药品
- 转换插头
- 轻便雨具

衣物可以按季节准备，很多生活用品到港后再买也很方便。',
      '来港前建议提前准备的证件、现金、药品和生活用品。',
      ARRAY['行前', '证件', '生活'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000003',
      'guides',
      'first_week',
      seed_user_id,
      '到港第一周 Checklist',
      '# 到港第一周 Checklist

刚到香港的第一周建议优先完成这些事情：

1. 安顿住宿
2. 办理学生证相关事项
3. 熟悉校园路线
4. 登录 eStudent 和 Learn@PolyU
5. 办理电话卡或开通漫游
6. 了解附近超市、食堂和交通

不要把所有事情堆在同一天，先保证住宿和通讯正常。',
      '到港第一周最应该优先完成的事项。',
      ARRAY['到港', 'checklist', '新生'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000004',
      'guides',
      'course_registration',
      seed_user_id,
      '第一次选课怎么做',
      '# 第一次选课怎么做

选课前建议先确认 programme requirement 和 recommended study pattern。

- 先看必修课
- 再看 elective 和 general education
- 注意 timetable 冲突
- 留意 add/drop period
- 不确定时咨询 academic advisor

选课不是越满越好，第一学期可以预留适应时间。',
      '第一次使用 PolyU 系统选课时需要注意的基础流程。',
      ARRAY['选课', 'eStudent', 'add/drop'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000005',
      'guides',
      'campus_systems',
      seed_user_id,
      'PolyU 常用系统快速认识',
      '# PolyU 常用系统快速认识

新生常用系统包括：

- eStudent：选课、成绩、学籍资料
- Learn@PolyU：课程资料、作业、公告
- Student Email：学校邮件通知
- POSS：部分学生服务和活动

建议开学前确认这些系统都可以登录，并定期查看邮箱。',
      '快速认识 eStudent、Learn@PolyU、学生邮箱和 POSS。',
      ARRAY['系统', 'eStudent', 'Learn@PolyU'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000006',
      'guides',
      'housing',
      seed_user_id,
      '宿舍和租房怎么选',
      '# 宿舍和租房怎么选

住宿选择通常取决于预算、通勤时间和生活习惯。

宿舍优点是离校园近、容易认识同学；租房自由度更高，但需要考虑押金、合约、交通和水电网。

看房时建议确认：

- 到学校的通勤方式
- 合约期限和费用
- 周边生活设施
- 室友规则

不要只看价格，也要看安全和通勤成本。',
      '宿舍与租房选择时需要考虑的主要因素。',
      ARRAY['住宿', '宿舍', '租房'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000007',
      'guides',
      'banking_mobile',
      seed_user_id,
      '银行卡和电话卡基础指南',
      '# 银行卡和电话卡基础指南

到港后通常需要处理通讯和支付问题。

电话卡可以先用短期方案过渡，再根据流量和通话需求选择长期套餐。

银行卡办理前建议准备：

- 身份证件
- 学生证明
- 地址证明
- 香港手机号

不同银行要求可能不同，办理前先查看官网或预约。',
      '到港后办理电话卡和银行卡的基础准备。',
      ARRAY['银行卡', '电话卡', '生活'],
      'published',
      'polyu'
    ),
    (
      '10000000-0000-4000-8000-000000000008',
      'guides',
      'life_adaptation',
      seed_user_id,
      '适应香港学习生活的小建议',
      '# 适应香港学习生活的小建议

刚开始可能会同时面对语言、课程节奏、生活方式和社交变化。

建议：

- 提前阅读课程 outline
- 遇到问题主动发邮件或约 office hour
- 给自己留出休息时间
- 多使用学校提供的 support services
- 不要害怕向同学和老师提问

适应需要时间，不必要求自己第一周就完全进入状态。',
      '帮助新生适应香港学习和生活节奏的基础建议。',
      ARRAY['适应', '学习', '生活'],
      'published',
      'polyu'
    )
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    excerpt = EXCLUDED.excerpt,
    topics = EXCLUDED.topics,
    status = EXCLUDED.status,
    updated_at = NOW();

  INSERT INTO public.guides_meta (
    post_id,
    stage,
    category,
    target_audience,
    estimated_reading_time,
    last_verified_at,
    source_links,
    is_pinned
  )
  VALUES
    ('10000000-0000-4000-8000-000000000001', 'admission', 'admission', '申请 PolyU 的准新生', 3, NOW(), '[]'::JSONB, TRUE),
    ('10000000-0000-4000-8000-000000000002', 'pre_arrival', 'pre_arrival', '准备来港的新生', 4, NOW(), '[]'::JSONB, TRUE),
    ('10000000-0000-4000-8000-000000000003', 'first_week', 'first_week', '刚到香港的新生', 3, NOW(), '[]'::JSONB, TRUE),
    ('10000000-0000-4000-8000-000000000004', 'course_registration', 'course_registration', '第一次选课的新生', 4, NOW(), '[]'::JSONB, FALSE),
    ('10000000-0000-4000-8000-000000000005', 'campus_systems', 'campus_systems', '所有新生', 3, NOW(), '[]'::JSONB, FALSE),
    ('10000000-0000-4000-8000-000000000006', 'housing', 'housing', '考虑住宿的新生', 4, NOW(), '[]'::JSONB, FALSE),
    ('10000000-0000-4000-8000-000000000007', 'banking_mobile', 'banking_mobile', '准备处理通讯和支付的新生', 3, NOW(), '[]'::JSONB, FALSE),
    ('10000000-0000-4000-8000-000000000008', 'life_adaptation', 'life_adaptation', '希望适应香港生活的新生', 3, NOW(), '[]'::JSONB, FALSE)
  ON CONFLICT (post_id) DO UPDATE SET
    stage = EXCLUDED.stage,
    category = EXCLUDED.category,
    target_audience = EXCLUDED.target_audience,
    estimated_reading_time = EXCLUDED.estimated_reading_time,
    last_verified_at = EXCLUDED.last_verified_at,
    source_links = EXCLUDED.source_links,
    is_pinned = EXCLUDED.is_pinned,
    updated_at = NOW();
END $$;

-- 会员系统种子数据

-- 清理现有数据（开发环境）
-- TRUNCATE TABLE plan_settings CASCADE;
-- TRUNCATE TABLE plan_permissions CASCADE;
-- TRUNCATE TABLE features CASCADE;
-- TRUNCATE TABLE membership_plans CASCADE;

-- 1. 插入会员方案配置
INSERT INTO membership_plans (plan_id, plan_name, monthly_price, monthly_credits, sort_order, is_active) VALUES
('free', '免费版', 0.00, 100, 1, true),
('basic', '基础版', 99.00, 1250, 2, true),
('pro', '专业版', 299.00, 4000, 3, true),
('enterprise', '企业版', 899.00, 15000, 4, true);

-- 2. 插入功能定义
INSERT INTO features (feature_code, feature_name, description, credits_cost, api_cost, category, is_active) VALUES
-- 基础功能（免费）
('dashboard_access', '仪表板查看', '数据概览、图表展示', 0, 0.00, 'basic', true),
('search_history', '搜索历史', '历史记录查看、筛选', 0, 0.00, 'basic', true),

-- 基础功能（付费）
('keyword_search', '关键词搜索', '竞争对手关键词分析（100词）', 8, 0.35, 'basic', true),
('industry_analysis', '行业关键词', '行业相关词扩展（50词）', 10, 0.46, 'basic', true),
('trending_keywords', '热门趋势', '趋势关键词查询（50词）', 4, 0.18, 'basic', true),
('content_assistant', '内容助手', 'AI内容大纲/标题生成', 1, 0.01, 'basic', true),

-- 高级功能
('keyword_analysis', '关键词深度分析', '关键词+SERP双重分析', 8, 0.36, 'advanced', true),
('page_analysis', '高流量页面分析', '域名页面流量分析', 200, 8.80, 'advanced', true),
('ranking_check', '关键词排名检查', '单关键词排名查询', 1, 0.003, 'advanced', true),

-- 专业功能
('gap_analysis', '竞争对手差距分析', '多域名关键词对比', 240, 10.60, 'professional', true),
('ranking_monitor', '排名监控项目', '创建监控项目（50词）', 80, 3.60, 'professional', true),
('data_export', '批量数据导出', 'CSV/Excel导出', 5, 0.05, 'professional', true),
('api_access', 'API接口访问', '程序化接口调用', 0, 0.00, 'professional', true);

-- 3. 插入功能权限配置
-- 免费版权限
INSERT INTO plan_permissions (plan_id, feature_code, is_enabled, daily_limit) VALUES
('free', 'dashboard_access', true, -1),
('free', 'search_history', true, -1),
('free', 'keyword_search', true, 3), -- 每日限制3次
('free', 'content_assistant', true, -1),
('free', 'trending_keywords', true, 3),
-- 其他功能禁用
('free', 'industry_analysis', false, 0),
('free', 'keyword_analysis', false, 0),
('free', 'page_analysis', false, 0),
('free', 'ranking_check', false, 0),
('free', 'gap_analysis', false, 0),
('free', 'ranking_monitor', false, 0),
('free', 'data_export', false, 0),
('free', 'api_access', false, 0);

-- 基础版权限
INSERT INTO plan_permissions (plan_id, feature_code, is_enabled, daily_limit) VALUES
('basic', 'dashboard_access', true, -1),
('basic', 'search_history', true, -1),
('basic', 'keyword_search', true, -1),
('basic', 'industry_analysis', true, -1),
('basic', 'trending_keywords', true, -1),
('basic', 'content_assistant', true, -1),
('basic', 'keyword_analysis', true, -1),
('basic', 'ranking_check', true, -1),
-- 禁用高级功能
('basic', 'page_analysis', false, 0),
('basic', 'gap_analysis', false, 0),
('basic', 'ranking_monitor', false, 0),
('basic', 'data_export', false, 0),
('basic', 'api_access', false, 0);

-- 专业版权限
INSERT INTO plan_permissions (plan_id, feature_code, is_enabled, daily_limit) VALUES
('pro', 'dashboard_access', true, -1),
('pro', 'search_history', true, -1),
('pro', 'keyword_search', true, -1),
('pro', 'industry_analysis', true, -1),
('pro', 'trending_keywords', true, -1),
('pro', 'content_assistant', true, -1),
('pro', 'keyword_analysis', true, -1),
('pro', 'ranking_check', true, -1),
('pro', 'page_analysis', true, -1),
('pro', 'ranking_monitor', true, 3), -- 限制3个项目
-- 禁用专业功能
('pro', 'gap_analysis', false, 0),
('pro', 'data_export', false, 0),
('pro', 'api_access', false, 0);

-- 企业版权限（所有功能）
INSERT INTO plan_permissions (plan_id, feature_code, is_enabled, daily_limit) VALUES
('enterprise', 'dashboard_access', true, -1),
('enterprise', 'search_history', true, -1),
('enterprise', 'keyword_search', true, -1),
('enterprise', 'industry_analysis', true, -1),
('enterprise', 'trending_keywords', true, -1),
('enterprise', 'content_assistant', true, -1),
('enterprise', 'keyword_analysis', true, -1),
('enterprise', 'ranking_check', true, -1),
('enterprise', 'page_analysis', true, -1),
('enterprise', 'gap_analysis', true, -1),
('enterprise', 'ranking_monitor', true, -1),
('enterprise', 'data_export', true, -1),
('enterprise', 'api_access', true, -1);

-- 4. 插入会员方案额外配置
-- 免费版配置
INSERT INTO plan_settings (plan_id, setting_key, setting_value) VALUES
('free', 'data_retention_days', '7'),
('free', 'support_level', 'none'),
('free', 'credit_discount', '1.0'),
('free', 'custom_reports', 'false'),
('free', 'training_service', 'false'),
('free', 'api_rate_limit', '100'), -- 每小时100次
('free', 'concurrent_requests', '1'); -- 并发请求数

-- 基础版配置
INSERT INTO plan_settings (plan_id, setting_key, setting_value) VALUES
('basic', 'data_retention_days', '30'),
('basic', 'support_level', 'email'),
('basic', 'credit_discount', '0.9'),
('basic', 'custom_reports', 'false'),
('basic', 'training_service', 'false'),
('basic', 'api_rate_limit', '500'),
('basic', 'concurrent_requests', '2');

-- 专业版配置
INSERT INTO plan_settings (plan_id, setting_key, setting_value) VALUES
('pro', 'data_retention_days', '90'),
('pro', 'support_level', 'online'),
('pro', 'credit_discount', '0.8'),
('pro', 'custom_reports', 'true'),
('pro', 'training_service', 'false'),
('pro', 'api_rate_limit', '2000'),
('pro', 'concurrent_requests', '5');

-- 企业版配置
INSERT INTO plan_settings (plan_id, setting_key, setting_value) VALUES
('enterprise', 'data_retention_days', '-1'), -- 永久保存
('enterprise', 'support_level', 'vip'),
('enterprise', 'credit_discount', '0.7'),
('enterprise', 'custom_reports', 'true'),
('enterprise', 'training_service', 'true'),
('enterprise', 'api_rate_limit', '10000'),
('enterprise', 'concurrent_requests', '10');

-- 5. 创建积分包配置表和数据
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code VARCHAR(50) UNIQUE NOT NULL,
  package_name VARCHAR(100) NOT NULL,
  credits_amount INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  original_price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入积分包配置
INSERT INTO credit_packages (package_code, package_name, credits_amount, bonus_credits, original_price, sort_order) VALUES
('credits_500', '入门包', 500, 100, 40.00, 1),
('credits_1500', '标准包', 1500, 500, 120.00, 2),
('credits_5000', '专业包', 5000, 1500, 400.00, 3),
('credits_15000', '企业包', 15000, 5000, 1200.00, 4),
-- 年度积分包
('credits_50000', '标准年包', 50000, 5000, 4000.00, 5),
('credits_150000', '专业年包', 150000, 20000, 12000.00, 6),
('credits_500000', '企业年包', 500000, 80000, 40000.00, 7);

-- 6. 创建视图：用户完整信息
CREATE OR REPLACE VIEW user_membership_info AS
SELECT 
  u.id as user_id,
  p.email,
  p.full_name,
  -- 当前会员信息
  mp.plan_id,
  mp.plan_name,
  mp.monthly_price,
  mp.monthly_credits,
  us.status as subscription_status,
  us.current_period_start,
  us.current_period_end,
  us.auto_renewal,
  -- 积分信息
  uc.current_balance,
  uc.total_earned,
  uc.total_purchased,
  uc.total_used,
  -- 计算字段
  CASE 
    WHEN us.current_period_end < CURRENT_DATE THEN 'expired'
    WHEN us.current_period_end IS NULL THEN 'free'
    ELSE us.status 
  END as effective_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN membership_plans mp ON us.plan_id = mp.plan_id
LEFT JOIN user_credits uc ON u.id = uc.user_id;

-- 7. 创建使用统计视图
CREATE OR REPLACE VIEW usage_statistics AS
SELECT 
  ul.user_id,
  ul.feature_code,
  f.feature_name,
  f.category,
  COUNT(*) as usage_count,
  SUM(ul.credits_used) as total_credits_used,
  SUM(ul.api_cost) as total_api_cost,
  AVG(ul.execution_time) as avg_execution_time,
  DATE(ul.created_at) as usage_date
FROM usage_logs ul
JOIN features f ON ul.feature_code = f.feature_code
WHERE ul.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ul.user_id, ul.feature_code, f.feature_name, f.category, DATE(ul.created_at)
ORDER BY usage_date DESC, total_credits_used DESC;

-- 8. 初始化系统管理员账户的企业版订阅（可选）
-- 注意：需要替换为实际的管理员用户ID
/*
DO $$
DECLARE
  admin_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- 替换为实际用户ID
BEGIN
  -- 如果存在该用户，给予企业版订阅
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
    INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end, auto_renewal)
    VALUES (admin_user_id, 'enterprise', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', true)
    ON CONFLICT DO NOTHING;
    
    -- 初始化积分账户
    INSERT INTO user_credits (user_id, current_balance, total_earned)
    VALUES (admin_user_id, 15000, 15000)
    ON CONFLICT (user_id) DO UPDATE SET 
      current_balance = 15000,
      total_earned = 15000;
      
    -- 记录积分获得
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_before, balance_after, source, description)
    VALUES (admin_user_id, 'earn', 15000, 0, 15000, 'admin_init', '管理员账户初始化');
  END IF;
END $$;
*/
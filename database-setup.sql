-- 关键词分析师 - 完整数据库部署SQL脚本
-- 执行顺序：按顺序执行以下所有SQL命令

-- ================================
-- 1. 基础表结构
-- ================================

-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 关键词搜索记录表
CREATE TABLE IF NOT EXISTS keyword_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  search_type TEXT CHECK (search_type IN ('competitor', 'trending', 'analysis', 'gap_analysis', 'top_pages', 'ranking', 'monitoring')) NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================
-- 2. 会员系统表结构
-- ================================

-- 会员方案表
CREATE TABLE IF NOT EXISTS membership_plans (
  plan_id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 功能权限表
CREATE TABLE IF NOT EXISTS feature_permissions (
  feature_code TEXT PRIMARY KEY,
  feature_name TEXT NOT NULL,
  description TEXT,
  credits_required INTEGER NOT NULL DEFAULT 1,
  min_plan_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_id TEXT REFERENCES membership_plans(plan_id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'pending')) NOT NULL DEFAULT 'pending',
  current_credits INTEGER NOT NULL DEFAULT 0,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- 订阅历史表
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_id TEXT REFERENCES membership_plans(plan_id) NOT NULL,
  action TEXT CHECK (action IN ('subscribe', 'upgrade', 'downgrade', 'cancel', 'renew')) NOT NULL,
  amount DECIMAL(10,2),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 积分使用记录表
CREATE TABLE IF NOT EXISTS credit_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  feature_code TEXT REFERENCES feature_permissions(feature_code) NOT NULL,
  credits_used INTEGER NOT NULL,
  remaining_credits INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================
-- 3. 分析结果存储表
-- ================================

-- 关键词差距分析结果表
CREATE TABLE IF NOT EXISTS keyword_gap_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  your_domain TEXT NOT NULL,
  competitor_domains TEXT[] NOT NULL,
  analysis_data JSONB NOT NULL,
  total_keywords INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 高流量页面分析结果表
CREATE TABLE IF NOT EXISTS top_pages_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  target_domain TEXT NOT NULL,
  pages_data JSONB NOT NULL,
  total_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 排名项目表
CREATE TABLE IF NOT EXISTS ranking_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  project_name TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  location TEXT DEFAULT 'China',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 排名查询结果表
CREATE TABLE IF NOT EXISTS ranking_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES ranking_projects(id) NOT NULL,
  keyword TEXT NOT NULL,
  position INTEGER,
  url TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================
-- 4. 创建索引
-- ================================

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_created_at ON keyword_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_search_type ON keyword_searches(search_type);

-- 会员系统索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_id ON credit_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_created_at ON credit_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);

-- 分析结果索引
CREATE INDEX IF NOT EXISTS idx_keyword_gap_analysis_user_id ON keyword_gap_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_top_pages_analysis_user_id ON top_pages_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_projects_user_id ON ranking_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_results_project_id ON ranking_results(project_id);

-- ================================
-- 5. 插入初始数据
-- ================================

-- 插入会员方案数据（美元定价）
INSERT INTO membership_plans (plan_id, plan_name, monthly_price, monthly_credits, sort_order, is_active) VALUES
('free', '免费版', 0.00, 100, 1, true),
('basic', '基础版', 19.90, 500, 2, true),
('pro', '专业版', 39.90, 2000, 3, true),
('enterprise', '企业版', 99.90, 10000, 4, true)
ON CONFLICT (plan_id) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  monthly_credits = EXCLUDED.monthly_credits,
  updated_at = NOW();

-- 插入功能权限数据
INSERT INTO feature_permissions (feature_code, feature_name, description, credits_required, min_plan_level, is_active) VALUES
('competitor_analysis', '竞争对手分析', '分析竞争对手的关键词策略', 10, 0, true),
('industry_analysis', '行业关键词分析', '基于行业或产品类别发现相关关键词', 8, 0, true),
('trending_keywords', '热门趋势监控', '获取最新的热门关键词趋势', 5, 0, true),
('keyword_analysis', '深度关键词分析', '360度关键词分析，包含SERP结果', 15, 1, true),
('gap_analysis', '关键词差距分析', '深度对比您与竞争对手的关键词策略', 20, 1, true),
('page_analysis', '高流量页面分析', '分析竞争对手的高流量页面', 12, 1, true),
('content_outline', 'AI内容大纲生成', '基于关键词生成详细的内容大纲', 8, 0, true),
('content_titles', 'AI标题创意生成', '生成多种风格的吸引性标题', 5, 0, true),
('ranking_check', '关键词排名查询', '查询关键词在搜索引擎中的排名', 3, 0, true),
('market_monitoring', '市场动态监控', '监控关键词排名变化和市场动态', 25, 2, true)
ON CONFLICT (feature_code) DO UPDATE SET
  credits_required = EXCLUDED.credits_required,
  min_plan_level = EXCLUDED.min_plan_level;

-- ================================
-- 6. 创建RLS策略（行级安全）
-- ================================

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_pages_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_results ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own searches" ON keyword_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own searches" ON keyword_searches FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription history" ON subscription_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own credit logs" ON credit_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payment_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own gap analysis" ON keyword_gap_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gap analysis" ON keyword_gap_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own top pages analysis" ON top_pages_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own top pages analysis" ON top_pages_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ranking projects" ON ranking_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ranking projects" ON ranking_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ranking projects" ON ranking_projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ranking results" ON ranking_results FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM ranking_projects WHERE id = ranking_results.project_id)
);

-- ================================
-- 7. 创建函数和触发器
-- ================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ranking_projects_updated_at BEFORE UPDATE ON ranking_projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 自动创建用户档案函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- 自动为新用户创建免费版订阅
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_credits)
  VALUES (NEW.id, 'free', 'active', 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建用户注册触发器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================
-- 部署完成提示
-- ================================

-- 验证数据是否插入成功
DO $$
BEGIN
    RAISE NOTICE '数据库部署完成！';
    RAISE NOTICE '会员方案数量: %', (SELECT COUNT(*) FROM membership_plans);
    RAISE NOTICE '功能权限数量: %', (SELECT COUNT(*) FROM feature_permissions);
    RAISE NOTICE '请确保在.env.local中正确配置环境变量';
END $$;
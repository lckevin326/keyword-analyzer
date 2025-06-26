-- 关键词分析师平台数据库架构
-- 支持产品文档中定义的四个核心模块功能

-- 用户资料表（已存在，保持不变）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关键词搜索记录表（扩展）
DROP TABLE IF EXISTS keyword_searches;
CREATE TABLE keyword_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('competitor', 'industry', 'trending', 'keyword_analysis', 'gap_analysis', 'top_pages')),
  query TEXT NOT NULL,
  location TEXT DEFAULT 'China',
  results JSONB,
  metadata JSONB, -- 存储额外的搜索参数和配置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关键词详细分析表（模块1：关键词深度分析）
CREATE TABLE keyword_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition_score DECIMAL(3,2), -- 0.00-1.00
  cpc DECIMAL(10,2),
  difficulty_score INTEGER, -- 1-100
  monthly_trends JSONB, -- 存储12个月的搜索量趋势
  serp_data JSONB, -- 存储SERP前10结果
  people_also_ask JSONB, -- 存储相关问题
  commercial_intent TEXT CHECK (commercial_intent IN ('informational', 'commercial', 'transactional')),
  seasonality_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 竞争对手分析表（模块2：市场竞争分析）
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  own_domain TEXT,
  competitor_domains TEXT[], -- 最多3个竞争对手域名
  shared_keywords JSONB, -- 共同关键词
  advantage_keywords JSONB, -- 我的优势关键词
  opportunity_keywords JSONB, -- 机会关键词（竞争对手有但我没有的）
  analysis_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 高流量页面分析表
CREATE TABLE top_pages_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_domain TEXT NOT NULL,
  pages_data JSONB, -- 存储页面URL、流量、核心关键词等
  total_pages INTEGER,
  analysis_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 内容创作助手表（模块3）
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_keyword TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('outline', 'titles')),
  target_audience TEXT,
  search_intent TEXT CHECK (search_intent IN ('informational', 'commercial', 'transactional')),
  generated_content JSONB, -- 存储生成的大纲或标题
  prompt_used TEXT, -- 记录使用的提示词
  ai_model TEXT DEFAULT 'deepseek', -- 使用的AI模型
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关键词排名追踪表（模块4）
CREATE TABLE keyword_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  keywords TEXT[] NOT NULL, -- 追踪的关键词列表
  location TEXT DEFAULT 'China',
  search_engine TEXT DEFAULT 'google',
  tracking_frequency TEXT DEFAULT 'weekly' CHECK (tracking_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关键词排名历史记录表
CREATE TABLE keyword_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id UUID REFERENCES keyword_tracking(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER, -- 搜索结果位置，NULL表示未进入前100
  url TEXT, -- 对应的页面URL
  check_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 市场动态告警表
CREATE TABLE market_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('ranking_drop', 'competitor_keyword', 'trend_spike')),
  alert_name TEXT NOT NULL,
  conditions JSONB NOT NULL, -- 告警条件配置
  notification_methods TEXT[] DEFAULT ARRAY['email'], -- 通知方式
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 告警历史记录表
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES market_alerts(id) ON DELETE CASCADE,
  trigger_data JSONB, -- 触发告警的具体数据
  notification_sent BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX idx_keyword_searches_created_at ON keyword_searches(created_at);
CREATE INDEX idx_keyword_analysis_keyword ON keyword_analysis(keyword);
CREATE INDEX idx_competitor_analysis_user_id ON competitor_analysis(user_id);
CREATE INDEX idx_keyword_tracking_user_domain ON keyword_tracking(user_id, domain);
CREATE INDEX idx_keyword_rankings_tracking_date ON keyword_rankings(tracking_id, check_date);
CREATE INDEX idx_market_alerts_user_active ON market_alerts(user_id, is_active);

-- 启用行级安全策略（RLS）
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_pages_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的数据
CREATE POLICY user_keyword_searches ON keyword_searches
  USING (auth.uid() = user_id);

CREATE POLICY user_keyword_analysis ON keyword_analysis
  USING (auth.uid() = user_id);

CREATE POLICY user_competitor_analysis ON competitor_analysis
  USING (auth.uid() = user_id);

CREATE POLICY user_top_pages_analysis ON top_pages_analysis
  USING (auth.uid() = user_id);

CREATE POLICY user_content_ideas ON content_ideas
  USING (auth.uid() = user_id);

CREATE POLICY user_keyword_tracking ON keyword_tracking
  USING (auth.uid() = user_id);

CREATE POLICY user_keyword_rankings ON keyword_rankings
  USING (auth.uid() IN (SELECT user_id FROM keyword_tracking WHERE id = tracking_id));

CREATE POLICY user_market_alerts ON market_alerts
  USING (auth.uid() = user_id);

CREATE POLICY user_alert_history ON alert_history
  USING (auth.uid() IN (SELECT user_id FROM market_alerts WHERE id = alert_id));
-- 会员系统数据库表结构

-- 会员方案配置表（管理员可配置）
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(20) UNIQUE NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  plan_name VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 功能定义表
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_code VARCHAR(50) UNIQUE NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  description TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  api_cost DECIMAL(8,4) DEFAULT 0,
  category VARCHAR(50) DEFAULT 'basic', -- 'basic', 'advanced', 'professional'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 会员方案功能权限配置表
CREATE TABLE plan_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(20) REFERENCES membership_plans(plan_id) ON DELETE CASCADE,
  feature_code VARCHAR(50) REFERENCES features(feature_code) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  daily_limit INTEGER DEFAULT -1, -- -1表示无限制, 0表示禁用, >0表示每日限制
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plan_id, feature_code)
);

-- 会员方案额外配置表
CREATE TABLE plan_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(20) REFERENCES membership_plans(plan_id) ON DELETE CASCADE,
  setting_key VARCHAR(50) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plan_id, setting_key)
);

-- 用户会员订阅表
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id VARCHAR(20) REFERENCES membership_plans(plan_id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  auto_renewal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 确保用户同时只有一个活跃订阅
  CONSTRAINT unique_active_subscription 
    EXCLUDE (user_id WITH =) 
    WHERE (status = 'active')
);

-- 用户积分账户表
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY,
  total_earned INTEGER DEFAULT 0, -- 总获得积分（会员赠送）
  total_purchased INTEGER DEFAULT 0, -- 总购买积分
  total_used INTEGER DEFAULT 0, -- 总使用积分
  current_balance INTEGER DEFAULT 0, -- 当前余额
  last_updated TIMESTAMP DEFAULT NOW()
);

-- 积分变动记录表
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'use', 'purchase', 'expire', 'refund')),
  amount INTEGER NOT NULL, -- 正数为增加，负数为减少
  balance_before INTEGER NOT NULL, -- 变动前余额
  balance_after INTEGER NOT NULL, -- 变动后余额
  source VARCHAR(50), -- 来源：'monthly_gift', 'purchase', 'feature_usage', 'admin_adjust'
  reference_id UUID, -- 关联订单或使用记录ID
  description TEXT,
  metadata JSONB, -- 额外信息
  created_at TIMESTAMP DEFAULT NOW()
);

-- 功能使用记录表
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_code VARCHAR(50) NOT NULL,
  credits_used INTEGER NOT NULL,
  api_cost DECIMAL(8,4) DEFAULT 0,
  request_params JSONB, -- 请求参数
  response_summary JSONB, -- 响应数据摘要
  execution_time INTEGER, -- 执行时间（毫秒）
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 积分包购买记录表
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id VARCHAR(20), -- 购买时的会员等级，影响折扣
  package_type VARCHAR(50) NOT NULL, -- '500_credits', '1500_credits', etc.
  original_price DECIMAL(10,2) NOT NULL,
  discount_rate DECIMAL(4,2) DEFAULT 1.0, -- 折扣率，1.0表示无折扣
  actual_price DECIMAL(10,2) NOT NULL, -- 实际支付价格
  credits_amount INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 每日使用限制跟踪表
CREATE TABLE daily_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_code VARCHAR(50) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature_code, usage_date)
);

-- 会员购买记录表
CREATE TABLE subscription_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id VARCHAR(20) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  actual_price DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_feature_code ON usage_logs(feature_code);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_daily_usage_limits_user_feature_date ON daily_usage_limits(user_id, feature_code, usage_date);

-- 创建触发器：用户注册时自动创建积分账户
CREATE OR REPLACE FUNCTION create_user_credits_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, current_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注意：需要在profiles表上创建触发器
-- CREATE TRIGGER trigger_create_user_credits_account
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_user_credits_account();

-- 创建触发器：积分变动时更新账户余额
CREATE OR REPLACE FUNCTION update_user_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_credits 
  SET 
    current_balance = NEW.balance_after,
    total_earned = CASE 
      WHEN NEW.transaction_type = 'earn' THEN total_earned + NEW.amount
      ELSE total_earned 
    END,
    total_purchased = CASE 
      WHEN NEW.transaction_type = 'purchase' THEN total_purchased + NEW.amount
      ELSE total_purchased 
    END,
    total_used = CASE 
      WHEN NEW.transaction_type = 'use' THEN total_used + ABS(NEW.amount)
      ELSE total_used 
    END,
    last_updated = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_credits_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_balance();

-- 创建函数：获取用户当前会员方案
CREATE OR REPLACE FUNCTION get_user_current_plan(p_user_id UUID)
RETURNS TABLE (
  plan_id VARCHAR(20),
  plan_name VARCHAR(50),
  monthly_price DECIMAL(10,2),
  monthly_credits INTEGER,
  status VARCHAR(20),
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.plan_id,
    mp.plan_name,
    mp.monthly_price,
    mp.monthly_credits,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  JOIN membership_plans mp ON us.plan_id = mp.plan_id
  WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND us.current_period_end >= CURRENT_DATE
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- 如果没有活跃订阅，返回免费版
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      mp.plan_id,
      mp.plan_name,
      mp.monthly_price,
      mp.monthly_credits,
      'active'::VARCHAR(20) as status,
      (CURRENT_DATE + INTERVAL '1 month')::DATE as period_end
    FROM membership_plans mp
    WHERE mp.plan_id = 'free'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：检查用户功能权限
CREATE OR REPLACE FUNCTION check_user_feature_permission(
  p_user_id UUID,
  p_feature_code VARCHAR(50)
)
RETURNS TABLE (
  has_permission BOOLEAN,
  reason VARCHAR(50),
  credits_required INTEGER,
  daily_limit INTEGER,
  daily_used INTEGER
) AS $$
DECLARE
  v_plan_id VARCHAR(20);
  v_permission RECORD;
  v_credits_cost INTEGER;
  v_user_balance INTEGER;
  v_daily_used INTEGER;
BEGIN
  -- 获取用户当前方案
  SELECT plan_id INTO v_plan_id 
  FROM get_user_current_plan(p_user_id) 
  LIMIT 1;
  
  -- 如果没有找到方案，默认为免费版
  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;
  
  -- 获取功能权限配置
  SELECT pp.is_enabled, pp.daily_limit, f.credits_cost
  INTO v_permission
  FROM plan_permissions pp
  JOIN features f ON pp.feature_code = f.feature_code
  WHERE pp.plan_id = v_plan_id AND pp.feature_code = p_feature_code;
  
  -- 如果没有配置，默认禁用
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'feature_not_configured', 0, 0, 0;
    RETURN;
  END IF;
  
  -- 检查功能是否启用
  IF NOT v_permission.is_enabled THEN
    RETURN QUERY SELECT false, 'feature_disabled', v_permission.credits_cost, v_permission.daily_limit, 0;
    RETURN;
  END IF;
  
  -- 检查每日使用限制
  SELECT COALESCE(usage_count, 0) INTO v_daily_used
  FROM daily_usage_limits
  WHERE user_id = p_user_id 
    AND feature_code = p_feature_code 
    AND usage_date = CURRENT_DATE;
    
  IF v_permission.daily_limit > 0 AND v_daily_used >= v_permission.daily_limit THEN
    RETURN QUERY SELECT false, 'daily_limit_exceeded', v_permission.credits_cost, v_permission.daily_limit, v_daily_used;
    RETURN;
  END IF;
  
  -- 检查积分余额
  SELECT current_balance INTO v_user_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_user_balance < v_permission.credits_cost THEN
    RETURN QUERY SELECT false, 'insufficient_credits', v_permission.credits_cost, v_permission.daily_limit, v_daily_used;
    RETURN;
  END IF;
  
  -- 所有检查通过
  RETURN QUERY SELECT true, 'allowed', v_permission.credits_cost, v_permission.daily_limit, v_daily_used;
END;
$$ LANGUAGE plpgsql;
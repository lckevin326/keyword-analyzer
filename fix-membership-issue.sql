-- 修复会员系统问题的SQL脚本
-- 执行前请先备份数据库！

-- 1. 首先检查当前用户订阅情况
SELECT 
  user_id,
  plan_id,
  status,
  current_credits,
  next_billing_date,
  created_at,
  updated_at
FROM user_subscriptions 
ORDER BY created_at DESC;

-- 2. 检查是否有重复的免费订阅记录
SELECT 
  user_id,
  COUNT(*) as subscription_count,
  array_agg(plan_id ORDER BY created_at) as plans,
  array_agg(created_at ORDER BY created_at) as dates
FROM user_subscriptions 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 3. 为表添加缺失的字段（如果不存在）
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start DATE,
ADD COLUMN IF NOT EXISTS current_period_end DATE,
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;

-- 4. 更新现有记录的period字段
UPDATE user_subscriptions 
SET 
  current_period_start = COALESCE(current_period_start, created_at::date),
  current_period_end = COALESCE(
    current_period_end, 
    next_billing_date::date,
    (created_at + INTERVAL '30 days')::date
  ),
  auto_renewal = COALESCE(auto_renewal, next_billing_date IS NOT NULL)
WHERE current_period_start IS NULL OR current_period_end IS NULL;

-- 5. 删除重复的免费订阅（保留最早的付费订阅）
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    plan_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE WHEN plan_id != 'free' THEN 0 ELSE 1 END,  -- 付费订阅优先
        created_at ASC  -- 然后按创建时间
    ) as rn
  FROM user_subscriptions
)
DELETE FROM user_subscriptions 
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- 6. 创建更安全的约束
-- 删除旧的唯一约束
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;

-- 添加新的约束：每个用户只能有一个活跃订阅
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- 7. 如果您知道自己应该是专业版会员，可以手动恢复（替换 'your-user-id'）
/*
-- 恢复专业版订阅的示例（请替换实际的用户ID）
UPDATE user_subscriptions 
SET 
  plan_id = 'professional',
  status = 'active',
  current_credits = 2000,
  current_period_end = (CURRENT_DATE + INTERVAL '30 days')::date,
  auto_renewal = true,
  updated_at = NOW()
WHERE user_id = 'your-user-id-here' 
AND status = 'active';
*/

-- 8. 验证修复结果
SELECT 
  u.user_id,
  p.email,
  u.plan_id,
  mp.plan_name,
  u.status,
  u.current_credits,
  u.current_period_start,
  u.current_period_end,
  u.auto_renewal,
  u.created_at
FROM user_subscriptions u
LEFT JOIN profiles p ON u.user_id = p.id
LEFT JOIN membership_plans mp ON u.plan_id = mp.plan_id
WHERE u.status = 'active'
ORDER BY u.created_at DESC;
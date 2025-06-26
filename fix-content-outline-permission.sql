-- Fix content_outline permission issues
-- This script ensures that content_outline feature exists and is properly configured

-- First, let's check if we have the feature_permissions table (simple schema)
DO $$
BEGIN
  -- Ensure content_outline exists in feature_permissions table
  INSERT INTO feature_permissions (feature_code, feature_name, description, credits_required, min_plan_level, is_active)
  VALUES ('content_outline', 'AI内容大纲生成', '基于关键词生成详细的内容大纲', 8, 0, true)
  ON CONFLICT (feature_code) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    credits_required = EXCLUDED.credits_required,
    min_plan_level = EXCLUDED.min_plan_level,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'Feature permissions updated for content_outline';
END
$$;

-- If we have the complex schema (features + plan_permissions tables), update those too
DO $$
BEGIN
  -- Check if features table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features') THEN
    -- Insert or update the feature in the features table
    INSERT INTO features (feature_code, feature_name, description, credits_cost, is_active)
    VALUES ('content_outline', 'AI内容大纲生成', '基于关键词生成详细的内容大纲', 8, true)
    ON CONFLICT (feature_code) DO UPDATE SET
      feature_name = EXCLUDED.feature_name,
      description = EXCLUDED.description,
      credits_cost = EXCLUDED.credits_cost,
      is_active = EXCLUDED.is_active;

    -- Grant permission to all plan levels
    INSERT INTO plan_permissions (plan_id, feature_code, is_enabled, daily_limit)
    VALUES 
      ('free', 'content_outline', true, 5),
      ('basic', 'content_outline', true, 20),
      ('pro', 'content_outline', true, 100),
      ('enterprise', 'content_outline', true, -1)
    ON CONFLICT (plan_id, feature_code) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      daily_limit = EXCLUDED.daily_limit;

    RAISE NOTICE 'Complex schema permissions updated for content_outline';
  END IF;
END
$$;

-- Ensure all professional users have sufficient credits
UPDATE user_subscriptions 
SET current_credits = GREATEST(current_credits, 100)
WHERE plan_id = 'pro' AND current_credits < 8;

-- Let's also check the actual data to debug the issue
SELECT 'Current feature_permissions for content_outline:' as info;
SELECT * FROM feature_permissions WHERE feature_code = 'content_outline';

SELECT 'All user subscriptions:' as info;
SELECT 
  us.user_id,
  us.plan_id, 
  us.status,
  us.current_credits,
  p.email
FROM user_subscriptions us
LEFT JOIN profiles p ON us.user_id = p.id
WHERE us.status = 'active';

-- Check if features table exists and show its content for content_outline
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features') THEN
    RAISE NOTICE 'Features table exists, checking content_outline';
    PERFORM * FROM features WHERE feature_code = 'content_outline';
  ELSE
    RAISE NOTICE 'Features table does not exist, using simple schema';
  END IF;
END
$$;
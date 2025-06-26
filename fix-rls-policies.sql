-- 修复 user_subscriptions 表的 RLS 策略
-- 添加缺失的 INSERT 和 UPDATE 权限

-- 允许用户插入自己的订阅记录
CREATE POLICY "Users can insert own subscription" ON user_subscriptions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的订阅记录  
CREATE POLICY "Users can update own subscription" ON user_subscriptions 
FOR UPDATE USING (auth.uid() = user_id);

-- 允许用户插入自己的订阅历史
CREATE POLICY "Users can insert own subscription history" ON subscription_history 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户插入自己的支付记录
CREATE POLICY "Users can insert own payment records" ON payment_records 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户插入自己的积分使用记录
CREATE POLICY "Users can insert own credit logs" ON credit_usage_logs 
FOR INSERT WITH CHECK (auth.uid() = user_id);
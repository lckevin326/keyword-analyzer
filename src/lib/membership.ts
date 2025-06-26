import { createServerSupabaseClient } from './supabase-server'

// 会员类型定义
export interface MembershipPlan {
  plan_id: string
  plan_name: string
  monthly_price: number
  monthly_credits: number
  sort_order: number
  is_active: boolean
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  current_period_start: string
  current_period_end: string
  auto_renewal: boolean
  plan_name?: string
  monthly_price?: number
  monthly_credits?: number
  current_credits?: number
}

export interface UserCredits {
  user_id: string
  total_earned: number
  total_purchased: number
  total_used: number
  current_balance: number
  last_updated: string
}

export interface Feature {
  feature_code: string
  feature_name: string
  description: string
  category: string
  credits_cost: number
  is_active: boolean
  min_plan_level: number
}

export interface FeaturePermission {
  feature_code: string
  is_enabled: boolean
  daily_limit: number
  credits_required: number
  daily_used?: number
}

export interface PermissionCheckResult {
  has_permission: boolean
  reason: 'allowed' | 'feature_disabled' | 'daily_limit_exceeded' | 'insufficient_credits' | 'not_logged_in'
  credits_required: number
  daily_limit: number
  daily_used: number
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: 'earn' | 'use' | 'purchase' | 'expire' | 'refund'
  amount: number
  balance_before: number
  balance_after: number
  source: string
  description: string
  created_at: string
}

export interface CreditPackage {
  package_code: string
  package_name: string
  credits_amount: number
  bonus_credits: number
  original_price: number
  sort_order: number
  is_active: boolean
}

// 会员服务类
export class MembershipService {
  public supabase = createServerSupabaseClient()

  // 获取所有会员方案
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await this.supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  // 获取用户当前订阅
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        current_credits,
        next_billing_date,
        created_at,
        updated_at,
        membership_plans(
          plan_name,
          monthly_price,
          monthly_credits
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 是 "no rows returned" 错误，这是正常的
      throw error
    }
    
    if (!data) {
      // 如果没有找到订阅，尝试为用户创建免费版订阅
      await this.createDefaultSubscription(userId)
      
      // 再次查询
      const { data: newData, error: newError } = await this.supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          current_credits,
          next_billing_date,
          created_at,
          updated_at,
          membership_plans(
            plan_name,
            monthly_price,
            monthly_credits
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (newError) {
        // 如果还是失败，返回默认免费版订阅
        return {
          id: 'free-default',
          user_id: userId,
          plan_id: 'free',
          status: 'active',
          current_period_start: new Date().toISOString().split('T')[0],
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          auto_renewal: false,
          plan_name: '免费版',
          monthly_price: 0,
          monthly_credits: 100
        }
      }
      
      return this.formatSubscription(newData)
    }

    return this.formatSubscription(data)
  }

  private formatSubscription(data: any): UserSubscription {
    return {
      id: data.id,
      user_id: data.user_id,
      plan_id: data.plan_id,
      status: data.status,
      current_period_start: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      current_period_end: data.next_billing_date?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      auto_renewal: !!data.next_billing_date,
      plan_name: data.membership_plans?.plan_name || '免费版',
      monthly_price: data.membership_plans?.monthly_price || 0,
      monthly_credits: data.membership_plans?.monthly_credits || 100,
      current_credits: data.current_credits || 100
    }
  }

  private async createDefaultSubscription(userId: string): Promise<void> {
    try {
      // 再次检查用户是否已有订阅，避免重复创建
      const { data: existing } = await this.supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (existing) {
        console.log('用户已有订阅，跳过创建')
        return
      }

      const { error } = await this.supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free',
          status: 'active',
          current_credits: 100
        })
      
      if (error) {
        console.error('插入默认订阅失败:', error)
        throw error
      }
      
      console.log('成功为用户创建默认订阅:', userId)
    } catch (err) {
      console.error('创建默认订阅失败:', err)
      // 不抛出错误，因为可能用户已经有订阅了（并发情况下）
    }
  }

  // 获取用户积分信息
  async getUserCredits(userId: string): Promise<UserCredits> {
    // 直接从数据库获取积分信息，避免循环调用
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('current_credits')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    let currentCredits = 100 // 默认积分
    
    if (error && error.code !== 'PGRST116') {
      console.error('获取积分信息失败:', error)
      // 不抛出错误，而是使用默认值
    } else if (data) {
      currentCredits = data.current_credits || 100
    }

    // 如果没有订阅记录，为用户创建默认订阅
    if (!data) {
      try {
        await this.createDefaultSubscription(userId)
        currentCredits = 100 // 确保新创建的用户有100积分
      } catch (err) {
        console.error('创建默认订阅失败:', err)
        // 即使创建失败，也返回默认值
      }
    }

    return {
      user_id: userId,
      current_balance: currentCredits,
      total_earned: currentCredits, // 简化处理，实际应该从历史记录计算
      total_purchased: 0, // 添加missing字段
      total_used: 0, // 修正字段名：total_spent -> total_used
      last_updated: new Date().toISOString()
    }
  }

  // 检查用户功能权限
  async checkFeaturePermission(userId: string, featureCode: string): Promise<PermissionCheckResult> {
    try {
      // 获取用户订阅信息
      const subscription = await this.getUserSubscription(userId)
      if (!subscription) {
        return {
          has_permission: false,
          reason: 'not_logged_in',
          credits_required: 0,
          daily_limit: 0,
          daily_used: 0
        }
      }

      // 尝试新的数据库架构 (features + plan_permissions)
      let feature = null
      let featureError = null

      // 首先尝试新的复杂架构
      const { data: newFeature, error: newFeatureError } = await this.supabase
        .from('features')
        .select('*')
        .eq('feature_code', featureCode)
        .eq('is_active', true)
        .single()

      if (!newFeatureError && newFeature) {
        // 检查plan_permissions
        const { data: planPermission, error: planPermError } = await this.supabase
          .from('plan_permissions')
          .select('*')
          .eq('plan_id', subscription.plan_id)
          .eq('feature_code', featureCode)
          .eq('is_enabled', true)
          .single()

        if (!planPermError && planPermission) {
          feature = {
            feature_code: newFeature.feature_code,
            credits_required: newFeature.credits_cost,
            min_plan_level: 0, // 如果在plan_permissions中找到，说明用户有权限
            is_active: true
          }
        } else {
          featureError = planPermError || { message: '功能未授权给当前会员等级' }
        }
      } else {
        // 如果新架构不存在，尝试旧的简单架构
        const { data: oldFeature, error: oldFeatureError } = await this.supabase
          .from('feature_permissions')
          .select('*')
          .eq('feature_code', featureCode)
          .eq('is_active', true)
          .single()

        feature = oldFeature
        featureError = oldFeatureError
      }

      if (featureError || !feature) {
        // 如果都找不到，作为临时解决方案，为content_outline提供默认权限
        if (featureCode === 'content_outline') {
          feature = {
            feature_code: 'content_outline',
            credits_required: 8,
            min_plan_level: 0,
            is_active: true
          }
        } else {
          return {
            has_permission: false,
            reason: 'feature_disabled',
            credits_required: 0,
            daily_limit: 0,
            daily_used: 0
          }
        }
      }

      // 检查会员等级权限（仅在旧架构中需要）
      if (feature.min_plan_level !== undefined) {
        const planLevels = {
          'free': 0,
          'basic': 1, 
          'pro': 2,
          'enterprise': 3
        }
        
        const userPlanLevel = planLevels[subscription.plan_id as keyof typeof planLevels] || 0
        
        if (feature.min_plan_level > userPlanLevel) {
          return {
            has_permission: false,
            reason: 'feature_disabled',
            credits_required: feature.credits_required,
            daily_limit: 0,
            daily_used: 0
          }
        }
      }

      // 检查积分余额
      const credits = await this.getUserCredits(userId)
      
      if (credits.current_balance < feature.credits_required) {
        console.log(`用户 ${userId} 积分不足: 需要 ${feature.credits_required}, 当前 ${credits.current_balance}`)
        return {
          has_permission: false,
          reason: 'insufficient_credits',
          credits_required: feature.credits_required,
          daily_limit: 0,
          daily_used: 0
        }
      }

      // 检查每日使用限制（仅免费用户）
      let dailyUsed = 0
      const planLevels = {
        'free': 0,
        'basic': 1, 
        'pro': 2,
        'enterprise': 3
      }
      const userPlanLevel = planLevels[subscription.plan_id as keyof typeof planLevels] || 0
      
      if (userPlanLevel === 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: usageData } = await this.supabase
          .from('credit_usage_logs')
          .select('credits_used')
          .eq('user_id', userId)
          .eq('feature_code', featureCode)
          .gte('created_at', today)

        dailyUsed = usageData?.reduce((sum, item) => sum + item.credits_used, 0) || 0
        
        const dailyLimit = 10 // 免费用户每日限制
        if (dailyUsed >= dailyLimit) {
          return {
            has_permission: false,
            reason: 'daily_limit_exceeded',
            credits_required: feature.credits_required,
            daily_limit: dailyLimit,
            daily_used: dailyUsed
          }
        }
      }

      return {
        has_permission: true,
        reason: 'allowed',
        credits_required: feature.credits_required,
        daily_limit: userPlanLevel === 0 ? 10 : 0,
        daily_used: dailyUsed
      }

    } catch (error) {
      console.error('权限检查失败:', error)
      return {
        has_permission: false,
        reason: 'feature_disabled',
        credits_required: 0,
        daily_limit: 0,
        daily_used: 0
      }
    }
  }

  // 扣除积分并记录使用
  async useFeature(
    userId: string, 
    featureCode: string, 
    requestData?: any,
    responseData?: any
  ): Promise<{ success: boolean; usageId?: string; error?: string }> {
    // 1. 检查权限
    const permission = await this.checkFeaturePermission(userId, featureCode)
    if (!permission.has_permission) {
      return { success: false, error: permission.reason }
    }

    // 2. 开始事务处理
    try {
      // 获取当前积分余额
      const credits = await this.getUserCredits(userId)
      const balanceBefore = credits.current_balance
      const balanceAfter = balanceBefore - permission.credits_required

      // 3. 记录积分使用日志（使用现有的 credit_usage_logs 表）
      const { data: usage, error: usageError } = await this.supabase
        .from('credit_usage_logs')
        .insert({
          user_id: userId,
          feature_code: featureCode,
          credits_used: permission.credits_required,
          remaining_credits: balanceAfter,
          description: `使用功能: ${featureCode}`
        })
        .select()
        .single()

      if (usageError) {
        console.error('记录积分使用日志失败:', usageError)
        throw usageError
      }

      // 5. 更新用户订阅表中的积分余额
      const { error: updateError } = await this.supabase
        .from('user_subscriptions')
        .update({ 
          current_credits: balanceAfter,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (updateError) {
        console.error('更新用户积分余额失败:', updateError)
        throw updateError
      }

      console.log(`积分扣除成功: 用户 ${userId}, 功能 ${featureCode}, 扣除 ${permission.credits_required} 积分, 余额: ${balanceBefore} -> ${balanceAfter}`)

      // 6. 更新每日使用计数
      await this.updateDailyUsage(userId, featureCode)

      return { success: true, usageId: usage.id }

    } catch (error) {
      console.error('扣除积分失败:', error)
      return { success: false, error: 'transaction_failed' }
    }
  }

  // 更新每日使用计数
  private async updateDailyUsage(userId: string, featureCode: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    
    // 先尝试获取当前记录
    const { data: existing } = await this.supabase
      .from('daily_usage_limits')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('feature_code', featureCode)
      .eq('usage_date', today)
      .single()

    if (existing) {
      // 如果记录存在，增加计数
      await this.supabase
        .from('daily_usage_limits')
        .update({ 
          usage_count: existing.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_code', featureCode)
        .eq('usage_date', today)
    } else {
      // 如果记录不存在，创建新记录
      await this.supabase
        .from('daily_usage_limits')
        .insert({
          user_id: userId,
          feature_code: featureCode,
          usage_date: today,
          usage_count: 1
        })
    }
  }

  // 获取所有功能列表
  async getFeatures(): Promise<Feature[]> {
    const { data, error } = await this.supabase
      .from('feature_permissions')
      .select('*')
      .eq('is_active', true)
      .order('feature_code', { ascending: true })

    if (error) throw error
    
    // 转换数据格式以匹配 Feature 接口
    return (data || []).map(item => ({
      feature_code: item.feature_code,
      feature_name: this.getFeatureDisplayName(item.feature_code),
      description: this.getFeatureDescription(item.feature_code),
      category: this.getFeatureCategory(item.feature_code),
      credits_cost: item.credits_required,
      is_active: item.is_active,
      min_plan_level: item.min_plan_level
    }))
  }

  // 获取功能显示名称
  private getFeatureDisplayName(featureCode: string): string {
    const names = {
      'keyword_search_basic': '基础关键词搜索',
      'keyword_analysis': '关键词深度分析',
      'competitor_analysis': '竞争对手分析',
      'trending_keywords': '热门趋势监控',
      'gap_analysis': '关键词差距分析',
      'top_pages_analysis': '高流量页面分析',
      'content_generation': 'AI内容生成',
      'outline_generation': '大纲生成'
    }
    return names[featureCode as keyof typeof names] || featureCode
  }

  // 获取功能描述
  private getFeatureDescription(featureCode: string): string {
    const descriptions = {
      'keyword_search_basic': '搜索和分析基础关键词数据',
      'keyword_analysis': '深度分析关键词的搜索量、竞争度等指标',
      'competitor_analysis': '分析竞争对手的关键词策略',
      'trending_keywords': '监控最新的热门关键词趋势',
      'gap_analysis': '发现与竞争对手的关键词差距',
      'top_pages_analysis': '分析网站的高流量页面',
      'content_generation': '基于关键词生成优质内容',
      'outline_generation': '生成内容大纲和结构'
    }
    return descriptions[featureCode as keyof typeof descriptions] || '功能描述'
  }

  // 获取功能分类
  private getFeatureCategory(featureCode: string): string {
    const categories = {
      'keyword_search_basic': '基础功能',
      'keyword_analysis': '关键词分析',
      'competitor_analysis': '竞争分析',
      'trending_keywords': '趋势监控',
      'gap_analysis': '竞争分析',
      'top_pages_analysis': '竞争分析',
      'content_generation': '内容创作',
      'outline_generation': '内容创作'
    }
    return categories[featureCode as keyof typeof categories] || '其他'
  }

  // 获取用户权限列表
  async getUserPermissions(userId: string): Promise<FeaturePermission[]> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return []

    // 根据会员等级获取权限
    const planLevels = {
      'free': 0,
      'basic': 1, 
      'pro': 2,
      'enterprise': 3
    }
    
    const userPlanLevel = planLevels[subscription.plan_id as keyof typeof planLevels] || 0

    const { data, error } = await this.supabase
      .from('feature_permissions')
      .select('*')
      .lte('min_plan_level', userPlanLevel)
      .eq('is_active', true)

    if (error) throw error

    return (data || []).map(item => ({
      feature_code: item.feature_code,
      is_enabled: true, // 如果在查询结果中，说明用户有权限
      daily_limit: userPlanLevel === 0 ? 10 : 0, // 免费用户有每日限制，付费用户无限制
      credits_required: item.credits_required
    }))
  }

  // 获取积分包列表
  async getCreditPackages(): Promise<CreditPackage[]> {
    const { data, error } = await this.supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  // 购买会员
  async purchaseSubscription(
    userId: string, 
    planId: string, 
    paymentMethod: string = 'mock'
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // 获取方案信息
      const { data: plan, error: planError } = await this.supabase
        .from('membership_plans')
        .select('*')
        .eq('plan_id', planId)
        .single()

      if (planError || !plan) {
        return { success: false, error: 'plan_not_found' }
      }

      // 检查用户是否已有订阅
      const { data: existingSubscription } = await this.supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single()

      const nextBillingDate = new Date()
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1) // 下个月同一天

      let subscription
      let subscriptionError

      if (existingSubscription) {
        // 更新现有订阅
        const { data, error } = await this.supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            current_credits: plan.monthly_credits,
            next_billing_date: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()
        
        subscription = data
        subscriptionError = error
      } else {
        // 创建新订阅
        const { data, error } = await this.supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_credits: plan.monthly_credits,
            next_billing_date: nextBillingDate.toISOString()
          })
          .select()
          .single()
        
        subscription = data
        subscriptionError = error
      }

      if (subscriptionError) throw subscriptionError

      // 记录购买记录到 payment_records 表
      await this.supabase
        .from('payment_records')
        .insert({
          user_id: userId,
          subscription_id: subscription.id,
          amount: plan.monthly_price,
          currency: 'USD',
          payment_method: paymentMethod,
          payment_status: 'completed',
          transaction_id: `mock_${Date.now()}`
        })

      // 记录订阅历史
      await this.supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          plan_id: planId,
          action: 'subscribe', // 使用数据库中定义的枚举值
          amount: plan.monthly_price,
          payment_method: paymentMethod
        })

      return { success: true, subscriptionId: subscription.id }

    } catch (error) {
      console.error('购买会员失败:', error)
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      
      return { success: false, error: 'purchase_failed' }
    }
  }

  // 购买积分
  async purchaseCredits(
    userId: string, 
    packageCode: string, 
    paymentMethod: string = 'mock'
  ): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
    try {
      // 获取积分包信息
      const { data: package_, error: packageError } = await this.supabase
        .from('credit_packages')
        .select('*')
        .eq('package_code', packageCode)
        .single()

      if (packageError || !package_) {
        return { success: false, error: 'package_not_found' }
      }

      // 获取用户当前会员等级的折扣
      const subscription = await this.getUserSubscription(userId)
      const discount = await this.getMemberDiscount(subscription?.plan_id || 'free')

      const originalPrice = package_.original_price
      const actualPrice = originalPrice * discount
      const totalCredits = package_.credits_amount + package_.bonus_credits

      // 记录购买记录
      const { data: purchase, error: purchaseError } = await this.supabase
        .from('credit_purchases')
        .insert({
          user_id: userId,
          plan_id: subscription?.plan_id,
          package_type: packageCode,
          original_price: originalPrice,
          discount_rate: discount,
          actual_price: actualPrice,
          credits_amount: package_.credits_amount,
          bonus_credits: package_.bonus_credits,
          payment_method: paymentMethod,
          payment_status: 'completed',
          transaction_id: `mock_${Date.now()}`
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // 增加积分
      await this.addCredits(userId, totalCredits, 'purchase', `购买积分包: ${package_.package_name}`)

      return { success: true, purchaseId: purchase.id }

    } catch (error) {
      console.error('购买积分失败:', error)
      return { success: false, error: 'purchase_failed' }
    }
  }

  // 增加用户积分
  async addCredits(
    userId: string, 
    amount: number, 
    source: string, 
    description: string
  ): Promise<void> {
    const credits = await this.getUserCredits(userId)
    const balanceBefore = credits.current_balance
    const balanceAfter = balanceBefore + amount

    const { error } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: source === 'purchase' ? 'purchase' : 'earn',
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        source: source,
        description: description
      })

    if (error) throw error
  }

  // 获取会员折扣率
  private async getMemberDiscount(planId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('plan_settings')
      .select('setting_value')
      .eq('plan_id', planId)
      .eq('setting_key', 'credit_discount')
      .single()

    if (error || !data) return 1.0
    return parseFloat(data.setting_value)
  }

  // 获取用户积分变动记录
  async getCreditTransactions(
    userId: string, 
    limit: number = 50
  ): Promise<CreditTransaction[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // 获取用户使用统计
  async getUserUsageStats(userId: string, days: number = 30) {
    const { data, error } = await this.supabase
      .from('usage_statistics')
      .select('*')
      .eq('user_id', userId)
      .gte('usage_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('usage_date', { ascending: false })

    if (error) throw error
    return data || []
  }
}
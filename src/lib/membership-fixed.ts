import { createServerSupabaseClient } from './supabase-server'

// 修复后的会员服务类
export class FixedMembershipService {
  private supabase = createServerSupabaseClient()

  // 修复后的获取用户订阅方法
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    console.log(`[MEMBERSHIP] 查询用户 ${userId} 的订阅信息`)
    
    const { data: allSubscriptions, error: allError } = await this.supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        current_credits,
        next_billing_date,
        current_period_start,
        current_period_end,
        auto_renewal,
        created_at,
        updated_at,
        membership_plans(
          plan_name,
          monthly_price,
          monthly_credits
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (allError) {
      console.error(`[MEMBERSHIP] 查询用户订阅失败:`, allError)
      throw allError
    }

    console.log(`[MEMBERSHIP] 找到 ${allSubscriptions?.length || 0} 条订阅记录`)

    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log(`[MEMBERSHIP] 用户 ${userId} 没有任何订阅记录，创建默认订阅`)
      await this.createDefaultSubscription(userId)
      return await this.getUserSubscription(userId)
    }

    // 查找最佳的订阅记录
    let bestSubscription = null
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // 优先级：活跃的付费订阅 > 活跃的免费订阅 > 最新的订阅
    for (const sub of allSubscriptions) {
      console.log(`[MEMBERSHIP] 检查订阅:`, {
        plan_id: sub.plan_id,
        status: sub.status,
        end_date: sub.current_period_end || sub.next_billing_date,
        created_at: sub.created_at
      })

      // 检查订阅是否过期
      const endDate = sub.current_period_end || (sub.next_billing_date ? sub.next_billing_date.split('T')[0] : null)
      const isExpired = endDate && endDate < today

      if (isExpired && sub.status === 'active') {
        console.log(`[MEMBERSHIP] 订阅已过期，更新状态为 expired`)
        await this.supabase
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id)
        continue
      }

      if (sub.status === 'active' && !isExpired) {
        if (!bestSubscription || sub.plan_id !== 'free' || bestSubscription.plan_id === 'free') {
          bestSubscription = sub
          if (sub.plan_id !== 'free') {
            // 找到付费订阅就立即使用
            break
          }
        }
      }
    }

    if (!bestSubscription) {
      // 如果没有活跃的订阅，使用最新的订阅或创建默认订阅
      bestSubscription = allSubscriptions[0]
      if (!bestSubscription) {
        console.log(`[MEMBERSHIP] 创建默认订阅`)
        await this.createDefaultSubscription(userId)
        return await this.getUserSubscription(userId)
      }
    }

    console.log(`[MEMBERSHIP] 使用订阅:`, {
      plan_id: bestSubscription.plan_id,
      status: bestSubscription.status
    })

    return this.formatSubscription(bestSubscription)
  }

  private formatSubscription(data: any): UserSubscription {
    const endDate = data.current_period_end || 
                   (data.next_billing_date ? data.next_billing_date.split('T')[0] : null) ||
                   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return {
      id: data.id,
      user_id: data.user_id,
      plan_id: data.plan_id,
      status: data.status,
      current_period_start: data.current_period_start || 
                           data.created_at?.split('T')[0] || 
                           new Date().toISOString().split('T')[0],
      current_period_end: endDate,
      auto_renewal: data.auto_renewal ?? !!data.next_billing_date,
      plan_name: data.membership_plans?.plan_name || this.getPlanName(data.plan_id),
      monthly_price: data.membership_plans?.monthly_price || this.getPlanPrice(data.plan_id),
      monthly_credits: data.membership_plans?.monthly_credits || this.getPlanCredits(data.plan_id),
      current_credits: data.current_credits || this.getPlanCredits(data.plan_id)
    }
  }

  private getPlanName(planId: string): string {
    const names = {
      'free': '免费版',
      'basic': '基础版',
      'professional': '专业版',
      'pro': '专业版',
      'enterprise': '企业版'
    }
    return names[planId as keyof typeof names] || planId
  }

  private getPlanPrice(planId: string): number {
    const prices = {
      'free': 0,
      'basic': 99,
      'professional': 299,
      'pro': 299,
      'enterprise': 599
    }
    return prices[planId as keyof typeof prices] || 0
  }

  private getPlanCredits(planId: string): number {
    const credits = {
      'free': 100,
      'basic': 500,
      'professional': 2000,
      'pro': 2000,
      'enterprise': 5000
    }
    return credits[planId as keyof typeof credits] || 100
  }

  private async createDefaultSubscription(userId: string): Promise<void> {
    try {
      console.log(`[MEMBERSHIP] 为用户 ${userId} 创建默认免费订阅`)
      
      // 检查是否已有订阅
      const { data: existing } = await this.supabase
        .from('user_subscriptions')
        .select('id, plan_id')
        .eq('user_id', userId)
        .single()
      
      if (existing) {
        console.log(`[MEMBERSHIP] 用户已有订阅，跳过创建:`, existing)
        return
      }

      const { error } = await this.supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free',
          status: 'active',
          current_credits: 100,
          current_period_start: new Date().toISOString().split('T')[0],
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          auto_renewal: false
        })
      
      if (error) {
        if (error.code === '23505') {
          // 唯一约束违反，说明已有订阅
          console.log(`[MEMBERSHIP] 用户已有订阅（唯一约束）`)
          return
        }
        console.error(`[MEMBERSHIP] 创建默认订阅失败:`, error)
        throw error
      }
      
      console.log(`[MEMBERSHIP] 成功创建默认订阅`)
    } catch (err) {
      console.error(`[MEMBERSHIP] 创建默认订阅异常:`, err)
      // 不抛出错误，避免影响正常流程
    }
  }

  // 手动恢复用户订阅的方法
  async restoreUserSubscription(userId: string, planId: string): Promise<void> {
    console.log(`[MEMBERSHIP] 恢复用户 ${userId} 的 ${planId} 订阅`)
    
    const { error } = await this.supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_credits: this.getPlanCredits(planId),
        current_period_start: new Date().toISOString().split('T')[0],
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_renewal: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error(`[MEMBERSHIP] 恢复订阅失败:`, error)
      throw error
    }

    console.log(`[MEMBERSHIP] 成功恢复订阅`)
  }
}

// 导出接口类型
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

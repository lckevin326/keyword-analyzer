import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

export async function GET() {
  try {
    // 验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const membershipService = new MembershipService()
    
    console.log('=== 积分扣除调试开始 ===')
    
    // 1. 获取当前积分
    const creditsBefore = await membershipService.getUserCredits(user.id)
    console.log('扣除前积分:', creditsBefore)
    
    // 2. 获取订阅信息
    const subscription = await membershipService.getUserSubscription(user.id)
    console.log('用户订阅:', subscription)
    
    // 3. 检查权限
    const permission = await membershipService.checkFeaturePermission(user.id, 'content_outline')
    console.log('权限检查:', permission)
    
    if (!permission.has_permission) {
      return NextResponse.json({
        error: '权限检查失败',
        permission: permission
      }, { status: 403 })
    }
    
    // 4. 尝试扣除积分
    console.log('开始扣除积分...')
    const result = await membershipService.useFeature(user.id, 'content_outline', {
      test: true,
      timestamp: new Date().toISOString()
    })
    
    console.log('扣除积分结果:', result)
    
    // 5. 再次获取积分
    const creditsAfter = await membershipService.getUserCredits(user.id)
    console.log('扣除后积分:', creditsAfter)
    
    // 6. 检查数据库中的实际记录
    const { data: usageLogs } = await supabase
      .from('credit_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('最近积分使用记录:', usageLogs)
    
    // 7. 检查用户订阅表中的积分
    const { data: subscriptionRecord } = await supabase
      .from('user_subscriptions')
      .select('current_credits, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    
    console.log('订阅表中的积分记录:', subscriptionRecord)
    
    console.log('=== 积分扣除调试结束 ===')
    
    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        creditsBefore: creditsBefore,
        creditsAfter: creditsAfter,
        permission: permission,
        useFeatureResult: result,
        recentUsageLogs: usageLogs,
        subscriptionRecord: subscriptionRecord,
        creditsDifference: creditsBefore.current_balance - creditsAfter.current_balance
      }
    })
    
  } catch (error: unknown) {
    console.error('积分调试失败:', error)
    const errorMessage = error instanceof Error ? error.message : '调试失败'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({
      error: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}



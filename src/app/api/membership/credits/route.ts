import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

// 获取用户积分信息和积分包
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const membershipService = new MembershipService()
    
    // 检查请求类型
    const url = new URL(request.url)
    const simpleMode = url.searchParams.get('simple') === 'true'
    const requestType = url.searchParams.get('type')
    
    // 如果请求积分包列表
    if (requestType === 'packages') {
      const packages = await membershipService.getCreditPackages()
      return NextResponse.json({
        success: true,
        data: packages
      })
    }
    
    if (simpleMode) {
      // 简单模式：直接从数据库获取积分信息
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          current_credits,
          plan_id,
          membership_plans(
            plan_name,
            monthly_credits
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      let currentCredits = 100
      let planName = '免费版'
      let monthlyCredits = 100
      
      if (subError && subError.code !== 'PGRST116') {
        console.error('获取订阅信息失败:', subError)
        // 不抛出错误，直接返回默认值
      } else if (subscriptionData) {
        currentCredits = subscriptionData.current_credits || 100
        planName = (subscriptionData.membership_plans as { plan_name?: string })?.plan_name || '免费版'
        monthlyCredits = (subscriptionData.membership_plans as { monthly_credits?: number })?.monthly_credits || 100
      }

      if (!subscriptionData) {
        // 用户没有订阅，创建默认订阅
        try {
          // 先检查是否已经有订阅（避免并发问题）
          const { data: existing } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()
            
          if (!existing) {
            const { error: insertError } = await supabase
              .from('user_subscriptions')
              .insert({
                user_id: user.id,
                plan_id: 'free',
                status: 'active',
                current_credits: 100
              })

            if (insertError) {
              console.error('创建默认订阅失败:', insertError)
            } else {
              console.log('成功为用户创建默认订阅:', user.id)
            }
          }
        } catch (err) {
          console.error('创建订阅过程失败:', err)
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          current_credits: currentCredits,
          plan_name: planName,
          monthly_credits: monthlyCredits
        }
      })
    }
    
    // 完整模式：返回所有积分相关信息
    const credits = await membershipService.getUserCredits(user.id)
    const subscription = await membershipService.getUserSubscription(user.id)

    // 获取积分使用历史记录
    const { data: usageHistory } = await supabase
      .from('credit_usage_logs')
      .select(`
        id,
        feature_code,
        credits_used,
        remaining_credits,
        description,
        created_at,
        feature_permissions(feature_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      data: {
        credits,
        usage_history: usageHistory || [],
        current_plan: subscription?.plan_id || 'free'
      }
    })

  } catch (error: unknown) {
    console.error('获取积分信息失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取积分信息失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}

// 购买积分（暂时不支持，通过会员订阅获取积分）
export async function POST() {
  try {
    return NextResponse.json({
      error: '积分购买功能暂未开放，请通过升级会员获取更多积分'
    }, { status: 400 })

  } catch (error: unknown) {
    console.error('购买积分失败:', error)
    const errorMessage = error instanceof Error ? error.message : '购买失败，请重试'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}

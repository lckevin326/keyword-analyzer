import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 管理员恢复用户订阅的API端点
export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json(
        { error: '缺少必要参数：userId 和 planId' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 验证当前用户是否为管理员（可选，根据需要实现）
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      )
    }

    console.log(`[ADMIN] 管理员 ${user.id} 请求恢复用户 ${userId} 的 ${planId} 订阅`)

    // 获取方案信息
    const planCredits = {
      'free': 100,
      'basic': 500,
      'professional': 2000,
      'pro': 2000,
      'enterprise': 5000
    }

    const credits = planCredits[planId as keyof typeof planCredits] || 100

    // 首先检查用户是否存在
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查当前订阅状态
    const { data: currentSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('查询当前订阅失败:', subError)
    }

    console.log('当前订阅状态:', currentSub)

    // 恢复或创建订阅
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_credits: credits,
      current_period_start: new Date().toISOString().split('T')[0],
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      auto_renewal: planId !== 'free',
      updated_at: new Date().toISOString()
    }

    let result
    if (currentSub) {
      // 更新现有订阅
      console.log('更新现有订阅')
      result = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId)
        .select()
    } else {
      // 创建新订阅
      console.log('创建新订阅')
      result = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
    }

    if (result.error) {
      console.error('恢复订阅失败:', result.error)
      return NextResponse.json(
        { error: `恢复订阅失败: ${result.error.message}` },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('subscription_history')
      .insert({
        user_id: userId,
        plan_id: planId,
        action: 'admin_restore',
        amount: 0,
        payment_method: 'admin_action'
      })

    console.log(`[ADMIN] 成功恢复用户 ${userId} 的 ${planId} 订阅`)

    return NextResponse.json({
      success: true,
      message: `成功恢复用户的 ${planId} 订阅`,
      data: {
        userId,
        planId,
        userEmail: userProfile.email,
        subscription: result.data[0]
      }
    })
  } catch (error: unknown) {
    console.error('恢复订阅API错误:', error)
    const errorMessage = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

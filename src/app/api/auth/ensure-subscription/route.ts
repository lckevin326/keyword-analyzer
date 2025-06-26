import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 确保用户有默认订阅的API端点
export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 检查用户是否已有订阅
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('id, current_credits, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('检查订阅失败:', checkError)
    }

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: '用户已有订阅',
        data: {
          credits: existingSubscription.current_credits,
          plan_id: existingSubscription.plan_id
        }
      })
    }

    // 为用户创建免费版订阅
    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: 'free',
        status: 'active',
        current_credits: 100
      })
      .select('id, current_credits, plan_id')
      .single()

    if (insertError) {
      console.error('创建订阅失败:', insertError)
      throw insertError
    }

    console.log('成功为用户创建默认订阅:', user.id, newSubscription)

    return NextResponse.json({
      success: true,
      message: '成功创建默认订阅',
      data: {
        credits: newSubscription.current_credits,
        plan_id: newSubscription.plan_id
      }
    })

  } catch (error: unknown) {
    console.error('确保用户订阅失败:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '创建订阅失败'
    }, { status: 500 })
  }
}

// 获取用户订阅状态（调试用）
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户订阅信息
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        current_credits,
        created_at,
        membership_plans(plan_name, monthly_credits)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      user_id: user.id,
      subscriptions: subscription || []
    })

  } catch (error: unknown) {
    console.error('获取订阅状态失败:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '获取失败'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

// 获取用户当前订阅信息
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const membershipService = new MembershipService()
    
    // 获取订阅信息
    const subscription = await membershipService.getUserSubscription(user.id)
    
    // 获取积分信息
    const credits = await membershipService.getUserCredits(user.id)
    
    // 获取权限列表
    const permissions = await membershipService.getUserPermissions(user.id)

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        credits,
        permissions
      }
    })

  } catch (error: unknown) {
    console.error('获取订阅信息失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取订阅信息失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}

// 购买会员订阅
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { plan_id, payment_method = 'mock' } = await request.json()

    if (!plan_id) {
      return NextResponse.json({ 
        error: '缺少必要参数：plan_id' 
      }, { status: 400 })
    }

    const membershipService = new MembershipService()
    const result = await membershipService.purchaseSubscription(
      user.id, 
      plan_id, 
      payment_method
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error
      }, { status: 400 })
    }

    // 获取更新后的订阅信息
    const subscription = await membershipService.getUserSubscription(user.id)
    const credits = await membershipService.getUserCredits(user.id)

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        credits,
        message: '会员购买成功'
      }
    })

  } catch (error: unknown) {
    console.error('购买会员失败:', error)
    
    // 提供更详细的错误信息用于调试
    const errorMessage = error instanceof Error ? error.message : '购买失败，请重试'
    
    return NextResponse.json({
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

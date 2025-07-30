import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MembershipService } from '@/lib/membership'

export async function GET() {
  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      )
    }

    const membershipService = new MembershipService()

    // 并行获取所有用户数据
    const [creditsResult, subscriptionResult, permissionsResult] = await Promise.allSettled([
      membershipService.getUserCredits(user.id),
      membershipService.getUserSubscription(user.id),
      membershipService.getUserPermissions(user.id)
    ])

    // 处理结果
    const credits = creditsResult.status === 'fulfilled' ? creditsResult.value : null
    const subscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null
    const permissions = permissionsResult.status === 'fulfilled' ? permissionsResult.value : null

    // 如果所有主要数据都失败了，返回错误
    if (!credits && !subscription) {
      return NextResponse.json(
        { error: '获取用户数据失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        credits: credits || {
          current_balance: 0,
          total_earned: 0,
          total_purchased: 0,
          total_used: 0
        },
        subscription: subscription || {
          plan_name: '免费版',
          status: 'active',
          current_period_end: null,
          monthly_credits: 100
        },
        permissions: permissions || {}
      }
    })
  } catch (error: unknown) {
    console.error('获取用户状态失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取用户状态失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}


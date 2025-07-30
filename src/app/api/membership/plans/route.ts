import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    
    const membershipService = new MembershipService()
    const plans = await membershipService.getMembershipPlans()

    return NextResponse.json({
      success: true,
      data: plans
    })

  } catch (error: unknown) {
    console.error('获取会员方案失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取会员方案失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}


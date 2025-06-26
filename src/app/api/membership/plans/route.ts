import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份（可选，计划信息可以公开）
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const membershipService = new MembershipService()
    const plans = await membershipService.getMembershipPlans()

    return NextResponse.json({
      success: true,
      data: plans
    })

  } catch (error: any) {
    console.error('获取会员方案失败:', error)
    return NextResponse.json({
      error: error.message || '获取会员方案失败'
    }, { status: 500 })
  }
}
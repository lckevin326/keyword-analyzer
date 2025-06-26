import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

// 检查用户功能权限
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: true,
        data: {
          has_permission: false,
          reason: 'not_logged_in',
          credits_required: 0,
          daily_limit: 0,
          daily_used: 0
        }
      })
    }

    const { feature_code } = await request.json()

    if (!feature_code) {
      return NextResponse.json({ 
        error: '缺少必要参数：feature_code' 
      }, { status: 400 })
    }

    const membershipService = new MembershipService()
    const permission = await membershipService.checkFeaturePermission(user.id, feature_code)

    return NextResponse.json({
      success: true,
      data: permission
    })

  } catch (error: any) {
    console.error('检查权限失败:', error)
    return NextResponse.json({
      error: error.message || '检查权限失败'
    }, { status: 500 })
  }
}
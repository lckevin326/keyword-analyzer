import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService, type FeaturePermission } from '@/lib/membership'

// 获取功能列表和用户权限
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const membershipService = new MembershipService()
    
    // 获取所有功能列表
    const features = await membershipService.getFeatures()
    
    let userPermissions: FeaturePermission[] = []
    if (user) {
      // 获取用户权限
      userPermissions = await membershipService.getUserPermissions(user.id)
    }

    // 组合功能信息和权限信息
    const featuresWithPermissions = features.map(feature => {
      const permission = userPermissions.find(p => p.feature_code === feature.feature_code)
      return {
        ...feature,
        permission: permission || {
          is_enabled: false,
          daily_limit: 0,
          credits_required: feature.credits_cost
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        features: featuresWithPermissions,
        user_logged_in: !!user
      }
    })

  } catch (error: any) {
    console.error('获取功能信息失败:', error)
    return NextResponse.json({
      error: error.message || '获取功能信息失败'
    }, { status: 500 })
  }
}
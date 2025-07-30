import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'

// 获取用户使用统计
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const membershipService = new MembershipService()
    
    // 获取使用统计
    const stats = await membershipService.getUserUsageStats(user.id, days)
    
    // 获取积分变动记录
    const transactions = await membershipService.getCreditTransactions(user.id, 50)

    // 汇总统计数据
    const summary = stats.reduce((acc, stat) => {
      if (!acc[stat.feature_code]) {
        acc[stat.feature_code] = {
          feature_code: stat.feature_code,
          feature_name: stat.feature_name,
          category: stat.category,
          total_usage: 0,
          total_credits: 0,
          total_cost: 0
        }
      }
      acc[stat.feature_code].total_usage += stat.usage_count
      acc[stat.feature_code].total_credits += stat.total_credits_used
      acc[stat.feature_code].total_cost += parseFloat(stat.total_api_cost || '0')
      return acc
    }, {} as any)

    return NextResponse.json({
      success: true,
      data: {
        daily_stats: stats,
        summary: Object.values(summary),
        transactions,
        period_days: days
      }
    })

  } catch (error: unknown) {
    console.error('获取使用统计失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取使用统计失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}

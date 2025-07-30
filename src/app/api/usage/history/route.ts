import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuthOnly } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  return withAuthOnly(
    request,
    async (user, membershipService) => {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const filter = url.searchParams.get('filter') || 'all'
      
      // 获取积分使用历史
      const supabase = membershipService.supabase
      let query = supabase
        .from('credit_usage_logs')
        .select(`
          id,
          feature_code,
          credits_used,
          remaining_credits,
          description,
          created_at,
          feature_permissions!inner(feature_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // 应用过滤器
      if (filter !== 'all') {
        query = query.eq('feature_code', filter)
      }
      
      // 分页
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
      
      const { data: usageHistory, error, count } = await query
      
      if (error) {
        throw new Error('获取使用历史失败')
      }
      
      // 格式化数据
      const formattedHistory = usageHistory?.map(item => ({
        id: item.id,
        feature_code: item.feature_code,
        feature_name: (item.feature_permissions as any)?.feature_name || item.feature_code,
        credits_used: item.credits_used,
        remaining_credits: item.remaining_credits,
        description: item.description,
        created_at: item.created_at
      })) || []
      
      const totalPages = Math.ceil((count || 0) / limit)
      
      return {
        success: true,
        data: {
          usage_history: formattedHistory,
          current_page: page,
          total_pages: totalPages,
          total_records: count || 0
        }
      }
    }
  )
}


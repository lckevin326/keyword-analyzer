import { NextRequest, NextResponse } from 'next/server'
import { withAuthOnly } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  return withAuthOnly(
    request,
    async (user, membershipService) => {
      const supabase = membershipService.supabase
      
      // 获取当前积分余额
      const subscription = await membershipService.getUserSubscription(user.id)
      
      // 获取本月使用量
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { data: monthlyUsage, error: monthlyError } = await supabase
        .from('credit_usage_logs')
        .select('credits_used')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
      
      if (monthlyError) {
        throw new Error('获取月度使用量失败')
      }
      
      const totalUsedThisMonth = monthlyUsage?.reduce((sum, log) => sum + log.credits_used, 0) || 0
      
      // 获取累计使用量
      const { data: allUsage, error: allError } = await supabase
        .from('credit_usage_logs')
        .select('credits_used')
        .eq('user_id', user.id)
      
      if (allError) {
        throw new Error('获取累计使用量失败')
      }
      
      const totalUsedAllTime = allUsage?.reduce((sum, log) => sum + log.credits_used, 0) || 0
      
      // 获取功能使用分布
      const { data: featureUsage, error: featureError } = await supabase
        .from('credit_usage_logs')
        .select(`
          feature_code,
          credits_used,
          feature_permissions!inner(feature_name)
        `)
        .eq('user_id', user.id)
      
      if (featureError) {
        throw new Error('获取功能使用分布失败')
      }
      
      // 统计各功能使用量
      const usageByFeature: { [key: string]: number } = {}
      let mostUsedFeature = ''
      let maxUsage = 0
      
      featureUsage?.forEach(item => {
        const featureName = (item.feature_permissions as any)?.feature_name || item.feature_code
        usageByFeature[featureName] = (usageByFeature[featureName] || 0) + item.credits_used
        
        if (usageByFeature[featureName] > maxUsage) {
          maxUsage = usageByFeature[featureName]
          mostUsedFeature = featureName
        }
      })
      
      return {
        success: true,
        data: {
          current_credits: (subscription as any)?.current_credits || 0,
          total_used_this_month: totalUsedThisMonth,
          total_used_all_time: totalUsedAllTime,
          most_used_feature: mostUsedFeature,
          usage_by_feature: usageByFeature
        }
      }
    }
  )
}
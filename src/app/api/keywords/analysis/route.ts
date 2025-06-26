import { NextRequest } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'keyword_analysis', requireAuth: true },
    async (user, permission, membershipService, requestData) => {
      // 解析请求数据（已经由中间件解析）
      const { keyword, location = 'China' } = requestData
    
      if (!keyword) {
        throw new Error('缺少必要参数：keyword')
      }

      // 检查环境变量
      const dataApiLogin = process.env.DATAFORSEO_LOGIN
      const dataApiPassword = process.env.DATAFORSEO_PASSWORD
      
      if (!dataApiLogin || !dataApiPassword) {
        throw new Error('数据源 API 配置错误，请联系管理员')
      }

      // 初始化数据服务
      const dataForSEOService = new DataForSEOService({
        login: dataApiLogin,
        password: dataApiPassword
      })

      // 调用 API 获取关键词深度分析
      const analysis = await dataForSEOService.getKeywordDetailAnalysis(keyword, location)

      // 保存分析结果到数据库
      const supabase = membershipService.supabase
      const { error: insertError } = await supabase
        .from('keyword_analysis')
        .insert({
          user_id: user.id,
          keyword: analysis.keyword,
          search_volume: analysis.search_volume,
          competition_score: analysis.competition_score,
          cpc: analysis.cpc,
          difficulty_score: analysis.difficulty_score,
          monthly_trends: analysis.monthly_trends,
          serp_data: analysis.serp_results,
          people_also_ask: analysis.people_also_ask,
          commercial_intent: analysis.commercial_intent,
          seasonality_data: analysis.seasonality_data
        })

      if (insertError) {
        console.error('保存关键词分析失败:', insertError)
      }

      // 同时保存到搜索历史
      await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          search_type: 'keyword_analysis',
          query: `关键词分析: ${keyword} (${location})`,
          results: analysis
        })

      return { 
        success: true, 
        data: analysis,
        message: `成功完成关键词 "${keyword}" 的详细分析，消耗 ${permission.credits_required} 积分`
      }
    }
  )
}
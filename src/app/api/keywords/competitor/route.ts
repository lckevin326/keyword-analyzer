import { NextRequest } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'competitor_analysis', requireAuth: true },
    async (user, permission, membershipService, requestData) => {
      // 解析请求数据（已经由中间件解析）
      const { domain, location = 'China' } = requestData
      
      if (!domain) {
        throw new Error('缺少必要参数：domain')
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

      // 调用 API 获取竞争对手关键词
      const keywords = await dataForSEOService.getKeywordsByCompetitor(domain, location)

      // 保存搜索记录到数据库
      const supabase = membershipService.supabase
      const { error: insertError } = await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          search_type: 'competitor',
          query: `竞争对手: ${domain} (${location})`,
          results: keywords
        })

      if (insertError) {
        console.error('保存搜索记录失败:', insertError)
      }

      return { 
        success: true, 
        data: keywords,
        message: `成功获取 ${keywords.length} 个相关关键词，消耗 ${permission.credits_required} 积分`
      }
    }
  )
}

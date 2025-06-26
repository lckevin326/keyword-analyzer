import { NextRequest } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'gap_analysis', requireAuth: true },
    async (user, permission, membershipService, requestData) => {
      // 解析请求数据（已经由中间件解析）
      const { 
        projectName,
        ownDomain, 
        competitorDomains, 
        location = 'China' 
      } = requestData
    
      if (!projectName || !ownDomain || !competitorDomains || competitorDomains.length === 0) {
        throw new Error('缺少必要参数：projectName, ownDomain, competitorDomains')
      }

      if (competitorDomains.length > 3) {
        throw new Error('最多支持分析3个竞争对手域名')
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

      // 调用 API 获取竞争对手差距分析
      const analysis = await dataForSEOService.getCompetitorGapAnalysis(
        ownDomain, 
        competitorDomains, 
        location
      )

      // 保存分析结果到数据库
      const supabase = membershipService.supabase
      const { error: insertError } = await supabase
        .from('competitor_analysis')
        .insert({
          user_id: user.id,
          project_name: projectName,
          own_domain: ownDomain,
          competitor_domains: competitorDomains,
          shared_keywords: analysis.shared_keywords,
          advantage_keywords: analysis.advantage_keywords,
          opportunity_keywords: analysis.opportunity_keywords
        })

      if (insertError) {
        console.error('保存竞争对手分析失败:', insertError)
      }

      // 同时保存到搜索历史
      await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          search_type: 'gap_analysis',
          query: `差距分析: ${ownDomain} vs [${competitorDomains.join(', ')}] (${location})`,
          results: analysis
        })

      return { 
        success: true, 
        data: analysis,
        message: `成功完成 "${projectName}" 的竞争对手差距分析，消耗 ${permission.credits_required} 积分`
      }
    }
  )
}
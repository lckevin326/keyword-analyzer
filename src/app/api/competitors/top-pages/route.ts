import { NextRequest, NextResponse } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'page_analysis', requireAuth: true },
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

      // 调用 API 获取高流量页面分析
      const analysis = await dataForSEOService.getTopPagesAnalysis(domain, location)

      // 保存分析结果到数据库
      const supabase = membershipService.supabase
      const { error: insertError } = await supabase
        .from('top_pages_analysis')
        .insert({
          user_id: user.id,
          target_domain: domain,
          pages_data: analysis.pages,
          total_pages: analysis.pages.length
        })

      if (insertError) {
        console.error('保存高流量页面分析失败:', insertError)
      }

      // 同时保存到搜索历史
      await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          search_type: 'top_pages',
          query: `高流量页面分析: ${domain} (${location})`,
          results: analysis
        })

      return { 
        success: true, 
        data: analysis,
        message: `成功分析域名 "${domain}" 的高流量页面，共 ${analysis.pages.length} 个页面，消耗 ${permission.credits_required} 积分`
      }
    }
  )
}
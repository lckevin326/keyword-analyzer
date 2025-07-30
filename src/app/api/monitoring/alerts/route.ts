import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 解析请求数据
    const { 
      trackingKeywords = [],
      competitorDomains = [],
      industryKeywords = [],
      location = 'China' 
    } = await request.json()

    // 检查环境变量
    const dataApiLogin = process.env.DATAFORSEO_LOGIN
    const dataApiPassword = process.env.DATAFORSEO_PASSWORD
    
    if (!dataApiLogin || !dataApiPassword) {
      return NextResponse.json({ 
        error: '数据源 API 配置错误，请联系管理员' 
      }, { status: 500 })
    }

    // 初始化数据服务
    const dataForSEOService = new DataForSEOService({
      login: dataApiLogin,
      password: dataApiPassword
    })

    // 获取市场动态监控数据
    const monitoring = await dataForSEOService.getMarketMonitoring(
      trackingKeywords,
      competitorDomains,
      industryKeywords,
      location
    )

    return NextResponse.json({ 
      success: true, 
      data: monitoring,
      message: `检测到 ${monitoring.total_alerts} 个市场动态变化`
    })

  } catch (error: unknown) {
    console.error('获取监控警报失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取监控警报失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}

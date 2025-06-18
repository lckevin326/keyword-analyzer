import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DataForSEOService from '@/lib/dataforseo'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 解析请求数据
    const { industry, location = 'China' } = await request.json()
    
    if (!industry) {
      return NextResponse.json({ error: '缺少必要参数：industry' }, { status: 400 })
    }

    // 检查环境变量
    const dataForSEOLogin = process.env.DATAFORSEO_LOGIN
    const dataForSEOPassword = process.env.DATAFORSEO_PASSWORD
    
    if (!dataForSEOLogin || !dataForSEOPassword) {
      return NextResponse.json({ 
        error: 'DataForSEO API 配置错误，请联系管理员' 
      }, { status: 500 })
    }

    // 初始化 DataForSEO 服务
    const dataForSEOService = new DataForSEOService({
      login: dataForSEOLogin,
      password: dataForSEOPassword
    })

    // 调用 API 获取行业关键词
    const keywords = await dataForSEOService.getKeywordsByIndustry(industry, location)

    // 保存搜索记录到数据库
    const { error: insertError } = await supabase
      .from('keyword_searches')
      .insert({
        user_id: user.id,
        search_type: 'competitor',
        query: `行业: ${industry} (${location})`,
        results: keywords
      })

    if (insertError) {
      console.error('保存搜索记录失败:', insertError)
    }

    return NextResponse.json({ 
      success: true, 
      data: keywords,
      message: `成功获取 ${keywords.length} 个相关关键词`
    })

  } catch (error: any) {
    console.error('行业关键词分析失败:', error)
    
    return NextResponse.json({ 
      error: error.message || '分析失败，请重试' 
    }, { status: 500 })
  }
}
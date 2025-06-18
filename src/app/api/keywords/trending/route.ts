import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DataForSEOService from '@/lib/dataforseo'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || 'China'

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

    // 调用 API 获取热门关键词
    const trendingKeywords = await dataForSEOService.getTrendingKeywords(location)

    // 保存搜索记录到数据库
    const { error: insertError } = await supabase
      .from('keyword_searches')
      .insert({
        user_id: user.id,
        search_type: 'trending',
        query: `热门趋势 - ${location}`,
        results: trendingKeywords
      })

    if (insertError) {
      console.error('保存搜索记录失败:', insertError)
    }

    return NextResponse.json({ 
      success: true, 
      data: trendingKeywords,
      message: `成功获取 ${trendingKeywords.length} 个热门关键词`
    })

  } catch (error: any) {
    console.error('获取热门关键词失败:', error)
    
    return NextResponse.json({ 
      error: error.message || '获取失败，请重试' 
    }, { status: 500 })
  }
}
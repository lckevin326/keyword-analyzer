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
    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ error: '缺少必要参数：projectId' }, { status: 400 })
    }

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('keyword_tracking')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在或无权限访问' }, { status: 404 })
    }

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

    // 查询关键词排名
    const results = await dataForSEOService.checkKeywordRankings(
      project.domain,
      project.keywords,
      project.location
    )

    // 统计数据
    const totalKeywords = results.length
    const top10Count = results.filter(r => r.position && r.position <= 10).length
    const top100Count = results.filter(r => r.found_in_top_100).length

    // 保存排名记录
    const rankingRecords = results.map(result => ({
      tracking_id: projectId,
      keyword: result.keyword,
      position: result.position,
      url: result.url,
      check_date: new Date().toISOString().split('T')[0]
    }))

    // 批量插入排名记录
    const { error: insertError } = await supabase
      .from('keyword_rankings')
      .insert(rankingRecords)

    if (insertError) {
      console.error('保存排名记录失败:', insertError)
    }

    // 更新项目的最后检查时间
    await supabase
      .from('keyword_tracking')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    const response = {
      project: {
        id: project.id,
        name: project.project_name,
        domain: project.domain,
        keywords: project.keywords,
        location: project.location,
        created_at: project.created_at,
        last_checked: new Date().toISOString()
      },
      results,
      check_date: new Date().toISOString(),
      total_keywords: totalKeywords,
      top_10_count: top10Count,
      top_100_count: top100Count
    }

    return NextResponse.json({ 
      success: true, 
      data: response,
      message: `成功查询 ${totalKeywords} 个关键词排名，其中 ${top10Count} 个在前10位`
    })

  } catch (error: any) {
    console.error('关键词排名查询失败:', error)
    
    return NextResponse.json({ 
      error: error.message || '查询失败，请重试' 
    }, { status: 500 })
  }
}
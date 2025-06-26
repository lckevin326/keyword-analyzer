import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取用户的排名项目列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户的排名项目
    const { data: projects, error } = await supabase
      .from('keyword_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取排名项目失败:', error)
      return NextResponse.json({ error: '获取项目失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: projects || [],
      message: `获取到 ${projects?.length || 0} 个排名项目`
    })

  } catch (error: any) {
    console.error('获取排名项目失败:', error)
    return NextResponse.json({ 
      error: error.message || '获取失败，请重试' 
    }, { status: 500 })
  }
}

// 创建新的排名项目
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
      projectName,
      domain, 
      keywords, 
      location = 'China' 
    } = await request.json()
    
    if (!projectName || !domain || !keywords || keywords.length === 0) {
      return NextResponse.json({ 
        error: '缺少必要参数：projectName, domain, keywords' 
      }, { status: 400 })
    }

    // 验证关键词数量
    if (keywords.length > 50) {
      return NextResponse.json({ 
        error: '关键词数量不能超过50个' 
      }, { status: 400 })
    }

    // 创建排名项目
    const { data: project, error: insertError } = await supabase
      .from('keyword_tracking')
      .insert({
        user_id: user.id,
        project_name: projectName,
        domain: domain,
        keywords: keywords,
        location: location,
        tracking_frequency: 'manual', // 手动查询模式
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('创建排名项目失败:', insertError)
      return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: project,
      message: `成功创建排名项目 "${projectName}"，包含 ${keywords.length} 个关键词`
    })

  } catch (error: any) {
    console.error('创建排名项目失败:', error)
    return NextResponse.json({ 
      error: error.message || '创建失败，请重试' 
    }, { status: 500 })
  }
}
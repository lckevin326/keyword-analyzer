import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'
import DataForSEOService from '@/lib/keyword-data'

export async function POST(request: NextRequest) {
  try {
    // 直接验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    console.log('Direct Top Pages API - User authenticated:', user.id)

    // 解析请求数据
    const { domain, location = 'China' } = await request.json()
    
    if (!domain) {
      return NextResponse.json({ 
        error: '缺少必要参数：domain' 
      }, { status: 400 })
    }

    // 检查用户权限和积分（简化版本）
    const membershipService = new MembershipService()
    const subscription = await membershipService.getUserSubscription(user.id)
    const credits = await membershipService.getUserCredits(user.id)
    
    console.log('Direct Top Pages API - User subscription:', subscription)
    console.log('Direct Top Pages API - User credits:', credits)

    // 专业用户应该有足够的权限和积分（高流量页面分析需要12积分）
    if (subscription?.plan_id === 'pro' && credits.current_balance >= 12) {
      console.log('Direct Top Pages API - Permission granted for pro user')
    } else if (credits.current_balance < 12) {
      return NextResponse.json({ 
        error: '积分余额不足，请充值' 
      }, { status: 403 })
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

    // 调用 API 获取高流量页面分析
    const analysis = await dataForSEOService.getTopPagesAnalysis(domain, location)

    // 扣除积分
    try {
      await membershipService.useFeature(user.id, 'page_analysis', {
        domain,
        location
      })
      console.log('Direct Top Pages API - Credits deducted successfully')
    } catch (creditError) {
      console.error('Direct Top Pages API - Failed to deduct credits:', creditError)
      // 不阻止继续执行，因为内容已经生成了
    }

    // 保存分析结果到数据库
    try {
      const { error: insertError } = await supabase
        .from('top_pages_analysis')
        .insert({
          user_id: user.id,
          target_domain: domain,
          pages_data: analysis.pages,
          total_pages: analysis.pages.length
        })

      if (insertError) {
        console.error('Direct Top Pages API - 保存高流量页面分析失败:', insertError)
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
    } catch (dbError) {
      console.error('Direct Top Pages API - Database error:', dbError)
      // 不阻止返回结果
    }

    return NextResponse.json({ 
      success: true, 
      data: analysis,
      message: `成功分析域名 "${domain}" 的高流量页面，共 ${analysis.pages.length} 个页面，消耗 12 积分`
    })

  } catch (error: unknown) {
    console.error('Direct Top Pages API - Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    }, { status: 500 })
  }
}

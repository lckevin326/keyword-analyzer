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

    console.log('Direct Keyword Search API - User authenticated:', user.id)

    // 解析请求数据
    const { domain, industry, location = 'China' } = await request.json()
    
    // 确定搜索类型
    const searchType = domain ? 'competitor' : 'industry'
    const query = domain || industry
    
    if (!query) {
      return NextResponse.json({ 
        error: '缺少必要参数：domain 或 industry' 
      }, { status: 400 })
    }

    // 检查用户权限和积分（基础搜索功能，消耗较少积分）
    const membershipService = new MembershipService()
    const subscription = await membershipService.getUserSubscription(user.id)
    const credits = await membershipService.getUserCredits(user.id)
    
    console.log('Direct Keyword Search API - User subscription:', subscription)
    console.log('Direct Keyword Search API - User credits:', credits)

    // 基础关键词搜索只需要5积分，对所有会员开放
    const requiredCredits = 5
    if (credits.current_balance < requiredCredits) {
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

    // 根据搜索类型调用不同的API
    let keywords
    if (searchType === 'competitor') {
      keywords = await dataForSEOService.getKeywordsByCompetitor(domain, location)
    } else {
      keywords = await dataForSEOService.getKeywordsByIndustry(industry, location)
    }

    // 扣除积分（使用trending_keywords功能代码，因为它是5积分且对所有用户开放）
    try {
      await membershipService.useFeature(user.id, 'trending_keywords', {
        searchType,
        query,
        location
      })
      console.log('Direct Keyword Search API - Credits deducted successfully')
    } catch (creditError) {
      console.error('Direct Keyword Search API - Failed to deduct credits:', creditError)
      // 不阻止继续执行，因为数据已经获取了
    }

    // 保存搜索记录到数据库
    try {
      const { error: insertError } = await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          search_type: searchType,
          query: searchType === 'competitor' 
            ? `竞争对手: ${domain} (${location})` 
            : `行业: ${industry} (${location})`,
          results: keywords
        })

      if (insertError) {
        console.error('Direct Keyword Search API - 保存搜索记录失败:', insertError)
      }
    } catch (dbError) {
      console.error('Direct Keyword Search API - Database error:', dbError)
      // 不阻止返回结果
    }

    return NextResponse.json({ 
      success: true, 
      data: keywords,
      message: `成功获取 ${keywords.length} 个相关关键词，消耗 ${requiredCredits} 积分`
    })

  } catch (error: unknown) {
    console.error('关键词搜索失败:', error)
    const errorMessage = error instanceof Error ? error.message : '搜索失败，请重试'
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MembershipService } from '@/lib/membership'
import DeepSeekService from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    // 直接验证用户身份
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    console.log('Direct Titles API - User authenticated:', user.id)

    // 解析请求数据
    const { 
      targetKeyword,
      coreAngle
    } = await request.json()
    
    if (!targetKeyword || !coreAngle) {
      return NextResponse.json({ 
        error: '缺少必要参数：targetKeyword, coreAngle' 
      }, { status: 400 })
    }

    // 检查用户权限和积分（简化版本）
    const membershipService = new MembershipService()
    const subscription = await membershipService.getUserSubscription(user.id)
    const credits = await membershipService.getUserCredits(user.id)
    
    console.log('Direct Titles API - User subscription:', subscription)
    console.log('Direct Titles API - User credits:', credits)

    // 专业用户应该有足够的权限和积分（标题生成需要5积分）
    if (subscription?.plan_id === 'pro' && credits.current_balance >= 5) {
      console.log('Direct Titles API - Permission granted for pro user')
    } else if (credits.current_balance < 5) {
      return NextResponse.json({ 
        error: '积分余额不足，请充值' 
      }, { status: 403 })
    }

    // 检查环境变量
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY
    
    if (!deepSeekApiKey) {
      return NextResponse.json({ 
        error: 'DeepSeek API 配置错误，请联系管理员' 
      }, { status: 500 })
    }

    // 初始化 DeepSeek 服务
    const deepSeekService = new DeepSeekService({
      apiKey: deepSeekApiKey
    })

    // 调用 API 生成标题
    const titles = await deepSeekService.generateTitles({
      target_keyword: targetKeyword,
      core_angle: coreAngle
    })

    // 扣除积分
    try {
      await membershipService.useFeature(user.id, 'content_titles', {
        targetKeyword,
        coreAngle
      })
      console.log('Direct Titles API - Credits deducted successfully')
    } catch (creditError) {
      console.error('Direct Titles API - Failed to deduct credits:', creditError)
      // 不阻止继续执行，因为内容已经生成了
    }

    return NextResponse.json({ 
      success: true, 
      data: titles,
      message: `成功为关键词 "${targetKeyword}" 生成 ${titles.titles.length} 个标题创意，消耗 5 积分`
    })

  } catch (error: any) {
    console.error('Direct Titles API - 标题生成失败:', error)
    
    return NextResponse.json({ 
      error: error.message || '生成失败，请重试' 
    }, { status: 500 })
  }
}
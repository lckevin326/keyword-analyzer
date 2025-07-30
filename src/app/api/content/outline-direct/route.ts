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

    console.log('Direct API - User authenticated:', user.id)

    // 解析请求数据
    const { 
      targetKeyword,
      selectedTitle, // 新增：选中的标题
      targetAudience,
      searchIntent,
      commonThemes = [],
      uniqueAngles = [],
      userQuestions = []
    } = await request.json()
    
    if (!targetKeyword || !targetAudience || !searchIntent) {
      return NextResponse.json({ 
        error: '缺少必要参数：targetKeyword, targetAudience, searchIntent' 
      }, { status: 400 })
    }

    // 检查用户权限和积分（简化版本）
    const membershipService = new MembershipService()
    const subscription = await membershipService.getUserSubscription(user.id)
    const credits = await membershipService.getUserCredits(user.id)
    
    console.log('Direct API - User subscription:', subscription)
    console.log('Direct API - User credits:', credits)

    // 专业用户应该有足够的权限和积分
    if (subscription?.plan_id === 'pro' && credits.current_balance >= 8) {
      console.log('Direct API - Permission granted for pro user')
    } else if (credits.current_balance < 8) {
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

    // 调用 API 生成内容大纲
    const outline = await deepSeekService.generateContentOutline({
      target_keyword: targetKeyword,
      selected_title: selectedTitle, // 传递选中的标题
      target_audience: targetAudience,
      search_intent: searchIntent,
      common_themes: commonThemes,
      unique_angles: uniqueAngles,
      user_questions: userQuestions
    })

    // 扣除积分
    try {
      await membershipService.useFeature(user.id, 'content_outline', {
        targetKeyword,
        targetAudience,
        searchIntent
      })
      console.log('Direct API - Credits deducted successfully')
    } catch (creditError) {
      console.error('Direct API - Failed to deduct credits:', creditError)
      // 不阻止继续执行，因为内容已经生成了
    }

    // 保存生成结果到数据库
    try {
      const { error: insertError } = await supabase
        .from('content_ideas')
        .insert({
          user_id: user.id,
          target_keyword: targetKeyword,
          content_type: 'outline',
          target_audience: targetAudience,
          search_intent: searchIntent,
          generated_content: outline,
          prompt_used: `目标关键词: ${targetKeyword}, 目标受众: ${targetAudience}, 搜索意图: ${searchIntent}`,
          ai_model: 'deepseek'
        })

      if (insertError) {
        console.error('Direct API - 保存内容大纲失败:', insertError)
      }
    } catch (dbError) {
      console.error('Direct API - Database error:', dbError)
      // 不阻止返回结果
    }

    return NextResponse.json({ 
      success: true, 
      data: outline,
      message: `成功为关键词 "${targetKeyword}" 生成内容大纲，消耗 8 积分`
    })

  } catch (error: unknown) {
    console.error('Direct API - Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    }, { status: 500 })
  }
}

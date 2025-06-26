import { NextRequest, NextResponse } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DeepSeekService from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'content_outline', requireAuth: true },
    async (user, permission, membershipService, requestData) => {
      console.log('Content outline handler called with:', {
        userId: user.id,
        permission: permission,
        requestData: Object.keys(requestData)
      })
      // 解析请求数据（已经由中间件解析）
      const { 
        targetKeyword,
        targetAudience,
        searchIntent,
        commonThemes = [],
        uniqueAngles = [],
        userQuestions = []
      } = requestData
      
      if (!targetKeyword || !targetAudience || !searchIntent) {
        throw new Error('缺少必要参数：targetKeyword, targetAudience, searchIntent')
      }

      // 检查环境变量
      const deepSeekApiKey = process.env.DEEPSEEK_API_KEY
      
      if (!deepSeekApiKey) {
        throw new Error('DeepSeek API 配置错误，请联系管理员')
      }

      // 初始化 DeepSeek 服务
      const deepSeekService = new DeepSeekService({
        apiKey: deepSeekApiKey
      })

      // 调用 API 生成内容大纲
      const outline = await deepSeekService.generateContentOutline({
        target_keyword: targetKeyword,
        target_audience: targetAudience,
        search_intent: searchIntent,
        common_themes: commonThemes,
        unique_angles: uniqueAngles,
        user_questions: userQuestions
      })

      // 保存生成结果到数据库
      const supabase = membershipService.supabase
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
        console.error('保存内容大纲失败:', insertError)
      }

      return { 
        success: true, 
        data: outline,
        message: `成功为关键词 "${targetKeyword}" 生成内容大纲，消耗 ${permission.credits_required} 积分`
      }
    }
  )
}
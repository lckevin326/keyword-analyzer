import { NextRequest } from 'next/server'
import { withFeatureUsage } from '@/lib/permission-middleware'
import DeepSeekService from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  return withFeatureUsage(
    request,
    { featureCode: 'content_titles', requireAuth: true },
    async (user, permission, membershipService, requestData) => {
      // 解析请求数据（已经由中间件解析）
      const { 
        targetKeyword,
        coreAngle
      } = requestData
      
      if (!targetKeyword || !coreAngle) {
        throw new Error('缺少必要参数：targetKeyword, coreAngle')
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

      // 调用 API 生成标题
      const titles = await deepSeekService.generateTitles({
        target_keyword: targetKeyword,
        core_angle: coreAngle
      })

      // 扣除积分并记录使用情况（由权限中间件自动处理）

      return { 
        success: true, 
        data: titles,
        message: `成功为关键词 "${targetKeyword}" 生成 ${titles.titles.length} 个标题创意`
      }
    }
  )
}
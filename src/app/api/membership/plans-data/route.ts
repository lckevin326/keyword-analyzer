import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MembershipService } from '@/lib/membership'

// 缓存方案数据，因为基本不会变化
let cachedPlansData: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

const plans: Record<string, {
  id: string
  name: string
  price: number
  features: string[]
  credits: number
  popular?: boolean
}> = {
  free: {
    id: 'free',
    name: '免费版',
    price: 0,
    features: [
      '每月100积分',
      '基础关键词搜索',
      '竞争对手分析（限制）',
      '基本报告导出',
      '邮件支持'
    ],
    credits: 100,
    popular: false
  },
  basic: {
    id: 'basic',
    name: '基础版',
    price: 99,
    features: [
      '每月500积分',
      '完整关键词分析',
      '深度竞争对手研究',
      '趋势监控（基础）',
      '多格式报告导出',
      '优先邮件支持',
      'API访问（限制）'
    ],
    credits: 500,
    popular: true
  },
  professional: {
    id: 'professional',
    name: '专业版',
    price: 299,
    features: [
      '每月2000积分',
      '高级关键词挖掘',
      '完整竞争分析套件',
      '实时趋势监控',
      '自定义报告模板',
      '团队协作功能',
      '完整API访问',
      '在线客服支持'
    ],
    credits: 2000,
    popular: false
  },
  enterprise: {
    id: 'enterprise',
    name: '企业版',
    price: 599,
    features: [
      '每月5000积分',
      '企业级数据分析',
      '白标解决方案',
      '自定义集成',
      '专属客户经理',
      '无限API调用',
      '优先技术支持',
      '数据安全保障',
      '定制化培训'
    ],
    credits: 5000,
    popular: false
  }
}

export async function GET() {
  try {
    // 检查缓存
    if (cachedPlansData && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedPlansData
      })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    let userSubscription = null
    let userCredits = null

    if (user) {
      const membershipService = new MembershipService()
      
      // 并行获取用户数据
      const [subscriptionResult, creditsResult] = await Promise.allSettled([
        membershipService.getUserSubscription(user.id),
        membershipService.getUserCredits(user.id)
      ])

      userSubscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null
      userCredits = creditsResult.status === 'fulfilled' ? creditsResult.value : null
    }

    const responseData = {
      plans: Object.values(plans),
      userSubscription: userSubscription || {
        plan_name: '免费版',
        status: 'active',
        current_period_end: null,
        monthly_credits: 100
      },
      userCredits: userCredits || {
        current_balance: 0,
        total_earned: 0,
        total_purchased: 0,
        total_used: 0
      },
      isAuthenticated: !!user
    }

    // 更新缓存（仅缓存方案数据部分）
    cachedPlansData = responseData
    cacheTimestamp = Date.now()

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error: unknown) {
    console.error('获取会员方案数据失败:', error)
    const errorMessage = error instanceof Error ? error.message : '获取会员方案数据失败'
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}




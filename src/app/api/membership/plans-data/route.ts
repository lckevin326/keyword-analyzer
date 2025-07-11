import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MembershipService } from '@/lib/membership'

// 缓存方案数据，因为基本不会变化
let cachedPlansData: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

const MEMBERSHIP_PLANS = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: 'month',
    description: '适合个人用户入门体验',
    credits: 100,
    features: [
      '每月100积分',
      '基础关键词搜索',
      '竞争对手分析（限制）',
      '基本报告导出',
      '邮件支持'
    ],
    limitations: [
      '每日查询限制：10次',
      '历史数据保留：7天',
      '导出格式：CSV'
    ],
    isPopular: false,
    isRecommended: false
  },
  {
    id: 'basic',
    name: '基础版',
    price: 99,
    period: 'month',
    description: '适合小型企业和个人专业用户',
    credits: 500,
    features: [
      '每月500积分',
      '完整关键词分析',
      '深度竞争对手研究',
      '趋势监控（基础）',
      '多格式报告导出',
      '优先邮件支持',
      'API访问（限制）'
    ],
    limitations: [
      '每日查询限制：50次',
      '历史数据保留：30天',
      '同时监控项目：3个'
    ],
    isPopular: true,
    isRecommended: false
  },
  {
    id: 'professional',
    name: '专业版',
    price: 299,
    period: 'month',
    description: '适合中型企业和营销团队',
    credits: 2000,
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
    limitations: [
      '每日查询限制：200次',
      '历史数据保留：90天',
      '同时监控项目：10个',
      '团队成员：5人'
    ],
    isPopular: false,
    isRecommended: true
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 599,
    period: 'month',
    description: '适合大型企业和代理机构',
    credits: 5000,
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
    limitations: [
      '无查询限制',
      '历史数据永久保留',
      '无限监控项目',
      '无限团队成员'
    ],
    isPopular: false,
    isRecommended: false
  }
]

export async function GET(request: NextRequest) {
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
      plans: MEMBERSHIP_PLANS,
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
  } catch (error: any) {
    console.error('获取方案数据失败:', error)
    
    // 如果有缓存的方案数据，在出错时也返回
    if (cachedPlansData) {
      return NextResponse.json({
        success: true,
        data: cachedPlansData,
        fromCache: true
      })
    }

    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
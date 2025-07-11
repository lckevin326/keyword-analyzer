import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MembershipService } from '@/lib/membership'

// 积分套餐数据
const CREDIT_PACKAGES = [
  {
    id: 'small',
    name: '入门包',
    credits: 500,
    price: 49,
    bonus: 0,
    description: '适合偶尔使用的个人用户',
    isPopular: false,
    pricePerCredit: 0.098
  },
  {
    id: 'medium',
    name: '标准包',
    credits: 1200,
    price: 99,
    bonus: 200,
    description: '适合中等使用频率的用户',
    isPopular: true,
    pricePerCredit: 0.0825
  },
  {
    id: 'large',
    name: '超值包',
    credits: 2500,
    price: 179,
    bonus: 500,
    description: '适合重度使用的专业用户',
    isPopular: false,
    pricePerCredit: 0.0716
  },
  {
    id: 'enterprise',
    name: '企业包',
    credits: 5000,
    price: 299,
    bonus: 1000,
    description: '适合企业和团队用户',
    isPopular: false,
    pricePerCredit: 0.0598
  }
]

export async function GET(request: NextRequest) {
  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      )
    }

    const membershipService = new MembershipService()

    // 快速获取用户当前积分
    const creditsResult = await membershipService.getUserCredits(user.id).catch(() => null)

    return NextResponse.json({
      success: true,
      data: {
        packages: CREDIT_PACKAGES,
        userCredits: creditsResult || {
          current_balance: 0,
          total_earned: 0,
          total_purchased: 0,
          total_used: 0
        }
      }
    })
  } catch (error: any) {
    console.error('获取积分购买数据失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // 只查询当前积分余额，不做复杂计算
    const { data: subscription, error: subError } = await supabase
      .from('user_memberships')
      .select('current_credits')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      // 如果没有找到订阅，返回默认积分
      return NextResponse.json({
        success: true,
        data: {
          current_credits: 100 // 默认免费用户积分
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        current_credits: subscription.current_credits || 0
      }
    })
  } catch (error: any) {
    console.error('快速获取积分失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
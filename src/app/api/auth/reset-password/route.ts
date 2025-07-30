import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!password) {
    return NextResponse.json(
      { error: '密码不能为空' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: '密码长度至少为6位' },
      { status: 400 }
    )
  }

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

    // 检查当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: '无效的会话，请重新申请密码重置' },
        { status: 401 }
      )
    }

    // 更新用户密码
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: '密码更新成功',
      success: true
    })
  } catch (error: unknown) {
    console.error('重置密码失败:', error)
    const errorMessage = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

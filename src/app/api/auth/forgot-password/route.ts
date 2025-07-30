import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json(
      { error: '邮箱地址不能为空' },
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: '密码重置邮件已发送',
      success: true
    })
  } catch (error: unknown) {
    console.error('发送重置密码邮件失败:', error)
    const errorMessage = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

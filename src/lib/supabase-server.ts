import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './supabase'
import { NextRequest } from 'next/server'

export const createServerSupabaseClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// 为API路由创建专门的Supabase客户端，可以处理Authorization header
export const createServerSupabaseClientForAPI = (request?: NextRequest) => {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Handle server component context
          }
        },
      },
    }
  )

  // 如果有请求对象，尝试从Authorization header中提取access token
  if (request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7)
      // 设置访问令牌到Supabase客户端
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // API调用不需要refresh token
      } as any)
    }
  }

  return supabase
}
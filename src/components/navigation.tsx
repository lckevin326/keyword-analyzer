'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Search, TrendingUp, Menu, X, User, LogOut } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 获取当前用户
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name
        })
      }
    }
    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata.full_name
          })
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">关键词分析师</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  仪表板
                </Link>
                <Link 
                  href="/search" 
                  className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>关键词搜索</span>
                </Link>
                <Link 
                  href="/trending" 
                  className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>热门趋势</span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.full_name || user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">注册</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    仪表板
                  </Link>
                  <Link
                    href="/search"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    关键词搜索
                  </Link>
                  <Link
                    href="/trending"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    热门趋势
                  </Link>
                  <div className="border-t pt-2">
                    <div className="px-3 py-2 text-sm text-foreground/60">
                      {user.full_name || user.email}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3"
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      退出登录
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      登录
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                      注册
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
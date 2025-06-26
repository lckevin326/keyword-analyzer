'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import CreditDisplay from '@/components/credit-display'
import MembershipStatus from '@/components/membership-status'
import { Search, TrendingUp, Menu, X, User, Target, PenTool, History, Crown, CreditCard } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
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
          <div className="hidden md:flex items-center space-x-6">
            {mounted && user && (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  仪表板
                </Link>
                
                {/* 关键词研究中心 */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors">
                    <Search className="h-4 w-4" />
                    <span>关键词研究</span>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-56 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <Link href="/search" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        基础关键词搜索
                      </Link>
                      <Link href="/analysis" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        关键词深度分析
                      </Link>
                      <Link href="/trending" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        热门趋势监控
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 市场竞争分析 */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors">
                    <Target className="h-4 w-4" />
                    <span>竞争分析</span>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-56 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <Link href="/gap-analysis" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        关键词差距分析
                      </Link>
                      <Link href="/top-pages" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        高流量页面分析
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 内容创作助手 */}
                <Link 
                  href="/content-assistant" 
                  className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <PenTool className="h-4 w-4" />
                  <span>内容助手</span>
                </Link>

                {/* 搜索历史 */}
                <Link 
                  href="/history" 
                  className="flex items-center space-x-1 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <History className="h-4 w-4" />
                  <span>历史</span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {mounted && user ? (
              <div className="flex items-center space-x-3">
                {/* Membership Status with integrated actions */}
                <MembershipStatus />
                
                {/* Credits Display with integrated actions */}
                <CreditDisplay />
                
                {/* User Info and Logout */}
                <div className="relative group">
                  <div className="flex items-center space-x-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-muted">
                    <User className="h-4 w-4" />
                    <span>{user.full_name || user.email}</span>
                  </div>
                  <div className="absolute top-full right-0 mt-1 w-64 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <Link href="/membership/permissions" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        权限管理
                      </Link>
                      <Link href="/usage/stats" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">
                        使用统计
                      </Link>
                      <div className="border-t my-1"></div>
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md text-red-600"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : mounted ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">注册</Link>
                </Button>
              </div>
            ) : null}
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
        {mounted && isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {user ? (
                <>
                  {/* Mobile Status Display */}
                  <div className="px-3 py-3 border-b border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <MembershipStatus />
                      <CreditDisplay />
                    </div>
                  </div>
                  
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    仪表板
                  </Link>
                  
                  {/* 关键词研究中心 */}
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">关键词研究</div>
                    <div className="ml-3 space-y-1">
                      <Link
                        href="/search"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        基础关键词搜索
                      </Link>
                      <Link
                        href="/analysis"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        关键词深度分析
                      </Link>
                      <Link
                        href="/trending"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        热门趋势监控
                      </Link>
                    </div>
                  </div>

                  {/* 市场竞争分析 */}
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">竞争分析</div>
                    <div className="ml-3 space-y-1">
                      <Link
                        href="/gap-analysis"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        关键词差距分析
                      </Link>
                      <Link
                        href="/top-pages"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        高流量页面分析
                      </Link>
                    </div>
                  </div>

                  <Link
                    href="/content-assistant"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    内容创作助手
                  </Link>
                  
                  <Link
                    href="/history"
                    className="block px-3 py-2 text-base font-medium text-foreground/60 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    搜索历史
                  </Link>

                  {/* 会员管理 */}
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">会员中心</div>
                    <div className="ml-3 space-y-1">
                      <Link
                        href="/membership/plans"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        会员方案
                      </Link>
                      <Link
                        href="/credits/purchase"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        购买积分
                      </Link>
                      <Link
                        href="/membership/permissions"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        权限管理
                      </Link>
                      <Link
                        href="/usage/stats"
                        className="block px-2 py-1 text-sm text-foreground/60 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        使用统计
                      </Link>
                    </div>
                  </div>

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
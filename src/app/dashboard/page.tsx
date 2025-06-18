'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Search, TrendingUp, BarChart3, Plus, History, Target } from 'lucide-react'

interface SearchHistory {
  id: string
  search_type: 'competitor' | 'trending'
  query: string
  created_at: string
  results: any
}

interface User {
  id: string
  email: string
  full_name?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 获取当前用户
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata.full_name
          })

          // 获取最近的搜索历史
          const { data: searches, error } = await supabase
            .from('keyword_searches')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

          if (!error && searches) {
            setRecentSearches(searches)
          }
        }
      } catch (error) {
        console.error('加载仪表板数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            欢迎回来，{user?.full_name || user?.email}！
          </h1>
          <p className="text-muted-foreground">
            开始您的关键词分析，发现新的市场机会
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/search">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">竞争对手分析</CardTitle>
                  <CardDescription>
                    分析对标产品和行业关键词
                  </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/trending">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">热门趋势</CardTitle>
                  <CardDescription>
                    查看最近一周的热门关键词
                  </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/history">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">搜索历史</CardTitle>
                  <CardDescription>
                    查看您的所有搜索记录
                  </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                总搜索次数
              </CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentSearches.length}</div>
              <p className="text-xs text-muted-foreground">
                本月累计搜索
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                竞争对手分析
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentSearches.filter(s => s.search_type === 'competitor').length}
              </div>
              <p className="text-xs text-muted-foreground">
                已完成分析
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                趋势分析
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentSearches.filter(s => s.search_type === 'trending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                趋势查询次数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Searches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最近搜索</CardTitle>
                <CardDescription>
                  您最近的关键词分析记录
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/history">
                  查看全部
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentSearches.length > 0 ? (
              <div className="space-y-4">
                {recentSearches.map((search) => (
                  <div key={search.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {search.search_type === 'competitor' ? (
                          <Target className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{search.query}</div>
                        <div className="text-sm text-muted-foreground">
                          {search.search_type === 'competitor' ? '竞争对手分析' : '趋势分析'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(search.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">还没有搜索记录</h3>
                <p className="text-muted-foreground mb-4">
                  开始您的第一次关键词分析
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link href="/search">
                      <Plus className="h-4 w-4 mr-2" />
                      开始分析
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
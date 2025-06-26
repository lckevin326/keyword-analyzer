'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { History, Search, Target, TrendingUp, Filter, Calendar, Trash2 } from 'lucide-react'

interface SearchHistory {
  id: string
  search_type: 'competitor' | 'trending'
  query: string
  created_at: string
  results: any
}

export default function HistoryPage() {
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [filteredSearches, setFilteredSearches] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'competitor' | 'trending'>('all')

  useEffect(() => {
    loadSearchHistory()
  }, [])

  useEffect(() => {
    filterSearches()
  }, [searches, searchQuery, typeFilter])

  const loadSearchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('keyword_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSearches(data)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSearches = () => {
    let filtered = searches

    // 按类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(search => search.search_type === typeFilter)
    }

    // 按关键词搜索
    if (searchQuery.trim()) {
      filtered = filtered.filter(search => 
        search.query.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredSearches(filtered)
  }

  const deleteSearch = async (searchId: string) => {
    if (!confirm('确定要删除这条搜索记录吗？')) return

    try {
      const { error } = await supabase
        .from('keyword_searches')
        .delete()
        .eq('id', searchId)

      if (!error) {
        setSearches(searches.filter(search => search.id !== searchId))
      }
    } catch (error) {
      console.error('删除搜索记录失败:', error)
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('确定要清空所有搜索历史吗？此操作不可恢复。')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('keyword_searches')
        .delete()
        .eq('user_id', user.id)

      if (!error) {
        setSearches([])
      }
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">搜索历史</h1>
            </div>
            <p className="text-muted-foreground">
              查看和管理您的所有关键词搜索记录
            </p>
          </div>
          <PageLoading text="正在加载搜索历史记录..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <History className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">搜索历史</h1>
              </div>
              <p className="text-muted-foreground">
                查看和管理您的所有关键词搜索记录
              </p>
            </div>
            {searches.length > 0 && (
              <Button variant="destructive" onClick={clearAllHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                清空历史
              </Button>
            )}
          </div>
        </div>

        {searches.length > 0 ? (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>筛选条件</span>
                </CardTitle>
                <CardDescription>
                  按条件筛选您的搜索历史
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">搜索内容</label>
                    <Input
                      placeholder="搜索历史记录..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">搜索类型</label>
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                      <option value="all">全部类型</option>
                      <option value="competitor">竞争对手分析</option>
                      <option value="trending">趋势分析</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        总搜索次数
                      </p>
                      <p className="text-2xl font-bold">{searches.length}</p>
                    </div>
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        竞争对手分析
                      </p>
                      <p className="text-2xl font-bold">
                        {searches.filter(s => s.search_type === 'competitor').length}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        趋势分析
                      </p>
                      <p className="text-2xl font-bold">
                        {searches.filter(s => s.search_type === 'trending').length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search History List */}
            <Card>
              <CardHeader>
                <CardTitle>搜索记录</CardTitle>
                <CardDescription>
                  显示 {filteredSearches.length} 条记录，共 {searches.length} 条
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSearches.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSearches.map((search) => (
                      <div 
                        key={search.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {search.search_type === 'competitor' ? (
                              <Target className="h-5 w-5 text-primary" />
                            ) : (
                              <TrendingUp className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{search.query}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateTime(search.created_at)}</span>
                              </span>
                              <span>
                                {search.search_type === 'competitor' ? '竞争对手分析' : '趋势分析'}
                              </span>
                              <span>
                                结果数量: {Array.isArray(search.results) ? search.results.length : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteSearch(search.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">没有找到匹配的记录</h3>
                    <p className="text-muted-foreground">
                      尝试调整筛选条件或清空搜索框
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">还没有搜索历史</h3>
                <p className="text-muted-foreground mb-4">
                  开始您的第一次关键词分析，建立搜索历史
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <a href="/search">
                      <Target className="h-4 w-4 mr-2" />
                      竞争对手分析
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/trending">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      热门趋势
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
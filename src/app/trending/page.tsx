'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type TrendingKeyword } from '@/lib/dataforseo'
import { TrendingUp, Search, BarChart3, Calendar, Target, RefreshCw } from 'lucide-react'

export default function TrendingPage() {
  const [location, setLocation] = useState('China')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TrendingKeyword[]>([])
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const loadTrendingKeywords = async () => {
    setLoading(true)
    setError('')

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 调用后端API
      const response = await fetch(`/api/keywords/trending?location=${encodeURIComponent(location)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取热门关键词失败')
      }

      setResults(result.data || [])
      // 使用确定性的时间戳格式化，避免 hydration mismatch
      setLastUpdated(new Date().toLocaleTimeString('zh-CN'))

    } catch (error: any) {
      console.error('获取热门关键词失败:', error)
      setError(error.message || '获取热门关键词失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    // 页面加载时自动获取热门关键词
    loadTrendingKeywords()
  }, [location])

  const getGrowthColor = (growthRate: number) => {
    if (growthRate > 50) return 'text-green-600'
    if (growthRate > 20) return 'text-blue-600'
    if (growthRate > 0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case '低': return 'text-green-600 bg-green-100'
      case '中': return 'text-yellow-600 bg-yellow-100'
      case '高': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">热门关键词趋势</h1>
          </div>
          <p className="text-muted-foreground">
            实时监控最近一周的热门关键词，把握市场动态
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>筛选设置</span>
                </CardTitle>
                <CardDescription>
                  自定义趋势分析参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">目标地区</Label>
                  <Select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="China">中国</option>
                    <option value="United States">美国</option>
                    <option value="United Kingdom">英国</option>
                    <option value="Japan">日本</option>
                    <option value="Germany">德国</option>
                  </Select>
                </div>

                <Button 
                  onClick={loadTrendingKeywords} 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loading size="sm" />
                      <span className="ml-2">更新中...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      刷新数据
                    </>
                  )}
                </Button>

                {mounted && lastUpdated && (
                  <div className="text-xs text-muted-foreground flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      最后更新: {lastUpdated}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">图例说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-2">增长率颜色:</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                      <span>高增长 (&gt;50%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      <span>中增长 (20-50%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                      <span>低增长 (0-20%)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">竞争度:</div>
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-600">低</span>
                    <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-600 ml-1">中</span>
                    <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-600 ml-1">高</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="text-destructive">{error}</div>
                </CardContent>
              </Card>
            )}

            {results.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            总关键词数
                          </p>
                          <p className="text-2xl font-bold">{results.length}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            平均搜索量
                          </p>
                          <p className="text-2xl font-bold">
                            {Math.round(results.reduce((sum, item) => sum + item.search_volume, 0) / results.length).toLocaleString()}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            高增长关键词
                          </p>
                          <p className="text-2xl font-bold">
                            {results.filter(item => item.growth_rate > 50).length}
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trending Keywords List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>热门关键词排行</span>
                    </CardTitle>
                    <CardDescription>
                      按搜索量排序的热门关键词
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results
                        .sort((a, b) => b.search_volume - a.search_volume)
                        .map((keyword, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-medium mb-1">{keyword.keyword}</h3>
                              <div className="flex items-center space-x-3 text-sm">
                                <span className="text-muted-foreground">
                                  搜索量: {keyword.search_volume.toLocaleString()}
                                </span>
                                <span className={`font-medium ${getGrowthColor(keyword.growth_rate)}`}>
                                  ↗ {keyword.growth_rate.toFixed(1)}%
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${getCompetitionColor(keyword.competition_level)}`}>
                                  {keyword.competition_level}竞争
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary">
                              {keyword.search_volume.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">月搜索量</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : !loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">获取最新热门趋势</h3>
                    <p className="text-muted-foreground mb-4">
                      点击刷新按钮获取最新的热门关键词数据
                    </p>
                    <Button onClick={loadTrendingKeywords}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      获取热门数据
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
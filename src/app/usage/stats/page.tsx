'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { 
  Coins, TrendingUp, Calendar, Activity, 
  Filter, ChevronLeft, ChevronRight, RefreshCw 
} from 'lucide-react'

interface CreditUsage {
  id: string
  feature_code: string
  feature_name: string
  credits_used: number
  remaining_credits: number
  description: string
  created_at: string
}

interface UsageStats {
  total_used_this_month: number
  total_used_all_time: number
  current_credits: number
  most_used_feature: string
  usage_by_feature: { [key: string]: number }
}

export default function UsageStatsPage() {
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsageData()
  }, [currentPage, filter])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      
      // 获取使用历史
      const historyResponse = await fetch(`/api/usage/history?page=${currentPage}&filter=${filter}`)
      const historyData = await historyResponse.json()
      
      if (!historyResponse.ok) {
        throw new Error(historyData.error || '获取使用历史失败')
      }
      
      // 获取统计数据
      const statsResponse = await fetch('/api/usage/stats')
      const statsData = await statsResponse.json()
      
      if (!statsResponse.ok) {
        throw new Error(statsData.error || '获取统计数据失败')
      }
      
      setUsageHistory(historyData.data.usage_history || [])
      setTotalPages(historyData.data.total_pages || 1)
      setStats(statsData.data)
      setError(null)
    } catch (err) {
      console.error('获取使用数据失败:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFeatureBadgeColor = (featureCode: string) => {
    const colors: { [key: string]: string } = {
      'competitor_analysis': 'bg-blue-100 text-blue-800',
      'keyword_analysis': 'bg-green-100 text-green-800',
      'content_outline': 'bg-purple-100 text-purple-800',
      'content_titles': 'bg-orange-100 text-orange-800',
      'gap_analysis': 'bg-red-100 text-red-800',
      'page_analysis': 'bg-indigo-100 text-indigo-800',
      'ranking_check': 'bg-yellow-100 text-yellow-800'
    }
    return colors[featureCode] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchUsageData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">使用统计</h1>
        <p className="text-muted-foreground">
          查看您的积分使用历史和统计数据
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">当前余额</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.current_credits}</div>
              <p className="text-xs text-muted-foreground">积分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月使用</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_used_this_month}</div>
              <p className="text-xs text-muted-foreground">积分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计使用</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.total_used_all_time}</div>
              <p className="text-xs text-muted-foreground">积分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最常用功能</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-indigo-600">{stats.most_used_feature || '暂无'}</div>
              <p className="text-xs text-muted-foreground">功能</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 功能使用分布 */}
      {stats?.usage_by_feature && Object.keys(stats.usage_by_feature).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>功能使用分布</CardTitle>
            <CardDescription>各功能的积分消耗情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.usage_by_feature).map(([feature, credits]) => (
                <div key={feature} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getFeatureBadgeColor(feature)}>
                      {feature}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{credits} 积分</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.total_used_all_time > 0 
                        ? `${((credits / stats.total_used_all_time) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用历史 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>使用历史</CardTitle>
              <CardDescription>积分使用的详细记录</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background"
              >
                <option value="all">所有功能</option>
                <option value="competitor_analysis">竞争对手分析</option>
                <option value="keyword_analysis">关键词分析</option>
                <option value="content_outline">内容大纲</option>
                <option value="content_titles">标题创意</option>
                <option value="gap_analysis">差距分析</option>
                <option value="page_analysis">页面分析</option>
                <option value="ranking_check">排名查询</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchUsageData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usageHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无使用记录
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {usageHistory.map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Badge className={getFeatureBadgeColor(usage.feature_code)}>
                        {usage.feature_name}
                      </Badge>
                      <div>
                        <div className="font-medium">{usage.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(usage.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">-{usage.credits_used} 积分</div>
                      <div className="text-sm text-muted-foreground">
                        余额: {usage.remaining_credits}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
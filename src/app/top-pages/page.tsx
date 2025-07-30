'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type TopPagesAnalysis } from '@/lib/keyword-data'
import { 
  Globe, BarChart3, ExternalLink, Search, Target, 
  FileText, Tag, Copy
} from 'lucide-react'
import { refreshCredits } from '@/lib/credit-refresh'
import { PermissionBanner } from '@/components/membership/permission-guard'

export default function TopPagesPage() {
  const [domain, setDomain] = useState('')
  const [location, setLocation] = useState('China')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<TopPagesAnalysis | null>(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'traffic' | 'keywords'>('traffic')

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 调用后端API
      const response = await fetch('/api/competitors/top-pages-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ domain, location })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，分析失败')
      }

      setAnalysis(result.data)
      
      // 触发积分刷新
      refreshCredits()

    } catch (error: unknown) {
      console.error('高流量页面分析失败:', error)
      setError(error instanceof Error ? error.message : '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      '博客文章': 'bg-blue-100 text-blue-700',
      '产品页面': 'bg-green-100 text-green-700',
      '新闻文章': 'bg-red-100 text-red-700',
      '教程指南': 'bg-purple-100 text-purple-700',
      '分类页面': 'bg-yellow-100 text-yellow-700',
      '内容页面': 'bg-gray-100 text-gray-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const sortedPages = analysis?.pages ? [...analysis.pages].sort((a, b) => {
    if (sortBy === 'traffic') {
      return b.estimated_traffic - a.estimated_traffic
    } else {
      return b.keywords_count - a.keywords_count
    }
  }) : []

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">高流量页面分析</h1>
          </div>
          <p className="text-muted-foreground">
            分析竞争对手网站的高流量页面，学习他们最成功的内容策略
          </p>
        </div>

        {/* Permission Banner */}
        <PermissionBanner featureCode="page_analysis" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>分析设置</span>
                </CardTitle>
                <CardDescription>
                  输入要分析的域名
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalysis} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">目标域名</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="例如：example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      required
                    />
                  </div>

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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loading variant="dots" size="sm" />
                        <span className="ml-2">正在分析高流量页面...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        开始分析
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Analysis Tips */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">分析说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>预估流量：</strong>页面每月预估自然搜索流量
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>关键词数量：</strong>为该页面贡献流量的关键词总数
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>核心关键词：</strong>为页面贡献最多流量的关键词
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>内容类型：</strong>页面的内容分类，便于制定相应策略
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="text-destructive">{error}</div>
                </CardContent>
              </Card>
            )}

            {analysis ? (
              <div className="space-y-6">
                {/* Overview Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>分析概览</CardTitle>
                    <CardDescription>
                      域名: {analysis.domain} | 分析日期: {analysis.analysis_date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {analysis.pages.length}
                        </div>
                        <div className="text-sm text-muted-foreground">高流量页面</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {analysis.total_organic_traffic.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">总预估流量/月</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(analysis.pages.reduce((sum, page) => sum + page.keywords_count, 0) / analysis.pages.length)}
                        </div>
                        <div className="text-sm text-muted-foreground">平均关键词数</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sort Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>高流量页面列表</span>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">排序:</Label>
                        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'traffic' | 'keywords')}>
                          <option value="traffic">按流量排序</option>
                          <option value="keywords">按关键词数排序</option>
                        </Select>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sortedPages.map((page, index) => (
                        <div key={index} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                          {/* Page Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-lg line-clamp-2">{page.title}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(page.title)}
                                  className="opacity-60 hover:opacity-100"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center space-x-1">
                                  <Globe className="h-3 w-3" />
                                  <span className="truncate max-w-xs">{page.url}</span>
                                </div>
                                <a 
                                  href={page.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>访问</span>
                                </a>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getContentTypeColor(page.content_type)}`}>
                                  {page.content_type}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-primary">
                                {page.estimated_traffic.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">月流量</div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">关键词数量:</span>
                              <span className="font-medium">{page.keywords_count}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">预估流量:</span>
                              <span className="font-medium">{page.estimated_traffic.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Top Keywords */}
                          {page.top_keywords.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 flex items-center space-x-2">
                                <Tag className="h-4 w-4" />
                                <span>核心关键词</span>
                              </h4>
                              <div className="space-y-2">
                                {page.top_keywords.map((keyword, kIndex) => (
                                  <div key={kIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                                        #{keyword.position}
                                      </div>
                                      <div>
                                        <span className="font-medium">{keyword.keyword}</span>
                                        <div className="text-xs text-muted-foreground">
                                          搜索量: {keyword.search_volume.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium">
                                        {keyword.traffic_share.toFixed(1)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">流量贡献</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>内容类型分布</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(
                        analysis.pages.reduce((acc, page) => {
                          acc[page.content_type] = (acc[page.content_type] || 0) + 1
                          return acc
                        }, {} as { [key: string]: number })
                      ).map(([type, count]) => (
                        <div key={type} className="text-center">
                          <div className="text-lg font-bold">{count}</div>
                          <div className={`text-sm px-2 py-1 rounded ${getContentTypeColor(type)}`}>
                            {type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : loading ? (
              <PageLoading text="正在分析竞争对手的高流量页面，请稍候..." />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始高流量页面分析</h3>
                    <p className="text-muted-foreground">
                      在左侧输入竞争对手域名，分析他们最成功的内容页面
                    </p>
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


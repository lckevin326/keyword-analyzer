'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading, CardLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type KeywordDetailAnalysis } from '@/lib/keyword-data'
import { 
  Search, BarChart3, TrendingUp, Globe, Target, Calendar, 
  Eye, ExternalLink, HelpCircle, Zap, Activity
} from 'lucide-react'
import { PermissionBanner } from '@/components/membership/permission-guard'

export default function KeywordAnalysisPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('China')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<KeywordDetailAnalysis | null>(null)
  const [error, setError] = useState('')

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return

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
      const response = await fetch('/api/keywords/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ keyword, location })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，分析失败')
      }

      setAnalysis(result.data)

    } catch (error: any) {
      console.error('关键词分析失败:', error)
      setError(error.message || '分析失败，数据服务暂时不可用，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'transactional': return 'bg-green-100 text-green-700'
      case 'commercial': return 'bg-blue-100 text-blue-700'
      case 'informational': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'transactional': return '交易型'
      case 'commercial': return '商业型'
      case 'informational': return '信息型'
      default: return '未知'
    }
  }

  const getDifficultyColor = (score: number) => {
    if (score < 30) return 'text-green-600'
    if (score < 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifficultyLabel = (score: number) => {
    if (score < 30) return '容易'
    if (score < 60) return '中等'
    return '困难'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">关键词深度分析</h1>
          </div>
          <p className="text-muted-foreground">
            对任意关键词进行360度全方位分析，获取搜索量、竞争度、SERP结果等详细数据
          </p>
        </div>

        {/* Permission Banner */}
        <PermissionBanner featureCode="keyword_analysis" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>分析设置</span>
                </CardTitle>
                <CardDescription>
                  输入要分析的关键词
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalysis} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyword">目标关键词</Label>
                    <Input
                      id="keyword"
                      type="text"
                      placeholder="例如：人工智能、SEO工具"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
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
                        <Loading size="sm" variant="pulse" />
                        <span className="ml-2">正在进行360度深度分析...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        开始深度分析
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
                    <strong>搜索量趋势：</strong>显示关键词过去12个月的搜索量变化
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>SERP结果：</strong>当前搜索引擎前10名结果分析
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>相关问题：</strong>用户常问的相关问题，内容创作灵感来源
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>难度评分：</strong>优化该关键词到首页的难度估算
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
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {analysis.search_volume.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">月搜索量</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          ${analysis.cpc.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">平均CPC</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getDifficultyColor(analysis.difficulty_score)}`}>
                          {analysis.difficulty_score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SEO难度 ({getDifficultyLabel(analysis.difficulty_score)})
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getIntentColor(analysis.commercial_intent)}`}>
                          {getIntentLabel(analysis.commercial_intent)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">搜索意图</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search Volume Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>搜索量趋势 (近12个月)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-2">
                      {analysis.monthly_trends.map((trend, index) => (
                        <div key={index} className="text-center">
                          <div className="text-sm font-medium">
                            {trend.search_volume.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(trend.date).toLocaleDateString('zh-CN', { month: 'short' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SERP Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>SERP结果分析</span>
                    </CardTitle>
                    <CardDescription>
                      当前搜索引擎前10名结果
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.serp_results.map((result, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                              {result.position}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium mb-1 line-clamp-2">{result.title}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                                <Globe className="h-3 w-3" />
                                <span>{result.domain}</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {result.type}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-primary hover:underline text-sm mt-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>访问页面</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* People Also Ask */}
                {analysis.people_also_ask.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <HelpCircle className="h-5 w-5" />
                        <span>用户常问问题</span>
                      </CardTitle>
                      <CardDescription>
                        基于此关键词，用户还会搜索的相关问题
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {analysis.people_also_ask.map((question, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg">
                            <HelpCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <span className="text-sm">{question}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Seasonality Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>季节性趋势</span>
                    </CardTitle>
                    <CardDescription>
                      关键词在不同月份的相对热度
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-3">
                      {analysis.seasonality_data.map((data, index) => (
                        <div key={index} className="text-center">
                          <div className="h-16 bg-gray-100 rounded-lg mb-2 flex items-end justify-center">
                            <div 
                              className="bg-primary rounded-b"
                              style={{ 
                                height: `${data.relative_interest}%`,
                                width: '20px',
                                minHeight: '4px'
                              }}
                            />
                          </div>
                          <div className="text-xs font-medium">{data.month}</div>
                          <div className="text-xs text-muted-foreground">{data.relative_interest}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : loading ? (
              <PageLoading text="正在进行360度深度分析，包含SERP结果、相关问题、季节性趋势..." />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始关键词深度分析</h3>
                    <p className="text-muted-foreground">
                      在左侧输入关键词，获取详细的SEO分析报告
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
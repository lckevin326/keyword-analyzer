'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type KeywordData } from '@/lib/keyword-data'
import { 
  Search, Target, BarChart3, 
  TrendingUp, Globe
} from 'lucide-react'
import { PermissionBanner } from '@/components/membership/permission-guard'
import { refreshCredits } from '@/lib/credit-refresh'

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'competitor' | 'industry'>('competitor')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('China')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KeywordData[]>([])
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 调用后端API (使用统一的搜索接口)
      const requestBody = searchType === 'competitor' 
        ? { domain: query, location }
        : { industry: query, location }

      const response = await fetch('/api/keywords/search-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，搜索失败')
      }

      setResults(result.data || [])
      
      // 触发积分刷新
      refreshCredits()

    } catch (error: unknown) {
      console.error('搜索失败:', error)
      const errorMessage = error instanceof Error ? error.message : '搜索失败，请重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">关键词搜索分析</h1>
          </div>
          <p className="text-muted-foreground">
            输入竞争对手域名或行业信息，发现高价值关键词机会
          </p>
        </div>

        {/* Permission Banner */}
        <PermissionBanner featureCode="competitor_analysis" />

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Search Form */}
            <div className="lg:col-span-1">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>搜索配置</span>
                </CardTitle>
                <CardDescription>
                  设置您的搜索参数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchType">搜索类型</Label>
                    <Select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as 'competitor' | 'industry')}
                    >
                      <option value="competitor">竞争对手分析</option>
                      <option value="industry">行业关键词</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="query">
                      {searchType === 'competitor' ? '竞争对手域名' : '行业/产品关键词'}
                    </Label>
                    <Input
                      id="query"
                      type="text"
                      placeholder={
                        searchType === 'competitor' 
                          ? '例如：example.com' 
                          : '例如：人工智能、电商平台'
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
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
                        <Loading size="sm" variant="dots" />
                        <span className="ml-2">正在分析关键词...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        开始搜索
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search Tips */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">搜索提示</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>竞争对手分析：</strong>输入竞争对手的网站域名，分析他们的关键词策略
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>行业关键词：</strong>输入您的行业或产品类别，发现相关的热门关键词
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>地区选择：</strong>选择目标市场地区以获得更精准的数据
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="text-destructive">{error}</div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <PageLoading text="正在分析关键词数据，请稍候..." />
            ) : results.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>搜索结果</span>
                  </CardTitle>
                  <CardDescription>
                    找到 {results.length} 个相关关键词
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((keyword, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{keyword.keyword}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>搜索量: {keyword.search_volume?.toLocaleString() || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>竞争度: {(keyword.competition * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>CPC: ${keyword.cpc?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            {keyword.search_volume?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-muted-foreground">月搜索量</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始您的关键词分析</h3>
                    <p className="text-muted-foreground">
                      在左侧输入搜索信息，我们将为您分析相关的关键词数据
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


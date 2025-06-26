'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading, CardLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type MarketMonitoringResponse } from '@/lib/keyword-data'
import { 
  AlertTriangle, TrendingUp, Target, Search, RefreshCw, 
  Calendar, ArrowDown, ArrowUp, Zap, Users, BarChart3
} from 'lucide-react'

export default function MonitoringPage() {
  const [loading, setLoading] = useState(false)
  const [monitoring, setMonitoring] = useState<MarketMonitoringResponse | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'ranking' | 'competitor' | 'trend'>('ranking')

  // 监控配置表单
  const [monitorForm, setMonitorForm] = useState({
    trackingKeywords: '',
    competitorDomains: '',
    industryKeywords: '',
    location: 'China'
  })

  const handleMonitoring = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError('')
    setMonitoring(null)

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 处理输入数据
      const trackingKeywords = monitorForm.trackingKeywords
        .split('\n')
        .map(k => k.trim())
        .filter(k => k)

      const competitorDomains = monitorForm.competitorDomains
        .split('\n')
        .map(d => d.trim())
        .filter(d => d)

      const industryKeywords = monitorForm.industryKeywords
        .split('\n')
        .map(k => k.trim())
        .filter(k => k)

      // 调用后端API
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          trackingKeywords,
          competitorDomains,
          industryKeywords,
          location: monitorForm.location
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，监控失败')
      }

      setMonitoring(result.data)

    } catch (error: any) {
      console.error('市场动态监控失败:', error)
      setError(error.message || '监控失败，数据服务暂时不可用，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <ArrowDown className="h-4 w-4" />
      case 'low': return <ArrowUp className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ranking_drop': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'competitor_keyword': return <Users className="h-4 w-4 text-blue-600" />
      case 'trend_spike': return <TrendingUp className="h-4 w-4 text-green-600" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const renderAlertsList = (alerts: any[], title: string, description: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{alert.keyword}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getSeverityColor(alert.severity)}`}>
                          {getSeverityIcon(alert.severity)}
                          <span>{alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(alert.detected_at).toLocaleString('zh-CN')}</span>
                      </div>
                      
                      {/* 显示具体数据 */}
                      {alert.data && (
                        <div className="mt-2 text-xs">
                          {alert.type === 'ranking_drop' && (
                            <div className="space-x-4">
                              <span>原排名: #{alert.data.oldPosition}</span>
                              <span>新排名: #{alert.data.newPosition}</span>
                            </div>
                          )}
                          {alert.type === 'competitor_keyword' && (
                            <div className="space-x-4">
                              <span>竞争对手: {alert.data.domain}</span>
                              <span>排名: #{alert.data.position}</span>
                            </div>
                          )}
                          {alert.type === 'trend_spike' && (
                            <div className="space-x-4">
                              <span>增长率: {alert.data.growthRate}%</span>
                              <span>时间段: {alert.data.period}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">暂无相关动态</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">市场动态监控</h1>
          </div>
          <p className="text-muted-foreground">
            实时监控关键词排名变化、竞争对手动态和行业热度趋势
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Monitoring Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>监控设置</span>
                </CardTitle>
                <CardDescription>
                  配置您的监控参数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMonitoring} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingKeywords">追踪关键词 (每行一个)</Label>
                    <textarea
                      id="trackingKeywords"
                      className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                      placeholder="例如：&#10;SEO优化&#10;关键词分析"
                      value={monitorForm.trackingKeywords}
                      onChange={(e) => setMonitorForm({...monitorForm, trackingKeywords: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitorDomains">竞争对手域名 (每行一个)</Label>
                    <textarea
                      id="competitorDomains"
                      className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                      placeholder="例如：&#10;competitor1.com&#10;competitor2.com"
                      value={monitorForm.competitorDomains}
                      onChange={(e) => setMonitorForm({...monitorForm, competitorDomains: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industryKeywords">行业关键词 (每行一个)</Label>
                    <textarea
                      id="industryKeywords"
                      className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                      placeholder="例如：&#10;人工智能&#10;机器学习"
                      value={monitorForm.industryKeywords}
                      onChange={(e) => setMonitorForm({...monitorForm, industryKeywords: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">目标地区</Label>
                    <Select
                      value={monitorForm.location}
                      onChange={(e) => setMonitorForm({...monitorForm, location: e.target.value})}
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
                        <span className="ml-2">正在监控市场动态...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        开始监控
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Monitoring Tips */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">监控说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <ArrowDown className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>排名变化：</strong>监控关键词是否跌出前10位
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>竞争对手：</strong>追踪对手关键词进入前十的情况
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>趋势飙升：</strong>检测行业热度一周内飙升50%以上的关键词
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring Results */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="text-destructive">{error}</div>
                </CardContent>
              </Card>
            )}

            {monitoring ? (
              <div className="space-y-6">
                {/* Overview Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>监控概览</CardTitle>
                    <CardDescription>
                      最后更新: {new Date(monitoring.last_updated).toLocaleString('zh-CN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {monitoring.total_alerts}
                        </div>
                        <div className="text-sm text-muted-foreground">总动态数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {monitoring.ranking_alerts.length}
                        </div>
                        <div className="text-sm text-muted-foreground">排名变化</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {monitoring.competitor_alerts.length}
                        </div>
                        <div className="text-sm text-muted-foreground">竞争对手</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {monitoring.trend_alerts.length}
                        </div>
                        <div className="text-sm text-muted-foreground">趋势飙升</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'ranking' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('ranking')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowDown className="h-4 w-4" />
                      <span>排名变化</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'competitor' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('competitor')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>竞争对手</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'trend' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('trend')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>趋势飙升</span>
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'ranking' && renderAlertsList(
                    monitoring.ranking_alerts,
                    '关键词排名变化',
                    '您追踪的关键词排名出现了显著变化'
                  )}
                  
                  {activeTab === 'competitor' && renderAlertsList(
                    monitoring.competitor_alerts,
                    '竞争对手动态',
                    '竞争对手在关键词排名方面的新动向'
                  )}
                  
                  {activeTab === 'trend' && renderAlertsList(
                    monitoring.trend_alerts,
                    '行业趋势飙升',
                    '行业内关键词搜索热度的显著增长'
                  )}
                </div>
              </div>
            ) : loading ? (
              <PageLoading text="正在分析最新的市场动态和竞争对手信息..." />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始市场动态监控</h3>
                    <p className="text-muted-foreground">
                      在左侧配置监控参数，获取最新的市场动态信息
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
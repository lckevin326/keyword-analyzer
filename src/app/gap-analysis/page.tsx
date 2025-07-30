'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type CompetitorGapAnalysis } from '@/lib/keyword-data'
import { 
  Target, BarChart3, 
  Users, Trophy, Lightbulb
} from 'lucide-react'
import { PermissionBanner } from '@/components/membership/permission-guard'

export default function GapAnalysisPage() {
  const [projectName, setProjectName] = useState('')
  const [ownDomain, setOwnDomain] = useState('')
  const [competitorDomains, setCompetitorDomains] = useState(['', '', ''])
  const [location, setLocation] = useState('China')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<CompetitorGapAnalysis | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'shared' | 'advantage' | 'opportunity'>('opportunity')

  const analyzeGap = async (formData: {
    projectName: string
    ownDomain: string
    competitorDomains: string[]
    location: string
  }) => {
    if (!formData.ownDomain.trim() || !formData.competitorDomains.length) {
      setError('请至少输入一个竞争对手域名')
      return
    }

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
      const response = await fetch('/api/competitors/gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          projectName: formData.projectName,
          ownDomain: formData.ownDomain, 
          competitorDomains: formData.competitorDomains, 
          location: formData.location 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '分析失败')
      }

      setAnalysis(result.data)

    } catch (error: unknown) {
      console.error('分析失败:', error)
      const errorMessage = error instanceof Error ? error.message : '分析失败，请重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateCompetitorDomain = (index: number, value: string) => {
    const newDomains = [...competitorDomains]
    newDomains[index] = value
    setCompetitorDomains(newDomains)
  }

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600 bg-green-100'
    if (position <= 10) return 'text-blue-600 bg-blue-100'
    if (position <= 20) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderKeywordList = (keywords: any[], title: string, icon: React.ReactNode, description: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.slice(0, 10).map((keyword, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{keyword.keyword}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityColor(keyword.opportunity_score)}`}>
                        机会分: {keyword.opportunity_score}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">搜索量:</span>
                        <span className="font-medium">{keyword.search_volume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">竞争度:</span>
                        <span className="font-medium">{(keyword.competition * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPC:</span>
                        <span className="font-medium">${keyword.cpc.toFixed(2)}</span>
                      </div>
                      {keyword.own_position && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">我的排名:</span>
                          <span className={`px-2 py-1 rounded text-xs ${getPositionColor(keyword.own_position)}`}>
                            #{keyword.own_position}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {Object.keys(keyword.competitor_positions).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground mb-2">竞争对手排名:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(keyword.competitor_positions).map(([domain, position]) => (
                          <div key={domain} className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">{domain}:</span>
                            <span className={`px-2 py-1 rounded text-xs ${getPositionColor(position as number)}`}>
                              #{String(position)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {keywords.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  还有 {keywords.length - 10} 个关键词...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">暂无数据</div>
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
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">关键词差距分析</h1>
          </div>
          <p className="text-muted-foreground">
            对比您与竞争对手的关键词策略，发现尚未覆盖的高价值关键词机会
          </p>
        </div>

        {/* Permission Banner */}
        <PermissionBanner featureCode="gap_analysis" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>分析设置</span>
                </CardTitle>
                <CardDescription>
                  配置竞争对手分析参数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = {
                    projectName,
                    ownDomain,
                    competitorDomains: competitorDomains.filter(domain => domain.trim()),
                    location
                  }
                  analyzeGap(formData)
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">项目名称</Label>
                    <Input
                      id="projectName"
                      type="text"
                      placeholder="例如：我的电商网站分析"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownDomain">您的域名</Label>
                    <Input
                      id="ownDomain"
                      type="text"
                      placeholder="例如：mywebsite.com"
                      value={ownDomain}
                      onChange={(e) => setOwnDomain(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>竞争对手域名 (最多3个)</Label>
                    {competitorDomains.map((domain, index) => (
                      <Input
                        key={index}
                        type="text"
                        placeholder={`竞争对手 ${index + 1}`}
                        value={domain}
                        onChange={(e) => updateCompetitorDomain(index, e.target.value)}
                      />
                    ))}
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
                      <Loading size="sm" variant="dots" text="正在分析竞争对手关键词..." />
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        开始差距分析
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Analysis Guide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">分析说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Trophy className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>优势关键词：</strong>您排名靠前但竞争对手没有的词
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>机会关键词：</strong>竞争对手有排名但您没有的高价值词
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <strong>共同关键词：</strong>您和竞争对手都在竞争的词
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
                      项目: {analysis.own_domain} vs [{analysis.competitor_domains.join(', ')}]
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analysis.advantage_keywords.length}
                        </div>
                        <div className="text-sm text-muted-foreground">优势关键词</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analysis.opportunity_keywords.length}
                        </div>
                        <div className="text-sm text-muted-foreground">机会关键词</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysis.shared_keywords.length}
                        </div>
                        <div className="text-sm text-muted-foreground">共同关键词</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {analysis.total_keywords}
                        </div>
                        <div className="text-sm text-muted-foreground">总关键词数</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'opportunity' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('opportunity')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>机会关键词</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'advantage' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('advantage')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy className="h-4 w-4" />
                      <span>优势关键词</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'shared' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('shared')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>共同关键词</span>
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'opportunity' && renderKeywordList(
                    analysis.opportunity_keywords,
                    '机会关键词',
                    <Lightbulb className="h-5 w-5" />,
                    '竞争对手排名靠前但您没有的高价值关键词，这些是内容策略的重点'
                  )}
                  
                  {activeTab === 'advantage' && renderKeywordList(
                    analysis.advantage_keywords,
                    '优势关键词',
                    <Trophy className="h-5 w-5" />,
                    '您排名靠前但竞争对手没有的关键词，继续保持和加强这些优势'
                  )}
                  
                  {activeTab === 'shared' && renderKeywordList(
                    analysis.shared_keywords,
                    '共同关键词',
                    <BarChart3 className="h-5 w-5" />,
                    '您和竞争对手都在竞争的关键词，需要优化以获得更好排名'
                  )}
                </div>
              </div>
            ) : loading ? (
              <PageLoading text="正在分析您与竞争对手的关键词差距，这可能需要几分钟时间..." />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">开始竞争对手差距分析</h3>
                    <p className="text-muted-foreground">
                      在左侧输入您的域名和竞争对手信息，发现关键词机会
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





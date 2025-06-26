'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading, CardLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type RankingCheckResponse, type KeywordRankingProject } from '@/lib/keyword-data'
import { 
  Plus, Search, Target, BarChart3, TrendingUp, Globe, 
  Calendar, ExternalLink, Award, AlertCircle, CheckCircle
} from 'lucide-react'

export default function RankingPage() {
  const [projects, setProjects] = useState<KeywordRankingProject[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [rankingResults, setRankingResults] = useState<RankingCheckResponse | null>(null)

  // 创建项目表单状态
  const [createForm, setCreateForm] = useState({
    projectName: '',
    domain: '',
    keywords: '',
    location: 'China'
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ranking/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.projectName.trim() || !createForm.domain.trim() || !createForm.keywords.trim()) {
      setError('请填写完整的项目信息')
      return
    }

    try {
      setLoading(true)
      setError('')

      const keywords = createForm.keywords
        .split('\n')
        .map(k => k.trim())
        .filter(k => k)

      if (keywords.length === 0) {
        throw new Error('请输入至少一个关键词')
      }

      if (keywords.length > 50) {
        throw new Error('关键词数量不能超过50个')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('请先登录')

      const response = await fetch('/api/ranking/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectName: createForm.projectName,
          domain: createForm.domain,
          keywords,
          location: createForm.location
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，创建失败')
      }

      setShowCreateForm(false)
      setCreateForm({ projectName: '', domain: '', keywords: '', location: 'China' })
      loadProjects()

    } catch (error: any) {
      setError(error.message || '创建失败，数据服务暂时不可用，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckRanking = async (projectId: string) => {
    try {
      setChecking(projectId)
      setError('')
      setRankingResults(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('请先登录')

      const response = await fetch('/api/ranking/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ projectId })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '数据接口异常，查询失败')
      }

      setRankingResults(result.data)

    } catch (error: any) {
      setError(error.message || '查询失败，数据服务暂时不可用，请稍后重试')
    } finally {
      setChecking(null)
    }
  }

  const getPositionColor = (position?: number) => {
    if (!position) return 'text-gray-500'
    if (position <= 3) return 'text-green-600'
    if (position <= 10) return 'text-blue-600'
    if (position <= 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPositionIcon = (position?: number, foundInTop100: boolean = false) => {
    if (!position && !foundInTop100) return <AlertCircle className="h-4 w-4 text-gray-500" />
    if (position && position <= 10) return <Award className="h-4 w-4 text-green-600" />
    if (position && position <= 20) return <CheckCircle className="h-4 w-4 text-blue-600" />
    return <Target className="h-4 w-4 text-yellow-600" />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">关键词排名查询</h1>
              </div>
              <p className="text-muted-foreground">
                创建排名项目，实时查询您的关键词在搜索引擎中的排名位置
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建项目
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Create Project Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>创建排名项目</CardTitle>
              <CardDescription>
                设置您的域名和要追踪的关键词列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">项目名称</Label>
                    <Input
                      id="projectName"
                      placeholder="例如：我的网站排名追踪"
                      value={createForm.projectName}
                      onChange={(e) => setCreateForm({...createForm, projectName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">网站域名</Label>
                    <Input
                      id="domain"
                      placeholder="例如：example.com"
                      value={createForm.domain}
                      onChange={(e) => setCreateForm({...createForm, domain: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">关键词列表 (每行一个，最多50个)</Label>
                  <textarea
                    id="keywords"
                    className="w-full p-3 border rounded-md min-h-[120px] text-sm"
                    placeholder="例如：&#10;SEO优化&#10;关键词分析&#10;内容营销"
                    value={createForm.keywords}
                    onChange={(e) => setCreateForm({...createForm, keywords: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">目标地区</Label>
                  <Select
                    value={createForm.location}
                    onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                  >
                    <option value="China">中国</option>
                    <option value="United States">美国</option>
                    <option value="United Kingdom">英国</option>
                    <option value="Japan">日本</option>
                    <option value="Germany">德国</option>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loading variant="dots" size="sm" />
                        <span className="ml-2">正在创建排名项目...</span>
                      </>
                    ) : (
                      '创建项目'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>我的项目</span>
                </CardTitle>
                <CardDescription>
                  选择项目查询关键词排名
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && projects.length === 0 ? (
                  <div className="py-4">
                    <CardLoading rows={3} />
                  </div>
                ) : projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{project.name}</h3>
                          <Button
                            size="sm"
                            onClick={() => handleCheckRanking(project.id)}
                            disabled={checking === project.id}
                          >
                            {checking === project.id ? (
                              <Loading variant="pulse" size="sm" />
                            ) : (
                              <Search className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{project.domain}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{project.keywords.length} 个关键词</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">还没有排名项目</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      创建您的第一个排名项目
                    </p>
                    <Button size="sm" onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      创建项目
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ranking Results */}
          <div className="lg:col-span-2">
            {rankingResults ? (
              <div className="space-y-6">
                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>排名查询结果</CardTitle>
                    <CardDescription>
                      项目: {rankingResults.project.name} | 域名: {rankingResults.project.domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {rankingResults.total_keywords}
                        </div>
                        <div className="text-sm text-muted-foreground">总关键词</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {rankingResults.top_10_count}
                        </div>
                        <div className="text-sm text-muted-foreground">前10名</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {rankingResults.top_100_count}
                        </div>
                        <div className="text-sm text-muted-foreground">前100名</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {rankingResults.total_keywords - rankingResults.top_100_count}
                        </div>
                        <div className="text-sm text-muted-foreground">未上榜</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>详细排名结果</CardTitle>
                    <CardDescription>
                      查询时间: {new Date(rankingResults.check_date).toLocaleString('zh-CN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rankingResults.results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3 flex-1">
                            {getPositionIcon(result.position, result.found_in_top_100)}
                            <div className="flex-1">
                              <h3 className="font-medium mb-1">{result.keyword}</h3>
                              {result.url && (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <span className="truncate max-w-md">{result.url}</span>
                                  <a 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span>搜索量: {result.search_volume?.toLocaleString() || 'N/A'}</span>
                                <span>竞争度: {((result.competition || 0) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getPositionColor(result.position)}`}>
                              {result.position ? `#${result.position}` : result.found_in_top_100 ? '100+' : '未收录'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.position ? '排名位置' : result.found_in_top_100 ? '在前100名' : '未找到'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">选择项目查询排名</h3>
                    <p className="text-muted-foreground">
                      从左侧选择一个项目，点击查询按钮获取最新的关键词排名数据
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
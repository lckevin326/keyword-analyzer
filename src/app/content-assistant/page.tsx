'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, PageLoading, CardLoading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { type ContentOutlineResponse, type TitleGenerationResponse } from '@/lib/deepseek'
import { 
  PenTool, Lightbulb, FileText, Copy, CheckCircle, Star,
  Zap, Target, Users, Brain, Award, TrendingUp
} from 'lucide-react'
import PermissionGuard, { PermissionBanner } from '@/components/membership/permission-guard'
import { refreshCredits } from '@/lib/credit-refresh'

type ActiveTab = 'outline' | 'titles'

export default function ContentAssistantPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('outline')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Outline generation state
  const [outlineForm, setOutlineForm] = useState({
    targetKeyword: '',
    targetAudience: 'content marketers',
    searchIntent: 'informational' as 'informational' | 'commercial' | 'transactional',
    commonThemes: '',
    uniqueAngles: '',
    userQuestions: ''
  })
  const [outlineResult, setOutlineResult] = useState<ContentOutlineResponse | null>(null)

  // Title generation state
  const [titleForm, setTitleForm] = useState({
    targetKeyword: '',
    coreAngle: 'guide'
  })
  const [titleResult, setTitleResult] = useState<TitleGenerationResponse | null>(null)

  const handleOutlineGeneration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outlineForm.targetKeyword.trim()) return

    setLoading(true)
    setError('')
    setOutlineResult(null)

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 处理输入数据
      const commonThemes = outlineForm.commonThemes.split('\n').filter(t => t.trim())
      const uniqueAngles = outlineForm.uniqueAngles.split('\n').filter(a => a.trim())
      const userQuestions = outlineForm.userQuestions.split('\n').filter(q => q.trim())

      // 调用后端API (使用修复版本)
      const response = await fetch('/api/content/outline-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetKeyword: outlineForm.targetKeyword,
          targetAudience: outlineForm.targetAudience,
          searchIntent: outlineForm.searchIntent,
          commonThemes,
          uniqueAngles,
          userQuestions
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '生成失败')
      }

      setOutlineResult(result.data)
      
      // 触发积分刷新
      refreshCredits()

    } catch (error: any) {
      console.error('内容大纲生成失败:', error)
      setError(error.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleGeneration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleForm.targetKeyword.trim()) return

    setLoading(true)
    setError('')
    setTitleResult(null)

    try {
      // 获取当前用户session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('请先登录')
      }

      // 调用后端API (使用修复版本)
      const response = await fetch('/api/content/titles-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetKeyword: titleForm.targetKeyword,
          coreAngle: titleForm.coreAngle
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '生成失败')
      }

      setTitleResult(result.data)
      
      // 触发积分刷新
      refreshCredits()

    } catch (error: any) {
      console.error('标题生成失败:', error)
      setError(error.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getAppealColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      '指南类': 'bg-blue-100 text-blue-700',
      '列表类': 'bg-green-100 text-green-700',
      '规避风险类': 'bg-red-100 text-red-700',
      '提问类': 'bg-purple-100 text-purple-700',
      '秘密类': 'bg-yellow-100 text-yellow-700',
      '反向角度类': 'bg-pink-100 text-pink-700',
      '数据驱动类': 'bg-indigo-100 text-indigo-700',
      '通用类': 'bg-gray-100 text-gray-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <PenTool className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI内容创作助手</h1>
          </div>
          <p className="text-muted-foreground">
            基于关键词研究数据，使用 AI 生成高质量的文章大纲和吸引人的标题创意
          </p>
        </div>

        {/* Permission Banner - 检查内容大纲生成权限（最常用功能） */}
        <PermissionBanner featureCode="content_outline" />

        {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <button
            className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'outline' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('outline')}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>AI内容大纲生成</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'titles' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('titles')}
          >
            <div className="flex items-center justify-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>标题创意工坊</span>
            </div>
          </button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Content Outline Generator */}
        {activeTab === 'outline' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>大纲生成设置</span>
                  </CardTitle>
                  <CardDescription>
                    基于SEO研究数据生成文章大纲
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOutlineGeneration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetKeyword">目标关键词</Label>
                      <Input
                        id="targetKeyword"
                        type="text"
                        placeholder="例如：SEO优化技巧"
                        value={outlineForm.targetKeyword}
                        onChange={(e) => setOutlineForm({...outlineForm, targetKeyword: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">目标受众</Label>
                      <Select
                        value={outlineForm.targetAudience}
                        onChange={(e) => setOutlineForm({...outlineForm, targetAudience: e.target.value})}
                      >
                        <option value="beginners">新手/初学者</option>
                        <option value="content marketers">内容营销人员</option>
                        <option value="business owners">企业主</option>
                        <option value="developers">开发者</option>
                        <option value="professionals">专业人士</option>
                        <option value="general audience">普通读者</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="searchIntent">搜索意图</Label>
                      <Select
                        value={outlineForm.searchIntent}
                        onChange={(e) => setOutlineForm({...outlineForm, searchIntent: e.target.value as any})}
                      >
                        <option value="informational">信息获取型</option>
                        <option value="commercial">商业调查型</option>
                        <option value="transactional">交易型</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commonThemes">常见主题 (每行一个)</Label>
                      <textarea
                        id="commonThemes"
                        className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                        placeholder="例如：&#10;什么是SEO&#10;SEO的好处&#10;如何开始SEO"
                        value={outlineForm.commonThemes}
                        onChange={(e) => setOutlineForm({...outlineForm, commonThemes: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uniqueAngles">独特角度 (每行一个)</Label>
                      <textarea
                        id="uniqueAngles"
                        className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                        placeholder="例如：&#10;2024年最新SEO趋势&#10;AI对SEO的影响"
                        value={outlineForm.uniqueAngles}
                        onChange={(e) => setOutlineForm({...outlineForm, uniqueAngles: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userQuestions">用户常问问题 (每行一个)</Label>
                      <textarea
                        id="userQuestions"
                        className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                        placeholder="例如：&#10;SEO需要多长时间见效？&#10;SEO和SEM有什么区别？"
                        value={outlineForm.userQuestions}
                        onChange={(e) => setOutlineForm({...outlineForm, userQuestions: e.target.value})}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loading variant="pulse" size="sm" />
                          <span className="ml-2">AI正在生成内容大纲...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          生成内容大纲
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {outlineResult ? (
                <div className="space-y-6">
                  {/* Outline Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>生成的内容大纲</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(outlineResult.outline)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          复制大纲
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        预估字数: {outlineResult.estimated_word_count} 字 | 共 {outlineResult.main_sections.length} 个主要章节
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h2 className="text-xl font-bold mb-4">{outlineResult.h1_title}</h2>
                        <div className="space-y-3">
                          {outlineResult.main_sections.map((section, index) => (
                            <div key={index} className="border-l-2 border-primary pl-4">
                              <h3 className="font-semibold text-lg mb-2">{section.h2_title}</h3>
                              {section.h3_subsections.length > 0 && (
                                <div className="ml-4 space-y-1">
                                  {section.h3_subsections.map((subsection, sIndex) => (
                                    <div key={sIndex} className="text-muted-foreground">
                                      • {subsection}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {section.key_points.length > 0 && (
                                <div className="ml-4 mt-2 space-y-1">
                                  {section.key_points.map((point, pIndex) => (
                                    <div key={pIndex} className="text-sm text-muted-foreground">
                                      - {point}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Raw Outline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Markdown 格式大纲</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg overflow-auto max-h-96">
                        {outlineResult.outline}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              ) : loading ? (
                <PageLoading text="AI正在基于您的关键词生成精美的内容大纲..." />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">AI内容大纲生成</h3>
                      <p className="text-muted-foreground">
                        在左侧输入关键词和相关信息，AI将为您生成结构完整的文章大纲
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Title Generator */}
        {activeTab === 'titles' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>标题生成设置</span>
                  </CardTitle>
                  <CardDescription>
                    生成高点击率的文章标题创意
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTitleGeneration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleKeyword">目标关键词</Label>
                      <Input
                        id="titleKeyword"
                        type="text"
                        placeholder="例如：内容营销策略"
                        value={titleForm.targetKeyword}
                        onChange={(e) => setTitleForm({...titleForm, targetKeyword: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coreAngle">核心角度</Label>
                      <Select
                        value={titleForm.coreAngle}
                        onChange={(e) => setTitleForm({...titleForm, coreAngle: e.target.value})}
                      >
                        <option value="guide">完整指南</option>
                        <option value="tips">实用技巧</option>
                        <option value="mistakes">常见错误</option>
                        <option value="tools">工具推荐</option>
                        <option value="trends">趋势分析</option>
                        <option value="case-study">案例研究</option>
                        <option value="comparison">对比评测</option>
                        <option value="beginner">新手教程</option>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loading variant="pulse" size="sm" />
                          <span className="ml-2">AI正在生成标题创意...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          生成标题创意
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Title Tips */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">标题优化提示</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Award className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>吸引力评分:</strong> 70-100分，分数越高点击率越好
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>SEO优化:</strong> 标题长度30-60字符最佳
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>类型多样:</strong> 混合使用不同标题风格提高效果
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {titleResult ? (
                <Card>
                  <CardHeader>
                    <CardTitle>生成的标题创意</CardTitle>
                    <CardDescription>
                      共生成 {titleResult.titles.length} 个标题，选择最适合的标题使用
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {titleResult.titles.map((title, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-lg flex-1 pr-4">{title.title}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(title.title)}
                              className="opacity-60 hover:opacity-100"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`px-3 py-1 rounded-full font-medium ${getTypeColor(title.type)}`}>
                              {title.type}
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span className="text-muted-foreground">吸引力:</span>
                              <span className={`font-medium ${getAppealColor(title.appeal_factor)}`}>
                                {title.appeal_factor}分
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span className="text-muted-foreground">SEO:</span>
                              {title.seo_optimized ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <span className="text-red-600 text-xs">长度需优化</span>
                              )}
                            </div>
                            
                            <div className="text-muted-foreground">
                              {title.title.length} 字符
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : loading ? (
                <PageLoading text="AI正在为您创作吸引人的标题创意..." />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">标题创意工坊</h3>
                      <p className="text-muted-foreground">
                        在左侧输入关键词和内容角度，AI将生成多个高点击率标题供您选择
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            </div>
          )}
      </div>
    </div>
  )
}
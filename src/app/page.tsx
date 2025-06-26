import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PlanComparison from '@/components/membership/plan-comparison'
import { 
  TrendingUp, Search, Target, BarChart3, Users, Zap, 
  Crown, Star, CheckCircle, ArrowRight, Globe, Brain,
  PenTool, Lightbulb, TrendingDown, Award, Shield
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <TrendingUp className="h-20 w-20 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
              关键词分析师
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              智能关键词分析平台，助您挖掘高价值关键词，洞察市场趋势，制胜数字营销
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all" asChild>
                <Link href="/auth/register">
                  <Star className="mr-2 h-5 w-5" />
                  免费开始分析
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-xl border-2" asChild>
                <Link href="/auth/login">立即登录</Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>免费试用</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>无需信用卡</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>即时结果</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">强大的分析工具</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              集成多种专业分析功能，从关键词挖掘到内容创作，全方位提升您的营销效果
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">竞争对手分析</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  深度分析竞争对手的关键词策略，发现他们的流量秘密，找到市场空白机会
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">热门趋势监控</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  实时追踪行业热门关键词变化，把握市场脉搏，抢占流量先机
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">深度数据洞察</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  全面的搜索量、竞争度、CPC等核心指标分析，用数据驱动决策
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">AI内容助手</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  基于关键词数据的AI内容创作工具，生成高质量文章大纲和标题创意
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingDown className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">关键词差距分析</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  发现您与竞争对手的关键词差距，识别未覆盖的高价值关键词机会
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">高流量页面分析</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  分析竞争对手最成功的页面，学习他们的内容策略和SEO技巧
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Advantages */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-muted/20 to-muted/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">为什么选择我们？</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              我们不只是一个分析工具，更是您数字营销路上的智能伙伴
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">数据权威可靠</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    基于权威数据源，确保关键词数据的准确性和实时性，让您的决策有据可依
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">智能AI驱动</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    集成先进AI算法，不仅提供数据分析，更能智能推荐关键词和生成创意内容
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">简单易用</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    直观的界面设计，无论您是SEO新手还是专家，都能快速上手并获得价值
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">全面功能覆盖</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    从关键词研究到内容创作，从竞争分析到趋势监控，一站式解决营销需求
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-2xl p-8 backdrop-blur-sm border border-primary/20">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">准确率</span>
                    <span className="font-bold text-lg">99.5%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '99.5%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">响应速度</span>
                    <span className="font-bold text-lg">{"<"}2秒</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">用户满意度</span>
                    <span className="font-bold text-lg">98%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">使用步骤</h2>
            <p className="text-xl text-muted-foreground">
              简单三步，开启您的关键词分析之旅
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent hidden md:block"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4">注册账户</h3>
              <p className="text-muted-foreground leading-relaxed">
                快速注册，支持邮箱注册或Google一键登录，30秒即可开始使用
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-green-500 to-transparent hidden md:block"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4">输入信息</h3>
              <p className="text-muted-foreground leading-relaxed">
                输入您的目标产品、行业关键词或竞争对手域名信息
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4">获取洞察</h3>
              <p className="text-muted-foreground leading-relaxed">
                获得详细的关键词分析报告，制定数据驱动的营销策略
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">选择适合您的方案</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              灵活的会员方案，满足从个人用户到企业团队的不同需求
            </p>
          </div>
          
          <PlanComparison />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 rounded-3xl p-12 backdrop-blur-sm border border-primary/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              准备好提升您的营销效果了吗？
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              加入数千名营销专家的行列，使用我们的专业工具发现高价值关键词，制胜数字营销战场
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl" asChild>
                <Link href="/auth/register">
                  <Star className="mr-2 h-5 w-5" />
                  立即免费试用
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-xl border-2" asChild>
                <Link href="/membership/plans">查看会员方案</Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>7天免费试用</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>随时可取消</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>专业客服支持</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl">关键词分析师</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                专业的关键词分析平台，助您挖掘高价值关键词，洞察市场趋势，制胜数字营销。
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>安全可靠 • 数据保护</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">产品功能</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/search" className="hover:text-primary transition-colors">关键词分析</Link></li>
                <li><Link href="/trending" className="hover:text-primary transition-colors">趋势监控</Link></li>
                <li><Link href="/content-assistant" className="hover:text-primary transition-colors">AI内容助手</Link></li>
                <li><Link href="/gap-analysis" className="hover:text-primary transition-colors">竞争分析</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">帮助支持</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/membership/plans" className="hover:text-primary transition-colors">会员方案</Link></li>
                <li><Link href="/auth/login" className="hover:text-primary transition-colors">登录</Link></li>
                <li><Link href="/auth/register" className="hover:text-primary transition-colors">注册</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 关键词分析师. 智能营销分析平台
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>由AI技术驱动</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>99.5%准确率</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
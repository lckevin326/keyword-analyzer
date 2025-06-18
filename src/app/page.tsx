import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Search, Target, BarChart3, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <TrendingUp className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            关键词分析师
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            基于 DataForSEO API 的专业关键词分析平台，助您发现热门关键词，洞察市场趋势
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/auth/register">免费开始分析</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/auth/login">立即登录</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              强大的关键词分析工具，帮助您在竞争激烈的市场中占据优势
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>竞争对手分析</CardTitle>
                <CardDescription>
                  输入对标产品或行业信息，快速发现竞争对手正在使用的热门关键词
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>热门趋势监控</CardTitle>
                <CardDescription>
                  实时跟踪最近一周的热门关键词，把握市场动态和用户需求变化
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>数据洞察</CardTitle>
                <CardDescription>
                  详细的搜索量、竞争度、CPC等数据分析，为您的营销策略提供数据支撑
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>智能搜索</CardTitle>
                <CardDescription>
                  基于AI算法的智能关键词推荐，发现您可能忽略的高价值关键词
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>用户友好</CardTitle>
                <CardDescription>
                  简洁直观的界面设计，无论您是新手还是专家都能快速上手使用
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>高性能API</CardTitle>
                <CardDescription>
                  基于DataForSEO权威数据源，确保数据的准确性和实时性
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">使用步骤</h2>
            <p className="text-lg text-muted-foreground">
              三步即可开始您的关键词分析之旅
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">注册账户</h3>
              <p className="text-muted-foreground">
                快速注册，支持邮箱注册或Google一键登录
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">输入信息</h3>
              <p className="text-muted-foreground">
                输入您的目标产品、行业或竞争对手信息
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">获取洞察</h3>
              <p className="text-muted-foreground">
                获得详细的关键词分析报告和市场洞察
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center bg-primary/5 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            立即开始您的关键词分析
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            不要让竞争对手抢占先机，现在就开始使用我们的专业工具发现高价值关键词
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link href="/auth/register">免费注册试用</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">关键词分析师</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 关键词分析师. 基于 DataForSEO API 构建
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

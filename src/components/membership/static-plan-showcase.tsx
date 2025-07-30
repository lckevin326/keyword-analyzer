import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, CheckCircle } from 'lucide-react'

export default function StaticPlanShowcase() {
  const plans = [
    {
      plan_id: 'free',
      plan_name: '免费版',
      monthly_price: 0,
      monthly_credits: 100,
      features: [
        '100积分/月',
        '基础关键词分析',
        '每日5次查询限制',
        '基础技术支持'
      ],
      isPopular: false,
      buttonText: '免费试用',
      buttonVariant: 'outline' as const
    },
    {
      plan_id: 'basic',
      plan_name: '基础版',
      monthly_price: 19.9,
      monthly_credits: 500,
      features: [
        '500积分/月',
        '竞争对手分析',
        '内容助手功能',
        '每日20次查询',
        '邮件技术支持'
      ],
      isPopular: false,
      buttonText: '立即升级',
      buttonVariant: 'outline' as const
    },
    {
      plan_id: 'pro',
      plan_name: '专业版',
      monthly_price: 39.9,
      monthly_credits: 2000,
      features: [
        '2000积分/月',
        '高级关键词分析',
        '批量关键词处理',
        '每日100次查询',
        '优先技术支持',
        '数据导出功能'
      ],
      isPopular: true,
      buttonText: '立即购买',
      buttonVariant: 'default' as const
    },
    {
      plan_id: 'enterprise',
      plan_name: '企业版',
      monthly_price: 99.9,
      monthly_credits: 10000,
      features: [
        '10000积分/月',
        '企业级API访问',
        '无限查询次数',
        '定制化报告',
        '专属客服支持',
        '高级数据分析'
      ],
      isPopular: false,
      buttonText: '联系销售',
      buttonVariant: 'outline' as const
    }
  ]

  const getPlanColor = (planId: string, isPopular: boolean) => {
    if (isPopular) return 'border-blue-500 border-2'
    
    const colors: { [key: string]: string } = {
      'free': 'border-gray-200',
      'basic': 'border-green-200',
      'pro': 'border-blue-500 border-2',
      'enterprise': 'border-purple-200'
    }
    return colors[planId] || 'border-gray-200'
  }

  const getPopularBadge = (isPopular: boolean) => {
    if (!isPopular) return null
    
    return (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <span className="bg-blue-500 text-white px-3 py-1 text-xs rounded-full flex items-center gap-1">
          <Star className="h-3 w-3" />
          最受欢迎
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <Card key={plan.plan_id} className={`relative p-6 hover:shadow-lg transition-shadow ${getPlanColor(plan.plan_id, plan.isPopular)}`}>
          {getPopularBadge(plan.isPopular)}
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">{plan.plan_name}</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold">${plan.monthly_price}</span>
              {plan.monthly_price > 0 && <span className="text-gray-600">/月</span>}
            </div>
            <div className="text-sm text-blue-600">
              {plan.monthly_credits} 积分/月
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <Button 
              className="w-full" 
              variant={plan.buttonVariant}
              asChild
            >
              <Link href="/auth/register">
                {plan.buttonText}
              </Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}



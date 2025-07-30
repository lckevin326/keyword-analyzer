'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'

interface MembershipPlan {
  plan_id: string
  plan_name: string
  monthly_price: number
  monthly_credits: number
  sort_order: number
  is_active: boolean
}

interface UserSubscription {
  plan_id: string
  status: string
}

export default function PlanComparison() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取所有会员方案（无需登录）
      const plansResponse = await fetch('/api/membership/plans')
      if (!plansResponse.ok) throw new Error('获取会员方案失败')
      const plansData = await plansResponse.json()
      
      // 获取当前订阅（需要登录，未登录时跳过）
      const { data: { user } } = await supabase.auth.getUser()
      let subscriptionData = { data: null }
      
      setIsLoggedIn(!!user)
      
      if (user) {
        try {
          const subscriptionResponse = await fetch('/api/membership/subscription', {
            credentials: 'same-origin'
          })
          subscriptionData = await subscriptionResponse.json()
        } catch (err) {
          // 如果获取订阅信息失败，但不影响显示方案
          console.log('获取订阅信息失败，用户可能未登录')
        }
      }
      
      setPlans(plansData.data || [])
      setCurrentSubscription(subscriptionData.data)
    } catch {
      console.error('获取会员方案失败')
      setError('获取会员方案失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (planId: string) => {
    try {
      setPurchasing(planId)
      
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 如果未登录，跳转到登录页面
        window.location.href = '/auth/login?redirectTo=' + encodeURIComponent('/membership/plans')
        return
      }
      
      const response = await fetch('/api/membership/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          plan_id: planId,
          payment_method: 'mock'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '购买失败')
      }
      
      // 购买成功，刷新数据
      await fetchData()
      alert('购买成功！')
    } catch (err) {
      alert(err instanceof Error ? err.message : '购买失败')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Loading />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600">错误: {error}</div>
        <Button onClick={fetchData} className="mt-2">重试</Button>
      </Card>
    )
  }

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId && currentSubscription?.status === 'active'
  }

  const getPlanFeatures = (planId: string) => {
    const features: { [key: string]: string[] } = {
      'free': [
        '100积分/月',
        '基础关键词分析',
        '每日5次查询限制',
        '基础技术支持'
      ],
      'basic': [
        '500积分/月',
        '竞争对手分析',
        '内容助手功能',
        '每日20次查询',
        '邮件技术支持'
      ],
      'pro': [
        '2000积分/月',
        '高级关键词分析',
        '批量关键词处理',
        '每日100次查询',
        '优先技术支持',
        '数据导出功能'
      ],
      'enterprise': [
        '10000积分/月',
        '企业级API访问',
        '无限查询次数',
        '定制化报告',
        '专属客服支持',
        '高级数据分析'
      ]
    }
    return features[planId] || []
  }

  const getPopularBadge = (planId: string) => {
    if (planId === 'pro') {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 text-xs rounded-full">
            最受欢迎
          </span>
        </div>
      )
    }
    return null
  }

  const getPlanColor = (planId: string) => {
    const colors: { [key: string]: string } = {
      'free': 'border-gray-200',
      'basic': 'border-green-200',
      'pro': 'border-blue-500 border-2',
      'enterprise': 'border-purple-200'
    }
    return colors[planId] || 'border-gray-200'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <Card key={plan.plan_id} className={`relative p-6 ${getPlanColor(plan.plan_id)}`}>
          {getPopularBadge(plan.plan_id)}
          
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
            {getPlanFeatures(plan.plan_id).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            {isCurrentPlan(plan.plan_id) ? (
              <Button className="w-full" disabled>
                当前方案
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(plan.plan_id)}
                disabled={purchasing === plan.plan_id}
                variant={plan.plan_id === 'pro' ? 'default' : 'outline'}
              >
                {purchasing === plan.plan_id ? '处理中...' : 
                 !isLoggedIn ? (plan.monthly_price === 0 ? '注册使用' : '登录购买') :
                 plan.monthly_price === 0 ? '使用免费版' : '立即购买'}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}


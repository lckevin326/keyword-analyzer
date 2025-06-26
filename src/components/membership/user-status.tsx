'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'

interface UserCredits {
  current_balance: number
  total_earned: number
  total_purchased: number
  total_used: number
}

interface UserSubscription {
  plan_name: string
  status: string
  current_period_end: string
  monthly_credits: number
}

export default function UserStatus() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserStatus()
  }, [])

  const fetchUserStatus = async () => {
    try {
      setLoading(true)
      
      // 获取积分信息
      const creditsResponse = await fetch('/api/membership/credits')
      if (!creditsResponse.ok) throw new Error('获取积分信息失败')
      const creditsData = await creditsResponse.json()
      
      // 获取订阅信息
      const subscriptionResponse = await fetch('/api/membership/subscription')
      if (!subscriptionResponse.ok) throw new Error('获取订阅信息失败')
      const subscriptionData = await subscriptionResponse.json()
      
      setCredits(creditsData.data)
      setSubscription(subscriptionData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <Loading />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600">错误: {error}</div>
        <Button onClick={fetchUserStatus} className="mt-2">重试</Button>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600'
      case 'expired':
      case 'cancelled':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '激活中'
      case 'expired':
        return '已过期'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 积分信息卡片 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">积分余额</h3>
          <Link href="/credits/purchase">
            <Button size="sm">充值积分</Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {credits?.current_balance || 0}
            </div>
            <div className="text-sm text-gray-600">当前余额</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-green-600">
                {credits?.total_earned || 0}
              </div>
              <div className="text-gray-600">总获得</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">
                {credits?.total_purchased || 0}
              </div>
              <div className="text-gray-600">已购买</div>
            </div>
            <div>
              <div className="font-medium text-red-600">
                {credits?.total_used || 0}
              </div>
              <div className="text-gray-600">已使用</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 会员信息卡片 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">会员状态</h3>
          <Link href="/membership/plans">
            <Button size="sm" variant="outline">升级会员</Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">当前方案</span>
            <span className="font-medium">{subscription?.plan_name || '免费版'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">状态</span>
            <span className={`font-medium ${getStatusColor(subscription?.status || 'active')}`}>
              {getStatusText(subscription?.status || 'active')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">到期时间</span>
            <span className="font-medium">
              {subscription?.current_period_end ? formatDate(subscription.current_period_end) : '永久'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">每月赠送积分</span>
            <span className="font-medium text-blue-600">
              {subscription?.monthly_credits || 100}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
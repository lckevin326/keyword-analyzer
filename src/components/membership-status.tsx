'use client'

import { useState, useEffect } from 'react'
import { Crown, Loader2, Settings, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface MembershipStatusProps {
  className?: string
}

interface SubscriptionData {
  plan_id: string
  plan_name?: string
  status: string
}

export default function MembershipStatus({ className = '' }: MembershipStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchSubscription()
    
    // 设置定期更新（每30秒）
    const interval = setInterval(fetchSubscription, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      const response = await fetch('/api/membership/subscription', {
        credentials: 'same-origin'
      })
      const data = await response.json()
      
      if (data.success && data.data.subscription) {
        setSubscription(data.data.subscription)
        setError(null)
      } else {
        setError('获取会员状态失败')
      }
    } catch (err) {
      console.error('获取会员状态失败:', err)
      setError('获取会员状态失败')
    } finally {
      setLoading(false)
    }
  }

  const getPlanDisplayName = (planId: string) => {
    const planNames = {
      'free': '免费版',
      'basic': '基础版', 
      'pro': '专业版',
      'enterprise': '企业版'
    }
    return planNames[planId as keyof typeof planNames] || planId
  }

  const getPlanColor = (planId: string) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-700 border-gray-200',
      'basic': 'bg-blue-100 text-blue-700 border-blue-200',
      'pro': 'bg-purple-100 text-purple-700 border-purple-200',
      'enterprise': 'bg-gold-100 text-gold-700 border-gold-200'
    }
    return colors[planId as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // 防止hydration不匹配，客户端mount前显示占位符
  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gray-100 border-gray-200 ${className}`}>
        <Crown className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
        </span>
      </div>
    )
  }

  // 如果用户未登录，不显示会员状态
  if (!subscription && !loading) {
    return null
  }

  return (
    <div className={`relative group ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer hover:shadow-md transition-all ${getPlanColor(subscription?.plan_id || 'free')}`}>
        <Crown className="h-4 w-4" />
        <span className="text-sm font-medium">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <span className="text-red-600 text-xs">--</span>
          ) : (
            getPlanDisplayName(subscription?.plan_id || 'free')
          )}
        </span>
        <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
      </div>
      
      {/* Dropdown Menu */}
      <div className="absolute top-full right-0 mt-1 w-56 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <div className="px-3 py-2 text-sm text-muted-foreground border-b">
            当前会员状态
          </div>
          <div className="px-3 py-2">
            <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${getPlanColor(subscription?.plan_id || 'free')}`}>
              <Crown className="h-4 w-4" />
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : error ? (
                <span className="text-red-600">获取失败</span>
              ) : (
                getPlanDisplayName(subscription?.plan_id || 'free')
              )}
            </div>
          </div>
          <div className="border-t mt-2 pt-2">
            <Link 
              href="/membership/plans"
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Crown className="h-4 w-4" />
              <span>升级会员</span>
            </Link>
            <Link 
              href="/membership/permissions"
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>权限管理</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// 用于手动刷新会员状态的Hook
export function useMembershipRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshMembership = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  return { refreshMembership, refreshTrigger }
}
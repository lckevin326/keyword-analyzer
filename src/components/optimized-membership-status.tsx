'use client'

import { useState, useEffect, useCallback } from 'react'
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

// 全局缓存
let cachedSubscription: SubscriptionData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export default function OptimizedMembershipStatus({ className = '' }: MembershipStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(cachedSubscription)
  const [loading, setLoading] = useState(!cachedSubscription)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchSubscription = useCallback(async (useCache = true) => {
    try {
      // 检查缓存
      if (useCache && cachedSubscription && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setSubscription(cachedSubscription)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await fetch('/api/membership/subscription', {
        credentials: 'same-origin',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.data.subscription) {
        cachedSubscription = data.data.subscription
        cacheTimestamp = Date.now()
        setSubscription(cachedSubscription)
        setError(null)
      } else {
        // 设置默认状态
        const defaultSubscription = { plan_id: 'free', status: 'active' }
        cachedSubscription = defaultSubscription
        cacheTimestamp = Date.now()
        setSubscription(defaultSubscription)
        setError(null)
      }
    } catch (err) {
      console.error('获取会员状态失败:', err)
      setError('获取会员状态失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchSubscription()
  }, [fetchSubscription])

  const refreshSubscription = useCallback(() => {
    fetchSubscription(false) // 强制刷新，不使用缓存
  }, [fetchSubscription])

  const getPlanDisplayName = (planId: string) => {
    const planNames = {
      'free': '免费版',
      'basic': '基础版', 
      'pro': '专业版',
      'professional': '专业版',
      'enterprise': '企业版'
    }
    return planNames[planId as keyof typeof planNames] || planId
  }

  const getPlanColor = (planId: string) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-700 border-gray-200',
      'basic': 'bg-blue-100 text-blue-700 border-blue-200',
      'pro': 'bg-purple-100 text-purple-700 border-purple-200',
      'professional': 'bg-purple-100 text-purple-700 border-purple-200',
      'enterprise': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
    return colors[planId as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // 防止hydration不匹配
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
  if (!subscription && !loading && !error) {
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
          {error && (
            <button 
              onClick={refreshSubscription}
              className="w-full px-3 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              点击重试
            </button>
          )}
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
            <button 
              onClick={refreshSubscription}
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors w-full text-left"
              disabled={loading}
            >
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新状态</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 暴露刷新会员状态的全局方法
export const refreshGlobalMembership = () => {
  cachedSubscription = null
  cacheTimestamp = 0
}
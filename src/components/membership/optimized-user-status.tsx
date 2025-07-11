'use client'

import { useState, useEffect, useCallback } from 'react'
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
  current_period_end: string | null
  monthly_credits: number
}

interface UserStatus {
  credits: UserCredits
  subscription: UserSubscription
  permissions: Record<string, any>
}

// 简单的内存缓存
let cachedUserStatus: UserStatus | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export default function OptimizedUserStatus() {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(cachedUserStatus)
  const [loading, setLoading] = useState(!cachedUserStatus)
  const [error, setError] = useState<string | null>(null)

  const fetchUserStatus = useCallback(async (useCache = true) => {
    try {
      // 检查缓存
      if (useCache && cachedUserStatus && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setUserStatus(cachedUserStatus)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/status', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取用户状态失败')
      }

      // 更新缓存
      cachedUserStatus = result.data
      cacheTimestamp = Date.now()
      setUserStatus(result.data)
    } catch (err) {
      console.error('获取用户状态失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserStatus()
  }, [fetchUserStatus])

  const refreshData = useCallback(() => {
    fetchUserStatus(false) // 强制刷新，不使用缓存
  }, [fetchUserStatus])

  if (loading && !userStatus) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">错误: {error}</div>
          <Button onClick={refreshData} disabled={loading}>
            {loading ? <Loading size="sm" /> : '重试'}
          </Button>
        </div>
      </Card>
    )
  }

  if (!userStatus) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          暂无数据
        </div>
      </Card>
    )
  }

  const { credits, subscription } = userStatus

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '永久'
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
    <div className="space-y-4">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshData}
          disabled={loading}
        >
          {loading ? <Loading size="sm" /> : '刷新'}
        </Button>
      </div>

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
                {credits.current_balance}
              </div>
              <div className="text-sm text-gray-600">当前余额</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-green-600">
                  {credits.total_earned}
                </div>
                <div className="text-gray-600">总获得</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">
                  {credits.total_purchased}
                </div>
                <div className="text-gray-600">已购买</div>
              </div>
              <div>
                <div className="font-medium text-red-600">
                  {credits.total_used}
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
              <span className="font-medium">{subscription.plan_name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">状态</span>
              <span className={`font-medium ${getStatusColor(subscription.status)}`}>
                {getStatusText(subscription.status)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">到期时间</span>
              <span className="font-medium">
                {formatDate(subscription.current_period_end)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">每月赠送积分</span>
              <span className="font-medium text-blue-600">
                {subscription.monthly_credits}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
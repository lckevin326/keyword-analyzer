'use client'

import { useState, useEffect, useCallback } from 'react'
import { Coins, Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { creditRefreshManager } from '@/lib/credit-refresh'
import Link from 'next/link'

interface CreditDisplayProps {
  className?: string
}

export default function CreditDisplay({ className = '' }: CreditDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCredits(null)
        setLoading(false)
        return
      }

      // 先尝试获取积分
      const response = await fetch('/api/membership/credits?simple=true', {
        credentials: 'same-origin'
      })
      const data = await response.json()
      
      if (data.success) {
        setCredits(data.data.current_credits)
        setError(null)
      } else {
        // 如果获取失败，尝试确保用户有订阅
        console.log('积分获取失败，尝试初始化用户订阅...')
        
        const initResponse = await fetch('/api/auth/ensure-subscription', {
          method: 'POST',
          credentials: 'same-origin'
        })
        const initData = await initResponse.json()
        
        if (initData.success) {
          // 重新获取积分
          setTimeout(() => fetchCredits(), 1000) // 1秒后重试
        } else {
          setError('初始化失败')
        }
      }
    } catch (err) {
      console.error('获取积分失败:', err)
      setError('获取积分失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchCredits()
    
    // 注册全局刷新监听器
    const unsubscribe = creditRefreshManager.subscribe(() => {
      fetchCredits()
    })
    
    // 设置定期更新（每30秒）
    const interval = setInterval(fetchCredits, 30000)
    
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [fetchCredits])

  // 防止hydration不匹配，客户端mount前显示占位符
  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200 ${className}`}>
        <Coins className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      </div>
    )
  }

  // 如果用户未登录，不显示积分
  if (credits === null && !loading) {
    return null
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-colors">
        <Coins className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <span className="text-red-600 text-xs">--</span>
          ) : (
            `${credits} 积分`
          )}
        </span>
        <Plus className="h-3 w-3 text-blue-600 opacity-60 group-hover:opacity-100" />
      </div>
      
      {/* Dropdown Menu */}
      <div className="absolute top-full right-0 mt-1 w-56 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <div className="px-3 py-2 text-sm text-muted-foreground border-b">
            当前积分余额
          </div>
          <div className="px-3 py-2 text-lg font-semibold text-foreground">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : error ? (
              <span className="text-red-600">获取失败</span>
            ) : (
              `${credits} 积分`
            )}
          </div>
          <div className="border-t mt-2 pt-2">
            <Link 
              href="/credits/purchase"
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>购买积分</span>
            </Link>
            <Link 
              href="/usage/stats"
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Coins className="h-4 w-4" />
              <span>使用记录</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// 用于手动刷新积分的Hook
export function useCreditRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshCredits = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  return { refreshCredits, refreshTrigger }
}

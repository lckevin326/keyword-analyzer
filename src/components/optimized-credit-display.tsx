'use client'

import { useState, useEffect, useCallback } from 'react'
import { Coins, Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface CreditDisplayProps {
  className?: string
}

// 全局缓存
let cachedCredits: number | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export default function OptimizedCreditDisplay({ className = '' }: CreditDisplayProps) {
  const [credits, setCredits] = useState<number | null>(cachedCredits)
  const [loading, setLoading] = useState(!cachedCredits)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchCredits = useCallback(async (useCache = true) => {
    try {
      // 检查缓存
      if (useCache && cachedCredits !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setCredits(cachedCredits)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setCredits(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await fetch('/api/membership/credits?simple=true', {
        credentials: 'same-origin',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        cachedCredits = data.data.current_credits
        cacheTimestamp = Date.now()
        setCredits(cachedCredits)
        setError(null)
      } else {
        throw new Error(data.error || '获取积分失败')
      }
    } catch (err) {
      console.error('获取积分失败:', err)
      setError('获取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchCredits()
  }, [fetchCredits])

  // 手动刷新积分
  const refreshCredits = useCallback(() => {
    fetchCredits(false) // 强制刷新，不使用缓存
  }, [fetchCredits])

  // 防止hydration不匹配
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
  if (credits === null && !loading && !error) {
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
          {error && (
            <button 
              onClick={refreshCredits}
              className="w-full px-3 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              点击重试
            </button>
          )}
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
            <button 
              onClick={refreshCredits}
              className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors w-full text-left"
              disabled={loading}
            >
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新余额</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 暴露刷新积分的全局方法
export const refreshGlobalCredits = () => {
  cachedCredits = null
  cacheTimestamp = 0
}
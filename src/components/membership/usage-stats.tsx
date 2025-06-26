'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface UsageStats {
  feature_code: string
  feature_name: string
  total_usage: number
  total_credits: number
  today_usage: number
  today_credits: number
  this_month_usage: number
  this_month_credits: number
}

interface DailyUsage {
  usage_date: string
  total_usage: number
  total_credits: number
}

export default function UsageStats() {
  const [stats, setStats] = useState<UsageStats[]>([])
  const [dailyStats, setDailyStats] = useState<DailyUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'7' | '30'>('7')

  useEffect(() => {
    fetchUsageStats()
  }, [period])

  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/membership/usage?days=${period}`)
      if (!response.ok) throw new Error('获取使用统计失败')
      
      const result = await response.json()
      setStats(result.data.stats || [])
      setDailyStats(result.data.daily || [])
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
        <Button onClick={fetchUsageStats} className="mt-2">重试</Button>
      </Card>
    )
  }

  const totalUsage = stats.reduce((sum, stat) => sum + stat.total_usage, 0)
  const totalCredits = stats.reduce((sum, stat) => sum + stat.total_credits, 0)
  const todayUsage = stats.reduce((sum, stat) => sum + stat.today_usage, 0)
  const todayCredits = stats.reduce((sum, stat) => sum + stat.today_credits, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getMaxUsage = () => {
    return Math.max(...dailyStats.map(d => d.total_usage), 1)
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{todayUsage}</div>
            <div className="text-sm text-gray-600">今日使用次数</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{todayCredits}</div>
            <div className="text-sm text-gray-600">今日消耗积分</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalUsage}</div>
            <div className="text-sm text-gray-600">总使用次数</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalCredits}</div>
            <div className="text-sm text-gray-600">总消耗积分</div>
          </div>
        </Card>
      </div>

      {/* 时间范围选择 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">使用趋势</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={period === '7' ? 'default' : 'outline'}
              onClick={() => setPeriod('7')}
            >
              最近7天
            </Button>
            <Button 
              size="sm" 
              variant={period === '30' ? 'default' : 'outline'}
              onClick={() => setPeriod('30')}
            >
              最近30天
            </Button>
          </div>
        </div>

        {/* 简单的柱状图 */}
        <div className="space-y-2">
          {dailyStats.slice(-parseInt(period)).map((day, index) => {
            const percentage = (day.total_usage / getMaxUsage()) * 100
            
            return (
              <div key={day.usage_date} className="flex items-center gap-3">
                <div className="w-16 text-sm text-gray-600">
                  {formatDate(day.usage_date)}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded relative">
                  <div 
                    className="h-full bg-blue-500 rounded transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-700">
                    {day.total_usage > 0 && `${day.total_usage}次`}
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  {day.total_credits}积分
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 功能使用详情 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">功能使用详情</h3>
        
        {stats.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无使用记录
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.feature_code} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{stat.feature_name}</h4>
                  <div className="text-sm text-gray-600">
                    今日: {stat.today_usage}次 | 本月: {stat.this_month_usage}次
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{stat.total_usage}</div>
                    <div className="text-gray-600">总使用次数</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{stat.total_credits}</div>
                    <div className="text-gray-600">总消耗积分</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{stat.today_usage}</div>
                    <div className="text-gray-600">今日使用</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">{stat.today_credits}</div>
                    <div className="text-gray-600">今日积分</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
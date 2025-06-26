'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface Feature {
  feature_code: string
  feature_name: string
  description: string
  credits_cost: number
  category: string
}

interface Permission {
  feature_code: string
  is_enabled: boolean
  daily_limit: number
  credits_required: number
  daily_used?: number
}

interface PermissionStatus {
  features: (Feature & { permission: Permission })[]
  user_logged_in: boolean
}

export default function PermissionStatus() {
  const [data, setData] = useState<PermissionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPermissionStatus()
  }, [])

  const fetchPermissionStatus = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/membership/features')
      if (!response.ok) throw new Error('获取权限信息失败')
      
      const result = await response.json()
      console.log('权限管理组件 - API响应:', result)
      
      // 确保数据结构正确
      if (result.success && result.data && Array.isArray(result.data.features)) {
        setData(result.data)
        setError(null)
      } else {
        throw new Error('API响应数据格式不正确')
      }
    } catch (err) {
      console.error('权限管理组件 - 获取数据失败:', err)
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
        <Button onClick={fetchPermissionStatus} className="mt-2">重试</Button>
      </Card>
    )
  }


  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'basic': '基础功能',
      'advanced': '高级功能', 
      'professional': '专业功能'
    }
    return names[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'basic': 'bg-green-100 text-green-800',
      'advanced': 'bg-blue-100 text-blue-800',
      'professional': 'bg-purple-100 text-purple-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (permission: Permission | undefined) => {
    if (!permission) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">未配置</span>
    }
    
    if (!permission.is_enabled) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">未开放</span>
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">可使用</span>
  }

  const formatUsageInfo = (permission: Permission | undefined) => {
    if (!permission || !permission.is_enabled) return '不可用'
    
    const parts = []
    if (permission.credits_required > 0) {
      parts.push(`${permission.credits_required}积分/次`)
    }
    if (permission.daily_limit > 0) {
      const used = permission.daily_used || 0
      parts.push(`${used}/${permission.daily_limit}次/日`)
    } else {
      parts.push('无限制')
    }
    
    return parts.join(' • ')
  }

  // 按类别分组功能
  const groupedFeatures = data?.features?.reduce((acc, feature) => {
    if (!feature || !feature.category) {
      console.warn('权限管理组件 - 发现无效功能项:', feature)
      return acc
    }
    
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as { [key: string]: (Feature & { permission: Permission })[] }) || {}
  
  console.log('权限管理组件 - 分组后的功能:', groupedFeatures)

  return (
    <div className="space-y-6">
      {Object.entries(groupedFeatures).map(([category, features]) => (
        <Card key={category} className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">{getCategoryName(category)}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
              {features.length} 个功能
            </span>
          </div>
          
          <div className="space-y-3">
            {features.map((feature) => {
              const permission = feature?.permission
              
              return (
                <div key={feature.feature_code} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.feature_name}</h4>
                        {getStatusBadge(permission)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="text-sm text-gray-500">
                        {formatUsageInfo(permission)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
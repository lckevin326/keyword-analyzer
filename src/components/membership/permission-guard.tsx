'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { usePermission, getPermissionMessage } from '@/hooks/use-permission'
import Link from 'next/link'

interface PermissionGuardProps {
  featureCode: string
  children: ReactNode
  fallback?: ReactNode
}

export default function PermissionGuard({ 
  featureCode, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { canUse, loading, error, permission, checkPermission } = usePermission(featureCode)

  if (loading) {
    return (
      <Card className="p-6">
        <Loading />
        <div className="text-center text-sm text-gray-600 mt-2">
          正在检查权限...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">权限检查失败: {error}</div>
        <Button onClick={checkPermission} variant="outline" size="sm">
          重试
        </Button>
      </Card>
    )
  }

  if (!canUse) {
    if (fallback) {
      return <>{fallback}</>
    }

    const message = permission ? getPermissionMessage(permission.reason) : '权限不足'
    
    return (
      <Card className="p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">功能受限</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        
        {permission && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">所需积分:</span>
                <span className="font-medium ml-2">{permission.credits_required}</span>
              </div>
              <div>
                <span className="text-gray-600">每日限制:</span>
                <span className="font-medium ml-2">
                  {permission.daily_limit === 0 ? '无限制' : `${permission.daily_used}/${permission.daily_limit}`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {permission?.reason === 'not_logged_in' ? (
            <Link href="/auth/login">
              <Button>立即登录</Button>
            </Link>
          ) : permission?.reason === 'feature_disabled' ? (
            <Link href="/membership/plans">
              <Button>升级会员</Button>
            </Link>
          ) : permission?.reason === 'insufficient_credits' ? (
            <Link href="/credits/purchase">
              <Button>购买积分</Button>
            </Link>
          ) : (
            <Link href="/membership/plans">
              <Button>查看会员方案</Button>
            </Link>
          )}
          <Button onClick={checkPermission} variant="outline">
            重新检查
          </Button>
        </div>
      </Card>
    )
  }

  return <>{children}</>
}

// 权限提示组件
export function PermissionBanner({ 
  featureCode 
}: { 
  featureCode: string 
}) {
  const { permission, loading } = usePermission(featureCode)

  // 正在加载中，不显示横幅
  if (loading) {
    return null
  }

  // 如果有权限，不显示横幅
  if (permission?.has_permission) {
    return null
  }

  // 如果用户未登录，显示登录提示
  if (permission?.reason === 'not_logged_in') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-blue-600">ℹ️</span>
          <div className="flex-1">
            <h4 className="font-medium text-blue-800 mb-1">
              功能说明
            </h4>
            <p className="text-blue-700 text-sm mb-3">
              此功能需要消耗积分使用。注册登录后可获得免费积分，体验所有功能。
            </p>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button size="sm">
                  立即登录
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" variant="outline">
                  免费注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 其他权限问题显示黄色警告
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-yellow-600">⚠️</span>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-1">
            权限提醒
          </h4>
          <p className="text-yellow-700 text-sm mb-3">
            {getPermissionMessage(permission?.reason || 'unknown')}
          </p>
          <div className="flex gap-2">
            {permission?.reason === 'insufficient_credits' ? (
              <Link href="/credits/purchase">
                <Button size="sm">
                  购买积分
                </Button>
              </Link>
            ) : (
              <Link href="/membership/plans">
                <Button size="sm">
                  升级会员
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
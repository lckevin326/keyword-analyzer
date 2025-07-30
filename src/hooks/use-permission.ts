'use client'

import { useState, useEffect, useCallback } from 'react'

interface PermissionResult {
  has_permission: boolean
  reason: 'allowed' | 'feature_disabled' | 'daily_limit_exceeded' | 'insufficient_credits' | 'not_logged_in'
  credits_required: number
  daily_limit: number
  daily_used: number
}

interface UsePermissionResult {
  canUse: boolean
  loading: boolean
  error: string | null
  permission: PermissionResult | null
  checkPermission: () => Promise<void>
}

export function usePermission(featureCode: string): UsePermissionResult {
  const [permission, setPermission] = useState<PermissionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkPermission = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/membership/check-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ feature_code: featureCode })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setPermission({
            has_permission: false,
            reason: 'not_logged_in',
            credits_required: 0,
            daily_limit: 0,
            daily_used: 0
          })
          return
        }
        throw new Error('检查权限失败')
      }
      
      const result = await response.json()
      setPermission(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '检查权限失败')
    } finally {
      setLoading(false)
    }
  }, [featureCode])

  useEffect(() => {
    if (featureCode) {
      checkPermission()
    }
  }, [featureCode, checkPermission])

  return {
    canUse: permission?.has_permission || false,
    loading,
    error,
    permission,
    checkPermission
  }
}

export function getPermissionMessage(reason: string): string {
  const messages: { [key: string]: string } = {
    'feature_disabled': '该功能未开放，请升级会员',
    'daily_limit_exceeded': '今日使用次数已达上限',
    'insufficient_credits': '积分余额不足，请充值',
    'not_logged_in': '请先登录'
  }
  return messages[reason] || '权限不足'
}

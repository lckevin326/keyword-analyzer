import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientForAPI } from './supabase-server'
import { MembershipService } from './membership'

// 权限中间件配置
export interface PermissionConfig {
  featureCode: string
  requireAuth?: boolean
  skipPermissionCheck?: boolean
}

// 权限验证结果
export interface PermissionResult {
  success: boolean
  user?: any
  permission?: any
  error?: string
}

// 权限验证中间件
export async function withPermissionCheck(
  request: NextRequest,
  config: PermissionConfig
): Promise<PermissionResult> {
  try {
    const supabase = createServerSupabaseClientForAPI(request)
    
    // 1. 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message,
      requireAuth: config.requireAuth 
    })
    
    if (config.requireAuth !== false && (authError || !user)) {
      console.log('Auth failed:', { authError: authError?.message, hasUser: !!user })
      return {
        success: false,
        error: '未授权访问'
      }
    }

    // 2. 如果不需要检查权限或用户未登录，直接返回成功
    if (config.skipPermissionCheck || !user) {
      return {
        success: true,
        user
      }
    }

    // 3. 检查功能权限
    const membershipService = new MembershipService()
    const permission = await membershipService.checkFeaturePermission(user.id, config.featureCode)

    console.log(`Permission check for ${config.featureCode}:`, {
      userId: user.id,
      featureCode: config.featureCode,
      permission: permission
    })

    if (!permission.has_permission) {
      console.log(`Permission denied for ${config.featureCode}:`, permission.reason)
      return {
        success: false,
        user,
        permission,
        error: getPermissionErrorMessage(permission.reason)
      }
    }

    return {
      success: true,
      user,
      permission
    }

  } catch (error) {
    console.error('权限验证失败:', error)
    return {
      success: false,
      error: '系统错误'
    }
  }
}

// 获取权限错误消息
function getPermissionErrorMessage(reason: string): string {
  const messages: { [key: string]: string } = {
    'feature_disabled': '该功能未开放，请升级会员',
    'daily_limit_exceeded': '今日使用次数已达上限',
    'insufficient_credits': '积分余额不足，请充值',
    'not_logged_in': '请先登录'
  }
  return messages[reason] || '权限不足'
}

// 使用积分的权限验证（用于实际调用功能时）
export async function withFeatureUsage(
  request: NextRequest,
  config: PermissionConfig,
  handler: (user: any, permission: any, membershipService: MembershipService, requestData: any) => Promise<any>
): Promise<NextResponse> {
  try {
    // 1. 权限验证
    const permissionResult = await withPermissionCheck(request, config)
    
    if (!permissionResult.success) {
      console.log('Permission check failed:', permissionResult.error)
      return NextResponse.json({
        error: permissionResult.error
      }, { status: permissionResult.error === '未授权访问' ? 401 : 403 })
    }

    const { user, permission } = permissionResult
    const membershipService = new MembershipService()

    // 2. 读取请求数据（只读取一次）
    let requestData = {}
    try {
      requestData = await request.json()
    } catch (error) {
      // 如果请求体为空或格式错误，使用空对象
    }

    // 3. 如果需要消耗积分，先扣除积分
    let usageResult
    if (permission && permission.credits_required > 0) {
      usageResult = await membershipService.useFeature(
        user.id,
        config.featureCode,
        requestData
      )

      if (!usageResult.success) {
        return NextResponse.json({
          error: getPermissionErrorMessage(usageResult.error || 'usage_failed')
        }, { status: 403 })
      }
    }

    // 4. 执行实际业务逻辑（传递已解析的请求数据）
    const result = await handler(user, permission, membershipService, requestData)

    // 4. 如果有使用记录，更新响应数据摘要
    if (usageResult?.usageId && result) {
      // 这里可以更新使用记录的响应数据摘要
      // 暂时跳过，避免额外的数据库调用
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('功能执行失败:', error)
    return NextResponse.json({
      error: error.message || '系统错误'
    }, { status: 500 })
  }
}

// 简化的权限检查装饰器
export function requirePermission(featureCode: string, requireAuth: boolean = true) {
  return function(handler: Function) {
    return async function(request: NextRequest) {
      const permissionResult = await withPermissionCheck(request, {
        featureCode,
        requireAuth
      })

      if (!permissionResult.success) {
        return NextResponse.json({
          error: permissionResult.error
        }, { status: permissionResult.error === '未授权访问' ? 401 : 403 })
      }

      // 将用户和权限信息传递给处理函数
      return handler(request, permissionResult.user, permissionResult.permission)
    }
  }
}

// 仅验证登录状态（用于页面访问，不检查具体功能权限）
export async function withAuthOnly(
  request: NextRequest,
  handler: (user: any, membershipService: MembershipService) => Promise<any>
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabaseClientForAPI(request)
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        error: '未授权访问'
      }, { status: 401 })
    }

    const membershipService = new MembershipService()
    
    // 执行业务逻辑
    const result = await handler(user, membershipService)
    
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('功能执行失败:', error)
    return NextResponse.json({
      error: error.message || '系统错误'
    }, { status: 500 })
  }
}

// 中间件类型定义
export type PermissionMiddleware = (
  request: NextRequest,
  handler: (user: any, permission: any) => Promise<NextResponse>
) => Promise<NextResponse>

// 创建权限中间件工厂
export function createPermissionMiddleware(featureCode: string): PermissionMiddleware {
  return async function(request: NextRequest, handler: Function): Promise<NextResponse> {
    const permissionResult = await withPermissionCheck(request, {
      featureCode,
      requireAuth: true
    })

    if (!permissionResult.success) {
      return NextResponse.json({
        error: permissionResult.error
      }, { status: permissionResult.error === '未授权访问' ? 401 : 403 })
    }

    return handler(permissionResult.user, permissionResult.permission)
  }
}

// 批量权限检查（用于页面级权限）
export async function checkMultiplePermissions(
  userId: string,
  featureCodes: string[]
): Promise<{ [featureCode: string]: any }> {
  const membershipService = new MembershipService()
  const results: { [featureCode: string]: any } = {}

  for (const featureCode of featureCodes) {
    try {
      results[featureCode] = await membershipService.checkFeaturePermission(userId, featureCode)
    } catch (error) {
      results[featureCode] = {
        has_permission: false,
        reason: 'check_failed',
        credits_required: 0,
        daily_limit: 0,
        daily_used: 0
      }
    }
  }

  return results
}

// React Hook 样式的权限检查结果类型
export interface PermissionHookResult {
  canUse: boolean
  reason?: string
  creditsRequired: number
  dailyLimit: number
  dailyUsed: number
  loading: boolean
}

// 权限状态常量
export const PERMISSION_REASONS = {
  ALLOWED: 'allowed',
  FEATURE_DISABLED: 'feature_disabled',
  DAILY_LIMIT_EXCEEDED: 'daily_limit_exceeded',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  NOT_LOGGED_IN: 'not_logged_in'
} as const

// 权限错误消息映射
export const PERMISSION_ERROR_MESSAGES = {
  [PERMISSION_REASONS.FEATURE_DISABLED]: '该功能未开放，请升级会员',
  [PERMISSION_REASONS.DAILY_LIMIT_EXCEEDED]: '今日使用次数已达上限',
  [PERMISSION_REASONS.INSUFFICIENT_CREDITS]: '积分余额不足，请充值',
  [PERMISSION_REASONS.NOT_LOGGED_IN]: '请先登录'
} as const
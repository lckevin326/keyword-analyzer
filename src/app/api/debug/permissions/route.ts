import { NextRequest } from 'next/server'

function withAuthOnly(
  request: NextRequest,
  handler: (user: any, membershipService: any) => Promise<any>
) {
  // 实现认证逻辑
  return handler({}, {})
}

export async function GET(request: NextRequest) {
  return withAuthOnly(
    request,
    async (user, membershipService) => {
      try {
        // Get user subscription
        const subscription = await membershipService.getUserSubscription(user.id)
        
        // Check content_outline permission specifically
        const contentOutlinePermission = await membershipService.checkFeaturePermission(user.id, 'content_outline')
        
        // Get all user permissions
        const allPermissions = await membershipService.getUserPermissions(user.id)
        
        // Debug information
        const debugInfo = {
          user: {
            id: user.id,
            email: user.email
          },
          subscription: subscription,
          contentOutlinePermission: contentOutlinePermission,
          allPermissions: allPermissions,
          timestamp: new Date().toISOString()
        }
        
        return {
          success: true,
          data: debugInfo
        }
      } catch (error: unknown) {
        console.error('Debug permissions failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Debug failed'
        }
      }
    }
  )
}




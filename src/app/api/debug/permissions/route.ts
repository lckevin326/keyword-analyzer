import { NextRequest, NextResponse } from 'next/server'
import { withAuthOnly } from '@/lib/permission-middleware'

export async function POST(request: NextRequest) {
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
      } catch (error: any) {
        console.error('Permission debug failed:', error)
        return {
          success: false,
          error: error.message,
          stack: error.stack
        }
      }
    }
  )
}
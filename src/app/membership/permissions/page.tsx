import PermissionStatus from '@/components/membership/permission-status'
import UserStatus from '@/components/membership/user-status'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PermissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">功能权限管理</h1>
            <p className="text-gray-600">
              查看您当前会员方案的功能权限和使用限制
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/membership/plans">
              <Button variant="outline">升级会员</Button>
            </Link>
            <Link href="/credits/purchase">
              <Button>购买积分</Button>
            </Link>
          </div>
        </div>

        {/* 用户当前状态 */}
        <div className="mb-8">
          <UserStatus />
        </div>

        {/* 权限状态 */}
        <PermissionStatus />
      </div>
    </div>
  )
}
import CreditPurchase from '@/components/membership/credit-purchase'
import UserStatus from '@/components/membership/user-status'

export default function CreditsPurchasePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">购买积分</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            购买积分包享受更多功能使用次数，积分永久有效不过期
          </p>
        </div>

        {/* 用户当前状态 */}
        <div className="mb-8">
          <UserStatus />
        </div>

        {/* 积分购买 */}
        <CreditPurchase />
      </div>
    </div>
  )
}
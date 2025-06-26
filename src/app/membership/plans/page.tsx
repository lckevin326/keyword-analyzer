import PlanComparison from '@/components/membership/plan-comparison'
import UserStatus from '@/components/membership/user-status'

export default function MembershipPlansPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">选择适合您的会员方案</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            升级会员享受更多功能权限和积分赠送，提升您的关键词分析效率
          </p>
        </div>

        {/* 用户当前状态 */}
        <div className="mb-8">
          <UserStatus />
        </div>

        {/* 会员方案比较 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">会员方案对比</h2>
          <PlanComparison />
        </div>

        {/* 常见问题 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">常见问题</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Q: 如何升级会员？</h4>
              <p className="text-gray-600 text-sm">
                点击任意方案的"立即购买"按钮，即可升级到对应的会员等级。升级后立即生效。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Q: 积分如何使用？</h4>
              <p className="text-gray-600 text-sm">
                每次使用功能都会消耗相应积分，不同功能消耗积分数量不同。积分永久有效，不会过期。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Q: 可以随时取消订阅吗？</h4>
              <p className="text-gray-600 text-sm">
                可以，您可以随时取消订阅。取消后仍可使用至当前计费周期结束。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Q: 支持哪些支付方式？</h4>
              <p className="text-gray-600 text-sm">
                目前支持支付宝、微信支付、银行卡等多种支付方式。（当前为测试模式）
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
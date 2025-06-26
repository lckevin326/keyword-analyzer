'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface CreditPackage {
  package_code: string
  package_name: string
  credits_amount: number
  bonus_credits: number
  original_price: number
  sort_order: number
  is_active: boolean
}

interface UserCredits {
  current_balance: number
}

export default function CreditPurchase() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 使用模拟积分包数据（暂时）
      const mockPackages: CreditPackage[] = [
        {
          package_code: 'basic',
          package_name: '基础包',
          credits_amount: 500,
          bonus_credits: 50,
          original_price: 19.90,
          sort_order: 1,
          is_active: true
        },
        {
          package_code: 'standard',
          package_name: '标准包',
          credits_amount: 1000,
          bonus_credits: 150,
          original_price: 39.90,
          sort_order: 2,
          is_active: true
        },
        {
          package_code: 'premium',
          package_name: '高级包',
          credits_amount: 2500,
          bonus_credits: 500,
          original_price: 79.90,
          sort_order: 3,
          is_active: true
        },
        {
          package_code: 'enterprise',
          package_name: '企业包',
          credits_amount: 10000,
          bonus_credits: 2000,
          original_price: 199.90,
          sort_order: 4,
          is_active: true
        }
      ]
      
      // 获取用户当前积分
      const creditsResponse = await fetch('/api/membership/credits?simple=true', {
        credentials: 'same-origin'
      })
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        if (creditsData.success) {
          setUserCredits({ current_balance: creditsData.data.current_credits })
        }
      }
      
      setPackages(mockPackages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageCode: string) => {
    try {
      setPurchasing(packageCode)
      
      const response = await fetch('/api/membership/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          package_code: packageCode,
          payment_method: 'mock'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '购买失败')
      }
      
      // 购买成功，刷新数据
      await fetchData()
      alert('积分购买成功！')
    } catch (err) {
      alert(err instanceof Error ? err.message : '购买失败')
    } finally {
      setPurchasing(null)
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
        <Button onClick={fetchData} className="mt-2">重试</Button>
      </Card>
    )
  }

  const getPackageValue = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits_amount + pkg.bonus_credits
    const pricePerCredit = pkg.original_price / totalCredits
    return {
      totalCredits,
      pricePerCredit: pricePerCredit.toFixed(3),
      bonusPercentage: Math.round((pkg.bonus_credits / pkg.credits_amount) * 100)
    }
  }

  const getBestValueBadge = (packageCode: string) => {
    if (packageCode === 'pro_pack') {
      return (
        <div className="absolute -top-2 -right-2">
          <span className="bg-red-500 text-white px-2 py-1 text-xs rounded-full">
            最划算
          </span>
        </div>
      )
    }
    return null
  }

  const getPackageColor = (packageCode: string) => {
    const colors: { [key: string]: string } = {
      'basic_pack': 'border-gray-200',
      'standard_pack': 'border-green-200',
      'pro_pack': 'border-red-500 border-2',
      'enterprise_pack': 'border-purple-200'
    }
    return colors[packageCode] || 'border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* 当前积分余额 */}
      {userCredits && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-sm text-blue-600 mb-1">当前积分余额</div>
            <div className="text-2xl font-bold text-blue-800">
              {userCredits.current_balance}
            </div>
          </div>
        </Card>
      )}

      {/* 积分包列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(packages || []).map((pkg) => {
          const value = getPackageValue(pkg)
          
          return (
            <Card key={pkg.package_code} className={`relative p-6 ${getPackageColor(pkg.package_code)}`}>
              {getBestValueBadge(pkg.package_code)}
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold mb-2">{pkg.package_name}</h3>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {value.totalCredits}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">积分</span>
                </div>
                <div className="text-xl font-bold mb-1">
                  ¥{pkg.original_price}
                </div>
                <div className="text-xs text-gray-500">
                  ¥{value.pricePerCredit}/积分
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">基础积分</span>
                  <span className="font-medium">{pkg.credits_amount}</span>
                </div>
                {pkg.bonus_credits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">赠送积分</span>
                    <span className="font-medium text-green-600">
                      +{pkg.bonus_credits}
                    </span>
                  </div>
                )}
                {pkg.bonus_credits > 0 && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">总计</span>
                    <span className="font-bold text-blue-600">
                      {value.totalCredits}积分
                    </span>
                  </div>
                )}
              </div>

              {pkg.bonus_credits > 0 && (
                <div className="text-center mb-4">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    额外赠送 {value.bonusPercentage}%
                  </span>
                </div>
              )}

              <Button 
                className="w-full"
                onClick={() => handlePurchase(pkg.package_code)}
                disabled={purchasing === pkg.package_code}
                variant={pkg.package_code === 'pro_pack' ? 'default' : 'outline'}
              >
                {purchasing === pkg.package_code ? '处理中...' : '立即购买'}
              </Button>
            </Card>
          )
        })}
      </div>

      <Card className="p-6 bg-gray-50">
        <h4 className="font-semibold mb-3">购买说明</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div>• 积分永久有效，不会过期</div>
          <div>• 不同功能消耗不同积分，具体请查看功能说明</div>
          <div>• 积分可以与会员方案叠加使用</div>
          <div>• 支持多种支付方式（当前为测试模式）</div>
        </div>
      </Card>
    </div>
  )
}
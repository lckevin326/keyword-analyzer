'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface CreditTransaction {
  id: string
  transaction_type: 'earn' | 'use' | 'purchase' | 'expire' | 'refund'
  amount: number
  balance_before: number
  balance_after: number
  source: string
  description: string
  created_at: string
}

export default function CreditHistory() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  const fetchTransactions = async (pageNum: number) => {
    try {
      setLoading(pageNum === 1)
      
      const response = await fetch(`/api/membership/usage?page=${pageNum}&limit=20`)
      if (!response.ok) throw new Error('获取交易记录失败')
      
      const result = await response.json()
      const newTransactions = result.data || []
      
      if (pageNum === 1) {
        setTransactions(newTransactions)
      } else {
        setTransactions(prev => [...prev, ...newTransactions])
      }
      
      setHasMore(newTransactions.length === 20)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(page + 1)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return '🎁'
      case 'purchase':
        return '💰'
      case 'use':
        return '⚡'
      case 'expire':
        return '⏰'
      case 'refund':
        return '↩️'
      default:
        return '📝'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
      case 'purchase':
      case 'refund':
        return 'text-green-600'
      case 'use':
      case 'expire':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'earn': '获得',
      'purchase': '购买',
      'use': '消费',
      'expire': '过期',
      'refund': '退款'
    }
    return names[type] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  if (loading && transactions.length === 0) {
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
        <Button onClick={() => fetchTransactions(1)} className="mt-2">重试</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">积分使用记录</h3>
      
      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无积分交易记录
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="text-lg">
                  {getTransactionIcon(transaction.transaction_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {transaction.description}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getTransactionColor(transaction.transaction_type)}`}>
                      {getTransactionTypeName(transaction.transaction_type)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(transaction.created_at)} • 余额: {transaction.balance_after}
                  </div>
                </div>
              </div>
              <div className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <Button 
                onClick={loadMore} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
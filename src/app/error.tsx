'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台或错误监控服务
    console.error('应用错误:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">出现了错误</h2>
        <p className="text-muted-foreground mb-6">
          抱歉，页面加载时出现了问题。请尝试刷新页面或稍后重试。
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            错误代码: {error.digest}
          </p>
        )}
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发送失败，请重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <TrendingUp className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">关键词分析师</h1>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>邮件已发送</CardTitle>
              <CardDescription>
                我们已向您的邮箱发送了密码重置链接
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm text-center text-muted-foreground space-y-2">
                <p>请检查您的邮箱：<span className="font-medium">{email}</span></p>
                <p>点击邮件中的链接来重置您的密码</p>
                <p className="text-xs">如果您没有收到邮件，请检查垃圾邮件文件夹</p>
              </div>
            </CardContent>

            <CardFooter className="space-y-2">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回登录
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
              >
                重新发送邮件
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <TrendingUp className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">关键词分析师</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>忘记密码</CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将发送密码重置链接
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="输入您的邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loading size="sm" /> : '发送重置链接'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="space-y-2">
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回登录
              </Button>
            </Link>
            <div className="text-center text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link 
                href="/auth/register" 
                className="text-primary underline-offset-4 hover:underline"
              >
                立即注册
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

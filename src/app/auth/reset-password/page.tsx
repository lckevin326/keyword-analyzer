'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 检查是否有有效的重置密码会话
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidSession(true)
      } else {
        setError('无效的重置链接或链接已过期')
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 验证密码
    if (password.length < 6) {
      setError('密码长度至少为6位')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // 3秒后自动跳转到登录页面
      setTimeout(() => {
        router.push('/auth/login?message=password_updated')
      }, 3000)
    } catch (error: any) {
      setError(error.message || '密码重置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !validSession) {
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
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle>链接无效</CardTitle>
              <CardDescription>
                重置密码链接无效或已过期
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-center text-muted-foreground">
                <p>请重新申请密码重置或联系客服获取帮助</p>
              </div>
            </CardContent>

            <CardFooter className="space-y-2">
              <Link href="/auth/forgot-password" className="w-full">
                <Button className="w-full">
                  重新申请密码重置
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  返回登录
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
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
              <CardTitle>密码重置成功</CardTitle>
              <CardDescription>
                您的密码已成功更新
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-center text-muted-foreground">
                <p>正在跳转到登录页面...</p>
                <p className="text-xs mt-2">3秒后自动跳转</p>
              </div>
            </CardContent>

            <CardFooter>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">
                  立即登录
                </Button>
              </Link>
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
            <CardTitle>重置密码</CardTitle>
            <CardDescription>
              请输入您的新密码
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="输入新密码（至少6位）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>密码要求：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>至少6个字符</li>
                  <li>建议包含字母和数字</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loading size="sm" /> : '更新密码'}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                返回登录
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function DebugPermissionsPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testPermissions = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResult({ error: '请先登录' })
        return
      }

      const response = await fetch('/api/debug/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'same-origin'
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testContentOutlineAPI = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResult({ error: '请先登录' })
        return
      }

      const response = await fetch('/api/content/outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetKeyword: '测试关键词',
          targetAudience: 'content marketers', 
          searchIntent: 'informational',
          commonThemes: [],
          uniqueAngles: [],
          userQuestions: []
        })
      })

      const data = await response.json()
      setResult({ apiTest: data, responseStatus: response.status })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDirectAPI = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResult({ error: '请先登录' })
        return
      }

      const response = await fetch('/api/content/outline-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetKeyword: '测试关键词',
          targetAudience: 'content marketers', 
          searchIntent: 'informational',
          commonThemes: [],
          uniqueAngles: [],
          userQuestions: []
        })
      })

      const data = await response.json()
      setResult({ directApiTest: data, responseStatus: response.status })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testTitlesDirectAPI = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResult({ error: '请先登录' })
        return
      }

      const response = await fetch('/api/content/titles-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetKeyword: '测试关键词',
          coreAngle: 'guide'
        })
      })

      const data = await response.json()
      setResult({ titlesDirectApiTest: data, responseStatus: response.status })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCreditsDeduction = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResult({ error: '请先登录' })
        return
      }

      const response = await fetch('/api/debug/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      })

      const data = await response.json()
      setResult({ creditsDebugTest: data, responseStatus: response.status })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>权限调试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-x-2 flex flex-wrap gap-2">
            <Button onClick={testPermissions} disabled={loading}>
              运行权限调试
            </Button>
            <Button onClick={testContentOutlineAPI} disabled={loading}>
              测试内容大纲API
            </Button>
            <Button onClick={testDirectAPI} disabled={loading} variant="outline">
              测试大纲直接API
            </Button>
            <Button onClick={testTitlesDirectAPI} disabled={loading} variant="outline">
              测试标题直接API
            </Button>
            <Button onClick={testCreditsDeduction} disabled={loading} variant="secondary">
              调试积分扣除
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
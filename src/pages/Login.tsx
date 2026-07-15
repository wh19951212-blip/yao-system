import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { appConfig } from '@/config/app'
import { getSupabaseConfigHint, isSupabaseConfigured } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Login() {
  const { signIn, signInAsGuest, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请检查邮箱和密码'
      if (message === 'Failed to fetch') {
        setError(
          isSupabaseConfigured()
            ? '无法连接 Supabase 服务器。请检查网络，或在 Supabase → Authentication → URL Configuration 添加站点地址：https://wh19951212-blip.github.io/yao-system/'
            : (getSupabaseConfigHint() ?? 'Supabase 未配置，请联系管理员重新部署'),
        )
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B2B4B] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-md">
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-[#C9A84C]/40 flex items-center justify-center mb-8">
            <span className="text-[#C9A84C] text-xl font-bold">Y</span>
          </div>
          <h1 className="text-3xl font-semibold text-white mb-4 tracking-tight">
            {appConfig.name}
          </h1>
          <p className="text-white/60 leading-relaxed">
            日本高端房地产投资管理平台
            <br />
            森ビル · 野村不动产 · 私人银行级体验
          </p>
          <div className="mt-8 h-px w-16 bg-[#C9A84C]" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-semibold text-[#1B2B4B]">
              {appConfig.name}
            </h1>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-[#1A1A2A] mb-1">登录</h2>
              <p className="text-sm text-gray-500 mb-6">使用邮箱和密码登录系统</p>

              {error && <div className="alert-error mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="email" label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required autoComplete="email" />
                <Input id="password" label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required autoComplete="current-password" />
                <Button type="submit" className="w-full mt-2" disabled={submitting}>
                  {submitting ? '登录中...' : '登录'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">或</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  signInAsGuest()
                  navigate(from, { replace: true })
                }}
              >
                一键进入（无需账号）
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3">
                首次用邮箱登录会自动注册账号
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

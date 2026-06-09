import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { appConfig } from '@/config/app'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Login() {
  const { signIn, user, loading } = useAuth()
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
      setError(err instanceof Error ? err.message : '登录失败，请检查邮箱和密码')
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
            <span className="text-[#C9A84C] text-xl font-bold">投</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

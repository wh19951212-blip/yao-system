import { useEffect, useState } from 'react'
import {
  Bell,
  Building,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/config/settingsDefaults'
import {
  fetchAllUsers,
  inviteUser,
  updateUserRole,
  type AppUser,
  type UserRole,
} from '@/services/users'
import OperationLogsPanel from '@/components/settings/OperationLogsPanel'
import { useToast } from '@/contexts/ToastContext'

export default function SettingsPage() {
  const { isAdmin, profile, refreshProfile } = useAuth()
  const { settings, saveSettings, loading: settingsLoading } = useSettings()
  const toast = useToast()
  const [form, setForm] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [users, setUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'staff' as UserRole,
    password: '',
  })
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const loadUsers = () => {
    setUsersLoading(true)
    fetchAllUsers()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载用户失败'),
      )
      .finally(() => setUsersLoading(false))
  }

  useEffect(() => {
    if (isAdmin) loadUsers()
    else setUsersLoading(false)
  }, [isAdmin])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await saveSettings({
        ...form,
        followUpReminderDays: Math.max(1, Number(form.followUpReminderDays) || 7),
        deadlineReminderDays: Math.max(
          1,
          Number(form.deadlineReminderDays) || 3,
        ),
      })
      setSuccess('系统设置已保存，将自动应用于微信笔记与提醒规则')
      toast.success('系统设置已保存')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setError('')
    try {
      const updated = await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      await refreshProfile()
      setSuccess('角色已更新')
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError('')
    setSuccess('')
    try {
      await inviteUser(inviteForm)
      setInviteForm({ email: '', name: '', role: 'staff', password: '' })
      setSuccess('邀请成功，请将临时密码发送给新用户')
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀请失败')
    } finally {
      setInviting(false)
    }
  }

  const setField = (key: keyof AppSettings, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        title="系统设置"
        description="公司信息、通知规则与用户权限管理"
      />

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-600">
          {success}
        </div>
      )}

      <section className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-[#C9A84C]" />
          <h2 className="section-label">当前账号</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500 mb-0.5">邮箱</dt>
            <dd className="text-[#1A1A2A]">{profile?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-0.5">姓名</dt>
            <dd className="text-[#1A1A2A]">{profile?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-0.5">角色</dt>
            <dd>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  isAdmin
                    ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}
              >
                {isAdmin ? '管理员' : '员工'}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building size={20} className="text-[#C9A84C]" />
            <h2 className="section-label">公司信息</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            自动填入微信笔记、AI 报告中的公司与联系方式
          </p>
          <div className="space-y-4">
            <Input
              id="company_name"
              label="公司名称"
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              placeholder="如：YAO Investment"
              disabled={!isAdmin || settingsLoading}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="contact_name"
                label="联系人"
                value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)}
                placeholder="YAO"
                disabled={!isAdmin || settingsLoading}
              />
              <Input
                id="contact_info"
                label="联系方式"
                value={form.contactInfo}
                onChange={(e) => setField('contactInfo', e.target.value)}
                placeholder="微信 / 电话"
                disabled={!isAdmin || settingsLoading}
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={20} className="text-[#C9A84C]" />
            <h2 className="section-label">通知设置</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="follow_up_days"
              label="跟进提醒天数"
              type="number"
              min="1"
              value={form.followUpReminderDays}
              onChange={(e) =>
                setField('followUpReminderDays', Number(e.target.value))
              }
              disabled={!isAdmin || settingsLoading}
            />
            <Input
              id="deadline_days"
              label="截止提醒天数（黄色预警）"
              type="number"
              min="1"
              value={form.deadlineReminderDays}
              onChange={(e) =>
                setField('deadlineReminderDays', Number(e.target.value))
              }
              disabled={!isAdmin || settingsLoading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            超过跟进提醒天数未联系将出现在「跟进预警」；截止日在提醒天数内将高亮显示。
          </p>
        </section>

        {isAdmin && (
          <Button type="submit" disabled={saving || settingsLoading}>
            {saving ? '保存中...' : '保存系统设置'}
          </Button>
        )}
      </form>

      {isAdmin && (
        <>
          <section className="card p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Users size={20} className="text-[#C9A84C]" />
              <h2 className="section-label">用户管理</h2>
            </div>

            {usersLoading ? (
              <p className="text-sm text-gray-500">加载中...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500">暂无用户记录</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-[#1A1A2A]">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <Select
                      id={`role-${u.id}`}
                      label=""
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as UserRole)
                      }
                      options={[
                        { value: 'admin', label: '管理员' },
                        { value: 'staff', label: '员工' },
                      ]}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus size={20} className="text-[#C9A84C]" />
              <h2 className="section-label">邀请新用户</h2>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="invite_email"
                  label="邮箱 *"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
                <Input
                  id="invite_name"
                  label="姓名 *"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  id="invite_role"
                  label="角色"
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((p) => ({
                      ...p,
                      role: e.target.value as UserRole,
                    }))
                  }
                  options={[
                    { value: 'staff', label: '员工' },
                    { value: 'admin', label: '管理员' },
                  ]}
                />
                <Input
                  id="invite_password"
                  label="临时密码 *"
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="至少 6 位"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting ? '邀请中...' : '发送邀请'}
              </Button>
            </form>
          </section>
        </>
      )}

      {isAdmin && <OperationLogsPanel />}
    </div>
  )
}

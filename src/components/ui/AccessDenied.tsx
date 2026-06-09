import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <div className="page-shell">
      <div className="alert-error">无权访问此记录，请联系管理员</div>
      <Link to="/dashboard" className="link-back mt-4">
        ← 返回首页
      </Link>
    </div>
  )
}

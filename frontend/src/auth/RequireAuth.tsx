import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthProvider'

/** 未ログイン時は /login へリダイレクトする */
export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <p className="message">読み込み中…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import styles from './Header.module.css'

export function Header() {
  const { session } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className={styles.header}>
      <span className={styles.title}>Reading App</span>
      {session && (
        <>
          <nav className={styles.nav}>
            <NavLink to="/books">本</NavLink>
            <NavLink to="/sites">サイト</NavLink>
          </nav>
          <button type="button" onClick={handleLogout}>
            ログアウト
          </button>
        </>
      )}
    </header>
  )
}

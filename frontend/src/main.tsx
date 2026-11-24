import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_API_BASE_URL',
] as const

const root = createRoot(document.getElementById('root')!)

// 環境変数が不足していると supabase クライアントの生成で例外になり画面が真っ白になる。
// App（supabase を読み込む）は動的 import にして、先に不足を検出して表示する。
const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k])

if (missing.length > 0) {
  root.render(
    <main className="page">
      <h1>環境変数が設定されていません</h1>
      <p>
        <code>frontend/.env</code> に次の変数を設定し、開発サーバーを再起動してください。
      </p>
      <ul>
        {missing.map((k) => (
          <li key={k}>
            <code>{k}</code>
          </li>
        ))}
      </ul>
    </main>,
  )
} else {
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}

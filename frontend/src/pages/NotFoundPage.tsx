import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="page">
      <h1>ページが見つかりません</h1>
      <p>
        <Link to="/books">本一覧へ戻る</Link>
      </p>
    </main>
  )
}

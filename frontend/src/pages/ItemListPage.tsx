import { Link } from 'react-router'
import { ExternalLink } from '../components/ExternalLink'
import { LoadStatus } from '../components/LoadState'
import { StatusBadge } from '../components/StatusBadge'
import { TagList } from '../components/TagList'
import { listItems } from '../lib/api'
import { formatDate } from '../lib/format'
import { useLoad } from '../lib/useLoad'
import type { ItemType } from '../types'
import { TYPE_LABELS } from '../types'

export function ItemListPage({ type }: { type: ItemType }) {
  const { data, loading, slow, error, reload } = useLoad(() => listItems(type), [type])
  const base = type === 'book' ? '/books' : '/sites'

  return (
    <main className="page">
      <div className="page-head">
        <h1>{TYPE_LABELS[type]}一覧</h1>
        <Link to={`${base}/new`} className="button">
          新規登録
        </Link>
      </div>
      <LoadStatus loading={loading} slow={slow} error={error} onReload={reload} />
      {data && data.length === 0 && <p className="message">まだ登録がありません</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>URL</th>
              <th>ステータス</th>
              <th>タグ</th>
              <th>登録日</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`${base}/${item.id}`}>{item.title}</Link>
                </td>
                <td>
                  <ExternalLink url={item.url} />
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>
                  <TagList tags={item.tags} />
                </td>
                <td>{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ExternalLink } from '../components/ExternalLink'
import { LoadStatus } from '../components/LoadState'
import { StatusBadge } from '../components/StatusBadge'
import { TagList } from '../components/TagList'
import { deleteItem, formatApiError, getItem } from '../lib/api'
import { formatDate } from '../lib/format'
import { useLoad } from '../lib/useLoad'
import type { ItemType } from '../types'
import { TYPE_LABELS } from '../types'

export function ItemDetailPage({ type }: { type: ItemType }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: item, loading, slow, error, reload } = useLoad(() => getItem(type, id), [type, id])
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const base = type === 'book' ? '/books' : '/sites'

  async function handleDelete() {
    if (!window.confirm('この項目を削除します。よろしいですか？')) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteItem(type, id)
      navigate(base, { replace: true })
    } catch (e) {
      setDeleteError(formatApiError(e))
      setDeleting(false)
    }
  }

  return (
    <main className="page">
      <p>
        <Link to={base}>← {TYPE_LABELS[type]}一覧へ</Link>
      </p>
      <LoadStatus loading={loading} slow={slow} error={error} onReload={reload} />
      {item && (
        <>
          <h1>{item.title}</h1>
          {deleteError && (
            <div role="alert" className="form-error">
              {deleteError}
            </div>
          )}
          <dl className="detail">
            <dt>URL</dt>
            <dd>
              <ExternalLink url={item.url} />
            </dd>
            <dt>ステータス</dt>
            <dd>
              <StatusBadge status={item.status} />
            </dd>
            <dt>タグ</dt>
            <dd>
              <TagList tags={item.tags} />
            </dd>
            <dt>メモ</dt>
            <dd className="memo">{item.memo}</dd>
            <dt>登録日</dt>
            <dd>{formatDate(item.created_at)}</dd>
            <dt>更新日</dt>
            <dd>{formatDate(item.updated_at)}</dd>
          </dl>
          <div className="actions">
            <Link to={`${base}/${item.id}/edit`} className="button">
              編集
            </Link>
            <button type="button" onClick={handleDelete} disabled={deleting}>
              削除
            </button>
          </div>
        </>
      )}
    </main>
  )
}

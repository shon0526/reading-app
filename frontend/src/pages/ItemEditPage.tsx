import { useNavigate, useParams } from 'react-router'
import { ItemForm } from '../components/ItemForm'
import { LoadStatus } from '../components/LoadState'
import { getItem, updateItem } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import type { ItemType } from '../types'
import { TYPE_LABELS } from '../types'

export function ItemEditPage({ type }: { type: ItemType }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: item, loading, slow, error, reload } = useLoad(() => getItem(type, id), [type, id])
  const base = type === 'book' ? '/books' : '/sites'

  return (
    <main className="page">
      <h1>{TYPE_LABELS[type]}の編集</h1>
      <LoadStatus loading={loading} slow={slow} error={error} onReload={reload} />
      {item && (
        <ItemForm
          type={type}
          initial={item}
          onSubmit={async (input) => {
            await updateItem(type, id, input)
            navigate(`${base}/${id}`)
          }}
          onCancel={() => navigate(`${base}/${id}`)}
        />
      )}
    </main>
  )
}

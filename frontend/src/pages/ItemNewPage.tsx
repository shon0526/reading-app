import { useNavigate } from 'react-router'
import { ItemForm } from '../components/ItemForm'
import { createItem } from '../lib/api'
import type { ItemType } from '../types'
import { TYPE_LABELS } from '../types'

export function ItemNewPage({ type }: { type: ItemType }) {
  const navigate = useNavigate()
  const base = type === 'book' ? '/books' : '/sites'

  return (
    <main className="page">
      <h1>{TYPE_LABELS[type]}の登録</h1>
      <ItemForm
        type={type}
        onSubmit={async (input) => {
          const created = await createItem(type, input)
          navigate(`${base}/${created.id}`)
        }}
        onCancel={() => navigate(base)}
      />
    </main>
  )
}

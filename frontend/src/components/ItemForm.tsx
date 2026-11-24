import { useState, type FormEvent } from 'react'
import { formatApiError } from '../lib/api'
import { formatTags } from '../lib/tags'
import { toItemInput, validateItem, type FormErrors } from '../lib/validation'
import type { Item, ItemFormValues, ItemInput, ItemType } from '../types'
import { STATUS_LABELS, STATUSES } from '../types'
import styles from './ItemForm.module.css'

interface Props {
  type: ItemType
  initial?: Item
  onSubmit: (input: ItemInput) => Promise<void>
  onCancel: () => void
}

function toFormValues(item?: Item): ItemFormValues {
  return {
    title: item?.title ?? '',
    url: item?.url ?? '',
    memo: item?.memo ?? '',
    status: item?.status ?? '',
    tags: item ? formatTags(item.tags) : '',
  }
}

/** 登録・編集フォーム（本・サイト共通） */
export function ItemForm({ type, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<ItemFormValues>(() => toFormValues(initial))
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setFormError(null)

    const found = validateItem(type, values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(toItemInput(values))
    } catch (err) {
      setFormError(formatApiError(err))
      setSubmitting(false)
    }
  }

  const urlLabel = type === 'book' ? 'URL（任意）' : 'URL'

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <div role="alert" className={styles.formError}>
          {formError}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="title">タイトル</label>
        <input id="title" value={values.title} onChange={(e) => set('title', e.target.value)} />
        {errors.title && <p className={styles.error}>{errors.title}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="url">{urlLabel}</label>
        <input id="url" value={values.url} onChange={(e) => set('url', e.target.value)} />
        {errors.url && <p className={styles.error}>{errors.url}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="memo">メモ</label>
        <textarea
          id="memo"
          rows={8}
          value={values.memo}
          onChange={(e) => set('memo', e.target.value)}
        />
        {errors.memo && <p className={styles.error}>{errors.memo}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="status">ステータス</label>
        <select
          id="status"
          value={values.status}
          onChange={(e) => set('status', e.target.value as ItemFormValues['status'])}
        >
          <option value="">未選択</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {errors.status && <p className={styles.error}>{errors.status}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="tags">タグ（カンマ区切り）</label>
        <input id="tags" value={values.tags} onChange={(e) => set('tags', e.target.value)} />
        {errors.tags && <p className={styles.error}>{errors.tags}</p>}
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={submitting}>
          保存
        </button>
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  )
}

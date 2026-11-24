export type ItemType = 'book' | 'site'

export type Status = 'want_to_read' | 'reading' | 'done'

export const STATUS_LABELS: Record<Status, string> = {
  want_to_read: '読みたい',
  reading: '読書中',
  done: '読了',
}

export const STATUSES = Object.keys(STATUS_LABELS) as Status[]

export const TYPE_LABELS: Record<ItemType, string> = {
  book: '本',
  site: 'サイト',
}

export interface Item {
  id: string
  title: string
  url: string | null
  memo: string
  status: Status | null
  tags: string[]
  created_at: string
  updated_at: string
}

/** API に送る登録・更新の入力 */
export interface ItemInput {
  title: string
  url: string | null
  memo: string
  status: Status | null
  tags: string[]
}

/** フォーム上の入力値（タグは文字列のまま） */
export interface ItemFormValues {
  title: string
  url: string
  memo: string
  status: Status | ''
  tags: string
}

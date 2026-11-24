import type { ItemFormValues, ItemInput, ItemType } from '../types'
import { STATUSES } from '../types'
import { parseTags } from './tags'

export type FormErrors = Partial<Record<keyof ItemFormValues, string>>

const TITLE_MAX = 200
const URL_MAX = 2048
const MEMO_MAX = 10000
const TAG_MAX_LENGTH = 30
const TAG_MAX_COUNT = 10

/** フォームの入力チェック（要件定義書 4.2）。エラーがなければ空オブジェクトを返す */
export function validateItem(type: ItemType, values: ItemFormValues): FormErrors {
  const errors: FormErrors = {}

  const title = values.title.trim()
  if (title === '') errors.title = 'タイトルを入力してください'
  else if (title.length > TITLE_MAX) errors.title = `タイトルは${TITLE_MAX}文字以内で入力してください`

  const url = values.url.trim()
  if (url === '') {
    if (type === 'site') errors.url = 'URLを入力してください'
  } else if (!/^https?:\/\//.test(url)) {
    errors.url = 'URLは http:// または https:// で始まる形式で入力してください'
  } else if (url.length > URL_MAX) {
    errors.url = `URLは${URL_MAX}文字以内で入力してください`
  }

  const memo = values.memo.trim()
  if (memo === '') errors.memo = 'メモを入力してください'
  else if (memo.length > MEMO_MAX) errors.memo = `メモは${MEMO_MAX.toLocaleString()}文字以内で入力してください`

  if (values.status !== '' && !STATUSES.includes(values.status)) {
    errors.status = 'ステータスの選択が正しくありません'
  }

  const tags = parseTags(values.tags)
  if (tags.length > TAG_MAX_COUNT) errors.tags = `タグは${TAG_MAX_COUNT}個までです`
  else if (tags.some((t) => t.length > TAG_MAX_LENGTH)) {
    errors.tags = `1つのタグは${TAG_MAX_LENGTH}文字以内で入力してください`
  }

  return errors
}

/** フォーム入力値を API 送信用に変換する */
export function toItemInput(values: ItemFormValues): ItemInput {
  const url = values.url.trim()
  return {
    title: values.title.trim(),
    url: url === '' ? null : url,
    memo: values.memo.trim(),
    status: values.status === '' ? null : values.status,
    tags: parseTags(values.tags),
  }
}

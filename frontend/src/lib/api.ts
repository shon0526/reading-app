import type { Item, ItemInput, ItemType } from '../types'
import { supabase } from './supabase'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `API error (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function basePath(type: ItemType): string {
  return type === 'book' ? '/api/books' : '/api/sites'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    if (res.status === 401) await supabase.auth.signOut()
    let detail: unknown = res.statusText
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      // 本文が JSON でない場合はステータステキストを使う
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const listItems = (type: ItemType) => request<Item[]>(basePath(type))

export const getItem = (type: ItemType, id: string) =>
  request<Item>(`${basePath(type)}/${encodeURIComponent(id)}`)

export const createItem = (type: ItemType, input: ItemInput) =>
  request<Item>(basePath(type), { method: 'POST', body: JSON.stringify(input) })

export const updateItem = (type: ItemType, id: string, input: ItemInput) =>
  request<Item>(`${basePath(type)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

export const deleteItem = (type: ItemType, id: string) =>
  request<void>(`${basePath(type)}/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** 422 の detail（文字列または FastAPI 形式の配列）を表示用の文字列にする */
export function formatApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (Array.isArray(e.detail)) {
      return e.detail
        .map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : String(d)))
        .join(' / ')
    }
    return String(e.detail)
  }
  return '予期しないエラーが発生しました'
}

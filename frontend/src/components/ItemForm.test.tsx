import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ApiError } from '../lib/api'
import type { Item } from '../types'
import { ItemForm } from './ItemForm'

vi.mock('../lib/supabase', () => ({ supabase: { auth: {} } }))

const item: Item = {
  id: '1',
  title: '既存タイトル',
  url: 'https://example.com',
  memo: '既存メモ',
  status: 'reading',
  tags: ['a', 'b'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function setup(props: Partial<Parameters<typeof ItemForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()
  render(<ItemForm type="book" onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

test('本ではURLラベルが「URL（任意）」、サイトでは「URL」', () => {
  const { unmount } = render(<ItemForm type="book" onSubmit={vi.fn()} onCancel={vi.fn()} />)
  expect(screen.getByLabelText('URL（任意）')).toBeInTheDocument()
  unmount()
  render(<ItemForm type="site" onSubmit={vi.fn()} onCancel={vi.fn()} />)
  expect(screen.getByLabelText('URL')).toBeInTheDocument()
})

test('編集時は既存値を初期表示し、タグは「, 」連結', () => {
  setup({ initial: item })
  expect(screen.getByLabelText('タイトル')).toHaveValue('既存タイトル')
  expect(screen.getByLabelText('タグ（カンマ区切り）')).toHaveValue('a, b')
  expect(screen.getByLabelText('ステータス')).toHaveValue('reading')
})

test('必須項目が空なら項目ごとにエラーを出し、送信しない', async () => {
  const { user, onSubmit } = setup()
  await user.click(screen.getByRole('button', { name: '保存' }))
  expect(screen.getByText('タイトルを入力してください')).toBeInTheDocument()
  expect(screen.getByText('メモを入力してください')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('入力内容を API 用の形式にして送信する', async () => {
  const { user, onSubmit } = setup()
  await user.type(screen.getByLabelText('タイトル'), 'タイトル')
  await user.type(screen.getByLabelText('メモ'), 'メモ')
  await user.selectOptions(screen.getByLabelText('ステータス'), 'done')
  await user.type(screen.getByLabelText('タグ（カンマ区切り）'), 'x、y,x')
  await user.click(screen.getByRole('button', { name: '保存' }))
  expect(onSubmit).toHaveBeenCalledWith({
    title: 'タイトル',
    url: null,
    memo: 'メモ',
    status: 'done',
    tags: ['x', 'y'],
  })
})

test('API の 422 エラーをフォーム上部に表示する', async () => {
  const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'サーバー側のエラー'))
  const { user } = setup({ initial: item, onSubmit })
  await user.click(screen.getByRole('button', { name: '保存' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('サーバー側のエラー')
  await waitFor(() => expect(screen.getByRole('button', { name: '保存' })).toBeEnabled())
})

test('送信中は保存ボタンを無効化する', async () => {
  const onSubmit = vi.fn(() => new Promise<void>(() => {}))
  const { user } = setup({ initial: item, onSubmit })
  await user.click(screen.getByRole('button', { name: '保存' }))
  expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
})

test('キャンセルで onCancel を呼ぶ', async () => {
  const { user, onCancel } = setup()
  await user.click(screen.getByRole('button', { name: 'キャンセル' }))
  expect(onCancel).toHaveBeenCalled()
})

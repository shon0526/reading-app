import type { ItemFormValues } from '../types'
import { toItemInput, validateItem } from './validation'

const valid: ItemFormValues = {
  title: 'リーダブルコード',
  url: 'https://example.com/',
  memo: 'メモ',
  status: 'done',
  tags: 'a, b',
}

describe('validateItem', () => {
  test('正常な入力ではエラーなし', () => {
    expect(validateItem('book', valid)).toEqual({})
    expect(validateItem('site', valid)).toEqual({})
  })

  describe('title', () => {
    test('空・空白のみは必須エラー', () => {
      expect(validateItem('book', { ...valid, title: '' }).title).toBeDefined()
      expect(validateItem('book', { ...valid, title: '   ' }).title).toBeDefined()
    })
    test('200文字は可、201文字は不可', () => {
      expect(validateItem('book', { ...valid, title: 'a'.repeat(200) }).title).toBeUndefined()
      expect(validateItem('book', { ...valid, title: 'a'.repeat(201) }).title).toBeDefined()
    })
  })

  describe('url', () => {
    test('本では空でも可', () => {
      expect(validateItem('book', { ...valid, url: '' }).url).toBeUndefined()
    })
    test('サイトでは必須', () => {
      expect(validateItem('site', { ...valid, url: '' }).url).toBeDefined()
    })
    test('http / https 以外は不可', () => {
      for (const url of ['javascript:alert(1)', 'ftp://example.com', 'example.com']) {
        expect(validateItem('book', { ...valid, url }).url).toBeDefined()
      }
      expect(validateItem('book', { ...valid, url: 'http://example.com' }).url).toBeUndefined()
    })
    test('2048文字は可、2049文字は不可', () => {
      const base = 'https://example.com/'
      expect(
        validateItem('site', { ...valid, url: base + 'a'.repeat(2048 - base.length) }).url,
      ).toBeUndefined()
      expect(
        validateItem('site', { ...valid, url: base + 'a'.repeat(2049 - base.length) }).url,
      ).toBeDefined()
    })
  })

  describe('memo', () => {
    test('空は必須エラー', () => {
      expect(validateItem('book', { ...valid, memo: ' ' }).memo).toBeDefined()
    })
    test('10,000文字は可、10,001文字は不可', () => {
      expect(validateItem('book', { ...valid, memo: 'a'.repeat(10000) }).memo).toBeUndefined()
      expect(validateItem('book', { ...valid, memo: 'a'.repeat(10001) }).memo).toBeDefined()
    })
  })

  describe('tags', () => {
    test('1タグ30文字は可、31文字は不可', () => {
      expect(validateItem('book', { ...valid, tags: 'a'.repeat(30) }).tags).toBeUndefined()
      expect(validateItem('book', { ...valid, tags: 'a'.repeat(31) }).tags).toBeDefined()
    })
    test('10個は可、11個は不可', () => {
      const n = (k: number) => Array.from({ length: k }, (_, i) => `t${i}`).join(',')
      expect(validateItem('book', { ...valid, tags: n(10) }).tags).toBeUndefined()
      expect(validateItem('book', { ...valid, tags: n(11) }).tags).toBeDefined()
    })
    test('重複は除去してから数える', () => {
      const tags = Array.from({ length: 11 }, () => 'same').join(',')
      expect(validateItem('book', { ...valid, tags }).tags).toBeUndefined()
    })
  })
})

describe('toItemInput', () => {
  test('API 用の形式に変換する', () => {
    expect(toItemInput({ ...valid, title: ' タイトル ', tags: 'a、b,a' })).toEqual({
      title: 'タイトル',
      url: 'https://example.com/',
      memo: 'メモ',
      status: 'done',
      tags: ['a', 'b'],
    })
  })
  test('空の URL・ステータスは null にする', () => {
    const input = toItemInput({ ...valid, url: ' ', status: '' })
    expect(input.url).toBeNull()
    expect(input.status).toBeNull()
  })
})

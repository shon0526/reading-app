import { formatTags, parseTags } from './tags'

describe('parseTags', () => {
  test('半角カンマで区切る', () => {
    expect(parseTags('a,b,c')).toEqual(['a', 'b', 'c'])
  })
  test('全角読点でも区切れる', () => {
    expect(parseTags('設計、テスト')).toEqual(['設計', 'テスト'])
  })
  test('前後の空白を除去し、空要素を捨てる', () => {
    expect(parseTags(' a , ,b,, ')).toEqual(['a', 'b'])
  })
  test('重複を除去し、最初の出現順を保つ', () => {
    expect(parseTags('a,b,a,c,b')).toEqual(['a', 'b', 'c'])
  })
  test('空文字は空配列', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags('  ')).toEqual([])
  })
})

describe('formatTags', () => {
  test('「, 」で連結する', () => {
    expect(formatTags(['a', 'b'])).toBe('a, b')
  })
  test('空配列は空文字', () => {
    expect(formatTags([])).toBe('')
  })
})

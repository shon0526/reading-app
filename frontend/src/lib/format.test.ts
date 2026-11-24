import { formatDate, isSafeUrl } from './format'

test('formatDate はローカル時刻で YYYY/MM/DD', () => {
  expect(formatDate(new Date(2026, 0, 5, 12).toISOString())).toBe('2026/01/05')
})

test('isSafeUrl', () => {
  expect(isSafeUrl('https://a.com')).toBe(true)
  expect(isSafeUrl('http://a.com')).toBe(true)
  expect(isSafeUrl('javascript:alert(1)')).toBe(false)
})

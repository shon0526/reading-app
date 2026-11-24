/** ISO 日時をブラウザのローカル時刻で YYYY/MM/DD にする */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

/** http:// / https:// で始まる URL だけをリンク対象にする */
export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

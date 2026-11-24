import { isSafeUrl } from '../lib/format'

/** http(s) の URL だけをリンクにし、それ以外は文字列として表示する */
export function ExternalLink({ url }: { url: string | null }) {
  if (!url) return <>—</>
  if (!isSafeUrl(url)) return <>{url}</>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  )
}

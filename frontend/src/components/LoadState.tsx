import { formatApiError } from '../lib/api'

interface Props {
  loading: boolean
  slow: boolean
  error: unknown
  onReload: () => void
}

/** 読み込み中・エラー時の表示。表示すべき状態がなければ null を返す */
export function LoadStatus({ loading, slow, error, onReload }: Props) {
  if (loading) {
    return (
      <div className="message">
        <p>読み込み中…</p>
        {slow && <p>サーバーを起動しています。少々お待ちください（最大1分程度）</p>}
      </div>
    )
  }
  if (error) {
    return (
      <div className="message" role="alert">
        <p>{formatApiError(error)}</p>
        <button type="button" onClick={onReload}>
          再読み込み
        </button>
      </div>
    )
  }
  return null
}

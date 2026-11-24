import { useCallback, useEffect, useState } from 'react'

export interface LoadState<T> {
  data: T | null
  loading: boolean
  slow: boolean
  error: unknown
  reload: () => void
}

const SLOW_MS = 5000

/** 非同期データの取得状態（読み込み中・5秒超過・エラー）を管理する */
export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[]): LoadState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSlow(false)
    setError(null)
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        clearTimeout(timer)
        if (!cancelled) {
          setLoading(false)
          setSlow(false)
        }
      })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, loading, slow, error, reload }
}

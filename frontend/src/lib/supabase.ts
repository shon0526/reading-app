import { createClient } from '@supabase/supabase-js'

// 認証（ログイン・セッション管理）のみに使用する。DB には直接アクセスしない。
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
)

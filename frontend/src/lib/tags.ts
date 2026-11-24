/** 「,」または「、」区切りの文字列をタグ配列に変換する（空要素・重複は除去） */
export function parseTags(text: string): string[] {
  const tags = text
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
  return [...new Set(tags)]
}

/** タグ配列を編集用の文字列に変換する */
export function formatTags(tags: string[]): string {
  return tags.join(', ')
}

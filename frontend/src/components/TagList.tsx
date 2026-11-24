import styles from './TagList.module.css'

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <>—</>
  return (
    <ul className={styles.list}>
      {tags.map((t) => (
        <li key={t} className={styles.tag}>
          {t}
        </li>
      ))}
    </ul>
  )
}

import type { Status } from '../types'
import { STATUS_LABELS } from '../types'
import styles from './StatusBadge.module.css'

export function StatusBadge({ status }: { status: Status | null }) {
  if (!status) return <>—</>
  return <span className={`${styles.badge} ${styles[status]}`}>{STATUS_LABELS[status]}</span>
}

import { cx } from '../utils/cx'
import { btn, buttonRow, confirmBox, confirmTitle, hint } from './ui'

type Props = {
  title: string
  text: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Inline "are you sure?" card with a destructive and a safe choice. */
export function ConfirmBox({ title, text, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  return (
    <div className={confirmBox} role="alertdialog" aria-label={title}>
      <p className={confirmTitle}>{title}</p>
      <p className={hint()}>{text}</p>
      <div className={cx(buttonRow, 'mt-3.5')}>
        <button className={btn('danger')} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className={btn('secondary')} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}

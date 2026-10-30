import type { RefObject } from 'react'
import { block, blockTitle, field, hint } from '../../components/ui'

type Props = { value: string; error: boolean; inputRef: RefObject<HTMLInputElement | null>; onChange: (value: string) => void }

export function NameField({ value, error, inputRef, onChange }: Props) {
  return (
    <section className={block}>
      <label className={blockTitle} htmlFor="guest-name">
        Как вас назвать?
      </label>
      <input
        id="guest-name"
        ref={inputRef}
        className={field(error)}
        value={value}
        maxLength={20}
        autoComplete="given-name"
        placeholder="Имя для бариста"
        aria-invalid={error}
        aria-describedby="guest-name-hint"
        onChange={(e) => onChange(e.target.value)}
      />
      <p id="guest-name-hint" className={hint(error ? 'error' : 'plain')}>
        {error ? 'Напишите имя — так бариста позовёт вас' : 'Назовём, когда заказ будет готов'}
      </p>
    </section>
  )
}

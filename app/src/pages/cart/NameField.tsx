import type { RefObject } from 'react'

import { TextField } from '../../components/TextField'
import { block, blockTitle, hint } from '../../components/ui'
import { NAME_MAX } from '../../forms/schemas'

type Props = { value: string; error: boolean; inputRef: RefObject<HTMLInputElement | null>; onChange: (value: string) => void }

export function NameField({ value, error, inputRef, onChange }: Props) {
  return (
    <section className={block}>
      <label className={blockTitle} htmlFor="guest-name">
        Как вас назвать?
      </label>
      <TextField
        id="guest-name"
        ref={inputRef}
         error={error} fieldSize="md"
        value={value}
        maxLength={NAME_MAX}
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

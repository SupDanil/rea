import { useForm } from '@tanstack/react-form'
import type { RefObject } from 'react'

import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { NAME_MAX, nameSchema } from '../../forms/schemas'
import { cx } from '../../utils/cx'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = { defaultName: string; inputRef: RefObject<HTMLInputElement | null>; onSubmit: (name: string) => void }

/**
 * 2026 Liquid Glass NameStep:
 * Single-question focused name registration with barista cue.
 */
export function NameStep({ defaultName, inputRef, onSubmit }: Props) {
  const form = useForm({
    defaultValues: { name: defaultName },
    validators: { onSubmit: nameSchema },
    onSubmit: ({ value }) => onSubmit(nameSchema.parse(value).name),
  })

  return (
    <form
      className={stepBox}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="relative mx-auto size-20 rounded-pill bg-accent/15 border-(length:--stroke-width) border-accent/25 grid place-items-center mb-1">
        <span className="text-display leading-none" aria-hidden="true">
          ☕
        </span>
      </div>

      <h1 className={stepTitle}>Как вас зовут?</h1>
      <p className={stepLead}>Бариста назовёт это имя, когда заказ будет готов</p>

      <label className="sr-only" htmlFor="profile-name">
        Имя
      </label>
      <form.Field name="name">
        {(field) => (
          <TextField
            id="profile-name"
            ref={inputRef}
            className={cx('text-center')}
            error={field.state.meta.errors.length > 0}
            fieldSize="xl"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.name.trim().length > 0}>
        {(hasName) => (
          <Button className={cx('mt-1')} variant="primary" size="lg" fullWidth type="submit" disabled={!hasName}>
            Готово
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

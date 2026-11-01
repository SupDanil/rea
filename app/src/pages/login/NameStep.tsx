import type { RefObject } from 'react'
import { btn, field } from '../../components/ui'
import { cx } from '../../utils/cx'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = { name: string; inputRef: RefObject<HTMLInputElement | null>; onChange: (name: string) => void; onSubmit: () => void }

/**
 * 2026 Liquid Glass NameStep:
 * Single-question focused name registration with barista cue.
 */
export function NameStep({ name, inputRef, onChange, onSubmit }: Props) {
  return (
    <form
      className={stepBox}
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onSubmit()
      }}
    >
      <div className="relative mx-auto size-20 rounded-full bg-accent/15 border border-accent/25 grid place-items-center mb-1">
        <span className="text-[34px] leading-none" aria-hidden="true">
          ☕
        </span>
      </div>

      <h1 className={stepTitle}>Как вас зовут?</h1>
      <p className={stepLead}>Бариста назовёт это имя, когда заказ будет готов</p>

      <label className="sr-only" htmlFor="profile-name">
        Имя
      </label>
      <input
        id="profile-name"
        ref={inputRef}
        className={cx(field(false, 'xl'), 'text-center')}
        autoComplete="given-name"
        maxLength={20}
        value={name}
        onChange={(e) => onChange(e.target.value)}
      />

      <button className={cx(btn('primary', 'lg'), 'mt-1')} type="submit" disabled={!name.trim()}>
        Готово
      </button>
    </form>
  )
}

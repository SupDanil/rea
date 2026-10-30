import type { RefObject } from 'react'
import { btn, field } from '../../components/ui'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = { name: string; inputRef: RefObject<HTMLInputElement | null>; onChange: (name: string) => void; onSubmit: () => void }

export function NameStep({ name, inputRef, onChange, onSubmit }: Props) {
  return (
    <form
      className={stepBox}
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onSubmit()
      }}
    >
      <h1 className={stepTitle}>Как вас зовут?</h1>
      <p className={stepLead}>Бариста назовёт это имя, когда заказ будет готов</p>
      <label className="sr-only" htmlFor="profile-name">
        Имя
      </label>
      <input id="profile-name" ref={inputRef} className={field(false, 'xl')} autoComplete="given-name" maxLength={20} value={name} onChange={(e) => onChange(e.target.value)} />
      <button className={btn('primary', 'lg')} type="submit" disabled={!name.trim()}>
        Готово
      </button>
    </form>
  )
}

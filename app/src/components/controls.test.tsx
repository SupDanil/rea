import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button, IconButton } from './Button'
import { QuantityStepper } from './QuantityStepper'
import { QuickAddButton } from './QuickAddButton'
import { SegmentedControl } from './SegmentedControl'
import { Surface } from './Surface'
import { SwitchRow } from './SwitchRow'
import { Checkbox, TextField } from './TextField'

afterEach(cleanup)

describe('shared native controls', () => {
  it('forwards the button ref and does not accidentally submit forms; explicit submit still works', () => {
    const submit = vi.fn((event) => event.preventDefault())
    const ref = createRef<HTMLButtonElement>()
    render(<form onSubmit={submit}><Button ref={ref}>Открыть</Button><Button type="submit" variant="primary">Сохранить</Button></form>)
    fireEvent.click(screen.getByText('Открыть'))
    expect(submit).not.toHaveBeenCalled()
    expect(ref.current).toBe(screen.getByText('Открыть'))
    fireEvent.click(screen.getByText('Сохранить'))
    expect(submit).toHaveBeenCalledOnce()
  })

  it('retains native disabled behavior and accessible icon names', () => {
    const click = vi.fn()
    render(<IconButton aria-label="Закрыть" disabled onClick={click}>×</IconButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(click).not.toHaveBeenCalled()
  })

  it('forwards input refs, validation and change events without replacing the input', () => {
    const ref = createRef<HTMLInputElement>()
    const change = vi.fn()
    const { rerender } = render(<TextField ref={ref} aria-label="Имя" error onChange={change} />)
    const input = screen.getByRole('textbox', { name: 'Имя' })
    expect(ref.current).toBe(input)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(input, { target: { value: 'Лена' } })
    expect(change).toHaveBeenCalledOnce()
    rerender(<TextField ref={ref} aria-label="Имя" error={false} />)
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('keeps a real labeled checkbox and its checked state', () => {
    const change = vi.fn()
    render(<label><Checkbox checked onChange={change} />Согласие</label>)
    const checkbox = screen.getByRole('checkbox', { name: 'Согласие' })
    expect(checkbox).toBeChecked()
    fireEvent.click(checkbox)
    expect(change).toHaveBeenCalledOnce()
  })
})

describe('shared composed controls', () => {
  it('stepper enforces caller limits without suppressing removal at quantity one', () => {
    const decrease = vi.fn(), increase = vi.fn()
    const { rerender } = render(<QuantityStepper value={1} decreaseLabel="Удалить" increaseLabel="Больше" onDecrease={decrease} onIncrease={increase} increaseDisabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    fireEvent.click(screen.getByRole('button', { name: 'Больше' }))
    expect(decrease).toHaveBeenCalledOnce()
    expect(increase).not.toHaveBeenCalled()
    rerender(<QuantityStepper value={2} decreaseLabel="Меньше" increaseLabel="Больше" onDecrease={decrease} onIncrease={increase} disabled />)
    expect(screen.getByRole('group', { name: 'Количество: 2' })).toHaveTextContent('2')
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true)
  })

  it('segments support arrows, wrap, Home/End and skip unavailable choices', () => {
    function Example() {
      const [value, setValue] = useState('s')
      return <SegmentedControl label="Размер" value={value} onChange={setValue} options={[
        { value: 's', label: 'S' }, { value: 'm', label: 'M', disabled: true }, { value: 'l', label: 'L' },
      ]} />
    }
    render(<Example />)
    const small = screen.getByRole('radio', { name: 'S' }), large = screen.getByRole('radio', { name: 'L' })
    fireEvent.keyDown(small, { key: 'ArrowRight' })
    expect(large).toHaveAttribute('aria-checked', 'true')
    expect(large).toHaveFocus()
    fireEvent.keyDown(large, { key: 'ArrowRight' })
    expect(small).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(small, { key: 'End' })
    expect(large).toHaveFocus()
    fireEvent.keyDown(large, { key: 'Home' })
    expect(small).toHaveFocus()
    fireEvent.keyDown(small, { key: 'ArrowLeft' })
    expect(large).toHaveFocus()
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toHaveLength(1)
  })

  it('segments provide one enabled tab stop when the selection is no longer available', () => {
    render(<SegmentedControl label="Размер" value="missing" onChange={vi.fn()} options={[
      { value: 's', label: 'S', disabled: true }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' },
    ]} />)
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toEqual([screen.getByRole('radio', { name: 'M' })])
  })

  it('switch state belongs to the caller and disabled switches do not toggle', () => {
    const toggle = vi.fn()
    const { rerender } = render(<SwitchRow label="Тёмная тема" checked onChange={toggle} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Тёмная тема' }))
    expect(toggle).toHaveBeenCalledOnce()
    rerender(<SwitchRow label="Тёмная тема" checked={false} onChange={toggle} disabled />)
    fireEvent.click(screen.getByRole('switch'))
    expect(toggle).toHaveBeenCalledOnce()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('quick-add keeps its accessible name and action when showing confirmation', () => {
    const add = vi.fn()
    const { rerender } = render(<QuickAddButton added={false} aria-label="Добавить латте" onClick={add} />)
    fireEvent.click(screen.getByRole('button', { name: 'Добавить латте' }))
    expect(add).toHaveBeenCalledOnce()
    rerender(<QuickAddButton added aria-label="Добавить латте" onClick={add} />)
    expect(screen.getByRole('button', { name: 'Добавить латте' })).toBeEnabled()
  })

  it('surface preserves semantic list markup without adding wrappers', () => {
    render(<Surface as="ul" aria-label="Заказы"><Surface as="li">№ 123</Surface></Surface>)
    expect(screen.getByRole('list', { name: 'Заказы' }).firstElementChild).toBe(screen.getByRole('listitem'))
  })
})

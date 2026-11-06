import { cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSlidingIndicator } from './useSlidingIndicator'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('useSlidingIndicator geometry', () => {
  it.each([[1, 0], [1.5, 0], [1, 37.5]])('preserves fractional geometry at scale %s and scroll %s', (scale, scrollLeft) => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.row !== undefined) return new DOMRect(100, 0, 200.5 * scale, 54 * scale)
      if (this.getAttribute('aria-selected') === 'true') return new DOMRect(100 + (6.25 - scrollLeft) * scale, 6 * scale, 60.25 * scale, 42 * scale)
      return new DOMRect()
    })
    function Example() {
      const row = useRef<HTMLDivElement>(null)
      const indicator = useSlidingIndicator(row, 'selected')
      return <div ref={(node) => { row.current = node; if (node) node.scrollLeft = scrollLeft }} data-row style={{ width: '200.5px' }}>
        <span ref={indicator} data-testid="indicator" />
        <button aria-selected="true">Selected</button>
      </div>
    }
    const { getByTestId } = render(<Example />)
    expect(getByTestId('indicator').style.width).toBe('60.25px')
    expect(getByTestId('indicator').style.transform).toBe('translateX(6.25px)')
  })
})

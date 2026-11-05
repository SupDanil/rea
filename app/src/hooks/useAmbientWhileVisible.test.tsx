import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAmbientWhileVisible } from './useAmbientWhileVisible'

function Banner() {
  const ref = useRef<HTMLDivElement>(null)
  useAmbientWhileVisible(ref)
  return <div ref={ref} data-testid="banner" />
}

describe('useAmbientWhileVisible', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('flags the element while it is out of view', () => {
    let report: IntersectionObserverCallback = () => {}
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback
      }
      observe() {}
      disconnect() {}
    })
    const { getByTestId } = render(<Banner />)
    const seen = (isIntersecting: boolean) =>
      act(() => report([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))

    seen(false)
    expect(getByTestId('banner')).toHaveAttribute('data-offscreen')
    seen(true)
    expect(getByTestId('banner')).not.toHaveAttribute('data-offscreen')
  })

  it('renders fine where the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    expect(() => render(<Banner />)).not.toThrow()
  })
})

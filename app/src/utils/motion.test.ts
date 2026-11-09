import { afterEach, describe, expect, it, vi } from 'vitest'

import { flyTo } from './motion'

describe('flyTo', () => {
  afterEach(() => {
    // jsdom has no Web Animations: drop the stub again
    delete (Element.prototype as Partial<Element>).animate
    document.body.innerHTML = ''
  })

  it('flies one plain box from the source and removes it on landing', async () => {
    let land = () => {}
    const animate = vi.fn(() => ({ finished: new Promise<void>((resolve) => (land = resolve)) }))
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate
    const source = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    source.setAttribute('class', 'max-h-[160px] drop-shadow-lg')
    source.getBoundingClientRect = () => new DOMRect(40, 60, 100, 110)
    document.body.appendChild(source)

    const flight = flyTo(source, new DOMRect(10, 700, 40, 40))

    const box = document.querySelector<HTMLElement>('[data-flight]')!
    expect(box.style).toMatchObject({ left: '40px', top: '60px', width: '100px', height: '110px' })
    expect(box.tagName).toBe('DIV')
    expect((box.firstElementChild as SVGElement).style.maxHeight).toBe('none')
    expect(animate).toHaveBeenCalledOnce()

    land()
    await flight
    expect(document.querySelector('[data-flight]')).toBeNull()
  })
})

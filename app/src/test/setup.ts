import '@testing-library/jest-dom/vitest'

// Polyfill window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  // Polyfill ResizeObserver
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver

  // Polyfill scrollTo and scrollIntoView
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}

  // Polyfill Element.animate
  if (!Element.prototype.animate) {
    Element.prototype.animate = () =>
      ({
        finished: Promise.resolve(),
        cancel: () => {},
        play: () => {},
        pause: () => {},
        finish: () => {},
        reverse: () => {},
      }) as unknown as Animation
  }
}

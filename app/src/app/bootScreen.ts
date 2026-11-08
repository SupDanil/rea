/**
 * The launch screen in index.html stays until the menu is ready to be seen, then dissolves into
 * it. It is the very first thing on screen, before any script, so nothing swaps in between.
 */
export function dismissBootScreen() {
  const boot = document.getElementById('boot')
  if (!boot || boot.hasAttribute('data-gone')) return
  boot.setAttribute('data-gone', '')
  // The splash colour gives way to the theme's (index.html set it aside), under the fade.
  const themeBg = document.documentElement.dataset.themeBg
  if (themeBg) {
    document.documentElement.style.backgroundColor = themeBg
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', themeBg))
  }
  const remove = () => boot.remove()
  boot.addEventListener('transitionend', remove, { once: true })
  // No transition (reduced motion, a hidden tab) means no transitionend.
  window.setTimeout(remove, 600)
}

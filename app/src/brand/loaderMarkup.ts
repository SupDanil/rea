type Eye = { x: number; y: number; size: number }

/**
 * The brand loader: the logo filling with coffee, steam, a blink. One markup for the launch
 * screen (index.html, filled in at build time) and for <Loader>; index.html holds its styles.
 */
export function brandLoaderHtml(eyes: Eye[]) {
  const eyeHtml = eyes
    .map(({ x, y, size }) => `<i class="brand-eye" style="left:${x}%;top:${y}%;width:${size}%;margin:-${size / 2}% 0 0 -${size / 2}%"></i>`)
    .join('')
  return `<span class="brand-steam" aria-hidden="true"><i></i><i></i><i></i></span><div class="brand-logo"><span class="brand-coffee"></span>${eyeHtml}</div>`
}

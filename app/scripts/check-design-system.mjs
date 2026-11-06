#!/usr/bin/env node
/** Prevent brand values and native control implementations leaking back into pages. */
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const root = fileURLToPath(new URL('../src', import.meta.url))
const failures = []
const exceptions = new Set(['components/ItemArt.tsx', 'components/QrCodeView.tsx'])
const rules = [
  ['literal colour', /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/i],
  ['raw Tailwind palette', /\b(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d/],
  ['arbitrary fixed style size', /\b(?:text|rounded|p[trblxy]?|m[trblxy]?|gap[xy]?|[wh]|size|min-[wh]|max-[wh])-\[[^\]]*\d(?:px|rem)\b/],
  ['inline effect', /(?:shadow|drop-shadow)-\[[^\]]*(?:px|rgba|#)/],
]
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name), name = relative(root, path)
    if (entry.isDirectory()) { if (entry.name !== 'test') await scan(path); continue }
    if (!/\.(tsx?|css)$/.test(name) || /\.test\./.test(name) || exceptions.has(name) || name === 'styles/tokens.css') continue
    const source = await readFile(path, 'utf8')
    for (const [index, line] of source.split('\n').entries()) {
      if (/^\s*(\/\/|\*)/.test(line)) continue
      for (const [label, pattern] of rules) if (pattern.test(line)) failures.push(`${name}:${index + 1}: ${label}`)
      if (/<button\b/.test(line) && name !== 'components/Button.tsx') failures.push(`${name}:${index + 1}: use Button/IconButton`)
      if (/<input\b/.test(line) && name !== 'components/TextField.tsx') failures.push(`${name}:${index + 1}: use TextField/Checkbox`)
    }
  }
}
await scan(root)
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
else console.log('Design system: no inline brand colours, fixed arbitrary sizes or duplicate native controls.')

import { useState } from 'react'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

type Props = { text: string; className?: string }

/**
 * Odometer-style number: each digit is a vertical strip that rolls to its new
 * value, so only the places that change move. Digits are keyed from the right
 * so units stay units when the number gains a place (99 → 100).
 */
export function RollingNumber({ text, className }: Props) {
  // Which way the number moved decides the stagger: up ripples from the units,
  // down from the leading digit.
  const [last, setLast] = useState(text)
  const [rising, setRising] = useState(true)
  if (last !== text) {
    setRising(parse(text) >= parse(last))
    setLast(text)
  }

  const chars = [...text]
  return (
    <span className={className} aria-label={text}>
      <span className="inline-flex" aria-hidden="true">
        {chars.map((ch, i) => {
          const fromRight = chars.length - 1 - i
          if (!/\d/.test(ch)) {
            return (
              <span key={`c${fromRight}`} className="inline-block whitespace-pre">
                {ch}
              </span>
            )
          }
          return <Digit key={`d${fromRight}`} digit={Number(ch)} delay={(rising ? fromRight : i) * 45} />
        })}
      </span>
    </span>
  )
}

function Digit({ digit, delay }: { digit: number; delay: number }) {
  return (
    // 1lh tall window; the 0–9 strip slides inside it.
    // A place that appears (99 → 100) fades in rather than popping.
    <span className="relative inline-block h-[1lh] overflow-hidden animate-[fade-only_0.3s_ease_both]">
      <span className="invisible">0</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[620ms] ease-[cubic-bezier(0.34,1.36,0.64,1)]"
        style={{ transform: `translateY(${-digit}lh)`, transitionDelay: `${delay}ms` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1lh] text-center">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

const parse = (text: string) => Number(text.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeViewProps {
  value: string
  size?: number
  className?: string
}

/**
 * 2026 QrCodeView:
 * Always rendered on a pure white elevated platter with high optical scan contrast
 * in both light and dark themes.
 */
export function QrCodeView({ value, size = 180, className = '' }: QrCodeViewProps) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#120E0C',
        light: '#FFFFFF',
      },
    })
      .then((svgString) => {
        if (!cancelled) setSvg(svgString)
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err)
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!svg) {
    return (
      <div
        className={`grid place-items-center bg-white rounded-[24px] p-4 shadow-lift ${className}`}
        style={{ width: size, height: size }}
        aria-label="Загрузка QR-кода"
      >
        <div className="size-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={`relative inline-block bg-white p-4 rounded-[24px] shadow-lift overflow-hidden border border-black/10 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="QR-код для выдачи заказа"
    />
  )
}

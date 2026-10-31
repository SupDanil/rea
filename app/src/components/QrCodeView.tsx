import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeViewProps {
  value: string
  size?: number
  className?: string
}

export function QrCodeView({ value, size = 180, className = '' }: QrCodeViewProps) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#141416',
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
        className={`grid place-items-center bg-white rounded-2xl p-3 shadow-inner ${className}`}
        style={{ width: size, height: size }}
        aria-label="Загрузка QR-кода"
      >
        <div className="size-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={`relative inline-block bg-white p-3 rounded-2xl shadow-card overflow-hidden border border-black/5 ${className}`}
      aria-label={`QR-код заказа: ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

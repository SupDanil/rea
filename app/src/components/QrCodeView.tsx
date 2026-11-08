import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

import { cx } from '../utils/cx'

interface QrCodeViewProps {
  value: string
  size?: number
  className?: string
}

/**
 * Keep the QR modules unobstructed, with a four-module white quiet zone.
 */
export function QrCodeView({ value, size = 180, className = '' }: QrCodeViewProps) {
  const [generated, setGenerated] = useState<{ value: string; svg: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000', // 100% optical contrast
        light: '#FFFFFF',
      },
    })
      .then((svgString) => {
        if (!cancelled) setGenerated({ value, svg: svgString })
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err)
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!generated || generated.value !== value) {
    return (
      <div
        className={cx('grid aspect-square place-items-center bg-white', className)}
        style={{ width: size, maxWidth: '100%' }}
        aria-label="Загрузка QR-кода"
      >
        <div className="size-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={cx(
        'aspect-square bg-white leading-none [&>svg]:block [&>svg]:w-full [&>svg]:h-full [&>svg]:aspect-square',
        className,
      )}
      style={{ width: size, maxWidth: '100%' }}
      role="img"
      aria-label="QR-код для выдачи заказа"
      dangerouslySetInnerHTML={{ __html: generated.svg }}
    />
  )
}

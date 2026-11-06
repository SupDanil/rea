import { SegmentedControl } from '../../components/SegmentedControl'
import type { Variant } from '../../domain'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

export function SizePicker({ variants, selected, onSelect }: Props) {
  return <SegmentedControl label="Размер" tone="product" cycleOnSelected value={variants[selected]?.id ?? ''}
    onChange={(id) => onSelect(variants.findIndex((variant) => variant.id === id))}
    options={variants.map((variant) => ({
      value: variant.id, disabled: variant.stopped,
      accessibleLabel: [sizeLabel[variant.size], variant.volume].filter(Boolean).join(' '),
      label: sizeLabel[variant.size],
      detail: variant.volume,
    }))} />
}

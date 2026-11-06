import { SegmentedControl } from '../../components/SegmentedControl'
import type { Variant } from '../../domain'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

export function SizePicker({ variants, selected, onSelect }: Props) {
  return <SegmentedControl label="Размер" tone="product" value={variants[selected]?.id ?? ''}
    onChange={(id) => onSelect(variants.findIndex((variant) => variant.id === id))}
    options={variants.map((variant, index) => ({
      value: variant.id, disabled: variant.stopped,
      label: <><span className="font-display text-caption font-bold">{sizeLabel[variant.size]}</span>
        {index === selected && variant.volume && <span className="text-micro font-semibold whitespace-nowrap animate-fade-in">{variant.volume}</span>}</>,
    }))} />
}

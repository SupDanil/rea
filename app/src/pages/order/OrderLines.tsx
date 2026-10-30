import { ItemArt } from '../../components/ItemArt'
import { addonLabel, countAddons } from '../../data/menu'
import { block, blockTitle, panel } from '../../components/ui'
import { Summary, SummaryRow, SummaryTotal } from '../../components/Summary'
import { resolveLines } from '../../state/cart'
import type { Order, OrderStatus } from '../../state/orders'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { discountRows, totalLabel } from './orderCopy'

export function OrderLines({ order, status }: { order: Order; status: OrderStatus }) {
  return (
    <section className={block}>
      <h2 className={blockTitle}>Состав</h2>
      <ul className={cx('divide-y divide-line rounded-[20px] px-3 py-1.5', panel)}>
        {resolveLines(order.lines).map((l) => (
          <li key={l.key} className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-2.5 py-2 text-[14px]">
            <span>
              <ItemArt art={l.item.art} className="block h-11 w-10" />
            </span>
            <span className="font-semibold">
              {l.item.name}
              {l.variant.size !== 'ONE' && <span className="font-medium text-muted"> {l.variant.size}</span>}
              {l.ingredients.length > 0 && (
                <span className="mt-0.5 block text-[12px] font-medium text-muted">{countAddons(l.ingredients).map((a) => `+ ${addonLabel(a)}`).join(', ')}</span>
              )}
            </span>
            <span className="text-muted">×{l.qty}</span>
            <span className="font-bold">{formatPrice(l.unitPrice * l.qty)}</span>
          </li>
        ))}
      </ul>
      <Summary>
        {discountRows(order).map(([label, amount]) => (
          <SummaryRow key={label} label={label} amount={amount} discount />
        ))}
        <SummaryTotal label={totalLabel(order, status)} amount={order.total} />
      </Summary>
    </section>
  )
}

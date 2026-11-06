import { cx } from '../utils/cx'
import { Button } from './Button'
import { Presence } from './Presence'
import { Sheet, SheetBody } from './Sheet'

type LegalType = 'terms' | 'privacy'

interface LegalModalProps {
  type: LegalType | null
  onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  return <Presence>{type && <LegalSheet type={type} onClose={onClose} />}</Presence>
}

function LegalSheet({ type, onClose }: { type: LegalType; onClose: () => void }) {
  const isTerms = type === 'terms'
  const title = isTerms ? 'Публичная оферта' : 'Политика конфиденциальности'

  return (
    <Sheet label={title} title={title} onBack={onClose}>
      <SheetBody>
        <div className="space-y-4 text-compact leading-relaxed text-ink/80">
          {isTerms ? (
            <>
              <p className="font-bold text-ink">
                Публичная оферта на оформление предварительного заказа и участие в программе лояльности сети «shit кофе»
              </p>
              <p>
                <strong>1. Предмет:</strong> Настоящий документ регулирует правила оформления предзаказа
                блюд и напитков на условиях самовывоза («takeaway») через мобильное приложение.
              </p>
              <p>
                <strong>2. Время хранения напитка:</strong> В связи со скоропортящимся характером кофейной
                продукции готовый заказ ожидает гостя на стойке выдачи <strong>не более 20 минут</strong>.
                После этого продукция утилизируется в соответствии с СанПиН, услуга считается оказанной.
              </p>
              <p>
                <strong>3. Отмена заказа:</strong> Гость вправе отменить заказ только до момента, пока бариста
                не начал готовить (статусы «Принят» или «Ожидает оплаты»).
              </p>
              <p>
                <strong>4. Программа лояльности:</strong> За каждый напиток начисляется 1 штамп. 6-й штамп
                даёт право на один бесплатный напиток. Штампы не обмениваются на наличные.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-ink">
                Политика обработки персональных данных (152-ФЗ)
              </p>
              <p>
                <strong>1. Собираемые данные:</strong> Мы обрабатываем только номер телефона и выбранное имя
                (псевдоним) для идентификации заказа и начисления штампов.
              </p>
              <p>
                <strong>2. Локализация:</strong> В соответствии с 152-ФЗ сервер базы данных физически расположен
                на территории Российской Федерации.
              </p>
              <p>
                <strong>3. Безопасность:</strong> Данные защищены с использованием современных криптографических
                токенов (JWT) и не передаются третьим лицам.
              </p>
              <p>
                <strong>4. Отзыв согласия:</strong> Вы можете в любой момент отозвать согласие или удалить профиль,
                обратившись к бариста или по email: privacy@shitcoffee.ru.
              </p>
            </>
          )}
        </div>

        <Button onClick={onClose} className={cx('w-full mt-4')} variant="secondary" size="md">
          Понятно
        </Button>
      </SheetBody>
    </Sheet>
  )
}

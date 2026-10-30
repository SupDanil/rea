# Анализ Drinkit 3.48.0 (Android) → спецификация MVP

Источник: `ru.drinkit` 3.48.0 (versionCode 32465), APK выгружен из эмулятора через REA
(`pull_adb_package`), манифест — REA `decode_android_resources` (apktool 3.0.3),
модели — декомпиляция DEX (jadx 1.5.6), UX — живые экраны в эмуляторе.

Ничего из кода, текстов, фото и бренда Drinkit в наше приложение не переносится.
Берём только устройство функций.

## Что внутри у Drinkit

- Kotlin, single-activity (`ru.drinkit.ui.MainActivity`), Fragments + Jetpack Compose, MVI.
- Deep links `app.drinkit.io/menu`, `/category`, `/product`, `/promo`, `/orderHistory`, `/profile`.
- Модули: `menu`, `product`, `cart`, `order`, `loyalty`, `coffeepass`, `combo`, `payment`, `aisuggestions`, `game`.

### Модель данных меню (`ru.drinkit.common.menu.dto`)

```
MenuDto        { unitId, countryId, currencyId, version, categories[], items[] }
MenuCategory   { id, name, parentId }            // два уровня: категория → подкатегория
MenuItem       { id, name, description, imageUrlTemplate, banner, products[], relatedMenuItems[] }
Product        { id, menuItemId, name, size, sizeName, sizeLabel, prices{level→price},
                 stopped, definition: MenuDefinition, traits{isDrink,isFood},
                 composition, containAllergens, canContainAllergens, videoUrl }
MenuDefinition { kiloCalories, fats, carbohydrates, proteins, caffeine, weight }
IngredientGroup{ id, name, choiceType, totalQuantityMin, totalQuantityMax, ingredients[] }
Ingredient     { id, name, image, order, stopped, quantityVariations[{quantity, price, foodValue}] }
RelatedMenuItem{ menuItemId, type }              // напр. «холодная версия»
```

Ключевое: **MenuItem — это «напиток», Product — его размер (вариант)**. У каждого варианта своя цена,
КБЖУ и набор групп добавок. Добавка несёт свою цену и пищевую ценность.

## UX, который повторяем (по смыслу, не по виду)

**Меню**
1. Шапка: выбранная кофейня + часы работы.
2. Hero-блок активной категории: крупное фото/видео товара, название, цена.
3. Sticky-табы категорий; под ними второй ряд — подкатегории; скролл синхронизирован с табами.
4. Секции подкатегорий, карточки в сетке 2 колонки: картинка, название, цена, «>».
5. Стоп-лист: недоступные позиции видны, но приглушены.

**Карточка товара** (полноэкранная, закрывается крестиком)
1. Сверху КБЖУ (ккал / жиры / углеводы / белки) — пересчитывается от размера и добавок.
2. «Что внутри» — раскрывающийся состав и аллергены.
3. Большая картинка товара на фоне цвета товара.
4. Ряд чипов: связанный товар (напр. «холодная версия») | группы добавок с «+».
5. Тап по группе → сетка добавок поверх карточки: картинка, название, «+цена».
   Выбранная добавка инвертируется и получает ✓; чип группы показывает выбранную добавку.
   Группа с `max = 1` — одиночный выбор (повторный тап снимает), иначе — до `max` штук.
6. Низ: переключатель размера (M 300 мл / L 400 мл) и кнопка «+ цена» с итоговой суммой.

## MVP нашего приложения

- PWA: React 18 + TypeScript + Vite, `vite-plugin-pwa` (манифест, офлайн-кеш).
- Данные: локальный JSON с той же формой (категории → позиции → размеры → группы добавок).
- Экраны: меню и карточка товара. Корзина — только счётчик (вне MVP).
- Свой бренд, свои названия, свои SVG-иллюстрации вместо фото.

## Корзина и заказ (вторая итерация)

Источник: `ru.drinkit.cart.*`, `ru.drinkit.order.*` (jadx) и строковые ресурсы `res/values/strings.xml` (apktool).

- `CartDto { unitId, countryId, lines[], visibleTotalPrice, greeting }`, `CartLineDto { productId, isGiving }` —
  корзина привязана к кофейне; строка = вариант товара + ингредиенты.
- Модули корзины: `upsell` (допродажа прямо в корзине), `tipsntax`, `greeting`, промокод (`cart_promo_*`),
  подтверждение удаления позиции (`shopping_cart_confirmation`), ошибки стоп-листа при оплате.
- Имя на стакане: `nick_input_hint` «What's your name?», `order_and_nick` «%1$s · %2$s».
- Статусы активного заказа (`active_order_status_*`): paying → accepted («Got your order») → making («Preparing»)
  → ready («Order is ready. All good?») + cancelling/cancelled, payment_failed.
- Подэтапы приготовления (`active_order_time_*`): in line → studying recipe → preparing ingredients →
  whipping and mixing → final touches → packing; «almost ready», «delayed».
- Отмена с подтверждением и возвратом денег; после выдачи — оценка «All good?» да/нет.

В MVP повторяем: плавающая плашка корзины в меню, экран корзины со счётчиками и допродажей, имя,
время выдачи, промокод, демо-оплата, экран статуса с подэтапами, отменой и оценкой.

## Профиль и лояльность (третья итерация)

- Вход по телефону и SMS-коду (`phone_get_code_by_sms`, `sms_send_again`, `sms_wrong`), SMS ретривер
  (`ru.drinkit.auth.sms.SmsBroadcastReceiver`), кросс-авторизация через приложение Додо Пиццы.
- Приветственный бонус за регистрацию (`promo_auth_popup_*`); в корзине «Sign in by phone» для применения акции.
- Уровни лояльности: `RecentOrderLoyaltyLevelDto { level, discountPercent }`,
  `CalculatedOrderLoyaltyLevelDto` — скидка уровня считается в корзине; цены меню хранятся как `prices{level → price}`.
- Призовые боксы (`PrizeBox*`, «kitboxes»): «закажи на N — получи подарок», распаковка с конфетти.
- Coffee Pass — подписка (`PassDto`), в MVP не повторяем.
- Настройки профиля: имя, телефон, e-mail для чеков, уведомления, обратная связь, выход с подтверждением.

В MVP: вход по телефону с демо-кодом, уровни со скидкой по числу заказов, карта штампов с подарком
(вместо боксов), приветственный подарок, история заказов с «Повторить», настройки профиля.

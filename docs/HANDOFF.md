# Передача работы: «shit кофе» PWA

Репозиторий: `/Users/dakon/Desktop/REA` (GitHub `SupDanil/rea`, ветка `main`, деплой GitHub Pages через `.github/workflows/deploy.yml` на каждый push в `main`).
Приложение: `app/` — React 19 + TypeScript + Vite 8 + Tailwind v4 + react-router 8 (hash router) + vite-plugin-pwa. Node 22.23.4 (`nvm use 22.23.4`).
Команды (из `app/`): `npm run dev` (порт 5173; на маке слушать `127.0.0.1:5173`, на IPv6 5173 висит чужой проект), `npm run lint`, `npm run build` (включает `tsc -b`).
Пушить только с разрешения пользователя: `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main`.

## Состояние на текущий момент

Локальная ветка `main` опережает `origin/main` на 4 коммита (ничего не запушено):
- `4c830d6`: Фикс скачка стакана на реальном устройстве + одноколоночная карточка на развёрнутом экране.
- `3bf7a0c`: Замена View Transitions API на кастомные переходы и исправление жизненного цикла маршрутов в `AnimatedOutlet`.
- `4a12a0f`: Архитектурный слой `domain/`, `api/`, хуки TanStack Query и набор тестов Vitest (22 теста).
- `359657c`: Перевод компонентов меню и товара на хук `useCatalog` и синхронизация типов с `domain/`.

### 1. Отказ от View Transitions API (завершено и проверено)
- Реализованы экраны въезда (`sheet-up`) и ухода (`sheet-down 0.32s`) с флагом `data-leaving`.
- Решена проблема коллизии маршрутов: `AnimatedOutlet` использует монотонные `entryId`, предотвращая залипание экранов с одинаковым ключом при быстром открытии/закрытии.
- `src/utils/morph.ts`: перелёт клона арта между миниатюрой (`data-art-of={item.id}` на `ItemArt` в каталоге, корзине и `HeroBanner`) и стаканом товара.
- Проверено сценариями `scripts/tour.mjs` и `scripts/record_tour.mjs` на Android Chrome через CDP: `hash #/menu overlays 0 clones 0 hidden 0 errors none`.

### 2. Архитектура под бэкенд с админкой (завершено)
- **`domain/`**: чистая доменная логика без привязки к React/DOM (`catalog`, `cart`, `pricing`, `orders`, `profile`, `loyalty`).
- **`api/`**: DTO-типы (`types.ts`), единый интерфейс `ApiClient`, реализация `MockApiClient` (на основе локальных данных и localStorage) и `HttpApiClient` (обращается к `VITE_API_URL` с фоллбэком на мок).
- **`queries/`**: TanStack Query хуки (`useCatalog`, `useOrdersQuery`, `useCreateOrderMutation`, `useProfileQuery`, `useVerifySmsMutation`...). Меню загружается синхронно из начальных данных без мигания интерфейса.
- **`state/` (Контекст)**: строго клиентское состояние — корзина (localStorage `zerno-cart`), тема (dark/light), тосты и UI-анимации.
- **Тесты**: Vitest + jsdom + `@testing-library/react` с моками (`matchMedia`, `ResizeObserver`, `scrollTo`, `Element.animate`). 6 тестовых файлов, 22 теста — все проходят за <600 мс. В `.github/workflows/deploy.yml` добавлен шаг `npm test`.
- **Визуальная проверка**: сделан снимок всех 26 экранов в обеих темах через CDP на эмуляторе. Все экраны визуально идентичны до изменений.

### Что делать дальше:
1. При согласии пользователя отправить коммиты в репозиторий: `git push origin main`.
2. Подключение реального API бэкенда при появлении эндпоинтов (через переменную `VITE_API_URL`).
3. При необходимости расширить админские возможности (управление стоп-листом, ценами и т. д.).

## Договорённости с пользователем
- Ответы на русском, кратко.
- Дизайн не менять без просьбы; цвета карточки товара — токены `--pd-*` (светлая/тёмная тема).
- Анимации проверять записью экрана, а не только кодом; на реальных устройствах важна одинаковость во всех браузерах.
- Коммиты — с осмысленным сообщением; push только по просьбе.

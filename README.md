# Зерно — PWA кофейни

Мобильное веб-приложение кофейни: меню, карточка товара с добавками, корзина, заказ со статусами,
профиль с уровнями и штампами, тёмная тема. Работает офлайн и ставится на домашний экран.

- `app/` — приложение (React + TypeScript + Vite + vite-plugin-pwa), подробности в [app/README.md](app/README.md)
- `docs/` — заметки об устройстве функций, на которые ориентировались

## Локальный запуск

```bash
cd app
npm install
npm run dev
```

## Деплой на GitHub Pages

Workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) собирает `app/` и публикует его
при каждом пуше в `main`. Адрес: `https://<пользователь>.github.io/<репозиторий>/`.

Один раз в настройках репозитория: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Бэкенда нет: оплата, SMS-код (`1234`) и заказы — демо, данные хранятся в браузере.

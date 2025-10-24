# 🚀 Быстрый старт

## Локальная разработка

1. **Установка**
```bash
npm install
```

2. **Настройка переменных окружения**

Создайте `.env.local` и добавьте:
```env
XMLSTOCK_USER=your_user_id
XMLSTOCK_KEY=your_api_key
GCP_NL_CREDENTIALS_JSON='{"type":"service_account",...}'
OPENROUTER_API_KEY=sk-or-v1-your-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

3. **Запуск**
```bash
npm run dev
```

Откройте http://localhost:3000

---

## Деплой на Railway

1. **Создайте проект**
   - Перейдите на https://railway.app/
   - Нажмите "New Project" → "Deploy from GitHub repo"
   - Выберите ваш репозиторий

2. **Настройте переменные окружения** в Railway:
   - `XMLSTOCK_USER`
   - `XMLSTOCK_KEY`
   - `GCP_NL_CREDENTIALS_JSON` (в одну строку!)
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`

3. **Готово!** Railway автоматически развернёт приложение

Подробнее: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Основные команды

```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшна
npm start            # Запуск prod сервера
npm run lint         # Проверка кода
npm run type-check   # Проверка типов
npm run format       # Форматирование кода
```

---

## Получение API ключей

### XMLStock
- Регистрация: https://xmlstock.com/
- Получить User ID и API Key

### Google Cloud Natural Language
- Консоль: https://console.cloud.google.com/
- Включить Natural Language API
- Создать Service Account
- Скачать JSON ключ

### OpenRouter
- Регистрация: https://openrouter.ai/
- Создать API ключ
- Пополнить баланс ($5 минимум)

### Upstash Redis (опционально)
- Регистрация: https://upstash.com/
- Создать базу Redis
- Получить REST URL и Token

---

## Проблемы?

1. Проверьте [README.md](README.md) → раздел "Отладка"
2. См. [DEPLOYMENT.md](DEPLOYMENT.md) для деплоя
3. Откройте issue в GitHub


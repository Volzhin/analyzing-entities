# Анализ ключевых объектов в ТОП-10 Google

Веб-сервис для анализа ключевых сущностей в органических результатах поиска Google с использованием Google Cloud Natural Language API и AI-анализа.

## 🚀 Возможности

- **Поиск ТОП-10 результатов** через XMLStock API
- **Извлечение контента** со страниц с помощью Readability
- **Анализ сущностей** через Google Cloud Natural Language API
- **AI-сводка и рекомендации** через OpenRouter API
- **Кэширование результатов** с Redis/память
- **Экспорт данных** в JSON/CSV форматах
- **Красивый UI** с адаптивным дизайном

## 🛠 Технологии

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Google Cloud Natural Language
- **AI**: OpenRouter API (Claude, GPT-4, и др.)
- **Кэш**: Upstash Redis (с fallback на память)
- **Парсинг**: Mozilla Readability, jsdom
- **Лемматизация**: Natural.js для группировки словоформ

## 📋 Требования

- Node.js 18+ 
- npm или yarn
- API ключи для сервисов (см. настройка)

## ⚙️ Установка

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd analyzing-entities
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
Создайте файл `.env.local` на основе `env.example`:

```bash
cp env.example .env.local
```

Заполните следующие переменные:

```env
# XMLStock API
XMLSTOCK_USER=your_user_id
XMLSTOCK_KEY=your_api_key

# Google Cloud Natural Language
GCP_NL_CREDENTIALS_JSON='{"type":"service_account",...}'

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-your-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Upstash Redis (опционально)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 🔧 Настройка API

### XMLStock API
1. Зарегистрируйтесь на [XMLStock](https://xmlstock.com/)
2. Получите User ID и API Key
3. Добавьте в `.env.local`

### Google Cloud Natural Language
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Natural Language API
3. Создайте Service Account
4. Скачайте JSON ключ и добавьте в `GCP_NL_CREDENTIALS_JSON`

### OpenRouter API
1. Зарегистрируйтесь на [OpenRouter](https://openrouter.ai/)
2. Получите API ключ
3. Добавьте в `.env.local`

### Upstash Redis (опционально)
1. Создайте базу данных в [Upstash](https://upstash.com/)
2. Получите REST URL и Token
3. Добавьте в `.env.local`

## 🚀 Запуск

### Разработка
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Продакшн
```bash
npm run build
npm start
```

## 📖 Использование

1. **Введите поисковый запрос** (например: "best wireless headphones")
2. **Выберите параметры**: страна, язык, устройство
3. **Нажмите "Анализировать"**
4. **Дождитесь результатов** (может занять 1-3 минуты)
5. **Изучите результаты**:
   - Сводку и рекомендации от AI
   - Агрегированные сущности
   - Результаты по каждому URL
6. **Экспортируйте данные** в JSON или CSV

## 🧪 Проверка качества

```bash
# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Форматирование
npm run format
```

## 📁 Структура проекта

```
/app
  /api
    /search/route.ts           # GET: получение ТОП-10
    /analyze/route.ts          # POST: полный анализ
    /export/route.ts           # POST: экспорт данных
  /api-docs/page.tsx           # Документация API
  /wiki/page.tsx               # Wiki по типам сущностей
  /page.tsx                    # Главная страница
/components
  SearchForm.tsx               # Форма поиска
  ResultsSummary.tsx           # Сводка результатов
  EntityTable.tsx              # Таблица сущностей
  EntityGroupedList.tsx        # Группированные сущности
  UrlCard.tsx                  # Карточка URL
  LoadingSkeleton.tsx          # Скелетоны загрузки
  ErrorState.tsx               # Состояния ошибок
  /ui                          # Базовые UI компоненты
/lib
  xmlstock.ts                  # XMLStock API клиент
  fetchPage.ts                 # Извлечение контента
  gcpNl.ts                     # Google Cloud NL
  openrouter.ts                # OpenRouter API
  pipeline.ts                  # Основной pipeline
  cache.ts                     # Кэширование
  lemmatization.ts             # Лемматизация
  types.ts                     # TypeScript типы
  utils.ts                     # Утилиты
```

## 🔄 Процесс анализа

1. **Поиск**: Получение ТОП-10 результатов через XMLStock
2. **Извлечение**: Загрузка и очистка контента со страниц
3. **Анализ**: Определение сущностей через Google Cloud NL
4. **Агрегация**: Группировка и сортировка сущностей
5. **Сводка**: Генерация рекомендаций через AI
6. **Кэширование**: Сохранение результатов

## ⚡ Оптимизации

- **Кэширование**: Результаты кэшируются на 24 часа
- **Конкурентность**: Ограничение до 3 одновременных запросов
- **Таймауты**: Настройка таймаутов для всех API
- **Ретраи**: Автоматические повторы при ошибках
- **Fallback**: Резервные варианты для всех сервисов

## 🚨 Ограничения

- **Лимиты API**: Соблюдайте лимиты всех используемых сервисов
- **Время анализа**: Полный анализ может занять 1-3 минуты
- **Размер контента**: Ограничение на размер извлекаемого текста
- **Количество запросов**: Ограничение на одновременные запросы

## 🐛 Отладка

### Частые проблемы

1. **Ошибка аутентификации Google Cloud**
   - Проверьте формат JSON в `GCP_NL_CREDENTIALS_JSON`
   - Убедитесь, что Natural Language API включен

2. **Ошибка XMLStock API**
   - Проверьте User ID и API Key
   - Убедитесь, что не превышены лимиты

3. **Ошибка OpenRouter API**
   - Проверьте API ключ
   - Убедитесь, что на счету есть средства

4. **Медленная загрузка**
   - Проверьте интернет-соединение
   - Попробуйте уменьшить количество URL

### Логи

Логи выводятся в консоль сервера. Для продакшена настройте централизованное логирование.

## 🚢 Деплой

### Railway (рекомендуется)

Подробные инструкции по деплою на Railway см. в файле [DEPLOYMENT.md](DEPLOYMENT.md)

Краткая инструкция:
1. Создайте аккаунт на [Railway](https://railway.app/)
2. Подключите GitHub репозиторий
3. Настройте переменные окружения
4. Railway автоматически развернёт приложение

### Другие платформы

Проект также может быть развёрнут на:
- **Vercel** (с ограничениями на серверные функции)
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**

Для других платформ используйте команды:
```bash
npm run build
npm start
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Проверьте типы и линтинг
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
1. Проверьте раздел "Отладка"
2. Создайте Issue в репозитории
3. Обратитесь к документации API сервисов

---

**Примечание**: Этот инструмент предназначен для образовательных и исследовательских целей. Соблюдайте условия использования всех внешних сервисов и API.

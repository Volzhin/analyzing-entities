# Деплой на Railway

Это руководство поможет развернуть приложение для анализа сущностей на Railway.

## Предварительные требования

1. Аккаунт на [Railway](https://railway.app/)
2. GitHub аккаунт (для подключения репозитория)
3. Все необходимые API ключи:
   - XMLStock API (user и key)
   - Google Cloud Natural Language API (credentials JSON)
   - OpenRouter API key
   - (Опционально) Upstash Redis

## Шаг 1: Подготовка репозитория

1. Создайте новый репозиторий на GitHub
2. Инициализируйте Git (если ещё не сделано):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
   git push -u origin main
   ```

## Шаг 2: Создание проекта на Railway

1. Перейдите на [Railway](https://railway.app/)
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Авторизуйте Railway для доступа к вашим репозиториям
5. Выберите репозиторий с проектом

## Шаг 3: Настройка переменных окружения

В настройках проекта Railway добавьте следующие переменные окружения:

### Обязательные переменные:

```env
# XMLStock API
XMLSTOCK_USER=ваш_user_id
XMLSTOCK_KEY=ваш_api_key

# Google Cloud Natural Language API
GCP_NL_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# OpenRouter API
OPENROUTER_API_KEY=ваш_openrouter_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### Опциональные переменные (для Redis кэширования):

```env
UPSTASH_REDIS_REST_URL=https://ваш-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=ваш_redis_token
```

**ВАЖНО для GCP_NL_CREDENTIALS_JSON:**
- Это должен быть **один JSON в одну строку**
- Все переносы строк в `private_key` должны быть представлены как `\n`
- Пример правильного формата:
  ```json
  {"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n","client_email":"your-email@project.iam.gserviceaccount.com"}
  ```

## Шаг 4: Настройка домена (опционально)

1. В настройках проекта Railway перейдите в раздел **"Settings"**
2. В разделе **"Domains"** нажмите **"Generate Domain"**
3. Railway автоматически сгенерирует домен вида `your-app.up.railway.app`
4. Для кастомного домена:
   - Нажмите **"Add Custom Domain"**
   - Введите ваш домен
   - Настройте DNS записи согласно инструкциям Railway

## Шаг 5: Деплой

После настройки переменных окружения Railway автоматически начнёт деплой:

1. Откройте раздел **"Deployments"**
2. Следите за процессом сборки в логах
3. После успешной сборки приложение будет доступно по сгенерированному URL

## Шаг 6: Проверка работы

1. Откройте URL вашего приложения
2. Попробуйте выполнить анализ для тестового запроса
3. Проверьте логи в Railway если возникли ошибки

## Автоматические обновления

Railway автоматически пересобирает и деплоит приложение при каждом push в main ветку GitHub.

Чтобы обновить приложение:
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

## Мониторинг и логи

- **Логи**: В Railway откройте проект и перейдите в раздел "Logs"
- **Метрики**: В разделе "Metrics" можно посмотреть использование CPU, памяти и трафика
- **Использование**: Railway показывает текущее использование ресурсов и стоимость

## Отладка проблем

### Ошибка сборки (Build Failed)

1. Проверьте логи сборки в Railway
2. Убедитесь, что все зависимости указаны в `package.json`
3. Проверьте, что `build` скрипт работает локально: `npm run build`

### Ошибка запуска (Crash on Start)

1. Проверьте логи запуска
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте формат `GCP_NL_CREDENTIALS_JSON` (должен быть валидный JSON)

### API не работает

1. Проверьте, что все API ключи действительны
2. Для Google Cloud NLP убедитесь, что API включен в консоли GCP
3. Проверьте логи на наличие ошибок аутентификации

### Медленная работа

1. Рассмотрите возможность настройки Upstash Redis для кэширования
2. Проверьте метрики использования ресурсов
3. Возможно, стоит обновить план Railway для большей производительности

## Стоимость

Railway предоставляет:
- **$5/месяц** бесплатного кредита на Hobby Plan
- **$20/месяц** за Developer Plan (более высокие лимиты)

Обычно это приложение потребляет:
- ~100-200 MB RAM
- ~0.1 vCPU
- ~1-5 GB трафика в месяц

## Масштабирование

Для увеличения производительности:
1. В настройках Railway можно увеличить лимиты ресурсов
2. Настройте Redis кэширование (значительно уменьшает количество API запросов)
3. Используйте CDN для статических ресурсов

## Резервное копирование

Переменные окружения рекомендуется сохранить в безопасном месте (например, в менеджере паролей).

## Альтернативы Railway

Если Railway не подходит, можно использовать:
- **Vercel** (но есть ограничения на серверные функции)
- **Render** (похож на Railway)
- **Fly.io** (больше контроля над инфраструктурой)
- **DigitalOcean App Platform**
- **Heroku** (дороже Railway)

## Поддержка

При проблемах с деплоем:
1. Проверьте [документацию Railway](https://docs.railway.app/)
2. Обратитесь в [Discord сообщество Railway](https://discord.gg/railway)
3. Откройте issue в GitHub репозитории проекта


import { AggregateEntity, XmlStockResult, ComparisonResult } from './types';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY не настроен в переменных окружения');
    }
  }

  async generateAnalysis(
    query: string,
    top10: XmlStockResult[],
    aggregateEntities: AggregateEntity[],
    perUrlEntities: Record<string, any[]>,
    comparison?: ComparisonResult
  ): Promise<string> {
    try {
      const systemPrompt = this.getSystemPrompt(!!comparison);
      const userContent = this.buildUserContent(query, top10, aggregateEntities, perUrlEntities, comparison);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://analyzing-entities.vercel.app',
          'X-Title': 'Entity Analysis Tool',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error.message}`);
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error('Пустой ответ от OpenRouter API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('Превышен лимит OpenRouter API');
        }
        if (error.message.includes('authentication') || error.message.includes('credentials')) {
          throw new Error('Ошибка аутентификации OpenRouter API');
        }
        throw new Error(`Ошибка генерации анализа: ${error.message}`);
      }
      throw new Error('Неизвестная ошибка при генерации анализа');
    }
  }

  private getSystemPrompt(hasUserPageComparison: boolean): string {
    let prompt = `Ты — SEO-аналитик уровня Senior с 10+ летним опытом. Проанализируй данные Google Natural Language API и создай ДЕТАЛЬНЫЙ отчёт.

## СТРУКТУРА ОТЧЁТА:

### 1. Краткая сводка главных тем и сущностей в ТОП-10

Детально опиши:
- **Основные тематические кластеры** (перечисли 5-7 кластеров с примерами сущностей)
- **Доминирующие типы сущностей** (PERSON, ORGANIZATION, LOCATION и т.д.)
- **Ключевые паттерны** в названиях и описаниях страниц
- **Общий контекст** выдачи (информационный/коммерческий/навигационный)

Пример формата:
\`\`\`
Основные тематические кластеры:
1. **Образовательные платформы** (Skillbox, Яндекс Практикум, Skyeng) — встречается в 8/10 документов
2. **Методики обучения** (интенсивные курсы, индивидуальные занятия, групповые уроки) — высокая частота упоминаний
3. ...
\`\`\`

---

### 2. Практические рекомендации по ранжированию

Дай 10-15 КОНКРЕТНЫХ рекомендаций по категориям:

#### Контент:
- Что должно быть на странице (с примерами)
- Какие темы раскрыть подробно
- Какие форматы использовать

#### Структура:
- Как организовать информацию
- Какие блоки обязательны
- Как структурировать заголовки

#### Интенты:
- Какие запросы пользователей закрывает выдача
- На что делать акцент
- Что важно для конверсии

#### E-E-A-T:
- Как показать экспертность
- Какие сигналы доверия добавить
- Что подтвердит авторитетность

#### Технические аспекты:
- Скорость загрузки
- Адаптивность
- Интерактивные элементы

Каждая рекомендация должна быть actionable!

---

### 3. Таблица "Сущность — важность — реализация"

Создай подробную таблицу для ТОП-20 сущностей:

| Сущность | Тип | Частота | Почему важна | Как учесть в контенте |
|----------|-----|---------|--------------|----------------------|
| Английский язык | CONSUMER_GOOD | 9/10 | Основной предмет запроса | 1) Детальное описание программы<br>2) Разбивка по уровням (A1-C2)<br>3) Методики преподавания<br>4) Примеры материалов |
| Грамматика | OTHER | 7/10 | Ключевой аспект обучения | 1) Раздел "Как мы учим грамматике"<br>2) Примеры упражнений<br>3) Прогресс-трекинг |

**ВАЖНО:** Для каждой сущности дай 2-4 конкретных способа реализации!

---`;

    // Добавляем раздел 4 только если есть сравнение пользовательской страницы
    if (hasUserPageComparison) {
      prompt += `

### 4. Пробелы и возможности (анализ пользовательской страницы)

Для КАЖДОГО пробела на пользовательской странице предоставь:

#### [Название сущности/темы] — [уровень приоритета: ВЫСОКИЙ/СРЕДНИЙ/НИЗКИЙ]

**Текущая ситуация:**
- В скольких документах ТОП-10 это присутствует
- Как это реализовано у конкурентов
- Почему это важно для ранжирования

**Что конкретно добавить на страницу пользователя:**
- Детальное описание контента
- Объём (количество слов/блоков)
- Формат подачи
- Где на странице разместить

**Примеры у конкурентов:**
- URL #1: [название страницы] — [что именно сделано хорошо, конкретные примеры]
- URL #2: [название страницы] — [что именно сделано хорошо, конкретные примеры]
- Цитаты/описание подходов

**Как реализовать (пошагово):**
1. [Конкретный шаг 1 с примером текста/структуры]
2. [Конкретный шаг 2 с примером текста/структуры]
3. [Конкретный шаг 3 с примером текста/структуры]

**Ожидаемый эффект:**
- Улучшение релевантности по запросу
- Повышение E-E-A-T
- Улучшение позиций в выдаче

---`;
    }

    prompt += `

## ПРАВИЛА НАПИСАНИЯ:

✅ Используй конкретные цифры и факты из данных
✅ Приводи примеры URL конкурентов где это уместно
✅ Давай actionable советы, которые можно сразу применить
✅ Используй форматирование markdown для читаемости
✅ Будь максимально детальным и практичным

❌ Не используй общие фразы типа "нужно улучшить контент"
❌ Не повторяйся
❌ Не давай советов без конкретики

Пиши профессионально, структурированно и по делу.`;

    return prompt;
  }

  private buildUserContent(
    query: string,
    top10: XmlStockResult[],
    aggregateEntities: AggregateEntity[],
    perUrlEntities: Record<string, any[]>,
    comparison?: ComparisonResult
  ): string {
    const topEntities = aggregateEntities.slice(0, 20);
    const sampleUrls = Object.keys(perUrlEntities).slice(0, 3);
    
    let content = `Запрос: "${query}"\n\n`;
    
    content += `ТОП-10 результатов Google:\n`;
    top10.forEach((result, index) => {
      content += `${index + 1}. ${result.title}\n   URL: ${result.url}\n`;
      if (result.snippet) {
        content += `   Snippet: ${result.snippet.substring(0, 150)}...\n`;
      }
    });

    content += `\n=== ТОП СУЩНОСТИ (АГРЕГИРОВАННЫЕ) ===\n`;
    content += `Всего найдено уникальных сущностей: ${aggregateEntities.length}\n\n`;
    
    // Группируем по типам для статистики
    const byType: Record<string, number> = {};
    aggregateEntities.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    
    content += `Распределение по типам:\n`;
    Object.entries(byType).forEach(([type, count]) => {
      content += `- ${type}: ${count} сущностей\n`;
    });
    
    content += `\nТОП-20 важнейших сущностей:\n`;
    topEntities.forEach((entity, index) => {
      content += `\n${index + 1}. **${entity.name}** (${entity.type})\n`;
      content += `   - Общий Salience: ${entity.totalSalience.toFixed(3)}\n`;
      content += `   - Средний Salience: ${entity.avgSalience.toFixed(3)}\n`;
      content += `   - Встречается в ${entity.docCount}/${top10.length} документах\n`;
      content += `   - Количество упоминаний: ${entity.sampleMentions}\n`;
      
      // Показываем на каких конкретно страницах
      if (entity.sources && entity.sources.length > 0) {
        content += `   - Присутствует на:\n`;
        entity.sources.slice(0, 3).forEach(sourceUrl => {
          const pageInfo = top10.find(r => r.url === sourceUrl);
          if (pageInfo) {
            content += `     * ${pageInfo.title}\n`;
          }
        });
        if (entity.sources.length > 3) {
          content += `     * ...и ещё ${entity.sources.length - 3} страниц\n`;
        }
      }
      
      // Показываем оригинальные формы если есть
      if (entity.originalForms && entity.originalForms.length > 1) {
        content += `   - Варианты написания: ${entity.originalForms.slice(0, 5).join(', ')}`;
        if (entity.originalForms.length > 5) {
          content += ` (+${entity.originalForms.length - 5})`;
        }
        content += `\n`;
      }
    });

    content += `\nПримеры сущностей по URL:\n`;
    sampleUrls.forEach(url => {
      const entities = perUrlEntities[url];
      if (entities && entities.length > 0) {
        content += `\n${url}:\n`;
        entities.slice(0, 5).forEach(entity => {
          content += `- ${entity.name} (${entity.type}, salience: ${entity.salience.toFixed(3)})\n`;
        });
      }
    });

    // Добавляем информацию о сравнении если есть
    if (comparison) {
      content += `\n\n=== АНАЛИЗ ПОЛЬЗОВАТЕЛЬСКОЙ СТРАНИЦЫ ===\n`;
      content += `URL: ${comparison.userPage.url}\n`;
      content += `Заголовок: ${comparison.userPage.title || 'Не найден'}\n`;
      content += `Количество слов: ${comparison.userPage.wordCount}\n`;
      content += `Найдено сущностей: ${comparison.userPage.entityCount}\n\n`;
      
      content += `Топ-5 сущностей на странице:\n`;
      comparison.userPage.topEntities.slice(0, 5).forEach((entity, index) => {
        content += `${index + 1}. ${entity.name} (${entity.type}, salience: ${entity.salience.toFixed(3)})\n`;
      });
      
      content += `\nОтсутствующие важные сущности (${comparison.missingEntities.length}):\n`;
      comparison.missingEntities.slice(0, 10).forEach((entity, index) => {
        content += `${index + 1}. ${entity.name} (${entity.type})\n`;
        content += `   - Встречается в ${entity.docCount} документах ТОП-10\n`;
        content += `   - Средний salience: ${entity.avgSalience.toFixed(3)}\n`;
        
        // Добавляем конкретные URL, где встречается эта сущность
        if (entity.sources && entity.sources.length > 0) {
          content += `   - Найдена на страницах:\n`;
          entity.sources.slice(0, 3).forEach(sourceUrl => {
            // Находим соответствующий результат из ТОП-10
            const pageInfo = top10.find(r => r.url === sourceUrl);
            if (pageInfo) {
              content += `     * ${pageInfo.title}\n`;
              content += `       ${sourceUrl}\n`;
            } else {
              content += `     * ${sourceUrl}\n`;
            }
          });
          if (entity.sources.length > 3) {
            content += `     * ...и ещё ${entity.sources.length - 3} страниц\n`;
          }
        }
      });
      
      content += `\nРекомендации по улучшению:\n`;
      comparison.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
      
      content += `\nКритические пробелы в сущностях:\n`;
      comparison.entityGaps.forEach((gap, index) => {
        content += `${index + 1}. ${gap.entity.name} (${gap.importance} приоритет)\n`;
        content += `   - ${gap.recommendation}\n`;
        
        // Добавляем примеры страниц, где это сделано хорошо
        if (gap.entity.sources && gap.entity.sources.length > 0) {
          content += `   - Хорошо реализовано на:\n`;
          gap.entity.sources.slice(0, 2).forEach(sourceUrl => {
            const pageInfo = top10.find(r => r.url === sourceUrl);
            if (pageInfo) {
              content += `     * "${pageInfo.title}" - ${sourceUrl}\n`;
              if (pageInfo.snippet) {
                content += `       Snippet: ${pageInfo.snippet.substring(0, 100)}...\n`;
              }
            }
          });
        }
      });
    }

    return content;
  }

  getAvailableModels(): string[] {
    return [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo-preview',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'meta-llama/llama-2-70b-chat',
      'google/gemini-pro',
    ];
  }

  async switchModel(newModel: string): Promise<void> {
    const availableModels = this.getAvailableModels();
    if (!availableModels.includes(newModel)) {
      throw new Error(`Модель ${newModel} не поддерживается`);
    }
    
    this.model = newModel;
  }

  getCurrentModel(): string {
    return this.model;
  }
}

export const openRouterClient = new OpenRouterClient();

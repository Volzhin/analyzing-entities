import { LanguageServiceClient } from '@google-cloud/language';
import { EntityItem, EntityType } from './types';

export class GCPNaturalLanguageClient {
  private client: LanguageServiceClient | null = null;
  private initialized = false;

  // Маппинг языков из параметров поиска в коды ISO-639-1 для Google Cloud Natural Language API
  private languageMapping: Record<string, string> = {
    'en': 'en',      // Английский
    'ru': 'ru',      // Русский
    'fr': 'fr',      // Французский
    'de': 'de',      // Немецкий
    'it': 'it',      // Итальянский
    'ja': 'ja',      // Японский
    'ko': 'ko',      // Корейский
    'pt': 'pt',      // Португальский
    'es': 'es',      // Испанский
    'zh': 'zh',      // Китайский (упрощенный)
    'zh-Hant': 'zh-Hant', // Китайский (традиционный)
  };

  constructor() {
    // Не вызываем initializeClient в конструкторе, так как он асинхронный
    // Инициализация произойдет при первом вызове analyzeEntities
  }

  private getLanguageCode(searchLang: string): string | undefined {
    return this.languageMapping[searchLang] || undefined;
  }

  private async initializeClient(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Инициализируем Google Cloud Natural Language клиент...');
      const credentialsJson = process.env.GCP_NL_CREDENTIALS_JSON;
      
      if (!credentialsJson) {
        throw new Error('GCP_NL_CREDENTIALS_JSON не настроен в переменных окружения');
      }

      console.log('Переменная GCP_NL_CREDENTIALS_JSON найдена, длина:', credentialsJson.length);
      
      // Парсим JSON строку в объект
      const credentials = JSON.parse(credentialsJson);
      console.log('JSON парсинг успешен, project_id:', credentials.project_id);
      
      this.client = new LanguageServiceClient({
        credentials: credentials,
        projectId: credentials.project_id,
      });

      console.log('Google Cloud Natural Language клиент инициализирован успешно');
      this.initialized = true;
    } catch (error) {
      console.error('Ошибка инициализации Google Cloud Natural Language:', error);
      throw new Error(`Ошибка инициализации Google Cloud Natural Language: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async analyzeEntities(text: string, sourceUrl: string, searchLang?: string): Promise<EntityItem[]> {
    await this.initializeClient();

    if (!text || text.length < 10) {
      throw new Error('Текст слишком короткий для анализа');
    }

    try {
      const document: any = {
        content: text,
        type: 'PLAIN_TEXT' as const,
      };

      // Добавляем язык, если он указан и поддерживается
      const languageCode = searchLang ? this.getLanguageCode(searchLang) : undefined;
      if (languageCode) {
        document.languageCode = languageCode;
        console.log(`Используем язык для анализа сущностей: ${languageCode} (из ${searchLang})`);
      } else if (searchLang) {
        console.log(`Язык ${searchLang} не поддерживается Google Cloud Natural Language API, используем автоопределение`);
      }

      const [result] = await this.client!.analyzeEntities({
        document: document,
        encodingType: 'UTF8' as const,
      });

      console.log(`Google NLP API ответ для ${sourceUrl}:`, {
        entitiesCount: result.entities?.length || 0,
        languageCode: result.language,
        fullResult: JSON.stringify(result, null, 2)
      });

      if (!result.entities || result.entities.length === 0) {
        console.log(`Нет сущностей для ${sourceUrl}, полный ответ:`, JSON.stringify(result, null, 2));
        return [];
      }

      const entities: EntityItem[] = result.entities
        .filter(entity => entity.name && entity.name.trim().length > 0)
        .map(entity => {
          // Извлекаем фрагменты текста из mentions
          const mentionTexts = entity.mentions?.map(mention => {
            if (mention.text?.content) {
              return mention.text.content;
            }
            return entity.name!; // Fallback к имени сущности
          }) || [entity.name!];

          console.log(`Сущность: ${entity.name}, Mentions:`, entity.mentions?.length || 0, 'Texts:', mentionTexts);

          const normalizedName = this.normalizeEntityName(entity.name!);
          return {
            name: normalizedName,
            type: this.normalizeEntityType(entity.type || 'UNKNOWN', entity.name || ''),
            salience: entity.salience || 0,
            mentions: entity.mentions?.length || 1,
            url: entity.metadata?.wikipedia_url || undefined,
            sourceUrl: sourceUrl,
            wikipedia_url: entity.metadata?.wikipedia_url || undefined,
            mentionTexts: mentionTexts,
          };
        })
        .filter(entity => entity.salience > 0.001) // Фильтруем очень слабые сущности
        .sort((a, b) => b.salience - a.salience); // Сортируем по salience

      return entities;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('Превышен лимит Google Cloud Natural Language API');
        }
        if (error.message.includes('authentication') || error.message.includes('credentials')) {
          throw new Error('Ошибка аутентификации Google Cloud Natural Language API');
        }
        throw new Error(`Ошибка анализа сущностей: ${error.message}`);
      }
      throw new Error('Неизвестная ошибка при анализе сущностей');
    }
  }

  private normalizeEntityName(name: string): string {
    return name
      .trim()
      // Удаляем знаки препинания и специальные символы
      .replace(/[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>]+/g, ' ')
      // Удаляем цифры в начале и конце
      .replace(/^\d+|\d+$/g, '')
      // Удаляем слова из одной буквы или цифры
      .replace(/\b[а-яёa-z0-9]\b/gi, ' ')
      // Нормализуем пробелы
      .replace(/\s+/g, ' ')
      .trim()
      // Ограничиваем длину
      .substring(0, 100);
  }

  // Словарь для исправления неправильно классифицированных сущностей
  private entityTypeCorrections: Record<string, EntityType> = {
    // Образовательные термины (часто неправильно определяются как PERSON)
    'урок': 'EVENT',
    'уроки': 'EVENT',
    'урока': 'EVENT',
    'уроков': 'EVENT',
    'занятие': 'EVENT',
    'занятия': 'EVENT',
    'курс': 'EVENT',
    'курсы': 'EVENT',
    'лекция': 'EVENT',
    'лекции': 'EVENT',
    'тренинг': 'EVENT',
    'тренинги': 'EVENT',
    'вебинар': 'EVENT',
    'вебинары': 'EVENT',
    'семинар': 'EVENT',
    'семинары': 'EVENT',
    // Общие существительные
    'сайт': 'OTHER',
    'сайта': 'OTHER',
    'сайтов': 'OTHER',
    'сайты': 'OTHER',
    'страница': 'OTHER',
    'страницы': 'OTHER',
    'ресурс': 'OTHER',
    'ресурсы': 'OTHER',
  };

  private normalizeEntityType(type: any, entityName?: string): EntityType {
    // Проверяем, нужно ли исправить тип на основе названия сущности
    if (entityName) {
      const lowerName = entityName.toLowerCase().trim();
      if (this.entityTypeCorrections[lowerName]) {
        console.log(`Исправляем тип для "${entityName}": ${type} -> ${this.entityTypeCorrections[lowerName]}`);
        return this.entityTypeCorrections[lowerName];
      }
    }
    
    const typeMap: Record<string, EntityType> = {
      'PERSON': 'PERSON',
      'ORGANIZATION': 'ORGANIZATION',
      'LOCATION': 'LOCATION',
      'CONSUMER_GOOD': 'CONSUMER_GOOD',
      'EVENT': 'EVENT',
      'WORK_OF_ART': 'WORK_OF_ART',
      'PHONE_NUMBER': 'PHONE_NUMBER',
      'ADDRESS': 'ADDRESS',
      'DATE': 'DATE',
      'NUMBER': 'NUMBER',
      'PRICE': 'PRICE',
      'OTHER': 'OTHER',
      'UNKNOWN': 'UNKNOWN',
    };

    return typeMap[type] || 'OTHER';
  }

  async analyzeEntitiesBatch(texts: Array<{ text: string; url: string; searchLang?: string }>): Promise<Record<string, EntityItem[]>> {
    const results: Record<string, EntityItem[]> = {};
    
    // Обрабатываем по одному, чтобы избежать превышения лимитов
    for (const { text, url, searchLang } of texts) {
      try {
        const entities = await this.analyzeEntities(text, url, searchLang);
        results[url] = entities;
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Ошибка анализа сущностей для ${url}:`, error);
        results[url] = [];
      }
    }

    return results;
  }

  async getEntityTypes(): Promise<EntityType[]> {
    return [
      'PERSON',
      'ORGANIZATION', 
      'LOCATION',
      'CONSUMER_GOOD',
      'EVENT',
      'WORK_OF_ART',
      'PHONE_NUMBER',
      'ADDRESS',
      'DATE',
      'NUMBER',
      'PRICE',
      'OTHER',
      'UNKNOWN'
    ];
  }

  getEntityTypeLabel(type: EntityType): string {
    const labels: Record<EntityType, string> = {
      'PERSON': 'Персона',
      'ORGANIZATION': 'Организация',
      'LOCATION': 'Местоположение',
      'CONSUMER_GOOD': 'Товар',
      'EVENT': 'Событие',
      'WORK_OF_ART': 'Произведение искусства',
      'PHONE_NUMBER': 'Номер телефона',
      'ADDRESS': 'Адрес',
      'DATE': 'Дата',
      'NUMBER': 'Число',
      'PRICE': 'Цена',
      'OTHER': 'Другое',
      'UNKNOWN': 'Неизвестно',
    };

    return labels[type] || 'Другое';
  }
}

export const gcpNlClient = new GCPNaturalLanguageClient();

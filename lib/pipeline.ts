// Простая реализация лимитера вместо p-limit
import { xmlStockClient } from './xmlstock';
import { pageExtractor } from './fetchPage';
import { gcpNlClient } from './gcpNl';
import { openRouterClient } from './openrouter';
import { cacheManager } from './cache';
import { normalizEntityName } from './lemmatization';
import { 
  SearchParams, 
  PipelineResult, 
  XmlStockResult, 
  PageExtract, 
  EntityItem, 
  AggregateEntity,
  CacheKey,
  UserPageAnalysis,
  ComparisonResult
} from './types';

export class AnalysisPipeline {
  private concurrencyLimit = 3; // Максимум 3 одновременных запроса

  async runAnalysis(params: SearchParams): Promise<PipelineResult> {
    const startTime = Date.now();
    const cacheKey: CacheKey = {
      query: params.query,
      country: params.country || 'us',
      lang: params.lang || 'en',
      device: params.device || 'desktop',
    };

    // Проверяем кэш
    const cachedResult = await cacheManager.getAnalysisResult(cacheKey);
    if (cachedResult) {
      console.log('Возвращаем результат из кэша');
      return cachedResult;
    }

    console.log('Запускаем новый анализ для запроса:', params.query);

    try {
      // Шаг 1: Получаем ТОП-10 результатов
      const top10 = await this.fetchTop10Results(params);
      console.log(`🔍 Получено ${top10.length} результатов из XMLStock`);
      console.log(`📋 Первые 3 URL:`, top10.slice(0, 3).map(r => r.url));

      // Шаг 2: Загружаем и извлекаем контент со страниц
      const { extracts: pageExtracts, errors: extractionErrors } = await this.fetchAndExtractPages(top10);
      console.log(`📄 Извлечен контент с ${pageExtracts.length} страниц`);

      // Шаг 3: Анализируем сущности
      const perUrlEntities = await this.analyzeEntities(pageExtracts, params.lang);
      console.log('✅ Завершен анализ сущностей');

      // Шаг 4: Агрегируем результаты
      const aggregateEntities = this.aggregateEntities(perUrlEntities);
      console.log(`Агрегировано ${aggregateEntities.length} сущностей`);

      // Шаг 5: Анализируем пользовательскую страницу если указана
      let userPageAnalysis;
      let comparison;
      if (params.userUrl) {
        userPageAnalysis = await this.analyzeUserPage(params.userUrl, params.lang);
        comparison = await this.compareWithTop10(userPageAnalysis, aggregateEntities, params.query);
        console.log('Завершен анализ пользовательской страницы');
      }

      // Шаг 6: Генерируем сводку с помощью LLM
      const llmSummary = await this.generateSummary(params.query, top10, aggregateEntities, perUrlEntities, comparison);
      console.log('Сгенерирована сводка');

      const result: PipelineResult = {
        top10,
        perUrlEntities,
        aggregate: aggregateEntities,
        llmSummary,
        userPageAnalysis,
        comparison,
        errors: extractionErrors,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      // Сохраняем в кэш
      await cacheManager.setAnalysisResult(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Ошибка в pipeline:', error);
      throw error;
    }
  }

  private async fetchTop10Results(params: SearchParams): Promise<XmlStockResult[]> {
    try {
      return await xmlStockClient.searchTop10(params);
    } catch (error) {
      throw new Error(`Ошибка получения ТОП-10 результатов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  private async fetchAndExtractPages(top10: XmlStockResult[]): Promise<{ extracts: PageExtract[], errors: Record<string, string> }> {
    const results: PageExtract[] = [];
    const errors: Record<string, string> = {};
    
    console.log(`🌐 Начинаем извлечение контента для ${top10.length} URL`);
    
    // Обрабатываем страницы по 3 одновременно
    for (let i = 0; i < top10.length; i += this.concurrencyLimit) {
      const batch = top10.slice(i, i + this.concurrencyLimit);
      const batchPromises = batch.map(async (result) => {
        try {
          console.log(`Извлекаем контент с: ${result.url}`);
          const extract = await pageExtractor.fetchAndExtract(result.url);
          console.log(`✅ Контент извлечен успешно: ${extract.text.length} символов`);
          return {
            ...extract,
            title: extract.title || result.title,
          };
        } catch (error) {
          console.error(`❌ Ошибка извлечения контента с ${result.url}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          errors[result.url] = errorMessage;
          
          // Возвращаем минимальный контент для продолжения анализа
          return {
            url: result.url,
            title: result.title,
            text: result.snippet || result.title,
            wordCount: (result.snippet || result.title).split(' ').length,
            error: errorMessage,
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    console.log(`📝 Извлечено ${results.length} страниц всего`);
    console.log(`📝 Результаты перед фильтрацией:`);
    results.forEach((r, i) => {
      console.log(`  [${i}] ${r.url}: text.length=${r.text?.length || 0}, hasError=${!!r.error}`);
    });
    
    const filtered = results.filter(extract => extract.text && extract.text.length > 10);
    console.log(`📝 После фильтрации осталось: ${filtered.length} страниц`);
    
    return { extracts: filtered, errors };
  }

  private async analyzeEntities(pageExtracts: PageExtract[], searchLang?: string): Promise<Record<string, EntityItem[]>> {
    const perUrlEntities: Record<string, EntityItem[]> = {};
    
    // Обрабатываем страницы по 3 одновременно
    for (let i = 0; i < pageExtracts.length; i += this.concurrencyLimit) {
      const batch = pageExtracts.slice(i, i + this.concurrencyLimit);
      const batchPromises = batch.map(async (extract) => {
        try {
          console.log(`Анализируем сущности для: ${extract.url}`);
          const allEntities = await gcpNlClient.analyzeEntities(extract.text, extract.url, searchLang);
          console.log(`Найдено сущностей до фильтрации: ${allEntities.length}`);
          
          // Фильтруем нерелевантные типы сущностей и сущности с проблемными именами
          const entities = allEntities.filter(entity => {
            // Исключаем нерелевантные типы (можно настроить)
            const excludedTypes = ['UNKNOWN', 'NUMBER', 'PHONE_NUMBER'];
            if (excludedTypes.includes(entity.type)) {
              console.log(`Исключаем сущность ${entity.name} (тип: ${entity.type})`);
              return false;
            }
            
            // Исключаем сущности с пустыми или очень короткими именами
            if (!entity.name || entity.name.trim().length < 2) {
              console.log(`Исключаем сущность с коротким именем: ${entity.name}`);
              return false;
            }
            
            // Исключаем сущности, состоящие только из знаков препинания или цифр
            if (/^[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>0-9\s]+$/.test(entity.name)) {
              console.log(`Исключаем сущность с только знаками препинания: ${entity.name}`);
              return false;
            }
            
            // Исключаем сущности с очень низким salience
            if (entity.salience < 0.001) {
              console.log(`Исключаем сущность с низким salience: ${entity.name} (${entity.salience})`);
              return false;
            }
            
            return true;
          });
          
          console.log(`Осталось сущностей после фильтрации: ${entities.length}`);
          
          if (entities.length > 0) {
            console.log(`✨ Первые 3 сущности для ${extract.url}:`, entities.slice(0, 3).map(e => ({
              name: e.name,
              type: e.type,
              salience: e.salience
            })));
          }
          
          return { url: extract.url, entities };
        } catch (error) {
          console.error(`Ошибка анализа сущностей для ${extract.url}:`, error);
          
          // Сохраняем информацию об ошибке для отображения пользователю
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          console.log(`Причина неудачи для ${extract.url}: ${errorMessage}`);
          
          return { url: extract.url, entities: [] };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      console.log(`📦 Получено результатов из batch: ${batchResults.length}`);
      
      batchResults.forEach((result, index) => {
        console.log(`📋 Результат #${index}:`, {
          hasResult: !!result,
          hasUrl: result?.url,
          hasEntities: result?.entities,
          entitiesLength: result?.entities?.length
        });
        
        if (result && result.url && result.entities && result.entities.length > 0) {
          perUrlEntities[result.url] = result.entities;
          console.log(`✅ Сохранено ${result.entities.length} сущностей для ${result.url}`);
        } else if (result && result.url) {
          console.log(`⚠️ Нет сущностей для ${result.url}`);
        } else {
          console.log(`❌ Невалидный результат #${index}`);
        }
      });
    }

    console.log(`📊 Итого в perUrlEntities: ${Object.keys(perUrlEntities).length} URL`);
    Object.entries(perUrlEntities).forEach(([url, entities]) => {
      console.log(`  - ${url}: ${entities.length} сущностей`);
    });
    
    return perUrlEntities;
  }

  private aggregateEntities(perUrlEntities: Record<string, EntityItem[]>): AggregateEntity[] {
    console.log('=== AGGREGATE ENTITIES START ===');
    console.log('perUrlEntities keys:', Object.keys(perUrlEntities));
    console.log('perUrlEntities values:', Object.values(perUrlEntities).map(entities => entities.length));
    
    const entityMap = new Map<string, AggregateEntity>();

    // Собираем все сущности, исключая нерелевантные типы
    Object.entries(perUrlEntities).forEach(([url, entities]) => {
      entities.forEach(entity => {
        // Исключаем нерелевантные типы сущностей для SEO
        if (['UNKNOWN', 'NUMBER', 'PHONE_NUMBER'].includes(entity.type)) {
          return;
        }

        // Используем лемматизацию для группировки сущностей
        const lemma = normalizEntityName(entity.name, 'ru');
        
        if (!lemma) return;
        
        // Логируем для отладки
        if (lemma === 'сайт') {
          console.log(`Обрабатываем сущность: "${entity.name}" -> лемма: "${lemma}"`);
        }
        
        if (entityMap.has(lemma)) {
          const existing = entityMap.get(lemma)!;
          existing.totalSalience += entity.salience;
          existing.docCount += 1;
          existing.sampleMentions += entity.mentions;
          if (!existing.sources.includes(url)) {
            existing.sources.push(url);
          }
          // Добавляем оригинальную форму, если её ещё нет
          if (!existing.originalForms) {
            existing.originalForms = [];
          }
          if (!existing.originalForms.includes(entity.name)) {
            existing.originalForms.push(entity.name);
          }
        } else {
          entityMap.set(lemma, {
            name: lemma, // Используем лемму как название
            type: entity.type,
            totalSalience: entity.salience,
            docCount: 1,
            sampleMentions: entity.mentions,
            sources: [url],
            avgSalience: entity.salience,
            originalForms: [entity.name], // Сохраняем оригинальную форму
            formsCount: 1,
          });
        }
      });
    });

    // Вычисляем средний salience, количество форм и сортируем
    const aggregated = Array.from(entityMap.values())
      .map(entity => ({
        ...entity,
        avgSalience: entity.totalSalience / entity.docCount,
        formsCount: entity.originalForms?.length || 1,
      }))
      .sort((a, b) => {
        // Сначала по количеству документов, потом по общему salience
        if (b.docCount !== a.docCount) {
          return b.docCount - a.docCount;
        }
        return b.totalSalience - a.totalSalience;
      })
      .slice(0, 50); // Топ-50 сущностей

    console.log(`Агрегировано ${aggregated.length} сущностей`);
    
    // Проверяем на дубликаты "сайт"
    const siteEntities = aggregated.filter(e => e.name.includes('сайт'));
    if (siteEntities.length > 0) {
      console.log(`Найдено ${siteEntities.length} сущностей со словом "сайт":`, 
        siteEntities.map(e => ({ name: e.name, forms: e.originalForms })));
    }
    
    console.log('=== AGGREGATE ENTITIES END ===');
    
    return aggregated;
  }

  private async generateSummary(
    query: string,
    top10: XmlStockResult[],
    aggregateEntities: AggregateEntity[],
    perUrlEntities: Record<string, EntityItem[]>,
    comparison?: ComparisonResult
  ): Promise<string> {
    try {
      return await openRouterClient.generateAnalysis(query, top10, aggregateEntities, perUrlEntities, comparison);
    } catch (error) {
      console.error('Ошибка генерации сводки:', error);
      // Возвращаем базовую сводку в случае ошибки
      return this.generateFallbackSummary(aggregateEntities, comparison);
    }
  }

  private generateFallbackSummary(aggregateEntities: AggregateEntity[], comparison?: ComparisonResult): string {
    const topEntities = aggregateEntities.slice(0, 10);
    
    let summary = `## Анализ ключевых сущностей\n\n`;
    summary += `Найдено ${aggregateEntities.length} уникальных сущностей в ТОП-10 результатах.\n\n`;
    
    summary += `### Топ-10 сущностей:\n\n`;
    topEntities.forEach((entity, index) => {
      summary += `${index + 1}. **${entity.name}** (${entity.type})\n`;
      summary += `   - Встречается в ${entity.docCount} документах\n`;
      summary += `   - Общий salience: ${entity.totalSalience.toFixed(3)}\n\n`;
    });

    summary += `### Рекомендации:\n\n`;
    summary += `1. Обратите внимание на сущности, которые встречаются в нескольких документах\n`;
    summary += `2. Проанализируйте контекст использования ключевых сущностей\n`;
    summary += `3. Учтите типы сущностей при создании контента\n`;

    // Добавляем информацию о сравнении если есть
    if (comparison) {
      summary += `\n### Анализ вашей страницы:\n\n`;
      summary += `- URL: ${comparison.userPage.url}\n`;
      summary += `- Количество слов: ${comparison.userPage.wordCount}\n`;
      summary += `- Найдено сущностей: ${comparison.userPage.entityCount}\n`;
      summary += `- Отсутствует важных сущностей: ${comparison.missingEntities.length}\n\n`;
      
      if (comparison.recommendations.length > 0) {
        summary += `### Рекомендации по улучшению:\n\n`;
        comparison.recommendations.forEach((rec, index) => {
          summary += `${index + 1}. ${rec}\n`;
        });
      }
    }

    return summary;
  }

  // Методы для управления кэшем
  async clearCache(params: SearchParams): Promise<void> {
    const cacheKey: CacheKey = {
      query: params.query,
      country: params.country || 'us',
      lang: params.lang || 'en',
      device: params.device || 'desktop',
    };
    
    await cacheManager.invalidateAnalysis(cacheKey);
  }

  async clearAllCache(): Promise<void> {
    await cacheManager.clear();
  }

  // Анализ пользовательской страницы
  async analyzeUserPage(url: string, searchLang?: string): Promise<UserPageAnalysis> {
    try {
      console.log('Анализируем пользовательскую страницу:', url);
      
      // Извлекаем контент со страницы
      const pageExtract = await pageExtractor.fetchAndExtract(url);
      
      // Анализируем сущности
      const allEntities = await gcpNlClient.analyzeEntities(pageExtract.text, url, searchLang);
      
      // Фильтруем нерелевантные типы сущностей
      const entities = allEntities.filter(entity => 
        !['OTHER', 'UNKNOWN', 'NUMBER', 'PHONE_NUMBER'].includes(entity.type)
      );
      
      // Получаем топ-сущности (первые 10)
      const topEntities = entities
        .sort((a, b) => b.salience - a.salience)
        .slice(0, 10);
      
      return {
        url,
        title: pageExtract.title,
        entities,
        wordCount: pageExtract.wordCount || pageExtract.text.split(/\s+/).length,
        entityCount: entities.length,
        topEntities,
      };
    } catch (error) {
      console.error('Ошибка анализа пользовательской страницы:', error);
      throw new Error(`Не удалось проанализировать страницу ${url}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // Сравнение с ТОП-10
  async compareWithTop10(
    userPage: UserPageAnalysis, 
    top10Entities: AggregateEntity[], 
    query: string
  ): Promise<ComparisonResult> {
    try {
      console.log('Сравниваем пользовательскую страницу с ТОП-10');
      
      // Находим сущности, которые есть в ТОП-10, но отсутствуют на пользовательской странице
      // Используем лемматизацию для точного сравнения
      const userEntityLemmas = new Set(
        userPage.entities.map(e => normalizEntityName(e.name, 'ru'))
      );
      const missingEntities = top10Entities.filter(
        entity => !userEntityLemmas.has(normalizEntityName(entity.name, 'ru'))
      );
      
      // Сортируем по важности (docCount * avgSalience)
      missingEntities.sort((a, b) => (b.docCount * b.avgSalience) - (a.docCount * a.avgSalience));
      
      // Определяем важность сущностей
      const entityGaps = missingEntities.slice(0, 10).map(entity => {
        const importance = entity.docCount >= 3 && entity.avgSalience >= 0.01 ? 'high' :
                          entity.docCount >= 2 && entity.avgSalience >= 0.005 ? 'medium' : 'low';
        
        const recommendation = this.generateEntityRecommendation(entity, importance);
        
        return {
          entity,
          importance,
          recommendation,
        };
      });
      
      // Генерируем общие рекомендации
      const recommendations = this.generateRecommendations(userPage, missingEntities, query);
      
      return {
        userPage,
        top10Entities: top10Entities.slice(0, 20), // Топ-20 для сравнения
        missingEntities: missingEntities.slice(0, 10),
        recommendations,
        entityGaps,
      };
    } catch (error) {
      console.error('Ошибка сравнения с ТОП-10:', error);
      throw new Error(`Не удалось выполнить сравнение: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  private generateEntityRecommendation(entity: AggregateEntity, importance: 'high' | 'medium' | 'low'): string {
    const baseRecommendation = `Добавить упоминания "${entity.name}" в контент`;
    
    switch (importance) {
      case 'high':
        return `${baseRecommendation}. Эта сущность встречается в ${entity.docCount} документах ТОП-10 и имеет высокую важность. Рекомендуется создать отдельный раздел или упомянуть в ключевых местах.`;
      case 'medium':
        return `${baseRecommendation}. Сущность встречается в ${entity.docCount} документах и может улучшить релевантность контента.`;
      case 'low':
        return `${baseRecommendation}. Может добавить дополнительную релевантность, но не критично.`;
      default:
        return baseRecommendation;
    }
  }

  private generateRecommendations(userPage: UserPageAnalysis, missingEntities: AggregateEntity[], query: string): string[] {
    const recommendations: string[] = [];
    
    // Анализ количества слов
    if (userPage.wordCount < 500) {
      recommendations.push('Увеличить объем контента до минимум 500-800 слов для лучшего ранжирования');
    }
    
    // Анализ сущностей
    if (userPage.entityCount < 10) {
      recommendations.push('Добавить больше именованных сущностей (бренды, имена, места) в контент');
    }
    
    // Анализ отсутствующих сущностей
    const highImportanceMissing = missingEntities.filter(e => 
      e.docCount >= 3 && e.avgSalience >= 0.01
    );
    
    if (highImportanceMissing.length > 0) {
      recommendations.push(`Добавить ${highImportanceMissing.length} критически важных сущностей, которые есть у конкурентов`);
    }
    
    // Рекомендации по структуре
    recommendations.push('Создать четкую структуру контента с заголовками H2/H3');
    recommendations.push('Добавить FAQ раздел с ключевыми вопросами по теме');
    
    return recommendations;
  }

  // Методы для отладки
  getCacheStats() {
    return cacheManager.getCacheStats();
  }
}

export const analysisPipeline = new AnalysisPipeline();

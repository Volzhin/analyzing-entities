export type Device = 'desktop' | 'mobile' | 'tablet';

export interface SearchParams {
  query: string;
  country?: string;
  lang?: string;
  device?: Device;
  userUrl?: string; // Добавляем опциональный URL пользователя
  // Упрощенные параметры XMLStock
  groupby?: number; // Позиций на странице (10, 20, 30, 40, 50, 100)
  domain?: string; // Домен: ru, com, или код страны (например 143 для ru)
  tbm?: string; // Тип результатов: images, news, video (пусто для обычного поиска)
  hl?: string; // Язык интерфейса: en, ru и т.д.
  gl?: string; // Страна поиска: RU, US и т.д.
}

export interface XmlStockResult {
  title: string;
  url: string;
  snippet?: string;
  position: number;
}

export interface PageExtract {
  url: string;
  title?: string;
  text: string;
  wordCount?: number;
  error?: string; // Информация об ошибке, если контент не удалось извлечь
}

export interface EntityMention {
  text: string;
  beginOffset: number;
  endOffset: number;
  type: 'PROPER' | 'COMMON' | 'TYPE_UNKNOWN';
  probability: number;
}

export interface EntityItem {
  name: string;
  type: string;
  salience: number;
  mentions: number;
  url?: string;
  sourceUrl: string;
  wikipedia_url?: string;
  mentionTexts?: string[]; // Фрагменты текста, где упоминается сущность
  metadata?: {
    originalForms?: string[];
  };
}

export interface AggregateEntity {
  name: string; // Лемма (нормализованная форма)
  type: string;
  totalSalience: number;
  docCount: number; // Количество документов с этой сущностью
  sampleMentions: number;
  sources: string[];
  avgSalience: number;
  originalForms?: string[]; // Оригинальные словоформы
  formsCount?: number; // Количество уникальных словоформ
}

export interface UserPageAnalysis {
  url: string;
  title?: string;
  entities: EntityItem[];
  wordCount: number;
  entityCount: number;
  topEntities: EntityItem[];
}

export interface ComparisonResult {
  userPage: UserPageAnalysis;
  top10Entities: AggregateEntity[];
  missingEntities: AggregateEntity[];
  recommendations: string[];
  entityGaps: Array<{
    entity: AggregateEntity;
    importance: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

export interface PipelineResult {
  top10: XmlStockResult[];
  perUrlEntities: Record<string, EntityItem[]>;
  aggregate: AggregateEntity[];
  llmSummary: string;
  userPageAnalysis?: UserPageAnalysis;
  comparison?: ComparisonResult;
  processingTime: number;
  timestamp: string;
  errors?: Record<string, string>; // Информация об ошибках для каждого URL
}

export interface CacheKey {
  query: string;
  country: string;
  lang: string;
  device: Device;
}

export interface AnalysisProgress {
  stage: 'search' | 'fetching' | 'analyzing' | 'aggregating' | 'summarizing' | 'complete';
  progress: number;
  currentUrl?: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export type EntityType = 
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'CONSUMER_GOOD'
  | 'EVENT'
  | 'WORK_OF_ART'
  | 'PHONE_NUMBER'
  | 'ADDRESS'
  | 'DATE'
  | 'NUMBER'
  | 'PRICE'
  | 'OTHER'
  | 'UNKNOWN';

export interface EntityTypeFilter {
  type: EntityType;
  label: string;
  count: number;
}

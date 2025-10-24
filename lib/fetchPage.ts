import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { PageExtract } from './types';

export class PageExtractor {
  private maxRetries = 3;
  private timeout = 15000; // 15 секунд
  private maxContentLength = 150000; // ~150KB символов

  async fetchAndExtract(url: string): Promise<PageExtract> {
    console.log(`🤖 Извлекаем контент с Googlebot User-Agent: ${url}`);
    let lastError: Error | null = null;
    let isJavaScriptHeavy = false;
    let hasRedirect = false;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const html = await this.fetchHtml(url, attempt);
        
        // Проверяем на JavaScript-heavy сайты
        if (this.isJavaScriptHeavy(html)) {
          isJavaScriptHeavy = true;
        }
        
        // Проверяем на редиректы
        if (this.hasRedirect(html)) {
          hasRedirect = true;
        }
        
        const extract = await this.extractContent(html, url);
        
        if (extract.text.length > 100) { // Минимум 100 символов
          return extract;
        }
        
        // Если текст слишком короткий, но мы можем определить причину
        if (isJavaScriptHeavy) {
          return {
            url,
            title: this.extractTitle(html),
            text: '',
            wordCount: 0,
            error: 'Сайт использует JavaScript для загрузки контента (SPA)'
          };
        }
        
        if (hasRedirect) {
          return {
            url,
            title: this.extractTitle(html),
            text: '',
            wordCount: 0,
            error: 'Сайт возвращает редирект'
          };
        }
        
        throw new Error('Извлеченный текст слишком короткий');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
        
        if (attempt < this.maxRetries) {
          // Экспоненциальный backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // Формируем более информативное сообщение об ошибке
    let errorMessage = `Не удалось извлечь контент с ${url}`;
    
    if (isJavaScriptHeavy) {
      errorMessage += ': Сайт использует JavaScript для загрузки контента (SPA)';
    } else if (hasRedirect) {
      errorMessage += ': Сайт возвращает редирект';
    } else if (lastError?.message.includes('HTTP 403')) {
      errorMessage += ': Доступ запрещен (403)';
    } else if (lastError?.message.includes('HTTP 404')) {
      errorMessage += ': Страница не найдена (404)';
    } else if (lastError?.message.includes('timeout')) {
      errorMessage += ': Превышено время ожидания';
    } else {
      errorMessage += `: ${lastError?.message}`;
    }

    throw new Error(errorMessage);
  }

  private async fetchHtml(url: string, attempt: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Используем User-Agent Googlebot для лучшего доступа и более чистого HTML
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Неверный content-type: ${contentType}`);
      }

      const html = await response.text();
      
      if (html.length < 500) {
        throw new Error('HTML слишком короткий');
      }

      return html;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async extractContent(html: string, url: string): Promise<PageExtract> {
    try {
      // Создаем DOM из HTML
      const dom = new JSDOM(html, {
        url: url,
        resources: 'usable',
      });

      const document = dom.window.document;
      
      // Пробуем использовать Readability
      const reader = new Readability(document, {
        debug: false,
        maxElemsToParse: 2000,
        nbTopCandidates: 5,
        charThreshold: 500,
        classesToPreserve: [],
        // Дополнительные настройки для лучшего извлечения
        keepClasses: false,
        removeUnlikelyCandidates: true,
        weightClasses: true,
        cleanConditionally: true,
        // Игнорируем элементы с этими классами/ID
        ignoreClasses: [
          'ad', 'ads', 'advertisement', 'banner', 'sidebar', 'menu', 
          'navigation', 'social', 'share', 'comments', 'related',
          'widget', 'popup', 'modal', 'overlay', 'cookie'
        ],
        ignoreIds: [
          'ad', 'ads', 'advertisement', 'banner', 'sidebar', 'menu',
          'navigation', 'social', 'share', 'comments', 'related',
          'widget', 'popup', 'modal', 'overlay', 'cookie'
        ]
      });

      const article = reader.parse();
      
      if (article && article.textContent && article.textContent.length > 200) {
        let cleanText = this.cleanText(article.textContent);
        
        // Дополнительная очистка для Google NLP API
        cleanText = this.prepareForGoogleNLP(cleanText);
        
        const title = article.title || this.extractTitle(document);
        
        return {
          url,
          title,
          text: this.truncateText(cleanText),
          wordCount: this.countWords(cleanText),
        };
      }

      // Fallback: используем эвристики
      return this.extractWithHeuristics(document, url);
    } catch (error) {
      throw new Error(`Ошибка при извлечении контента: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  private extractWithHeuristics(document: Document, url: string): PageExtract {
    // Удаляем ненужные элементы
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript',
      '.advertisement', '.ads', '.sidebar', '.menu', '.navigation',
      '.cookie-banner', '.popup', '.modal', '.overlay', '.banner',
      '.social', '.share', '.comments', '.related', '.recommended',
      '.widget', '.sidebar-widget', '.ad-container', '.sponsored',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
      '.hidden', '.sr-only', '.visually-hidden', '.screen-reader-only'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Удаляем элементы с атрибутами, указывающими на рекламу или навигацию
    const unwantedAttributes = ['data-ad', 'data-ads', 'id*="ad"', 'class*="ad"'];
    unwantedAttributes.forEach(attr => {
      const elements = document.querySelectorAll(`[${attr}]`);
      elements.forEach(el => el.remove());
    });

    // Ищем основной контент
    const contentSelectors = [
      'main', 'article', '.content', '.post', '.entry',
      '.article-content', '.post-content', '.main-content'
    ];

    let contentElement: Element | null = null;

    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    if (!contentElement) {
      // Используем body как fallback
      contentElement = document.body;
    }

    if (!contentElement) {
      throw new Error('Не удалось найти контент на странице');
    }

    const text = contentElement.textContent || '';
    let cleanText = this.cleanText(text);
    
    // Дополнительная очистка для Google NLP API
    cleanText = this.prepareForGoogleNLP(cleanText);
    
    const title = this.extractTitle(document);

    console.log(`Извлечен контент для ${url}: ${cleanText.length} символов`);
    console.log(`Первые 200 символов текста:`, cleanText.substring(0, 200));

    return {
      url,
      title,
      text: this.truncateText(cleanText),
      wordCount: this.countWords(cleanText),
    };
  }

  private extractTitle(document: Document): string {
    // Пробуем разные селекторы для заголовка
    const titleSelectors = [
      'h1',
      'title',
      '.title',
      '.headline',
      '.post-title',
      '.article-title'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const title = element.textContent.trim();
        if (title.length > 5 && title.length < 200) {
          return title;
        }
      }
    }

    return 'Без заголовка';
  }

  private isJavaScriptHeavy(html: string): boolean {
    const jsHeavyIndicators = [
      '<div id="root"></div>',
      '<div id="app"></div>',
      '<div id="__next"></div>',
      'data-react-helmet',
      'data-next-head',
      'window.__NEXT_DATA__',
      'window.__NUXT__',
      'window.__VUE__',
      'window.__INITIAL_STATE__',
      'noscript',
      'script src="/_next/static',
      'script src="/static/js',
      'script defer',
      'script async'
    ];
    
    return jsHeavyIndicators.some(indicator => html.includes(indicator));
  }

  private hasRedirect(html: string): boolean {
    const redirectIndicators = [
      '307 Temporary Redirect',
      '302 Found',
      '301 Moved Permanently',
      'meta http-equiv="refresh"',
      'window.location.href',
      'window.location.replace'
    ];
    
    return redirectIndicators.some(indicator => html.includes(indicator));
  }

  private cleanText(text: string): string {
    return text
      // Удаляем HTML теги если они остались
      .replace(/<[^>]*>/g, '')
      // Удаляем JavaScript код
      .replace(/javascript:/gi, '')
      .replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '')
      // Удаляем CSS код
      .replace(/\{[^}]*\}/g, '')
      .replace(/@[^{]*\{[^}]*\}/g, '')
      // Удаляем URL и email
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/www\.[^\s]+/g, '')
      .replace(/[^\s]+@[^\s]+/g, '')
      // Удаляем специальные символы и оставляем только буквы, цифры, пробелы и базовую пунктуацию
      .replace(/[^\w\s\-.,!?();:а-яё]/gi, ' ')
      // Заменяем множественные пробелы на один
      .replace(/\s+/g, ' ')
      // Заменяем множественные переносы на один
      .replace(/\n+/g, ' ')
      // Удаляем лишние пробелы вокруг знаков препинания
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s+/g, '$1 ')
      .trim();
  }

  private prepareForGoogleNLP(text: string): string {
    return text
      // Удаляем технические термины и коды
      .replace(/[A-Z]{2,}/g, '') // Удаляем аббревиатуры из заглавных букв
      .replace(/\d{4,}/g, '') // Удаляем длинные числа (коды, ID)
      .replace(/[a-f0-9ac-f]{8,}/gi, '') // Удаляем хеши и UUID
      
      // Удаляем знаки препинания в начале и конце слов
      .replace(/[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>]+/g, ' ')
      
      // Удаляем повторяющиеся слова и фразы
      .replace(/\b(\w+)\s+\1\b/gi, '$1') // Удаляем повторяющиеся слова
      
      // Удаляем слишком короткие "слова" которые могут быть артефактами
      .replace(/\b\w{1,2}\b/g, ' ')
      
      // Удаляем слова, состоящие только из цифр
      .replace(/\b\d+\b/g, ' ')
      
      // Удаляем слова с цифрами и буквами (коды, версии)
      .replace(/\b\w*\d+\w*\b/g, ' ')
      
      // Удаляем избыточные пробелы
      .replace(/\s+/g, ' ')
      
      // Удаляем строки, которые содержат только знаки препинания или пробелы
      .replace(/^[.,!?;:\s]+$/gm, '')
      
      // Удаляем строки короче 3 символов
      .split('\n')
      .filter(line => line.trim().length >= 3)
      .join('\n')
      
      // Финальная очистка - удаляем оставшиеся знаки препинания
      .replace(/[^\w\sа-яё]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private truncateText(text: string): string {
    if (text.length <= this.maxContentLength) {
      return text;
    }

    // Обрезаем по предложениям
    const sentences = text.split(/[.!?]+/);
    let result = '';
    
    for (const sentence of sentences) {
      if ((result + sentence).length > this.maxContentLength) {
        break;
      }
      result += sentence + '.';
    }

    return result || text.substring(0, this.maxContentLength);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

export const pageExtractor = new PageExtractor();

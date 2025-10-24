/**
 * Модуль для лемматизации текста (приведение слов к начальной форме)
 * Поддерживает русский и английский языки
 */

// Простая лемматизация на основе окончаний для русского языка
// Сортируем от более длинных к более коротким для правильного удаления
const russianEndings = [
  // Существительные (длинные окончания первыми)
  'ами', 'ями', 'ами', 'ями', 'ах', 'ях', 'ов', 'ев', 'ам', 'ям',
  // Прилагательные и причастия
  'ого', 'его', 'ому', 'ему', 'ими', 'ыми',
  'ой', 'ей', 'ый', 'ий', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие',
  'ом', 'ем', 'им', 'ым',
  // Существительные (короткие окончания)
  'ок', 'ек', 'ёк', 'ка', 'ку', 'ки', 'ке', 'кой', 'кам', 'ками',
  'ёнок', 'ёнка', 'ёнку', 'ёнком', 'ёнке',
  'онок', 'онка', 'онку', 'онком', 'онке',
  'а', 'я', 'у', 'ю', 'ы', 'и', 'е', 'о', 'ё',
  // Глаголы
  'ать', 'ять', 'еть', 'ить', 'ть',
  'ал', 'ял', 'ел', 'ил', 'ала', 'яла', 'ела', 'ила',
  'али', 'яли', 'ели', 'или',
].sort((a, b) => b.length - a.length); // Сортируем по длине от большего к меньшему

const englishSuffixes = [
  'ing', 'ed', 'es', 's', 'ly', 'er', 'est', 'ness', 'ment', 'tion', 'sion'
];

/**
 * Приводит слово к начальной форме (лемме)
 */
export function lemmatize(word: string, lang: string = 'ru'): string {
  if (!word || word.length < 3) {
    return word.toLowerCase();
  }

  let lowerWord = word.toLowerCase().trim();
  
  // Заменяем ё на е для унификации
  lowerWord = lowerWord.replace(/ё/g, 'е');
  
  // Для русского языка
  if (lang === 'ru' || /[а-яё]/i.test(word)) {
    // Пробуем удалить окончания (от длинных к коротким)
    for (const ending of russianEndings) {
      if (lowerWord.endsWith(ending) && lowerWord.length > ending.length + 2) {
        const stem = lowerWord.slice(0, -ending.length);
        // Проверяем, что основа не слишком короткая
        if (stem.length >= 2) {
          return stem;
        }
      }
    }
  }
  
  // Для английского языка
  if (lang === 'en' || /[a-z]/i.test(word)) {
    for (const suffix of englishSuffixes) {
      if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 2) {
        const stem = lowerWord.slice(0, -suffix.length);
        if (stem.length >= 2) {
          return stem;
        }
      }
    }
  }

  return lowerWord;
}

/**
 * Нормализует название сущности с учётом лемматизации
 */
export function normalizEntityName(name: string, lang: string = 'ru'): string {
  if (!name) return '';
  
  // Удаляем знаки препинания в начале и конце
  let normalized = name.trim().replace(/^[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>]+|[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>]+$/g, '');
  
  // Заменяем ё на е для унификации
  normalized = normalized.replace(/ё/gi, 'е');
  
  // Лемматизируем каждое слово
  const words = normalized.split(/\s+/);
  const lemmatized = words.map(word => lemmatize(word, lang)).join(' ');
  
  return lemmatized;
}

/**
 * Группирует сущности по леммам
 */
export interface LemmatizedEntity {
  lemma: string;
  originalForms: string[];
  count: number;
  totalSalience: number;
  type: string;
  mentions: number;
  sources: string[];
}

export function groupByLemma(
  entities: Array<{ name: string; salience: number; type: string; mentions: number }>,
  lang: string = 'ru'
): LemmatizedEntity[] {
  const lemmaMap = new Map<string, LemmatizedEntity>();

  entities.forEach(entity => {
    const lemma = normalizEntityName(entity.name, lang);
    
    if (!lemma) return;

    if (lemmaMap.has(lemma)) {
      const existing = lemmaMap.get(lemma)!;
      if (!existing.originalForms.includes(entity.name)) {
        existing.originalForms.push(entity.name);
      }
      existing.count += 1;
      existing.totalSalience += entity.salience;
      existing.mentions += entity.mentions;
    } else {
      lemmaMap.set(lemma, {
        lemma,
        originalForms: [entity.name],
        count: 1,
        totalSalience: entity.salience,
        type: entity.type,
        mentions: entity.mentions,
        sources: [],
      });
    }
  });

  return Array.from(lemmaMap.values()).sort((a, b) => b.totalSalience - a.totalSalience);
}


/**
 * Модуль для лемматизации текста (приведение слов к начальной форме)
 * Поддерживает русский и английский языки
 */

// Словарь для приведения общих форм к базовой (русский)
const russianLemmaDict: Record<string, string> = {
  // Дети/ребенок
  'детей': 'дети',
  'детям': 'дети',
  'детьми': 'дети',
  'детях': 'дети',
  'ребенка': 'ребенок',
  'ребенку': 'ребенок',
  'ребенком': 'ребенок',
  'ребенке': 'ребенок',
  // Урок/уроки
  'урока': 'урок',
  'уроку': 'урок',
  'уроком': 'урок',
  'уроке': 'урок',
  'уроки': 'урок',
  'уроков': 'урок',
  'урокам': 'урок',
  'уроками': 'урок',
  'уроках': 'урок',
  // Курс/курсы
  'курса': 'курс',
  'курсу': 'курс',
  'курсом': 'курс',
  'курсе': 'курс',
  'курсы': 'курс',
  'курсов': 'курс',
  'курсам': 'курс',
  'курсами': 'курс',
  'курсах': 'курс',
  // Обучение
  'обучения': 'обучение',
  'обучению': 'обучение',
  'обучением': 'обучение',
  'обучении': 'обучение',
  // Занятие/занятия
  'занятия': 'занятие',
  'занятию': 'занятие',
  'занятием': 'занятие',
  'занятии': 'занятие',
  'занятий': 'занятие',
  'занятиям': 'занятие',
  'занятиями': 'занятие',
  'занятиях': 'занятие',
  // Программирование
  'программирования': 'программирование',
  'программированию': 'программирование',
  'программированием': 'программирование',
  'программировании': 'программирование',
};

// Простая лемматизация на основе окончаний для русского языка
// Только самые безопасные окончания, которые точно не испортят основу
const russianEndings = [
  // Множественное число существительных (безопасные)
  'ами', 'ями', 'ах', 'ях', 'ам', 'ям',
  // Прилагательные (безопасные)
  'ого', 'его', 'ому', 'ему', 'ыми', 'ими',
  // Только самые очевидные окончания
].sort((a, b) => b.length - a.length);

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
  
  // Для русского языка - сначала проверяем словарь
  if (lang === 'ru' || /[а-яё]/i.test(word)) {
    // Проверяем словарь прямых соответствий
    if (russianLemmaDict[lowerWord]) {
      return russianLemmaDict[lowerWord];
    }
    
    // Пробуем удалить только безопасные окончания
    for (const ending of russianEndings) {
      if (lowerWord.endsWith(ending) && lowerWord.length > ending.length + 3) {
        const stem = lowerWord.slice(0, -ending.length);
        // Проверяем, что основа достаточно длинная
        if (stem.length >= 3) {
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

  // Если ничего не подошло - возвращаем исходное слово в нижнем регистре
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


'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, MapPin, ShoppingBag, Calendar, Palette, HelpCircle, AlertTriangle, Phone, Hash, DollarSign, Globe, Building } from 'lucide-react';
import Link from 'next/link';

const entityTypes = [
  {
    type: 'PERSON',
    label: 'Персона',
    description: 'Имена людей, известные личности, персонажи',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    examples: ['Илон Маск', 'Альберт Эйнштейн', 'Гарри Поттер'],
    importance: 'Высокая - помогает установить экспертность и авторитетность контента',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'ORGANIZATION',
    label: 'Организация',
    description: 'Компании, бренды, учреждения, некоммерческие организации',
    icon: Building,
    color: 'bg-green-100 text-green-800',
    examples: ['Apple', 'Google', 'Microsoft', 'ООН'],
    importance: 'Критическая - упоминания брендов повышают доверие и релевантность',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'LOCATION',
    label: 'Место',
    description: 'Географические объекты, города, страны, адреса',
    icon: MapPin,
    color: 'bg-red-100 text-red-800',
    examples: ['Москва', 'Нью-Йорк', 'Тихий океан', 'Эйфелева башня'],
    importance: 'Высокая - важна для локального SEO и географической релевантности',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'CONSUMER_GOOD',
    label: 'Товар',
    description: 'Продукты, услуги, товары, которые можно купить',
    icon: ShoppingBag,
    color: 'bg-purple-100 text-purple-800',
    examples: ['iPhone', 'Tesla Model S', 'курсы программирования'],
    importance: 'Критическая - ключевые товары для коммерческих запросов',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'EVENT',
    label: 'Событие',
    description: 'Важные события, конференции, праздники, происшествия',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-800',
    examples: ['Олимпиада 2024', 'WWDC', 'Черная пятница'],
    importance: 'Средняя - актуальность для событийного контента',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'WORK_OF_ART',
    label: 'Произведение искусства',
    description: 'Книги, фильмы, песни, картины, статьи',
    icon: Palette,
    color: 'bg-pink-100 text-pink-800',
    examples: ['Война и мир', 'Титаник', 'Мона Лиза', 'статья в Википедии'],
    importance: 'Средняя - важна для культурного и образовательного контента',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'PHONE_NUMBER',
    label: 'Номер телефона',
    description: 'Телефонные номера с метаданными',
    icon: Phone,
    color: 'bg-cyan-100 text-cyan-800',
    examples: ['+7 (495) 123-45-67', '+1-555-123-4567'],
    importance: 'Низкая - контактная информация',
    metadata: 'number, national_prefix, area_code, extension'
  },
  {
    type: 'ADDRESS',
    label: 'Адрес',
    description: 'Физические адреса с компонентами',
    icon: MapPin,
    color: 'bg-indigo-100 text-indigo-800',
    examples: ['ул. Тверская, 1, Москва', '1600 Amphitheatre Pkwy, Mountain View'],
    importance: 'Средняя - важна для локального SEO',
    metadata: 'street_number, locality, street_name, postal_code, country, broad_region, narrow_region, sublocality'
  },
  {
    type: 'DATE',
    label: 'Дата',
    description: 'Даты с компонентами года, месяца, дня',
    icon: Calendar,
    color: 'bg-teal-100 text-teal-800',
    examples: ['15 января 2024', '2024-01-15', 'вчера'],
    importance: 'Низкая - временная информация',
    metadata: 'year, month, day'
  },
  {
    type: 'NUMBER',
    label: 'Число',
    description: 'Числовые значения',
    icon: Hash,
    color: 'bg-gray-100 text-gray-800',
    examples: ['42', '1000', '3.14'],
    importance: 'Очень низкая - статистические данные',
    metadata: 'Само число'
  },
  {
    type: 'PRICE',
    label: 'Цена',
    description: 'Денежные суммы с валютой',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-800',
    examples: ['$99.99', '1000 руб.', '€50'],
    importance: 'Средняя - коммерческая информация',
    metadata: 'value, currency'
  },
  {
    type: 'OTHER',
    label: 'Другое',
    description: 'Различные понятия, термины, абстрактные концепции',
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-800',
    examples: ['искусственный интеллект', 'блокчейн', 'устойчивое развитие'],
    importance: 'Очень низкая - исключается из SEO-анализа',
    metadata: 'Нет специальных метаданных'
  },
  {
    type: 'UNKNOWN',
    label: 'Неизвестные сущности',
    description: 'Неопределенные сущности',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800',
    examples: ['Неясные термины', 'Неопределенные понятия'],
    importance: 'Исключается - не используется в анализе',
    metadata: 'Нет специальных метаданных'
  }
];

const seoGuidelines = [
  {
    title: 'Как использовать сущности для SEO',
    content: [
      'Упоминайте ключевые сущности в заголовках H1, H2, H3',
      'Включайте сущности в мета-описания и alt-тексты изображений',
      'Создавайте контекстные ссылки на связанные сущности',
      'Используйте структурированные данные для разметки сущностей'
    ]
  },
  {
    title: 'Приоритеты по типам сущностей',
    content: [
      'ORGANIZATION и CONSUMER_GOOD - высший приоритет для коммерческих запросов',
      'PERSON - важен для экспертности и авторитетности',
      'LOCATION - критичен для локального SEO',
      'EVENT и WORK_OF_ART - для тематического контента',
      'OTHER и UNKNOWN - исключаются из SEO-анализа как нерелевантные',
      'NUMBER и PHONE_NUMBER - низкая ценность для SEO'
    ]
  },
  {
    title: 'Анализ конкурентов',
    content: [
      'Изучите, какие сущности используют конкуренты в ТОП-10',
      'Определите пробелы в вашем контенте',
      'Добавьте недостающие сущности естественным образом',
      'Создайте уникальные комбинации сущностей'
    ]
  }
];

export default function WikiPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Wiki: Типы сущностей в SEO</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Полное руководство по пониманию и использованию сущностей для улучшения ранжирования в поисковых системах
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Что такое сущности?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Сущности - это именованные объекты, которые Google понимает как отдельные концепции. 
              Это могут быть люди, организации, места, товары и другие понятия, которые помогают 
              поисковой системе лучше понимать контент.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Зачем анализировать?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Анализ сущностей помогает понять, какие ключевые концепции используют ваши конкуренты 
              в ТОП-10, и найти возможности для улучшения вашего контента.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Как использовать?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Добавляйте важные сущности в контент естественным образом, создавайте контекстные 
              связи и используйте структурированные данные для лучшего понимания поисковыми системами.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="types">Типы сущностей</TabsTrigger>
          <TabsTrigger value="metadata">Метаданные</TabsTrigger>
          <TabsTrigger value="guidelines">SEO-руководство</TabsTrigger>
          <TabsTrigger value="analysis">Анализ и сравнение</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entityTypes.map((entity) => {
              const IconComponent = entity.icon;
              return (
                <Card key={entity.type} className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entity.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {entity.type}
                        </Badge>
                        <div className="text-lg font-semibold">{entity.label}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {entity.description}
                    </p>
                    
                    <div>
                      <h4 className="font-medium mb-2">Примеры:</h4>
                      <div className="flex flex-wrap gap-1">
                        {entity.examples.map((example, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>SEO-важность:</strong> {entity.importance}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Метаданные:</strong> {entity.metadata}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Метаданные сущностей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>
                Каждая сущность может содержать дополнительные метаданные в зависимости от типа:
              </p>
              
              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    PHONE_NUMBER
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Метаданные номера телефона:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code className="bg-white px-2 py-1 rounded">number</code> - фактический номер, разбитый по разделам</li>
                    <li><code className="bg-white px-2 py-1 rounded">national_prefix</code> - код страны, если обнаружен</li>
                    <li><code className="bg-white px-2 py-1 rounded">area_code</code> - код региона или города</li>
                    <li><code className="bg-white px-2 py-1 rounded">extension</code> - добавочный номер</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    ADDRESS
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Метаданные адреса:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code className="bg-white px-2 py-1 rounded">street_number</code> - номер дома</li>
                    <li><code className="bg-white px-2 py-1 rounded">locality</code> - город или поселок</li>
                    <li><code className="bg-white px-2 py-1 rounded">street_name</code> - название улицы/маршрута</li>
                    <li><code className="bg-white px-2 py-1 rounded">postal_code</code> - почтовый индекс</li>
                    <li><code className="bg-white px-2 py-1 rounded">country</code> - страна</li>
                    <li><code className="bg-white px-2 py-1 rounded">broad_region</code> - административная область (штат)</li>
                    <li><code className="bg-white px-2 py-1 rounded">narrow_region</code> - меньшая административная территория (округ)</li>
                    <li><code className="bg-white px-2 py-1 rounded">sublocality</code> - район в городе (для азиатских адресов)</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    DATE
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Метаданные даты:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code className="bg-white px-2 py-1 rounded">year</code> - четырехзначный год</li>
                    <li><code className="bg-white px-2 py-1 rounded">month</code> - двузначный номер месяца</li>
                    <li><code className="bg-white px-2 py-1 rounded">day</code> - двузначный номер дня</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    PRICE
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Метаданные цены:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code className="bg-white px-2 py-1 rounded">value</code> - числовое значение цены</li>
                    <li><code className="bg-white px-2 py-1 rounded">currency</code> - валюта</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EntityMention - Упоминания сущностей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Каждое упоминание сущности в тексте содержит следующую информацию:
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">JSON-представление упоминания:</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "text": {
    "content": "Иван Петров",
    "beginOffset": 0
  },
  "type": "PROPER|COMMON",
  "sentiment": {...},
  "probability": 0.95
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Поля упоминания</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>text:</strong> объект TextSpan с содержимым и позицией</li>
                    <li><strong>type:</strong> TYPE_UNKNOWN, PROPER (имя собственное), COMMON (нарицательное)</li>
                    <li><strong>sentiment:</strong> тональность упоминания (опционально)</li>
                    <li><strong>probability:</strong> оценка вероятности от 0 до 1</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Типы упоминаний</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>TYPE_UNKNOWN:</strong> Неизвестный тип</li>
                    <li><strong>PROPER:</strong> Имя собственное (Иван, Москва)</li>
                    <li><strong>COMMON:</strong> Нарицательное существительное (человек, город)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          {seoGuidelines.map((guideline, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{guideline.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guideline.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Как работает анализ сущностей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Процесс анализа:</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                      <span>Получение ТОП-10 результатов по запросу</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                      <span>Извлечение и анализ контента со страниц</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                      <span>Определение сущностей через Google Cloud NL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                      <span>Агрегация и ранжирование сущностей</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                      <span>Сравнение с вашей страницей (если указана)</span>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Метрики важности:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">Salience</Badge>
                      <span>Степень важности сущности в тексте (0-1)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">DocCount</Badge>
                      <span>Количество документов, где встречается сущность</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">AvgSalience</Badge>
                      <span>Средняя важность сущности по всем документам</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Рекомендации по использованию</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">✅ Что делать:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Анализируйте сущности конкурентов регулярно</li>
                    <li>• Добавляйте важные сущности естественно</li>
                    <li>• Создавайте контекстные связи между сущностями</li>
                    <li>• Используйте структурированные данные</li>
                    <li>• Обновляйте контент на основе анализа</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">❌ Чего избегать:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Искусственное добавление сущностей</li>
                    <li>• Игнорирование контекста</li>
                    <li>• Копирование структуры конкурентов</li>
                    <li>• Переоптимизация под сущности</li>
                    <li>• Игнорирование пользовательского опыта</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Известные ограничения Google NLP API</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-yellow-800">
                  Google Cloud Natural Language API использует машинное обучение для классификации сущностей, 
                  и иногда может делать ошибки, особенно с русским языком:
                </p>
                
                <div className="bg-white p-4 rounded-md border border-yellow-200">
                  <h4 className="font-semibold mb-3 text-yellow-800">Частые ошибки классификации:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs bg-blue-100">PERSON</Badge>
                      <div className="flex-1">
                        <span className="text-yellow-900">
                          Образовательные термины: <strong>урок, занятие, лекция, курс</strong>
                        </span>
                        <p className="text-xs text-yellow-700 mt-1">
                          → Автоматически исправляются на <Badge variant="outline" className="text-xs bg-orange-100">EVENT</Badge>
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs bg-blue-100">PERSON</Badge>
                      <div className="flex-1">
                        <span className="text-yellow-900">
                          Общие существительные: <strong>сайт, страница, ресурс</strong>
                        </span>
                        <p className="text-xs text-yellow-700 mt-1">
                          → Автоматически исправляются на <Badge variant="outline" className="text-xs bg-gray-100">OTHER</Badge>
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-md border border-yellow-200">
                  <h4 className="font-semibold mb-3 text-yellow-800">Как мы решаем эту проблему:</h4>
                  <ul className="space-y-1 text-yellow-900">
                    <li>✓ Используем словарь часто встречающихся ошибок</li>
                    <li>✓ Автоматически исправляем типы для известных слов</li>
                    <li>✓ Регулярно обновляем список исправлений</li>
                    <li>✓ Логируем все исправления для отладки</li>
                  </ul>
                </div>

                <p className="text-xs text-yellow-700 italic">
                  💡 Если вы заметили другие ошибки классификации, они будут исправлены в следующих обновлениях.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
          ← Вернуться к анализу
        </Link>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, ExternalLink, Globe, Database, Zap } from 'lucide-react';

export default function ApiDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const requestExample = {
    query: "курсы английского языка",
    country: "ru",
    lang: "ru",
    device: "desktop",
    userUrl: "https://skyeng.ru/programs/",
    domain: "ru",
    tbm: "",
    tbs: "",
    gl: "RU",
    ads: false,
    related: false,
    video: false,
    filter: false,
    punycode: false,
    hlword: false
  };

  const responseExample = {
    success: true,
    data: {
      top10: [
        {
          title: "Курсы английского языка онлайн — Skyeng",
          url: "https://skyeng.ru/programs/",
          snippet: "Начните говорить по-английски свободно...",
          position: 1
        }
      ],
      perUrlEntities: {
        "https://skyeng.ru/programs/": [
          {
            name: "английский язык",
            type: "OTHER",
            salience: 0.8,
            mentions: 5,
            sourceUrl: "https://skyeng.ru/programs/"
          }
        ]
      },
      aggregate: [
        {
          name: "английский язык",
          type: "OTHER",
          totalSalience: 8.5,
          docCount: 10,
          sampleMentions: 45,
          sources: ["https://skyeng.ru/programs/"],
          avgSalience: 0.85
        }
      ],
      llmSummary: "Анализ показал, что в ТОП-10 по запросу 'курсы английского языка' преобладают...",
      userPageAnalysis: {
        url: "https://skyeng.ru/programs/",
        title: "Курсы английского языка онлайн",
        entities: [],
        wordCount: 162,
        entityCount: 14,
        topEntities: []
      },
      comparison: {
        userPage: {},
        top10Entities: [],
        missingEntities: [],
        recommendations: [
          "Увеличить объем контента до минимум 500-800 слов",
          "Добавить информацию о сертификации TOEFL"
        ],
        entityGaps: []
      },
      processingTime: 15420,
      timestamp: "2024-01-15T10:30:00.000Z"
    },
    query: requestExample
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">API Документация</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Полное руководство по использованию API для анализа сущностей
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Обзор API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Обзор API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                API позволяет анализировать ключевые сущности в ТОП-10 результатов Google поиска
                и сравнивать их с вашей страницей для получения рекомендаций по SEO-оптимизации.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">POST</Badge>
                  <span className="text-sm font-medium">/api/analyze</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">JSON</Badge>
                  <span className="text-sm">Request/Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">~15 сек</Badge>
                  <span className="text-sm">Время обработки</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Эндпоинты */}
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
              <TabsTrigger value="analyze">Анализ</TabsTrigger>
              <TabsTrigger value="search">Поиск</TabsTrigger>
              <TabsTrigger value="export">Экспорт</TabsTrigger>
            </TabsList>

            {/* Анализ */}
            <TabsContent value="analyze" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    POST /api/analyze
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Основной эндпоинт для полного анализа сущностей в ТОП-10
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Параметры запроса */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Параметры запроса</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Основные параметры</h4>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-2 py-1 rounded">query</code> - поисковый запрос (обязательный)</li>
                            <li><code className="bg-muted px-2 py-1 rounded">country</code> - страна (по умолчанию: "us")</li>
                            <li><code className="bg-muted px-2 py-1 rounded">lang</code> - язык (по умолчанию: "en")</li>
                            <li><code className="bg-muted px-2 py-1 rounded">device</code> - устройство: "desktop", "mobile", "tablet"</li>
                            <li><code className="bg-muted px-2 py-1 rounded">userUrl</code> - URL для анализа (опционально)</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">XMLStock параметры</h4>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-2 py-1 rounded">domain</code> - домен Google (com, ru, co.uk)</li>
                            <li><code className="bg-muted px-2 py-1 rounded">tbm</code> - тип поиска: "", "images", "news", "video"</li>
                            <li><code className="bg-muted px-2 py-1 rounded">tbs</code> - временной фильтр: "qdr:h", "qdr:d", "qdr:w", "qdr:m", "qdr:y"</li>
                            <li><code className="bg-muted px-2 py-1 rounded">gl</code> - страна поиска (US, RU, GB)</li>
                            <li><code className="bg-muted px-2 py-1 rounded">ads</code> - показывать рекламу (boolean)</li>
                            <li><code className="bg-muted px-2 py-1 rounded">related</code> - связанные вопросы (boolean)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Пример запроса */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Пример запроса</h3>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(requestExample, null, 2))}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                        Копировать
                      </button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{JSON.stringify(requestExample, null, 2)}</code>
                    </pre>
                  </div>

                  {/* Пример ответа */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Пример ответа</h3>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(responseExample, null, 2))}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                        Копировать
                      </button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
                      <code>{JSON.stringify(responseExample, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Поиск */}
            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    GET /api/search
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Получение ТОП-10 результатов поиска без анализа сущностей
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Параметры запроса (query string)</h3>
                    <ul className="space-y-2 text-sm">
                      <li><code className="bg-muted px-2 py-1 rounded">query</code> - поисковый запрос (обязательный)</li>
                      <li><code className="bg-muted px-2 py-1 rounded">country</code> - страна</li>
                      <li><code className="bg-muted px-2 py-1 rounded">lang</code> - язык</li>
                      <li><code className="bg-muted px-2 py-1 rounded">device</code> - устройство</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Пример запроса</h3>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-3 py-2 rounded flex-1">
                        GET /api/search?query=курсы%20английского&country=ru&lang=ru&device=desktop
                      </code>
                      <button
                        onClick={() => copyToClipboard("/api/search?query=курсы%20английского&country=ru&lang=ru&device=desktop")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Экспорт */}
            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    POST /api/export
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Экспорт результатов анализа в CSV или JSON формат
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Параметры запроса</h3>
                    <ul className="space-y-2 text-sm">
                      <li><code className="bg-muted px-2 py-1 rounded">format</code> - формат: "csv" или "json"</li>
                      <li><code className="bg-muted px-2 py-1 rounded">data</code> - данные для экспорта (результат анализа)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Пример запроса</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{JSON.stringify({
                        format: "csv",
                        data: "результат анализа из /api/analyze"
                      }, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Коды ошибок */}
          <Card>
            <CardHeader>
              <CardTitle>Коды ошибок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">HTTP статусы</h4>
                    <ul className="space-y-1 text-sm">
                      <li><Badge variant="outline">200</Badge> Успешный запрос</li>
                      <li><Badge variant="destructive">400</Badge> Неверные параметры</li>
                      <li><Badge variant="destructive">408</Badge> Превышено время ожидания</li>
                      <li><Badge variant="destructive">429</Badge> Превышен лимит API</li>
                      <li><Badge variant="destructive">500</Badge> Внутренняя ошибка сервера</li>
                      <li><Badge variant="destructive">503</Badge> Ошибка внешнего сервиса</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Коды ошибок</h4>
                    <ul className="space-y-1 text-sm">
                      <li><code className="bg-muted px-2 py-1 rounded">XMLSTOCK_ERROR</code> - Ошибка сервиса поиска</li>
                      <li><code className="bg-muted px-2 py-1 rounded">GCP_ERROR</code> - Ошибка анализа сущностей</li>
                      <li><code className="bg-muted px-2 py-1 rounded">OPENROUTER_ERROR</code> - Ошибка генерации сводки</li>
                      <li><code className="bg-muted px-2 py-1 rounded">TIMEOUT_ERROR</code> - Превышено время ожидания</li>
                      <li><code className="bg-muted px-2 py-1 rounded">QUOTA_ERROR</code> - Превышен лимит API</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Примеры использования */}
          <Card>
            <CardHeader>
              <CardTitle>Примеры использования</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">cURL</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`curl -X POST "http://localhost:3001/api/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "курсы английского языка",
    "country": "ru",
    "lang": "ru",
    "device": "desktop",
    "userUrl": "https://skyeng.ru/programs/"
  }'`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-3">JavaScript (fetch)</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'курсы английского языка',
    country: 'ru',
    lang: 'ru',
    device: 'desktop',
    userUrl: 'https://skyeng.ru/programs/'
  })
});

const result = await response.json();
console.log(result);`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-3">Python (requests)</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`import requests

response = requests.post(
    'http://localhost:3001/api/analyze',
    json={
        'query': 'курсы английского языка',
        'country': 'ru',
        'lang': 'ru',
        'device': 'desktop',
        'userUrl': 'https://skyeng.ru/programs/'
    }
)

result = response.json()
print(result)`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Лимиты и ограничения */}
          <Card>
            <CardHeader>
              <CardTitle>Лимиты и ограничения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Временные ограничения</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Максимальное время обработки: 30 секунд</li>
                      <li>• Таймаут для каждого запроса: 15 секунд</li>
                      <li>• Максимум 3 попытки для каждого URL</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Размеры данных</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Максимум 150KB текста на страницу</li>
                      <li>• Максимум 200 символов в поисковом запросе</li>
                      <li>• Анализ до 10 результатов поиска</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

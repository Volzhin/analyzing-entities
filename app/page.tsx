'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { LoadingSkeleton, AnalysisLoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { UrlCard } from '@/components/UrlCard';
import { EntityTable } from '@/components/EntityTable';
import { ResultsSummary } from '@/components/ResultsSummary';
import { PipelineResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Table, Globe, BookOpen, Code } from 'lucide-react';
import Link from 'next/link';

type AnalysisState = 'idle' | 'searching' | 'analyzing' | 'complete' | 'error';

export default function HomePage() {
  console.log('HomePage rendering...');
  const [state, setState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string>('');
  const [searchParams, setSearchParams] = useState<any>(null);

  const handleSearch = async (params: {
    query: string;
    country: string;
    lang: string;
    device: string;
    userUrl?: string;
    groupby?: number;
    domain?: string;
    tbm?: string;
    hl?: string;
    gl?: string;
  }) => {
    setSearchParams(params);
    setState('analyzing');
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Ошибка анализа');
      }

      setResult(data.data);
      setState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setState('error');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!result) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: result,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      alert('Ошибка экспорта файла');
    }
  };

  const handleReanalyze = () => {
    if (searchParams) {
      handleSearch({ ...searchParams, clearCache: true });
    }
  };

  const handleRetry = () => {
    if (searchParams) {
      handleSearch(searchParams);
    }
  };

  const handleGoHome = () => {
    setState('idle');
    setResult(null);
    setError('');
    // Не сбрасываем searchParams, чтобы форма сохранила настройки
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Анализ ключевых объектов в ТОП-10 Google
            </h1>
            <div className="flex gap-2">
              <Link href="/wiki">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <BookOpen className="h-5 w-5" />
                  Wiki
                </button>
              </Link>
              <Link href="/api-docs">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Code className="h-5 w-5" />
                  API
                </button>
              </Link>
            </div>
          </div>
          <p className="text-xl text-muted-foreground">
            Анализируем сущности в органических результатах поиска для SEO-оптимизации
          </p>
        </div>

        {/* Форма поиска */}
        {state === 'idle' && (
          <SearchForm onSearch={handleSearch} isLoading={false} />
        )}

        {/* Загрузка */}
        {state === 'analyzing' && (
          <div className="space-y-8">
            <SearchForm onSearch={handleSearch} isLoading={true} />
            <AnalysisLoadingSkeleton />
          </div>
        )}

        {/* Ошибка */}
        {state === 'error' && (
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onGoHome={handleGoHome}
          />
        )}

        {/* Результаты */}
        {state === 'complete' && result && (
          <div className="space-y-8">
            {/* Форма поиска (свернутая) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Запрос: {searchParams?.query}</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchParams?.country} • {searchParams?.lang} • {searchParams?.device}
                    </p>
                  </div>
                  <button
                    onClick={handleGoHome}
                    className="text-sm text-primary hover:underline"
                  >
                    Новый поиск
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Сводка и рекомендации */}
            <ResultsSummary
              result={result}
              onExport={handleExport}
              onReanalyze={handleReanalyze}
            />

            {/* Табы с результатами */}
            <Tabs defaultValue="entities" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entities" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Сущности
                </TabsTrigger>
                <TabsTrigger value="urls" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL результаты
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Экспорт
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entities" className="space-y-6">
                <EntityTable entities={result.aggregate} onExport={handleExport} />
              </TabsContent>

              <TabsContent value="urls" className="space-y-6">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Результаты по URL ({result.top10.length})</CardTitle>
                    </CardHeader>
                  </Card>
                  <div className="grid gap-4">
                    {result.top10.map((urlResult, index) => (
                      <UrlCard
                        key={index}
                        title={urlResult.title}
                        url={urlResult.url}
                        snippet={urlResult.snippet}
                        position={urlResult.position}
                        entities={result.perUrlEntities[urlResult.url] || []}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Экспорт данных
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Экспортируйте результаты анализа в различных форматах для дальнейшего использования.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Экспорт CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Экспорт JSON
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, Clock, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PipelineResult } from '@/lib/types';
import { formatTime, formatSalience } from '@/lib/utils';

interface ResultsSummaryProps {
  result: PipelineResult;
  onExport?: (format: 'json' | 'csv') => void;
  onReanalyze?: () => void;
}

export function ResultsSummary({ result, onExport, onReanalyze }: ResultsSummaryProps) {
  const [showAllTypes, setShowAllTypes] = useState(false);
  const totalEntities = result.aggregate.length;
  const totalDocuments = result.top10.length;
  const avgEntitiesPerDoc = result.aggregate.reduce((sum, entity) => sum + entity.docCount, 0) / totalDocuments;
  const topEntityTypes = result.aggregate.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Статистика анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <div className="text-sm text-muted-foreground">Документов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalEntities}</div>
              <div className="text-sm text-muted-foreground">Сущностей</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{avgEntitiesPerDoc.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Ср. сущностей/док</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(result.processingTime)}</div>
              <div className="text-sm text-muted-foreground">Время анализа</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Топ типы сущностей */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение по типам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(topEntityTypes)
              .sort(([,a], [,b]) => b - a)
              .slice(0, showAllTypes ? undefined : 6)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {type}
                  </Badge>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <Progress 
                      value={(count / Math.max(...Object.values(topEntityTypes))) * 100} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
          </div>
          
          {/* Кнопка показать все/свернуть */}
          {Object.keys(topEntityTypes).length > 6 && (
            <div className="mt-4 text-center border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTypes(!showAllTypes)}
                className="w-full"
              >
                {showAllTypes ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Показать все типы ({Object.keys(topEntityTypes).length})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Сводка и рекомендации */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Что важно для Google по этому запросу</CardTitle>
            <div className="flex gap-2">
              {onExport && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Экспорт CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport('json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Экспорт JSON
                  </Button>
                </>
              )}
              {onReanalyze && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReanalyze}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Повторить анализ
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mb-3 mt-6">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium mb-2 mt-4">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-3 py-2">{children}</td>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {result.llmSummary}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Метаинформация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Информация об анализе
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Время анализа:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(result.timestamp).toLocaleString('ru-RU')}
              </span>
            </div>
            <div>
              <span className="font-medium">Длительность:</span>
              <span className="ml-2 text-muted-foreground">
                {formatTime(result.processingTime)}
              </span>
            </div>
            <div>
              <span className="font-medium">Обработано URL:</span>
              <span className="ml-2 text-muted-foreground">
                {Object.keys(result.perUrlEntities).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Уникальных сущностей:</span>
              <span className="ml-2 text-muted-foreground">
                {result.aggregate.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

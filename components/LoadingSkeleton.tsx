'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Поиск */}
      <Card>
        <CardHeader>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Результаты */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Анализ */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-2 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Прогресс */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-full"></div>
          </div>
        </CardContent>
      </Card>

      {/* URL карточки */}
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-14"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Сущности */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

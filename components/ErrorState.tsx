'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorState({ error, onRetry, onGoHome }: ErrorStateProps) {
  const getErrorMessage = (error: string) => {
    if (error.includes('XMLStock')) {
      return {
        title: 'Ошибка сервиса поиска',
        description: 'Не удалось получить результаты из Google. Возможно, превышен лимит запросов.',
        suggestion: 'Попробуйте повторить запрос через несколько минут.'
      };
    }
    
    if (error.includes('Google Cloud') || error.includes('GCP')) {
      return {
        title: 'Ошибка анализа сущностей',
        description: 'Не удалось проанализировать контент страниц.',
        suggestion: 'Проверьте настройки Google Cloud Natural Language API.'
      };
    }
    
    if (error.includes('OpenRouter')) {
      return {
        title: 'Ошибка генерации сводки',
        description: 'Не удалось сгенерировать рекомендации.',
        suggestion: 'Попробуйте повторить запрос позже.'
      };
    }
    
    if (error.includes('timeout')) {
      return {
        title: 'Превышено время ожидания',
        description: 'Анализ занимает слишком много времени.',
        suggestion: 'Попробуйте упростить запрос или повторить позже.'
      };
    }
    
    if (error.includes('quota') || error.includes('limit')) {
      return {
        title: 'Превышен лимит API',
        description: 'Превышены лимиты одного из сервисов.',
        suggestion: 'Попробуйте повторить запрос через час.'
      };
    }
    
    return {
      title: 'Произошла ошибка',
      description: error,
      suggestion: 'Попробуйте повторить запрос или обратитесь в поддержку.'
    };
  };

  const { title, description, suggestion } = getErrorMessage(error);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">{description}</p>
          <p className="text-sm text-muted-foreground">{suggestion}</p>
        </div>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Button>
          )}
          
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              На главную
            </Button>
          )}
        </div>
        
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Техническая информация
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
            {error}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

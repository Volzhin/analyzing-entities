'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { EntityItem } from '@/lib/types';
import { EntityGroupedList } from '@/components/EntityGroupedList';

interface UrlCardProps {
  title: string;
  url: string;
  snippet?: string;
  position: number;
  entities: EntityItem[];
  maxEntities?: number;
  error?: string; // Информация об ошибке анализа
}

export function UrlCard({ 
  title, 
  url, 
  snippet, 
  position, 
  entities, 
  maxEntities = 5,
  error
}: UrlCardProps) {
  const handleUrlClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                #{position}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {url}
              </span>
            </div>
          </div>
          <button
            onClick={handleUrlClick}
            className="flex-shrink-0 p-1 hover:bg-muted rounded"
            title="Открыть в новой вкладке"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {snippet && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {snippet}
          </p>
        )}
        
        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800 font-medium">
                Сущности не найдены
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {error}
            </p>
          </div>
        )}
        
        {entities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Ключевые сущности ({entities.length})
              </span>
            </div>
            
            <EntityGroupedList 
              entities={entities} 
              maxEntitiesPerType={maxEntities}
              maxMentionTexts={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

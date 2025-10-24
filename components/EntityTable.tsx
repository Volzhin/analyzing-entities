'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { AggregateEntity, EntityType } from '@/lib/types';
import { getEntityTypeColor, getEntityTypeLabel, formatSalience } from '@/lib/utils';

interface EntityTableProps {
  entities: AggregateEntity[];
  onExport?: (format: 'json' | 'csv') => void;
}

export function EntityTable({ entities, onExport }: EntityTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'docCount' | 'totalSalience' | 'avgSalience'>('docCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [expandedForms, setExpandedForms] = useState<Set<number>>(new Set());

  // Фильтрация и сортировка
  const filteredEntities = entities
    .filter(entity => {
      const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || entity.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const maxSalience = Math.max(...entities.map(e => e.totalSalience));

  const entityTypes = Array.from(new Set(entities.map(e => e.type)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Агрегированные сущности ({filteredEntities.length})</CardTitle>
          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('json')}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск сущностей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EntityType | 'all')}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getEntityTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-');
            setSortBy(field as typeof sortBy);
            setSortOrder(order as typeof sortOrder);
          }}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="docCount-desc">Документов ↓</SelectItem>
              <SelectItem value="docCount-asc">Документов ↑</SelectItem>
              <SelectItem value="totalSalience-desc">Salience ↓</SelectItem>
              <SelectItem value="totalSalience-asc">Salience ↑</SelectItem>
              <SelectItem value="avgSalience-desc">Средний Salience ↓</SelectItem>
              <SelectItem value="avgSalience-asc">Средний Salience ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица */}
        <div className="space-y-2">
          {filteredEntities.slice(0, isExpanded ? filteredEntities.length : displayLimit).map((entity, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getEntityTypeColor(entity.type)}`}
                  >
                    {getEntityTypeLabel(entity.type)}
                  </Badge>
                  <span className="font-medium truncate" title={entity.name}>
                    {entity.name}
                  </span>
                  {entity.formsCount && entity.formsCount > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {entity.formsCount} форм
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{entity.docCount} док.</span>
                  <span>{formatSalience(entity.totalSalience)}</span>
                </div>
              </div>
              
              <Progress 
                value={(entity.totalSalience / maxSalience) * 100} 
                className="h-2 mb-2"
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Средний salience: {formatSalience(entity.avgSalience)}</span>
                <span>{entity.sources.length} источников</span>
              </div>
              
              {/* Показываем оригинальные формы, если их больше одной */}
              {entity.originalForms && entity.originalForms.length > 1 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="font-medium whitespace-nowrap">Словоформы:</span>
                    <div className="flex-1">
                      <span className="italic">
                        {expandedForms.has(index)
                          ? entity.originalForms.join(', ')
                          : entity.originalForms.slice(0, 5).join(', ')}
                      </span>
                      {entity.originalForms.length > 5 && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedForms);
                            if (newExpanded.has(index)) {
                              newExpanded.delete(index);
                            } else {
                              newExpanded.add(index);
                            }
                            setExpandedForms(newExpanded);
                          }}
                          className="ml-2 text-primary hover:underline"
                        >
                          {expandedForms.has(index)
                            ? 'свернуть'
                            : `ещё ${entity.originalForms.length - 5}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredEntities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Сущности не найдены по заданным фильтрам
            </p>
          </div>
        )}
        
        {filteredEntities.length > displayLimit && (
          <div className="text-center py-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Свернуть (показаны все {filteredEntities.length})
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Показать все {filteredEntities.length} сущностей (сейчас показано {displayLimit})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

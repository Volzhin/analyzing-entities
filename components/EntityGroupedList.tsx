'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EntityItem } from '@/lib/types';
import { getEntityTypeColor, getEntityTypeLabel, formatSalience } from '@/lib/utils';
import { ChevronDown, ChevronRight, MapPin, Quote, ChevronUp } from 'lucide-react';

interface EntityGroupedListProps {
  entities: EntityItem[];
  maxEntitiesPerType?: number;
  maxMentionTexts?: number;
}

interface EntityGroup {
  type: string;
  entities: EntityItem[];
  totalSalience: number;
  totalMentions: number;
}

// Импортируем продвинутую лемматизацию
import { normalizEntityName } from '@/lib/lemmatization';

// Простая лемматизация для отображения (используем продвинутую)
function lemmatizeEntityName(name: string): string {
  return normalizEntityName(name, 'ru');
}

export function EntityGroupedList({ 
  entities, 
  maxEntitiesPerType = 10,
  maxMentionTexts = 5 
}: EntityGroupedListProps) {
  // Все группы свёрнуты по умолчанию
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
  const [showAllInGroup, setShowAllInGroup] = useState<Set<string>>(new Set());

  // Группируем сущности по типам с лемматизацией
  const groupedEntities = useMemo(() => {
    console.log('EntityGroupedList: Начинаем группировку', entities.length, 'сущностей');
    const groups: Record<string, EntityGroup> = {};
    
    entities.forEach(entity => {
      const type = entity.type;
      if (!groups[type]) {
        groups[type] = {
          type,
          entities: [],
          totalSalience: 0,
          totalMentions: 0,
        };
      }
      
      // Лемматизируем название для группировки
      const lemma = lemmatizeEntityName(entity.name);
      
      // Логируем для отладки
      if (entity.name.toLowerCase().includes('сайт') || entity.name.toLowerCase().includes('команд')) {
        console.log(`EntityGroupedList: "${entity.name}" -> лемма: "${lemma}"`);
      }
      
      // Ищем, есть ли уже такая лемма в группе
      const existingIndex = groups[type].entities.findIndex(
        e => lemmatizeEntityName(e.name) === lemma
      );
      
      if (existingIndex >= 0) {
        // Объединяем с существующей сущностью
        const existing = groups[type].entities[existingIndex];
        existing.salience += entity.salience;
        existing.mentions += entity.mentions;
        // Объединяем mentionTexts
        if (entity.mentionTexts) {
          if (!existing.mentionTexts) {
            existing.mentionTexts = [];
          }
          existing.mentionTexts.push(...entity.mentionTexts);
        }
        // Сохраняем оригинальные формы
        if (!existing.metadata) {
          existing.metadata = { originalForms: [existing.name] };
        }
        if (!existing.metadata.originalForms) {
          existing.metadata.originalForms = [existing.name];
        }
        if (!existing.metadata.originalForms.includes(entity.name)) {
          existing.metadata.originalForms.push(entity.name);
        }
      } else {
        // Добавляем новую сущность с леммой как названием
        groups[type].entities.push({
          ...entity,
          name: lemma, // Используем лемму как отображаемое название
          metadata: { originalForms: [entity.name] },
        });
      }
      
      groups[type].totalSalience += entity.salience;
      groups[type].totalMentions += entity.mentions;
    });
    
    console.log('EntityGroupedList: Группировка завершена', Object.keys(groups).length, 'групп');
    return groups;
  }, [entities]);

  // Сортируем группы по общему salience
  const sortedGroups = Object.values(groupedEntities)
    .sort((a, b) => b.totalSalience - a.totalSalience);

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const handleEntityClick = (entity: EntityItem) => {
    setSelectedEntity(selectedEntity?.name === entity.name ? null : entity);
  };

  const maxSalience = Math.max(...entities.map(e => e.salience));

  const toggleAllGroups = () => {
    if (expandedGroups.size === sortedGroups.length) {
      // Если все развёрнуты, сворачиваем все
      setExpandedGroups(new Set());
    } else {
      // Иначе разворачиваем все
      setExpandedGroups(new Set(sortedGroups.map(g => g.type)));
    }
  };

  const allExpanded = expandedGroups.size === sortedGroups.length;

  return (
    <div className="space-y-4">
      {/* Кнопка развернуть/свернуть все */}
      {sortedGroups.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={toggleAllGroups}
            className="text-sm text-primary hover:underline"
          >
            {allExpanded ? 'Свернуть все' : 'Развернуть все'}
          </button>
        </div>
      )}

      {/* Список групп */}
      <div className="space-y-2">
        {sortedGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.type);
          const showAll = showAllInGroup.has(group.type);
          const sortedEntities = group.entities.sort((a, b) => b.salience - a.salience);
          const displayEntities = showAll ? sortedEntities : sortedEntities.slice(0, maxEntitiesPerType);

          return (
            <Card key={group.type} className="overflow-hidden">
              <Collapsible 
                open={isExpanded} 
                onOpenChange={() => toggleGroup(group.type)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getEntityTypeColor(group.type)}`}
                          >
                            {getEntityTypeLabel(group.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {group.entities.length} сущностей
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatSalience(group.totalSalience)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {group.totalMentions} упоминаний
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {displayEntities.map((entity, index) => (
                        <div key={index} className="space-y-1">
                          <div 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleEntityClick(entity)}
                          >
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate" title={entity.name}>
                                  {entity.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {entity.mentions}
                                </Badge>
                              </div>
                              {/* Отображаем оригинальные формы */}
                              {entity.metadata?.originalForms && entity.metadata.originalForms.length > 1 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground">Формы:</span>
                                  {entity.metadata.originalForms.slice(0, 3).map((form, formIndex) => (
                                    <Badge key={formIndex} variant="secondary" className="text-xs">
                                      {form}
                                    </Badge>
                                  ))}
                                  {entity.metadata.originalForms.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{entity.metadata.originalForms.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatSalience(entity.salience)}
                            </span>
                          </div>
                          
                          <Progress 
                            value={(entity.salience / maxSalience) * 100} 
                            className="h-1"
                          />

                          {/* Фрагменты текста при клике */}
                          {selectedEntity?.name === entity.name && entity.mentionTexts && (
                            <div className="mt-2 p-3 bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2 mb-2">
                                <Quote className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Фрагменты текста:</span>
                              </div>
                              <div className="space-y-1">
                                {entity.mentionTexts.slice(0, maxMentionTexts).map((text, textIndex) => (
                                  <div 
                                    key={textIndex}
                                    className="text-xs text-muted-foreground bg-background p-2 rounded border"
                                  >
                                    "{text}"
                                  </div>
                                ))}
                                {entity.mentionTexts.length > maxMentionTexts && (
                                  <div className="text-xs text-muted-foreground italic">
                                    ... и еще {entity.mentionTexts.length - maxMentionTexts} фрагментов
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {group.entities.length > maxEntitiesPerType && (
                        <div className="mt-3 border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newShowAll = new Set(showAllInGroup);
                              if (newShowAll.has(group.type)) {
                                newShowAll.delete(group.type);
                              } else {
                                newShowAll.add(group.type);
                              }
                              setShowAllInGroup(newShowAll);
                            }}
                            className="w-full"
                          >
                            {showAll ? (
                              <>
                                <ChevronUp className="mr-2 h-4 w-4" />
                                Свернуть (показано все {group.entities.length})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="mr-2 h-4 w-4" />
                                Показать еще {group.entities.length - maxEntitiesPerType} сущностей
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Общая статистика */}
      <div className="text-xs text-muted-foreground text-center">
        Всего найдено {entities.length} сущностей в {sortedGroups.length} категориях
      </div>
    </div>
  );
}

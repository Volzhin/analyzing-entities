'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, RotateCcw } from 'lucide-react';

interface SearchFormProps {
  onSearch: (params: {
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
  }) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  // НЕ загружаем из localStorage при инициализации - это вызывает проблемы с гидратацией
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('us');
  const [lang, setLang] = useState('en');
  const [device, setDevice] = useState('desktop');
  const [userUrl, setUserUrl] = useState('');
  
  // Упрощенные параметры XMLStock
  const [groupby, setGroupby] = useState(10);
  const [domain, setDomain] = useState('com');
  const [tbm, setTbm] = useState('none');
  const [hl, setHl] = useState('');
  const [gl, setGl] = useState('');

  // Загружаем сохраненные настройки при монтировании компонента
  useEffect(() => {
    console.log('🔄 Загружаем настройки из localStorage...');
    const savedSettings = localStorage.getItem('searchSettings');
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        console.log('✅ Настройки загружены:', settings);
        
        setCountry(settings.country || 'us');
        setLang(settings.lang || 'en');
        setDevice(settings.device || 'desktop');
        if (settings.lastQuery) setQuery(settings.lastQuery);
        if (settings.userUrl) setUserUrl(settings.userUrl);
        
        // Упрощенные параметры XMLStock
        if (settings.groupby !== undefined) setGroupby(settings.groupby);
        if (settings.domain) setDomain(settings.domain);
        if (settings.tbm) setTbm(settings.tbm);
        if (settings.hl) setHl(settings.hl);
        if (settings.gl) setGl(settings.gl);
        
        console.log('📋 Установлены значения:', {
          country: settings.country,
          lang: settings.lang,
          device: settings.device,
          domain: settings.domain,
          tbm: settings.tbm,
          gl: settings.gl,
          hl: settings.hl
        });
      } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
      }
    } else {
      console.log('⚠️ Сохраненные настройки не найдены');
    }
  }, []);

  // Сохраняем настройки при изменении (с debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const settings = {
        country,
        lang,
        device,
        lastQuery: query,
        userUrl,
        groupby,
        domain,
        tbm,
        hl,
        gl,
      };
      localStorage.setItem('searchSettings', JSON.stringify(settings));
    }, 500);

    return () => clearTimeout(timeout);
  }, [country, lang, device, query, userUrl, groupby, domain, tbm, hl, gl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 handleSubmit вызван!');
    console.log('🎯 query:', query);
    console.log('🎯 query.trim():', query.trim());
    console.log('🎯 isLoading:', isLoading);
    
    if (!query.trim()) {
      console.log('⚠️ query пустой, выходим из handleSubmit');
      return;
    }

    // Сохраняем настройки перед поиском
    const settings = {
      country,
      lang,
      device,
      lastQuery: query,
      userUrl,
      groupby,
      domain,
      tbm,
      hl,
      gl,
    };
    console.log('💾 Сохраняем настройки перед поиском:', settings);
    localStorage.setItem('searchSettings', JSON.stringify(settings));

    const searchParams = {
      query: query.trim(),
      country,
      lang,
      device,
      userUrl: userUrl.trim() || undefined,
      groupby: groupby,
      domain: domain,
      tbm: tbm === 'none' ? undefined : tbm,
      hl: hl || undefined,
      gl: gl || undefined,
    };
    console.log('🔍 Отправляем поисковый запрос:', searchParams);
    
    onSearch(searchParams);
  };

  const resetToDefaults = () => {
    setQuery('');
    setCountry('us');
    setLang('en');
    setDevice('desktop');
    setUserUrl('');
    setGroupby(10);
    setDomain('com');
    setTbm('none');
    setHl('');
    setGl('');
    localStorage.removeItem('searchSettings');
  };

  // Логируем состояние при каждом рендере
  console.log('🔄 SearchForm рендер, query:', query, 'isLoading:', isLoading, 'disabled:', isLoading || !query.trim());

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Анализ ключевых объектов в ТОП-10 Google</CardTitle>
        <p className="text-muted-foreground">
          Введите запрос для анализа сущностей в органических результатах поиска
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" onClick={(e) => {
          console.log('📝 Клик где-то в форме!', e.target);
        }}>
          {/* Поисковый запрос */}
          <div className="space-y-2">
            <label htmlFor="query" className="text-sm font-medium">
              Поисковый запрос *
            </label>
            <Input
              id="query"
              type="text"
              placeholder="Например: курсы английского языка"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* URL для анализа */}
          <div className="space-y-2">
            <label htmlFor="userUrl" className="text-sm font-medium">
              Ваш URL для анализа (опционально)
            </label>
            <Input
              id="userUrl"
              type="url"
              placeholder="https://example.com"
              value={userUrl}
              onChange={(e) => setUserUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Введите URL вашей страницы для сравнения с ТОП-10 и получения рекомендаций
            </p>
          </div>

          {/* Настройки поиска */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Настройки поиска</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Сбросить
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Страна */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Страна</label>
                <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">США (us)</SelectItem>
                    <SelectItem value="ru">Россия (ru)</SelectItem>
                    <SelectItem value="uk">Великобритания (uk)</SelectItem>
                    <SelectItem value="de">Германия (de)</SelectItem>
                    <SelectItem value="fr">Франция (fr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Язык */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Язык</label>
                <Select value={lang} onValueChange={setLang} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите язык" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Английский (en)</SelectItem>
                    <SelectItem value="ru">Русский (ru)</SelectItem>
                    <SelectItem value="de">Немецкий (de)</SelectItem>
                    <SelectItem value="fr">Французский (fr)</SelectItem>
                    <SelectItem value="es">Испанский (es)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Устройство */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Устройство</label>
                <Select value={device} onValueChange={setDevice} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите устройство" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Десктоп</SelectItem>
                    <SelectItem value="mobile">Мобильный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Дополнительные параметры поиска */}
          <div>
            <h3 className="text-lg font-medium mb-4">Дополнительные параметры поиска</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Домен Google */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Домен Google</label>
                <Select value={domain} onValueChange={setDomain} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="com">google.com</SelectItem>
                    <SelectItem value="ru">google.ru</SelectItem>
                    <SelectItem value="co.uk">google.co.uk</SelectItem>
                    <SelectItem value="de">google.de</SelectItem>
                    <SelectItem value="fr">google.fr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Тип поиска */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Тип поиска</label>
                <Select value={tbm} onValueChange={setTbm} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Обычный поиск</SelectItem>
                    <SelectItem value="images">Картинки</SelectItem>
                    <SelectItem value="news">Новости</SelectItem>
                    <SelectItem value="video">Видео</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Язык интерфейса (hl) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Язык интерфейса (hl)</label>
                <Input
                  type="text"
                  placeholder="en, ru и т.д."
                  value={hl}
                  onChange={(e) => setHl(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Страна поиска (GL) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Страна поиска (GL)</label>
                <Input
                  type="text"
                  placeholder="RU, US и т.д."
                  value={gl}
                  onChange={(e) => setGl(e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Кнопка поиска */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !query.trim()}
            onClick={() => {
              console.log('🖱️ Клик по кнопке!');
              console.log('🖱️ isLoading:', isLoading);
              console.log('🖱️ query:', query);
              console.log('🖱️ disabled:', isLoading || !query.trim());
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Анализировать
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

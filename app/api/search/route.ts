import { NextRequest, NextResponse } from 'next/server';
import { xmlStockClient } from '@/lib/xmlstock';
import { SearchParams } from '@/lib/types';
import { z } from 'zod';

// Отключаем статическую генерацию для этого роута
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  country: z.string().optional(),
  lang: z.string().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const urlParams = url.searchParams;
    
    const query = urlParams.get('q');
    const country = urlParams.get('country') || 'us';
    const lang = urlParams.get('lang') || 'en';
    const device = urlParams.get('device') as 'desktop' | 'mobile' | 'tablet' || 'desktop';

    // Валидация параметров
    const validation = searchSchema.safeParse({
      q: query,
      country,
      lang,
      device,
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Параметр q (запрос) обязателен' },
        { status: 400 }
      );
    }

    const searchParams: SearchParams = {
      query,
      country,
      lang,
      device,
    };

    console.log('Поиск ТОП-10 результатов для запроса:', query);

    const results = await xmlStockClient.searchTop10(searchParams);

    return NextResponse.json({
      success: true,
      data: results,
      query: searchParams,
    });

  } catch (error) {
    console.error('Ошибка в API /api/search:', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    
    // Определяем тип ошибки для более точного ответа
    if (errorMessage.includes('XMLStock')) {
      return NextResponse.json(
        { 
          error: 'Ошибка сервиса поиска',
          message: errorMessage,
          code: 'XMLSTOCK_ERROR'
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Превышено время ожидания',
          message: 'Попробуйте повторить запрос позже',
          code: 'TIMEOUT_ERROR'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: errorMessage,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

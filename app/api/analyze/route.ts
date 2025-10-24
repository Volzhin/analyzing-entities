import { NextRequest, NextResponse } from 'next/server';
import { analysisPipeline } from '@/lib/pipeline';
import { SearchParams } from '@/lib/types';
import { z } from 'zod';

const analyzeSchema = z.object({
  query: z.string().min(1).max(200),
  country: z.string().optional(),
  lang: z.string().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  userUrl: z.string().url().optional().or(z.literal('')),
  clearCache: z.boolean().optional(),
  // Упрощенные параметры XMLStock
  groupby: z.number().optional(),
  domain: z.string().optional(),
  tbm: z.string().optional(),
  hl: z.string().optional(),
  gl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== API ANALYZE START ===');
    console.log('GCP_NL_CREDENTIALS_JSON exists:', !!process.env.GCP_NL_CREDENTIALS_JSON);
    console.log('GCP_NL_CREDENTIALS_JSON length:', process.env.GCP_NL_CREDENTIALS_JSON?.length || 0);
    
    const body = await request.json();
    
    // Валидация параметров
    const validation = analyzeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { 
      query, 
      country = 'us', 
      lang = 'en', 
      device = 'desktop', 
      userUrl, 
      clearCache = false,
      groupby,
      domain,
      tbm,
      hl,
      gl
    } = validation.data;

    const searchParams: SearchParams = {
      query,
      country,
      lang,
      device,
      userUrl: userUrl || undefined,
      groupby,
      domain,
      tbm,
      hl,
      gl,
    };

    console.log('Запуск анализа для запроса:', query);

    // Очищаем кэш если запрошено
    if (clearCache) {
      await analysisPipeline.clearCache(searchParams);
      console.log('Кэш очищен для запроса:', query);
    }

    // Запускаем анализ
    const result = await analysisPipeline.runAnalysis(searchParams);

    return NextResponse.json({
      success: true,
      data: result,
      query: searchParams,
    });

  } catch (error) {
    console.error('Ошибка в API /api/analyze:', error);

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

    if (errorMessage.includes('Google Cloud') || errorMessage.includes('GCP')) {
      return NextResponse.json(
        { 
          error: 'Ошибка анализа сущностей',
          message: errorMessage,
          code: 'GCP_ERROR'
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes('OpenRouter')) {
      return NextResponse.json(
        { 
          error: 'Ошибка генерации сводки',
          message: errorMessage,
          code: 'OPENROUTER_ERROR'
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Превышено время ожидания',
          message: 'Анализ занимает слишком много времени. Попробуйте позже.',
          code: 'TIMEOUT_ERROR'
        },
        { status: 408 }
      );
    }

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { 
          error: 'Превышен лимит API',
          message: 'Превышены лимиты одного из сервисов. Попробуйте позже.',
          code: 'QUOTA_ERROR'
        },
        { status: 429 }
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

// Обработка OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

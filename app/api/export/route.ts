import { NextRequest, NextResponse } from 'next/server';
// Убираем csv-stringify, используем простую реализацию
import { PipelineResult } from '@/lib/types';
import { z } from 'zod';

// Отключаем статическую генерацию для этого роута
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const exportSchema = z.object({
  data: z.any(), // PipelineResult
  format: z.enum(['json', 'csv']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация параметров
    const validation = exportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { data, format } = validation.data;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analysis-${Date.now()}.json"`,
        },
      });
    }

    if (format === 'csv') {
      const csvData = await generateCsvData(data);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analysis-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Неподдерживаемый формат экспорта' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Ошибка в API /api/export:', error);

    return NextResponse.json(
      { 
        error: 'Ошибка экспорта данных',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

async function generateCsvData(data: PipelineResult): Promise<string> {
  return new Promise((resolve, reject) => {
    const csvData: string[] = [];
    
    // Заголовок
    csvData.push('=== АНАЛИЗ КЛЮЧЕВЫХ СУЩНОСТЕЙ ===');
    csvData.push(`Время анализа: ${data.timestamp}`);
    csvData.push(`Время обработки: ${data.processingTime}ms`);
    csvData.push('');

    // ТОП-10 результатов
    csvData.push('=== ТОП-10 РЕЗУЛЬТАТОВ GOOGLE ===');
    csvData.push('Позиция,Заголовок,URL,Сниппет');
    data.top10.forEach((result, index) => {
      csvData.push(`${result.position},"${result.title}","${result.url}","${result.snippet || ''}"`);
    });
    csvData.push('');

    // Агрегированные сущности
    csvData.push('=== АГРЕГИРОВАННЫЕ СУЩНОСТИ ===');
    csvData.push('Название,Тип,Общий Salience,Количество документов,Средний Salience,Источники');
    data.aggregate.forEach(entity => {
      csvData.push(`"${entity.name}","${entity.type}",${entity.totalSalience.toFixed(3)},${entity.docCount},${entity.avgSalience.toFixed(3)},"${entity.sources.join('; ')}"`);
    });
    csvData.push('');

    // Сущности по URL
    csvData.push('=== СУЩНОСТИ ПО URL ===');
    csvData.push('URL,Сущность,Тип,Salience,Упоминания');
    Object.entries(data.perUrlEntities).forEach(([url, entities]) => {
      entities.forEach(entity => {
        csvData.push(`"${url}","${entity.name}","${entity.type}",${entity.salience.toFixed(3)},${entity.mentions}`);
      });
    });
    csvData.push('');

    // Сводка LLM
    csvData.push('=== СВОДКА И РЕКОМЕНДАЦИИ ===');
    csvData.push('Сводка');
    csvData.push(`"${data.llmSummary.replace(/"/g, '""')}"`);

    resolve(csvData.join('\n'));
  });
}

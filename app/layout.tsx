import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Анализ ключевых объектов в ТОП-10 Google',
  description: 'Анализируем сущности в органических результатах поиска для SEO-оптимизации',
  keywords: ['SEO', 'анализ', 'Google', 'сущности', 'поиск', 'оптимизация'],
  authors: [{ name: 'Entity Analysis Tool' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

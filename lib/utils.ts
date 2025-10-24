import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatSalience(salience: number): string {
  return (salience * 100).toFixed(1) + '%'
}

export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  }
  return `${(milliseconds / 60000).toFixed(1)}m`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

export function getEntityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'PERSON': 'bg-blue-100 text-blue-800',
    'ORGANIZATION': 'bg-green-100 text-green-800',
    'LOCATION': 'bg-purple-100 text-purple-800',
    'CONSUMER_GOOD': 'bg-orange-100 text-orange-800',
    'EVENT': 'bg-pink-100 text-pink-800',
    'WORK_OF_ART': 'bg-indigo-100 text-indigo-800',
    'OTHER': 'bg-gray-100 text-gray-800',
    'UNKNOWN': 'bg-gray-100 text-gray-800',
  }
  return colors[type] || colors['OTHER']
}

export function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'PERSON': 'Персона',
    'ORGANIZATION': 'Организация',
    'LOCATION': 'Местоположение',
    'CONSUMER_GOOD': 'Товар',
    'EVENT': 'Событие',
    'WORK_OF_ART': 'Произведение искусства',
    'OTHER': 'Другое',
    'UNKNOWN': 'Неизвестно',
  }
  return labels[type] || 'Другое'
}

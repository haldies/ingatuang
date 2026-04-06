// Utility functions for formatting

let currentCurrency = 'IDR';

export function updateGlobalCurrency(currency: string) {
  currentCurrency = currency;
}

export function formatCurrency(amount: number): string {
  const locales: Record<string, string> = {
    'IDR': 'id-ID',
    'USD': 'en-US',
    'EUR': 'de-DE',
    'JPY': 'ja-JP',
    'GBP': 'en-GB',
    'SGD': 'en-SG',
    'AUD': 'en-AU',
    'CAD': 'en-CA',
    'CNY': 'zh-CN',
    'KRW': 'ko-KR',
    'MYR': 'ms-MY',
    'THB': 'th-TH',
    'PHP': 'en-PH',
    'VND': 'vi-VN',
    'INR': 'hi-IN',
    'HKD': 'zh-HK',
    'TWD': 'zh-TW',
    'SAR': 'ar-SA',
    'AED': 'ar-AE',
  };

  const currency = currentCurrency || 'IDR';
  const locale = locales[currency] || 'id-ID';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: (currency === 'IDR' || currency === 'JPY' || currency === 'KRW' || currency === 'VND') ? 0 : 2,
    maximumFractionDigits: (currency === 'IDR' || currency === 'JPY' || currency === 'KRW' || currency === 'VND') ? 0 : 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
}

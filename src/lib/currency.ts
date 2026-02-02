// Currency utilities for Presupuesta2
// Only supports COP and USD

export type Currency = 'COP' | 'USD';

export const CURRENCIES: { value: Currency; label: string; symbol: string; locale: string }[] = [
  { value: 'COP', label: 'Peso Colombiano', symbol: '$', locale: 'es-CO' },
  { value: 'USD', label: 'Dólar Estadounidense', symbol: '$', locale: 'en-US' },
];

export function getCurrencyInfo(currency: Currency) {
  return CURRENCIES.find(c => c.value === currency) || CURRENCIES[0];
}

export function formatCurrency(amount: number, currency: Currency): string {
  const info = getCurrencyInfo(currency);
  
  if (currency === 'COP') {
    // Colombian peso formatting: no decimals, dot as thousand separator
    return `${info.symbol}${amount.toLocaleString('es-CO', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  }
  
  // USD formatting
  return `${info.symbol}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

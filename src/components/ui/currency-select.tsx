import { CURRENCIES, Currency } from '@/lib/currency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CurrencySelectProps {
  value: Currency;
  onValueChange: (value: Currency) => void;
  disabled?: boolean;
}

export function CurrencySelect({ value, onValueChange, disabled }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleccionar moneda" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            <span className="flex items-center gap-2">
              <span className="text-lg">
                {currency.value === 'COP' ? '🇨🇴' : '🇺🇸'}
              </span>
              <span>{currency.label}</span>
              <span className="text-muted-foreground">({currency.symbol})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

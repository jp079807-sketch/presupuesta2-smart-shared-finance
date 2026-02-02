import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CycleDaySelectProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export function CycleDaySelect({ value, onValueChange, disabled }: CycleDaySelectProps) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Select 
      value={value.toString()} 
      onValueChange={(v) => onValueChange(parseInt(v, 10))} 
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Día de inicio" />
      </SelectTrigger>
      <SelectContent>
        {days.map((day) => (
          <SelectItem key={day} value={day.toString()}>
            Día {day}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

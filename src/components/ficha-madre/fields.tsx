import { Controller, get, useFormContext, type FieldPath } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import type { FichaMadreFormValues } from './schema';

export type OptionValue = string | { value: string; label: string };

function normOptions(options: readonly OptionValue[]): Array<{ value: string; label: string }> {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

function FieldError({ name }: { name: FieldPath<FichaMadreFormValues> }) {
  const { formState } = useFormContext<FichaMadreFormValues>();
  const error = get(formState.errors, name) as { message?: string } | undefined;
  if (!error?.message) return null;
  return <p className="text-xs font-medium text-rose-400 flex items-center gap-1 mt-0.5">{error.message}</p>;
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('bg-[#08172e]/90 border border-[#162e52] shadow-xl backdrop-blur-md rounded-2xl gap-3 p-5 sm:p-6', className)}>
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-base font-bold text-white tracking-wide">{title}</CardTitle>
        {description && <CardDescription className="text-xs text-blue-200/70 leading-relaxed mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 gap-4.5 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function FieldText({
  name,
  label,
  required,
  placeholder,
  type = 'text',
  inputMode,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
            {label}
            {required && <span className="text-rose-400 font-bold"> *</span>}
          </Label>
          <Input
            id={name}
            type={type}
            inputMode={inputMode as 'decimal' | undefined}
            placeholder={placeholder}
            value={String(field.value ?? '')}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          <FieldError name={name} />
        </div>
      )}
    />
  );
}

export function formatThousands(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value).replace(/,/g, '').trim();
  if (str === '') return '';

  const parts = str.split('.');
  const intPart = parts[0].replace(/\D/g, '');
  if (!intPart && parts.length === 1) return '';

  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';
  if (parts.length > 1) {
    const decPart = parts[1].replace(/\D/g, '').slice(0, 2);
    return `${formattedInt}.${decPart}`;
  }
  return formattedInt;
}

export function cleanMoneyNumber(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/,/g, '').trim();
}

export function FieldMoney({
  name,
  label,
  required,
  placeholder = 'Ej: 12,000.00',
  currency = 'USD',
  showWords = false,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  placeholder?: string;
  currency?: string;
  showWords?: boolean;
  className?: string;
}) {
  const currencySymbol = currency.toUpperCase() === 'PEN' ? 'S/' : currency.toUpperCase() === 'EUR' ? '€' : '$';

  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => {
        const rawValue = String(field.value ?? '');
        const displayValue = formatThousands(rawValue);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const input = e.target.value;
          const cleaned = input.replace(/[^0-9.]/g, '');
          const parts = cleaned.split('.');
          const sanitized = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('').slice(0, 2) : '');
          field.onChange(sanitized);
        };

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex items-center justify-between">
              <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
                {label}
                {required && <span className="text-rose-400 font-bold"> *</span>}
              </Label>
              {displayValue && (
                <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {currencySymbol} {displayValue} {currency}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-neutral-400 pointer-events-none select-none">
                {currencySymbol}
              </span>
              <Input
                id={name}
                type="text"
                inputMode="decimal"
                placeholder={placeholder}
                value={displayValue}
                onChange={handleChange}
                onBlur={field.onBlur}
                className="pl-8 font-mono text-sm tracking-wide text-white"
              />
            </div>
            <FieldError name={name} />
          </div>
        );
      }}
    />
  );
}

export function FieldSelect({
  name,
  label,
  options,
  required,
  placeholder = 'Seleccionar...',
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  options: readonly OptionValue[];
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const opts = normOptions(options);
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
            {label}
            {required && <span className="text-rose-400 font-bold"> *</span>}
          </Label>
          <Select
            id={name}
            value={String(field.value ?? '')}
            onChange={(e) => field.onChange(e.target.value)}
          >
            <option value="" className="bg-[#0a192f] text-neutral-400">{placeholder}</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0a192f] text-neutral-100">
                {o.label}
              </option>
            ))}
          </Select>
          <FieldError name={name} />
        </div>
      )}
    />
  );
}

export function FieldTextarea({
  name,
  label,
  required,
  placeholder,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
            {label}
            {required && <span className="text-rose-400 font-bold"> *</span>}
          </Label>
          <Textarea
            id={name}
            placeholder={placeholder}
            value={String(field.value ?? '')}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          <FieldError name={name} />
        </div>
      )}
    />
  );
}

export function FieldRadio({
  name,
  label,
  options,
  required,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  options: readonly string[];
  required?: boolean;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label className="text-xs font-semibold text-neutral-300">
            {label}
            {required && <span className="text-rose-400 font-bold"> *</span>}
          </Label>
          <RadioGroup
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
            className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1"
          >
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${name}-${opt}`} className="border-[#1b355a] text-blue-500" />
                <Label htmlFor={`${name}-${opt}`} className="font-normal text-xs text-neutral-200 cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <FieldError name={name} />
        </div>
      )}
    />
  );
}

export function FieldSwitch({
  name,
  label,
  description,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div
          onClick={() => field.onChange(!field.value)}
          className={cn(
            'flex items-center justify-between gap-4 rounded-xl border border-[#162e52] bg-[#09172c] p-3.5 transition-all hover:border-blue-500/40 cursor-pointer select-none',
            className,
          )}
        >
          <div>
            <Label className="text-xs font-semibold text-neutral-200 cursor-pointer">{label}</Label>
            {description && <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{description}</p>}
          </div>
          <Switch
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    />
  );
}

export function FieldCheckbox({
  name,
  label,
  description,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex items-start gap-3 rounded-xl border border-[#162e52] bg-[#09172c] p-3.5 transition-all hover:border-blue-500/30', className)}>
          <Checkbox
            id={name}
            checked={!!field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            className="mt-0.5 border-[#1b355a]"
          />
          <div>
            <Label htmlFor={name} className="text-xs font-semibold text-neutral-200 cursor-pointer">{label}</Label>
            {description && <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
      )}
    />
  );
}

export function FieldDate({
  name,
  label,
  required,
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
            {label}
            {required && <span className="text-rose-400 font-bold"> *</span>}
          </Label>
          <DatePicker
            id={name}
            value={String(field.value ?? '')}
            onChange={field.onChange}
          />
          <FieldError name={name} />
        </div>
      )}
    />
  );
}

export interface CardBrandInfo {
  brand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DINERS' | 'GENERIC';
  label: string;
  badgeStyle: string;
}

export function detectCardBrand(numStr: string): CardBrandInfo {
  const clean = numStr.replace(/\D/g, '');
  if (/^4/.test(clean)) {
    return {
      brand: 'VISA',
      label: 'Visa',
      badgeStyle: 'bg-blue-600/20 border-blue-500/50 text-blue-400 font-black',
    };
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return {
      brand: 'MASTERCARD',
      label: 'Mastercard',
      badgeStyle: 'bg-amber-600/20 border-amber-500/50 text-amber-400 font-black',
    };
  }
  if (/^3[47]/.test(clean)) {
    return {
      brand: 'AMEX',
      label: 'Amex',
      badgeStyle: 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300 font-black',
    };
  }
  if (/^3(?:0[0-5]|[68])/.test(clean)) {
    return {
      brand: 'DINERS',
      label: 'Diners',
      badgeStyle: 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-black',
    };
  }
  return {
    brand: 'GENERIC',
    label: 'Cuenta',
    badgeStyle: 'bg-neutral-800 border-neutral-700 text-neutral-400 font-bold',
  };
}

export function formatAccountNumber(value: string | undefined | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  // Amex (15 dígitos: 4-6-5)
  if (/^3[47]/.test(digits)) {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join('-');
  }

  // Cuenta BCP tradicional (13-14 dígitos empezando por 191/193)
  if (/^(191|193)/.test(digits) && digits.length <= 14) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 10);
    const p3 = digits.slice(10, 11);
    const p4 = digits.slice(11, 13);
    return [p1, p2, p3, p4].filter(Boolean).join('-');
  }

  // Tarjetas Visa, Mastercard o cuentas generales (bloques de 4: XXXX-XXXX-XXXX-XXXX)
  const chunks: string[] = [];
  for (let i = 0; i < digits.length && i < 20; i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  return chunks.join('-');
}

export function formatCCI(value: string | undefined | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 20);
  if (!digits) return '';

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 18);
  const p4 = digits.slice(18, 20);

  return [p1, p2, p3, p4].filter(Boolean).join('-');
}

export const BANCOS_CCI_PREFIX: Record<string, string> = {
  '002': 'BCP',
  '011': 'BBVA',
  '003': 'Interbank',
  '009': 'Scotiabank',
  '038': 'BanBif',
  '022': 'Santander',
  '018': 'Banco de la Nación',
  '053': 'Banco GNB',
  '056': 'Pichincha',
  '805': 'Caja Arequipa',
  '803': 'Caja Huancayo',
  '808': 'Caja Piura',
  '801': 'Caja Sullana',
};

export function FieldAccountNumber({
  name,
  label,
  required,
  placeholder = 'Ej: 4557-8901-2345-6789 o 191-2848571-0-79',
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => {
        const rawValue = String(field.value ?? '');
        const displayValue = formatAccountNumber(rawValue);
        const brandInfo = rawValue.replace(/\D/g, '').length >= 1 ? detectCardBrand(rawValue) : null;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const input = e.target.value;
          const formatted = formatAccountNumber(input);
          field.onChange(formatted);
        };

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex items-center justify-between">
              <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
                {label}
                {required && <span className="text-rose-400 font-bold"> *</span>}
              </Label>
              {brandInfo && brandInfo.brand !== 'GENERIC' && (
                <span className={cn('text-[10px] tracking-wider px-2 py-0.5 rounded border uppercase', brandInfo.badgeStyle)}>
                  {brandInfo.label}
                </span>
              )}
            </div>

            <Input
              id={name}
              type="text"
              inputMode="numeric"
              placeholder={placeholder}
              value={displayValue}
              onChange={handleChange}
              onBlur={field.onBlur}
              className="font-mono text-sm tracking-wider"
            />
            <FieldError name={name} />
          </div>
        );
      }}
    />
  );
}

export function FieldCCI({
  name,
  label,
  required,
  placeholder = 'Ej: 002-191-002848571079-65',
  className,
}: {
  name: FieldPath<FichaMadreFormValues>;
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Controller<FichaMadreFormValues>
      name={name}
      render={({ field }) => {
        const rawValue = String(field.value ?? '');
        const displayValue = formatCCI(rawValue);
        const digits = rawValue.replace(/\D/g, '');
        const bancoDetectado = digits.length >= 3 ? BANCOS_CCI_PREFIX[digits.slice(0, 3)] : null;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const input = e.target.value;
          const formatted = formatCCI(input);
          field.onChange(formatted);
        };

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex items-center justify-between">
              <Label htmlFor={name} className="text-xs font-semibold text-neutral-300">
                {label}
                {required && <span className="text-rose-400 font-bold"> *</span>}
              </Label>
              {bancoDetectado && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Banco: {bancoDetectado}
                </span>
              )}
            </div>

            <Input
              id={name}
              type="text"
              inputMode="numeric"
              maxLength={26}
              placeholder={placeholder}
              value={displayValue}
              onChange={handleChange}
              onBlur={field.onBlur}
              className="font-mono text-sm tracking-wider"
            />
            <FieldError name={name} />
          </div>
        );
      }}
    />
  );
}
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
          className={cn(
            'flex items-center justify-between gap-4 rounded-xl border border-[#162e52] bg-[#09172c] p-3.5 transition-all hover:border-blue-500/30',
            className,
          )}
        >
          <div>
            <Label className="text-xs font-semibold text-neutral-200">{label}</Label>
            {description && <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{description}</p>}
          </div>
          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
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
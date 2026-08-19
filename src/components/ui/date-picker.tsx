'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

interface DatePickerProps {
  value?: string; // Formato YYYY-MM-DD
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parsear fecha YYYY-MM-DD inicial
  const dateObj = React.useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  }, [value]);

  // Mes y Año en vista en el calendario
  const [viewYear, setViewYear] = React.useState<number>(() => dateObj ? dateObj.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = React.useState<number>(() => dateObj ? dateObj.getMonth() : new Date().getMonth());

  // Actualizar mes/año cuando cambia la fecha externa
  React.useEffect(() => {
    if (dateObj) {
      setViewYear(dateObj.getFullYear());
      setViewMonth(dateObj.getMonth());
    }
  }, [dateObj]);

  // Cerrar si se hace click fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Años disponibles para selector rápido (1920 a año actual + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 5; y >= 1920; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Cálculos del calendario para el mes en vista
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onChange?.(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.('');
    setOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.preventDefault();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange?.(`${yyyy}-${mm}-${dd}`);
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  // Formato visible en el botón
  const formattedDisplay = React.useMemo(() => {
    if (!dateObj) return null;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = MESES[dateObj.getMonth()].toLowerCase();
    const year = dateObj.getFullYear();
    return `${day} de ${monthStr} de ${year}`;
  }, [dateObj]);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number) => {
    if (!dateObj) return false;
    return (
      dateObj.getDate() === day &&
      dateObj.getMonth() === viewMonth &&
      dateObj.getFullYear() === viewYear
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botón Activador Shadcn */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-[#1b355a] bg-[#0a192f] px-3.5 py-2 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 text-left font-medium',
          open && 'border-blue-500 ring-2 ring-blue-500/25',
          className,
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="h-4 w-4 shrink-0 text-blue-400" />
          {formattedDisplay ? (
            <span className="text-neutral-100 font-medium truncate">{formattedDisplay}</span>
          ) : (
            <span className="text-neutral-500 truncate">{placeholder}</span>
          )}
        </div>
        {value ? (
          <span
            role="button"
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Limpiar fecha"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="text-xs text-blue-300/60 font-semibold uppercase tracking-wider">
            Elegir
          </span>
        )}
      </button>

      {/* Popover desplegable de Calendario Shadcn */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-[#183154] bg-[#08172e] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
          {/* Header del Calendario (Controles de navegación) */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-[#1b355a] bg-[#0c1e38] text-neutral-300 hover:bg-[#132c52] hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Select de Mes */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-[#0c1e38] border border-[#1b355a] text-neutral-100 text-xs font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer [&_option]:bg-[#0a192f] [&_option]:text-white"
              >
                {MESES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Select de Año */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-[#0c1e38] border border-[#1b355a] text-neutral-100 text-xs font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer [&_option]:bg-[#0a192f] [&_option]:text-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-[#1b355a] bg-[#0c1e38] text-neutral-300 hover:bg-[#132c52] hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="text-[11px] font-bold text-neutral-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Grid de Días */}
          <div className="grid grid-cols-7 gap-1">
            {/* Celdas vacías para el desfase del primer día */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={cn(
                    'h-8 w-full rounded-lg text-xs font-semibold transition-all flex items-center justify-center',
                    selected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : today
                        ? 'bg-blue-500/15 border border-blue-400/40 text-blue-300 font-bold'
                        : 'text-neutral-200 hover:bg-[#132c52] hover:text-white',
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Barra de Acciones rápidas */}
          <div className="flex items-center justify-between border-t border-[#183154] pt-2.5 mt-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-neutral-400 hover:text-rose-400 font-medium transition-colors"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

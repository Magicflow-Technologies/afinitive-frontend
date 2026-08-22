'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { FichaMadreResponse } from '@/lib/ficha-madre.types';
import { calcularCompletitud } from '@/lib/ficha-madre.types';
import {
  defaultFormValues,
  formValuesToPayload,
  mergeFetchedIntoDefaults,
  saveInversionistaSchema,
  type FichaMadreFormValues,
} from './ficha-madre/schema';
import {
  PasoApoderadoCumplimiento,
  PasoConyuge,
  PasoDomicilio,
  PasoInversion,
  PasoLaboral,
  PasoOrigenFondos,
  PasoTitular,
} from './ficha-madre/steps';

const STEPS = [
  { id: 'titular', title: '1. Datos del Titular', description: 'Información personal del inversionista', Component: PasoTitular },
  { id: 'conyuge', title: '2. Cónyuge y Régimen Patrimonial', description: 'Información del cónyuge si corresponde', Component: PasoConyuge },
  { id: 'domicilio', title: '3. Domicilio y Correspondencia', description: 'Dirección de residencia y envío', Component: PasoDomicilio },
  { id: 'laboral', title: '4. Perfil Laboral y Vinculaciones', description: 'Empleo, actividad y patrimonio', Component: PasoLaboral },
  { id: 'origen', title: '5. Origen de Fondos', description: 'Declaración de fuentes de recursos', Component: PasoOrigenFondos },
  { id: 'apoderado', title: '6. Apoderado y Cumplimiento', description: 'Poder registral, antecedentes y FATCA/CRS', Component: PasoApoderadoCumplimiento },
  { id: 'inversion', title: '7. Inversión y Cuenta Bancaria', description: 'Monto a invertir y datos para abono', Component: PasoInversion },
] as const;

export interface FichaMadreWizardProps {
  fichaMadreId: string;
  initial?: Parameters<typeof mergeFetchedIntoDefaults>[1];
  readOnly?: boolean;
  onSaved?: (respuesta: FichaMadreResponse) => void;
  onComplete?: () => void;
}

export function FichaMadreWizard({
  fichaMadreId,
  initial,
  readOnly = false,
  onSaved,
  onComplete,
}: FichaMadreWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaults = useMemo(() => mergeFetchedIntoDefaults(defaultFormValues(), initial), [initial]);

  const form = useForm<FichaMadreFormValues>({
    resolver: zodResolver(saveInversionistaSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  // Resetear si los datos iniciales cambian
  const initialRef = useRef<string>('');
  useEffect(() => {
    const stringified = JSON.stringify(initial ?? {});
    if (initialRef.current !== stringified) {
      initialRef.current = stringified;
      form.reset(defaults);
      const p = formValuesToPayload(defaults);
      setProgressData(calcularCompletitud(p));
    }
  }, [defaults, form, initial]);

  // Estado del cálculo de progreso
  const [progressData, setProgressData] = useState(() => {
    const initialPayload = formValuesToPayload(defaults);
    return calcularCompletitud(initialPayload);
  });

  const updateProgress = React.useCallback(() => {
    const snapshot = form.getValues();
    const p = formValuesToPayload(snapshot);
    setProgressData(calcularCompletitud(p));
  }, [form]);

  useEffect(() => {
    updateProgress();
    const subscription = form.watch((values) => {
      const p = formValuesToPayload(values as FichaMadreFormValues);
      setProgressData(calcularCompletitud(p));
    });
    return () => subscription.unsubscribe();
  }, [form, step, updateProgress]);

  const { global, pasos } = progressData;

  // Envío final de todo el JSON en el último paso
  async function enviarFinal(): Promise<boolean> {
    try {
      setSaving(true);
      setErrorMsg(null);
      const freshPayload = formValuesToPayload(form.getValues());
      const respuesta = await api.guardarInversionista(fichaMadreId, freshPayload);
      setSavedAt(new Date());
      updateProgress();
      onSaved?.(respuesta);
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la información');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function siguiente() {
    // Último paso: enviar todo el JSON acumulado de una sola vez al backend
    if (step === STEPS.length - 1) {
      const saved = await enviarFinal();
      if (saved) onComplete?.();
      return;
    }

    // Pasos intermedios: avanzar inmediatamente al siguiente paso
    setStep((s) => s + 1);
  }

  function atras() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  const esUltimo = step === STEPS.length - 1;
  const PasoLabel = esUltimo ? 'Guardar todo y finalizar' : 'Continuar';

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-5 w-full">
        {/* Banner de Progreso General */}
        <div className="rounded-2xl border border-[#162e50] bg-gradient-to-r from-[#08172e] via-[#0a1d3b] to-[#08172e] p-4.5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-sm shadow-inner shrink-0">
              {global.pct}%
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 font-mono">
                Estado Ficha Madre
              </span>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {global.pct === 100 ? 'Ficha completada al 100%' : `Progreso total: ${global.pct}%`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {savedAt && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <Check className="size-3.5 text-emerald-400" />
                Guardado a las {savedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <div className="w-36 sm:w-48">
              <Progress value={global.pct} className="h-2.5 bg-[#0c1f3d]" />
            </div>
          </div>
        </div>

        {/* Lista Acordeón de Pasos */}
        <div className="space-y-3.5">
          {STEPS.map((s, i) => {
            const pct = pasos[s.id]?.pct ?? 0;
            const completo = pct === 100;
            const activo = i === step;
            const StepComp = s.Component;

            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-2xl border transition-all duration-300 ease-in-out overflow-hidden shadow-lg',
                  activo
                    ? 'border-blue-500/60 bg-[#08172e] ring-1 ring-blue-500/30 shadow-2xl shadow-blue-950/30'
                    : 'border-[#162e50]/70 bg-[#061427]/80 hover:border-[#1e3c68]',
                )}
              >
                {/* Encabezado del Acordeón (Clickable) */}
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly) return;
                    setStep(i);
                  }}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all duration-300 shadow-sm',
                        completo
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : activo
                            ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                            : 'bg-[#0f2343] text-neutral-400 border border-[#1b355a]',
                      )}
                    >
                      {completo ? <Check className="size-4 stroke-[3]" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-bold tracking-tight truncate transition-colors duration-200',
                          activo ? 'text-white font-extrabold' : 'text-neutral-200',
                        )}
                      >
                        {s.title}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{s.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Badge de Porcentaje de Paso */}
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-extrabold border font-mono transition-colors duration-200',
                        completo
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : pct > 0
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-neutral-800/60 border-neutral-700/50 text-neutral-400',
                      )}
                    >
                      {pct}%
                    </span>

                    {/* Icono Desplegable con rotación suave */}
                    <div
                      className={cn(
                        'p-1.5 rounded-lg transition-transform duration-300 ease-in-out',
                        activo ? 'bg-blue-500/20 text-blue-400 rotate-180' : 'text-neutral-500',
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </div>
                  </div>
                </button>

                {/* Cuerpo del Formulario con Animación Suave de Altura y Opacidad */}
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    activo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[#162e50]/80 p-5 md:p-6 bg-[#08172e]/60 space-y-6">
                      <StepComp />

                      {errorMsg && (
                        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300">
                          {errorMsg}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-3 border-t border-[#162e50]/80 pt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={atras}
                          disabled={step === 0 || saving}
                          className={cn(
                            'bg-[#09172c] border border-[#1b355a] hover:bg-[#112442] hover:text-white text-neutral-300 rounded-xl px-5 py-2.5 font-semibold text-xs transition-all cursor-pointer',
                            step === 0 && 'invisible',
                          )}
                        >
                          <ArrowLeft className="size-4 mr-1.5" /> Atrás
                        </Button>
                        <Button
                          type="button"
                          onClick={siguiente}
                          disabled={saving || readOnly}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 rounded-xl px-6 py-2.5 font-bold text-xs transition-all cursor-pointer"
                        >
                          {saving ? (
                            'Guardando...'
                          ) : (
                            <>
                              {PasoLabel}
                              {esUltimo ? <Save className="size-4 ml-1.5" /> : <ArrowRight className="size-4 ml-1.5" />}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FormProvider>
  );
}
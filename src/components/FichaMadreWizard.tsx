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
  STEP_TRIGGER_FIELDS,
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
  // Todos los steps empiezan cerrados (null) y el usuario elige cuál abrir
  const [step, setStep] = useState<number | null>(null);
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

  // Envío final o guardado manual de avance
  async function enviarFinal(): Promise<boolean> {
    if (readOnly) return true;
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

  // Alternar apertura/cierre de cualquier paso al hacer clic en su encabezado
  function irAPaso(targetStep: number) {
    setErrorMsg(null);
    setStep((prev) => (prev === targetStep ? null : targetStep));
  }

  async function siguiente() {
    if (step === null) return;

    if (readOnly) {
      if (step < STEPS.length - 1) {
        setStep((s) => (s !== null ? s + 1 : 0));
      } else {
        setStep(null);
      }
      return;
    }

    // Validar los campos obligatorios del paso actual antes de permitir avanzar
    const camposDelPaso = STEP_TRIGGER_FIELDS[step] ?? [];
    if (camposDelPaso.length > 0) {
      const esValido = await form.trigger(camposDelPaso as any, { shouldFocus: true });
      if (!esValido) {
        setErrorMsg('Por favor completa todos los campos obligatorios requeridos en este paso.');
        return;
      }
    }
    setErrorMsg(null);

    // Guardar avance en segundo plano sin interrumpir la navegación
    const freshPayload = formValuesToPayload(form.getValues());
    api.guardarInversionista(fichaMadreId, freshPayload)
      .then((res) => {
        setSavedAt(new Date());
        updateProgress();
        onSaved?.(res);
      })
      .catch(() => {});

    // Último paso: enviar todo el JSON acumulado de una sola vez al backend
    if (step === STEPS.length - 1) {
      const saved = await enviarFinal();
      if (saved) onComplete?.();
      return;
    }

    // Pasos intermedios: avanzar inmediatamente al siguiente paso
    setStep((s) => (s !== null ? s + 1 : 0));
  }

  function atras() {
    setErrorMsg(null);
    if (step === null || step === 0) {
      setStep(null);
      return;
    }
    setStep((s) => (s !== null && s > 0 ? s - 1 : null));
  }

  const esUltimo = step !== null && step === STEPS.length - 1;
  const PasoLabel = readOnly
    ? esUltimo
      ? 'Fin del Formulario'
      : 'Ver Siguiente Paso'
    : esUltimo
      ? 'Guardar todo y finalizar'
      : 'Continuar y Siguiente Paso';

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-5 w-full">
        {/* Banner de Modo Solo Lectura si está aprobado */}
        {readOnly && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4.5 shadow-xs flex items-center gap-3.5 text-emerald-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Check className="size-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Expediente Aprobado • Modo Solo Lectura
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                Este expediente ya cuenta con aprobación fiduciaria. Los campos se encuentran bloqueados para edición y están habilitados únicamente para su visualización y consulta.
              </p>
            </div>
          </div>
        )}

        {/* Banner de Progreso General */}
        <div className="rounded-2xl border border-[#e7ebf1] bg-white p-4.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344] font-extrabold text-sm shadow-xs shrink-0">
              {global.pct}%
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#caa344] font-mono">
                Estado Ficha Madre
              </span>
              <h2 className="text-base font-extrabold text-[#10233f] tracking-tight">
                {global.pct === 100 ? 'Ficha completada al 100%' : `Progreso total: ${global.pct}%`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step !== null && (
              <button
                type="button"
                onClick={() => setStep(null)}
                className="px-3 py-1 rounded-xl border border-[#e7ebf1] bg-white hover:bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Cerrar pasos
              </button>
            )}
            {savedAt && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <Check className="size-3.5 text-emerald-700" />
                Guardado a las {savedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <div className="w-36 sm:w-48">
              <Progress value={global.pct} className="h-2.5 bg-[#e7ebf1]" />
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
                  'rounded-2xl border transition-all duration-300 ease-in-out overflow-hidden shadow-xs',
                  activo
                    ? 'border-[#caa344] bg-white ring-1 ring-[#caa344]/30 shadow-sm'
                    : 'border-[#e7ebf1] bg-white hover:border-[#caa344]/40',
                )}
              >
                {/* Encabezado del Acordeón (Clickable) */}
                <button
                  type="button"
                  onClick={() => irAPaso(i)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all duration-300 shadow-xs',
                        completo
                          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                          : activo
                            ? 'bg-[#caa344] text-white shadow-[#caa344]/30 scale-105'
                            : 'bg-[#f7f8fb] text-[#8d9aae] border border-[#e7ebf1]',
                      )}
                    >
                      {completo ? <Check className="size-4 stroke-[3]" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-bold tracking-tight truncate transition-colors duration-200',
                          activo ? 'text-[#10233f] font-extrabold' : 'text-[#17233a]',
                        )}
                      >
                        {s.title}
                      </h3>
                      <p className="text-xs text-[#8d9aae] truncate mt-0.5">{s.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Badge de Porcentaje de Paso */}
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-extrabold border font-mono transition-colors duration-200',
                        completo
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : pct > 0
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-[#f7f8fb] border-[#e7ebf1] text-[#8d9aae]',
                      )}
                    >
                      {pct}%
                    </span>

                    {/* Icono Desplegable con rotación suave */}
                    <div
                      className={cn(
                        'p-1.5 rounded-lg transition-transform duration-300 ease-in-out',
                        activo ? 'bg-[#caa344]/10 text-[#caa344] rotate-180' : 'text-[#8d9aae]',
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
                    <div className="border-t border-[#e7ebf1] p-5 md:p-6 bg-[#f7f8fb]/40 space-y-6">
                      <fieldset disabled={readOnly} className={cn("space-y-6", readOnly && "opacity-95 cursor-default")}>
                        <StepComp />
                      </fieldset>

                      {errorMsg && (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                          {errorMsg}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-3 border-t border-[#e7ebf1] pt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={atras}
                          disabled={saving}
                          className="bg-white border border-[#e7ebf1] hover:bg-[#f7f8fb] hover:text-[#17233a] text-[#17233a] rounded-xl px-5 py-2.5 font-semibold text-xs transition-all cursor-pointer shadow-xs"
                        >
                          {step === 0 ? (
                            'Cerrar paso'
                          ) : (
                            <>
                              <ArrowLeft className="size-4 mr-1.5" /> Anterior
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-2.5">
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={enviarFinal}
                              disabled={saving}
                              className="bg-white border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#17233a] hover:text-[#caa344] hover:border-[#caa344] rounded-xl px-4 py-2.5 font-semibold text-xs transition-all shadow-xs cursor-pointer"
                              title="Guardar el avance actual"
                            >
                              <Save className="size-4 mr-1.5 text-[#caa344]" />
                              <span>{saving ? 'Guardando...' : 'Guardar Avance'}</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            onClick={siguiente}
                            disabled={saving || (readOnly && esUltimo)}
                            className={cn(
                              "rounded-xl px-6 py-2.5 font-bold text-xs transition-all shadow-xs",
                              readOnly && esUltimo
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default"
                                : "bg-[#caa344] hover:bg-[#b8923a] text-white shadow-sm cursor-pointer"
                            )}
                          >
                            {saving ? (
                              'Guardando...'
                            ) : (
                              <>
                                {PasoLabel}
                                {esUltimo ? (
                                  readOnly ? <Check className="size-4 ml-1.5" /> : <Save className="size-4 ml-1.5" />
                                ) : (
                                  <ArrowRight className="size-4 ml-1.5" />
                                )}
                              </>
                            )}
                          </Button>
                        </div>
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
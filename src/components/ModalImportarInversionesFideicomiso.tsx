'use client';

import React, { useState, useRef } from 'react';
import {
  api,
  ResultadoImportacionInversiones,
  ValidacionImportacionInversiones,
  FilaInversionValidada,
} from '@/services/api';
import Link from 'next/link';

interface ModalImportarInversionesFideicomisoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReload: () => void;
}

export function ModalImportarInversionesFideicomiso({
  isOpen,
  onClose,
  onSuccessReload,
}: ModalImportarInversionesFideicomisoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fases: 'carga' -> 'verificacion' -> 'completado'
  const [etapa, setEtapa] = useState<'carga' | 'verificacion' | 'completado'>('carga');
  const [validacion, setValidacion] = useState<ValidacionImportacionInversiones | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionInversiones | null>(null);
  const [tabVerificacion, setTabVerificacion] = useState<'validas' | 'inconsistencias'>('validas');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selected: File) => {
    setError('');
    const ext = selected.name.toLowerCase();
    const esValido = ext.endsWith('.xlsx') || ext.endsWith('.xls');

    if (!esValido) {
      setError('Formato no permitido. Por favor sube un archivo Excel (.xlsx o .xls) con las 9 columnas oficiales requeridas.');
      return;
    }
    setFile(selected);
  };

  // Fase 1: Validar / Simular sin escribir en BD
  const handleValidar = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.validarInversionesFideicomisoMasivo(file);
      setValidacion(res);
      setTabVerificacion(res.inconsistencias.length > 0 && res.totalValidas === 0 ? 'inconsistencias' : 'validas');
      setEtapa('verificacion');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al validar el archivo de inversiones.');
    } finally {
      setLoading(false);
    }
  };

  // Fase 2: Confirmar e importar filas válidas en BD
  const handleConfirmar = async () => {
    if (!validacion || validacion.filasValidas.length === 0) {
      setError('No hay filas válidas para importar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.confirmarInversionesFideicomisoMasivo(validacion.filasValidas);
      setResultado(res);
      setEtapa('completado');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar las inversiones en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidacion(null);
    setResultado(null);
    setEtapa('carga');
    setError('');
  };

  const handleFinish = () => {
    onSuccessReload();
    onClose();
    handleReset();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[#e7ebf1] bg-white shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#10233f]">
                  Importación Masiva de Inversiones en Fideicomisos
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  etapa === 'carga'
                    ? 'bg-blue-100 text-blue-700'
                    : etapa === 'verificacion'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {etapa === 'carga' ? 'Paso 1: Carga' : etapa === 'verificacion' ? 'Paso 2: Diagnóstico' : 'Paso 3: Completado'}
                </span>
              </div>
              <p className="text-xs text-[#8d9aae]">
                {etapa === 'carga' && 'Carga el archivo Excel oficial (.xlsx, .xls) para verificar la consistencia antes de importar.'}
                {etapa === 'verificacion' && 'Revisa el diagnóstico de consistencia y los fideicomisos asignados.'}
                {etapa === 'completado' && 'Operación completada exitosamente.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#8d9aae] hover:text-[#17233a] flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ============================================================== */}
          {/* ETAPA 1: CARGA DE ARCHIVO                                      */}
          {/* ============================================================== */}
          {etapa === 'carga' && (
            <>
              {/* Regla de negocio crítica */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  !
                </div>
                <div className="text-xs text-amber-900 leading-relaxed space-y-1">
                  <p className="font-bold">Reglas de validación estricta del Catálogo:</p>
                  <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-0.5">
                    <li>
                      <strong>El sistema NO creará fideicomisos automáticamente.</strong> Todo fideicomiso referenciado en el archivo debe existir previamente en el <Link href="/admin/fideicomisos" target="_blank" className="underline font-bold text-amber-950 hover:text-[#caa344]">Catálogo Oficial de Fideicomisos</Link>.
                    </li>
                    <li>
                      El archivo pasará por una <strong>fase de verificación previa</strong> antes de aplicar cualquier cambio en la base de datos.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Estructura requerida */}
              <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17233a] uppercase tracking-wider">
                    Estructura Oficial de Columnas (Excel):
                  </span>
                  <span className="text-[10px] font-mono text-[#caa344] bg-[#caa344]/10 border border-[#caa344]/30 px-2 py-0.5 rounded-md font-bold">
                    Excel (.xlsx, .xls) • 9 Columnas
                  </span>
                </div>
                <div className="overflow-x-auto pb-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#17233a]">
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#8d9aae]">N°</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#caa344] font-bold">INVERSIONISTA</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#10233f] font-bold">FIDEICOMISO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-emerald-700 font-bold">MONTO INVERTIDO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">TASA ANUAL</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">VENCIMIENTO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#17233a]">CORREO OP. CORIL</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#17233a]">CORREO OP. CORFID</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-emerald-600 font-bold">ENLACE CRONOGRAMA</span>
                  </div>
                </div>
              </div>

              {/* Zona Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-[#caa344] bg-[#caa344]/5'
                    : file
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-[#e7ebf1] hover:border-[#caa344] bg-[#f7f8fb]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm flex items-center justify-center text-[#caa344]">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                {file ? (
                  <div>
                    <span className="block text-sm font-extrabold text-[#10233f]">{file.name}</span>
                    <span className="text-xs text-[#8d9aae]">
                      {(file.size / 1024).toFixed(1)} KB — Clic para cambiar archivo Excel
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-sm font-bold text-[#10233f]">
                      Arrastra y suelta tu archivo Excel (.xlsx, .xls) aquí
                    </span>
                    <span className="text-xs text-[#8d9aae] mt-1 block">
                      o haz clic para seleccionar desde tu computadora
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* ETAPA 2: DIAGNÓSTICO Y PREVISUALIZACIÓN                       */}
          {/* ============================================================== */}
          {etapa === 'verificacion' && validacion && (
            <div className="space-y-5">
              
              {/* Alerta de Fideicomisos Faltantes */}
              {validacion.fideicomisosFaltantes.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-800 font-extrabold text-xs">
                      <span>⚠️ FIDEICOMISOS NO ENCONTRADOS EN EL CATÁLOGO ({validacion.fideicomisosFaltantes.length})</span>
                    </div>
                    <Link
                      href="/admin/fideicomisos"
                      target="_blank"
                      className="text-[11px] font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1"
                    >
                      Ir al Catálogo de Fideicomisos →
                    </Link>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Los siguientes nombres de fideicomisos fueron detectados en el archivo pero <strong>no existen en el Catálogo Oficial</strong>. Debes crearlos previamente desde el Catálogo o corregir el nombre en el archivo:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {validacion.fideicomisosFaltantes.map((fn, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 font-mono font-bold text-[11px] border border-red-300"
                      >
                        {fn || '(En blanco)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cockpit de Validación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1]">
                  <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Filas Analizadas</span>
                  <span className="text-xl font-extrabold text-[#10233f] mt-0.5 block">{validacion.totalFilas}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-emerald-700 text-[10px] font-mono font-bold uppercase">Filas Válidas Verificadas</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{validacion.totalValidas}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="block text-amber-700 text-[10px] font-mono font-bold uppercase">Inconsistencias Detectadas</span>
                  <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">{validacion.totalInconsistencias}</span>
                </div>
              </div>

              {/* Tabs entre Válidas e Inconsistencias */}
              <div className="flex items-center gap-2 border-b border-[#e7ebf1] pb-2">
                <button
                  type="button"
                  onClick={() => setTabVerificacion('validas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    tabVerificacion === 'validas'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
                  }`}
                >
                  <span>Inversiones Válidas Listas</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] font-extrabold shadow-sm">
                    {validacion.totalValidas}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabVerificacion('inconsistencias')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    tabVerificacion === 'inconsistencias'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
                  }`}
                >
                  <span>Inconsistencias y Observaciones</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] font-extrabold shadow-sm">
                    {validacion.totalInconsistencias}
                  </span>
                </button>
              </div>

              {/* Tabla de Válidas */}
              {tabVerificacion === 'validas' && (
                <div className="space-y-2">
                  {validacion.filasValidas.length === 0 ? (
                    <div className="p-8 text-center bg-[#f7f8fb] rounded-2xl border border-dashed border-[#e7ebf1]">
                      <p className="text-xs text-[#8d9aae]">No se encontraron filas válidas para importar.</p>
                      <p className="text-[11px] text-[#8d9aae] mt-1">Revisa la pestaña de inconsistencias para corregir los problemas.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-[#e7ebf1] rounded-2xl bg-[#f7f8fb] divide-y divide-[#e7ebf1]">
                      {validacion.filasValidas.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e7ebf1] text-[#8d9aae]">
                                #{item.fila}
                              </span>
                              <span className="font-bold text-[#10233f]">{item.clienteNombre}</span>
                            </div>
                            <span className="text-[11px] text-[#8d9aae] block">
                              Fideicomiso Oficial: <strong className="text-[#17233a]">{item.fideicomisoNombre}</strong> • Vence: {item.vencimiento || 'Vigente'}
                            </span>
                            {(item.correoOpCoril || item.correoOpCorfid || item.enlaceCronograma) && (
                              <div className="flex items-center gap-2 text-[10px] text-[#8d9aae] pt-0.5">
                                {item.correoOpCoril && <span>Coril: {item.correoOpCoril}</span>}
                                {item.correoOpCorfid && <span>• Corfid: {item.correoOpCorfid}</span>}
                                {item.enlaceCronograma && (
                                  <a href={item.enlaceCronograma} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold">
                                    • Ver Cronograma ↗
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-[#caa344]">
                              {item.moneda === 'USD' ? '$' : 'S/'} {item.monto.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-[#8d9aae]">{item.tasa || '10 %'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tabla de Inconsistencias */}
              {tabVerificacion === 'inconsistencias' && (
                <div className="space-y-2">
                  {validacion.inconsistencias.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-800">¡Excelente! No se detectaron inconsistencias en este archivo.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-amber-200 rounded-2xl bg-amber-50/30 divide-y divide-amber-100">
                      {validacion.inconsistencias.map((err, idx) => (
                        <div key={idx} className="p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 font-bold">
                                Fila {err.fila}
                              </span>
                              <span className="font-bold text-[#10233f]">{err.inversionista}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                              {err.campo}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900">{err.motivo}</p>
                          {err.valorDetectado && (
                            <span className="text-[10px] font-mono text-[#8d9aae] block">
                              Valor detectado en celda: <code className="text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">{err.valorDetectado}</code>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* ETAPA 3: RESULTADO FINAL PERSISTIDO                            */}
          {/* ============================================================== */}
          {etapa === 'completado' && resultado && (
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto text-xl font-bold shadow-lg shadow-emerald-500/20">
                  ✓
                </div>
                <h4 className="text-base font-extrabold text-emerald-950">
                  ¡Importación Completada Exitosamente!
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Se han registrado y asociado las inversiones verificadas directamente en los expedientes de cada cliente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1]">
                  <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Inversiones Guardadas</span>
                  <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">{resultado.totalExitosos}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1]">
                  <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Observaciones No Guardadas</span>
                  <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">{resultado.totalErrores}</span>
                </div>
              </div>

              {resultado.exitosos.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-[#e7ebf1] rounded-2xl bg-[#f7f8fb] divide-y divide-[#e7ebf1]">
                  {resultado.exitosos.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#10233f]">{item.inversionista}</span>
                        <span className="text-[11px] text-[#8d9aae] block">
                          Fideicomiso: <strong className="text-[#17233a]">{item.fideicomiso}</strong>
                        </span>
                      </div>
                      <span className="font-extrabold text-[#caa344]">
                        {item.moneda === 'USD' ? '$' : 'S/'} {item.monto.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-[#e7ebf1] flex items-center justify-between gap-3 bg-[#f7f8fb]">
          {etapa === 'carga' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#e7ebf1] bg-white hover:bg-[#f7f8fb] text-[#17233a] font-semibold text-xs transition-all cursor-pointer shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleValidar}
                disabled={loading || !file}
                className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analizando y Verificando...</span>
                  </>
                ) : (
                  <span>Verificar Archivo (Sin Guardar) →</span>
                )}
              </button>
            </>
          )}

          {etapa === 'verificacion' && validacion && (
            <>
              <button
                type="button"
                onClick={() => setEtapa('carga')}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-[#e7ebf1] bg-white hover:bg-[#f7f8fb] text-[#17233a] font-semibold text-xs transition-all cursor-pointer shadow-sm"
              >
                ← Cargar otro archivo
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={loading || validacion.totalValidas === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Guardando Inversiones...</span>
                    </>
                  ) : (
                    <span>Confirmar e Importar {validacion.totalValidas} Inversiones Verificadas</span>
                  )}
                </button>
              </div>
            </>
          )}

          {etapa === 'completado' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-md shadow-[#caa344]/20 transition-all cursor-pointer"
              >
                Finalizar y Ver Expedientes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

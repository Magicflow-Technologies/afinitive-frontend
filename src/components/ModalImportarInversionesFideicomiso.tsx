'use client';

import React, { useState, useRef } from 'react';
import { api, ResultadoImportacionInversiones } from '@/services/api';

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
  const [resultado, setResultado] = useState<ResultadoImportacionInversiones | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selected: File) => {
    setError('');
    const ext = selected.name.toLowerCase();
    const esValido =
      ext.endsWith('.xlsx') ||
      ext.endsWith('.xls') ||
      ext.endsWith('.html') ||
      ext.endsWith('.htm');

    if (!esValido) {
      setError('El archivo debe tener formato Excel (.xlsx, .xls) o archivo HTML con tabla (.html, .htm).');
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.importarInversionesFideicomisoMasivo(file);
      setResultado(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar el archivo de inversiones.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccessReload();
    onClose();
    setFile(null);
    setResultado(null);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl border border-[#e7ebf1] bg-white shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#10233f]">
                Importación Masiva de Inversiones en Fideicomisos
              </h3>
              <p className="text-xs text-[#8d9aae]">
                Carga el archivo Excel (.xlsx) o HTML con los fideicomisos asignados a cada inversionista.
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
          {!resultado ? (
            <>
              {/* Estructura requerida */}
              <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17233a] uppercase tracking-wider">
                    Estructura de Columnas Aceptadas:
                  </span>
                  <span className="text-[10px] font-mono text-[#caa344] bg-[#caa344]/10 border border-[#caa344]/30 px-2 py-0.5 rounded-md font-bold">
                    Excel (.xlsx, .xls) o HTML (.html)
                  </span>
                </div>
                <div className="overflow-x-auto pb-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#17233a]">
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">N°</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#caa344] font-bold">INVERSIONISTA</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-[#10233f] font-bold">FIDEICOMISO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">MONTO INVERTIDO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">TASA ANUAL</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">VENCIMIENTO</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">CORREO OP. CORIL</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1]">CORREO OP. CORFID</span>
                    <span className="text-[#8d9aae]">→</span>
                    <span className="px-2 py-1 bg-white rounded-lg border border-[#e7ebf1] text-emerald-600 font-bold">ENLACE CRONOGRAMA</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8d9aae] leading-relaxed">
                  * El sistema vinculará la inversión buscando al cliente por nombres/apellidos o documento. Si el fideicomiso no existe, se registrará automáticamente en el catálogo.
                </p>
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
                  accept=".xlsx, .xls, .html, .htm"
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
                      {(file.size / 1024).toFixed(1)} KB — Clic para cambiar archivo
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-sm font-bold text-[#10233f]">
                      Arrastra y suelta tu archivo Excel o HTML aquí
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
          ) : (
            /* Pantalla de Resultados */
            <div className="space-y-5">
              {/* Cockpit de Resultados */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1]">
                  <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Filas Procesadas</span>
                  <span className="text-xl font-extrabold text-[#10233f] mt-0.5 block">{resultado.totalFilas}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-emerald-700 text-[10px] font-mono font-bold uppercase">Inversiones Exitosas</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{resultado.totalExitosos}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="block text-amber-700 text-[10px] font-mono font-bold uppercase">Observadas / Errores</span>
                  <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">{resultado.totalErrores}</span>
                </div>
              </div>

              {/* Inversiones Exitosas */}
              {resultado.exitosos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#10233f] font-mono block">
                    Inversiones Registradas / Actualizadas ({resultado.exitosos.length})
                  </span>
                  <div className="max-h-56 overflow-y-auto border border-[#e7ebf1] rounded-2xl bg-[#f7f8fb] divide-y divide-[#e7ebf1]">
                    {resultado.exitosos.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#10233f]">{item.inversionista}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                              item.accion === 'CREADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.accion}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#8d9aae]">
                            Fideicomiso: <strong className="text-[#17233a]">{item.fideicomiso}</strong> • Vence: {item.vencimiento || 'Vigente'}
                          </span>
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
                </div>
              )}

              {/* Errores u Observaciones */}
              {resultado.errores.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 font-mono block">
                    Filas No Vinculadas ({resultado.errores.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-red-200 rounded-2xl bg-red-50/40 divide-y divide-red-100">
                    {resultado.errores.map((err, idx) => (
                      <div key={idx} className="p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-800">Fila {err.fila}: {err.inversionista}</span>
                        </div>
                        <p className="text-[11px] text-red-700 mt-0.5">{err.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-[#e7ebf1] flex items-center justify-end gap-3 bg-[#f7f8fb]">
          {!resultado ? (
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
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Procesando e Importando...</span>
                  </>
                ) : (
                  <span>Procesar e Importar Inversiones</span>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-md shadow-[#caa344]/20 transition-all cursor-pointer"
            >
              Completar y Ver Expedientes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

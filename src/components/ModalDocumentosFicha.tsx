'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, FichaMadre, DocumentoGeneral, DocumentoPlantilla } from '@/services/api';

interface ModalDocumentosFichaProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: FichaMadre | null;
  onSuccessReload?: () => void;
}

interface DocSlotConfig {
  idOrder: number;
  codigo: string;
  nombre: string;
  subtitulo: string;
  keywords: string[];
}

const DOCUMENTOS_OFICIALES: DocSlotConfig[] = [
  {
    idOrder: 1,
    codigo: '01_ficha_cliente_pn',
    nombre: '1. Ficha de Cliente PN',
    subtitulo: 'Datos personales y ficha general del cliente',
    keywords: ['ficha', 'cliente', '01'],
  },
  {
    idOrder: 2,
    codigo: '02_dj_titularidad_flujos',
    nombre: '2. DJ Titularidad y Origen de Flujos',
    subtitulo: 'Declaración jurada de fondos y recursos',
    keywords: ['titularidad', 'flujo', 'flujos', 'origen', 'fondo', 'fondos', '02'],
  },
  {
    idOrder: 3,
    codigo: '03_dj_residencia_fiscal',
    nombre: '3. DJ Residencia Fiscal (FATCA / CRS)',
    subtitulo: 'Declaración de tributación y residencia fiscal',
    keywords: ['residencia', 'fiscal', 'fatca', 'crs', '03'],
  },
  {
    idOrder: 4,
    codigo: '04_formato_beneficiario_final',
    nombre: '4. Formato Beneficiario Final',
    subtitulo: 'Identificación del beneficiario final',
    keywords: ['beneficiario', 'final', '04'],
  },
  {
    idOrder: 5,
    codigo: '05_carta_solicitud_participacion',
    nombre: '5. Carta Solicitud de Participación',
    subtitulo: 'Solicitud formal de incorporación / inversión',
    keywords: ['carta', 'solicitud', 'participacion', '05'],
  },
  {
    idOrder: 6,
    codigo: '06_instruccion_inversion',
    nombre: '6. Instrucción de Inversión',
    subtitulo: 'Instrucción formal de orden de colocación',
    keywords: ['instruccion', 'colocacion', '06'],
  },
  {
    idOrder: 7,
    codigo: '07_declaracion_inversion',
    nombre: '7. Declaración de Inversión',
    subtitulo: 'Declaración de conocimiento y riesgo de inversión',
    keywords: ['declaracion', 'riesgo', '07'],
  },
];

interface SlotItemState {
  slot: DocSlotConfig;
  documento?: DocumentoGeneral;
  plantilla?: DocumentoPlantilla;
}

export function ModalDocumentosFicha({
  isOpen,
  onClose,
  ficha,
  onSuccessReload,
}: ModalDocumentosFichaProps) {
  const [loading, setLoading] = useState(true);
  const [plantillas, setPlantillas] = useState<DocumentoPlantilla[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoGeneral[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Cargar plantillas y documentos existentes del expediente
  const cargarDatos = async () => {
    if (!ficha?.id) return;
    setLoading(true);
    setFeedback(null);
    try {
      const [plantillasData, docsData] = await Promise.all([
        api.obtenerPlantillasDocumento().catch(() => []),
        api.obtenerDocumentosFichaMadre(ficha.id).catch(() => []),
      ]);
      setPlantillas(plantillasData || []);
      setDocumentos(docsData || []);
    } catch (err: any) {
      console.error(err);
      setFeedback({ tipo: 'error', texto: 'No se pudieron cargar los documentos actuales del expediente.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ficha?.id) {
      cargarDatos();
    }
  }, [isOpen, ficha?.id]);

  if (!isOpen || !ficha) return null;

  // Emparejar cada slot con su plantilla y documento subido
  const slotsEstado: SlotItemState[] = DOCUMENTOS_OFICIALES.map((slot) => {
    const plantilla =
      plantillas.find((p) => p.archivo?.toLowerCase().includes(slot.codigo.toLowerCase())) ||
      plantillas.find((p) => slot.keywords.some((kw) => p.nombre?.toLowerCase().includes(kw))) ||
      plantillas[slot.idOrder - 1];

    // Buscar si ya existe un DocumentoGeneral para esta plantilla o código con archivo real en Storage
    const documento = documentos.find((d) => {
      // Solo consideramos subido si tiene ruta de archivo real en Supabase Storage (http/https)
      const esEnStorage = d.rutaArchivo && d.rutaArchivo.startsWith('http');
      if (!esEnStorage) return false;
      if (plantilla?.id && d.documentoPlantillaId === plantilla.id) return true;
      const archivoPlantilla = d.documentoPlantilla?.archivo?.toLowerCase() || '';
      if (archivoPlantilla && archivoPlantilla.includes(slot.codigo)) return true;
      const nombreDoc = (d.nombreArchivo || '').toLowerCase();
      return slot.keywords.some((kw) => nombreDoc.includes(kw));
    });

    return { slot, plantilla, documento };
  });

  const totalSubidos = slotsEstado.filter((item) => !!item.documento).length;
  const porcentaje = Math.round((totalSubidos / 7) * 100);

  // 1. Subida individual a un casillero
  const handleUploadIndividual = async (slotOrder: number, file: File) => {
    const item = slotsEstado.find((s) => s.slot.idOrder === slotOrder);
    if (!item) return;

    setUploadingSlot(slotOrder);
    setFeedback(null);

    try {
      await api.subirDocumentoHistorico(
        ficha.id,
        file,
        item.slot.nombre,
        item.plantilla?.id,
      );

      setFeedback({
        tipo: 'success',
        texto: `Documento "${item.slot.nombre}" subido exitosamente a Supabase Storage.`,
      });

      // Recargar documentos de la ficha para actualizar la vista
      const refreshedDocs = await api.obtenerDocumentosFichaMadre(ficha.id);
      setDocumentos(refreshedDocs || []);
      if (onSuccessReload) onSuccessReload();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        tipo: 'error',
        texto: err.message || `Error al subir documento ${item.slot.nombre}.`,
      });
    } finally {
      setUploadingSlot(null);
    }
  };

  // 2. Multi-drop inteligente: reconoce los archivos por nombre
  const handleBatchFiles = async (files: FileList | File[]) => {
    setBatchUploading(true);
    setFeedback(null);

    let subidosCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();

      // Buscar slot coincidente por palabras clave
      let matched = slotsEstado.find((item) =>
        item.slot.keywords.some((kw) => lowerName.includes(kw)),
      );

      // Si no coincide por nombre, colocar en el primer slot pendiente
      if (!matched) {
        matched = slotsEstado.find((item) => !item.documento);
      }

      if (matched) {
        try {
          await api.subirDocumentoHistorico(
            ficha.id,
            file,
            matched.slot.nombre,
            matched.plantilla?.id,
          );
          subidosCount++;
        } catch (err: any) {
          errors.push(`${file.name}: ${err.message}`);
        }
      } else {
        errors.push(`${file.name}: No se encontró un casillero disponible.`);
      }
    }

    setBatchUploading(false);

    try {
      const refreshedDocs = await api.obtenerDocumentosFichaMadre(ficha.id);
      setDocumentos(refreshedDocs || []);
      if (onSuccessReload) onSuccessReload();
    } catch (err) {
      console.error(err);
    }

    if (errors.length === 0) {
      setFeedback({
        tipo: 'success',
        texto: `Se subieron y asignaron ${subidosCount} documento(s) correctamente.`,
      });
    } else {
      setFeedback({
        tipo: 'error',
        texto: `Se subieron ${subidosCount} archivo(s). Observaciones: ${errors.join('; ')}`,
      });
    }
  };

  const getStatusBadge = (estado: FichaMadre['estado']) => {
    const badges = {
      PENDIENTE: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      EN_PROCESO: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      EN_REVISION: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      COMPLETADA: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      APROBADA: 'bg-green-500/15 border-green-500/40 text-green-400 font-bold',
      RECHAZADA: 'bg-red-500/10 border-red-500/30 text-red-400',
    };
    return badges[estado] || 'bg-neutral-800 border-neutral-700 text-neutral-400';
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#061325] border border-[#162e50] rounded-3xl overflow-hidden shadow-2xl flex flex-col my-6 max-h-[92vh]">
        
        {/* CABECERA DEL MODAL */}
        <div className="px-6 py-4 border-b border-[#162e50]/40 flex items-center justify-between bg-[#0a1c36]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-violet-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Expediente de Documentos
                </h2>
                <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {ficha.codigo}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Digitalización de los 7 formatos oficiales en Supabase Storage para este cliente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#050e1b] border border-[#162e50] hover:bg-[#0a1c36] text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          
          {/* Tarjeta resumen del cliente */}
          <div className="p-4 rounded-2xl bg-[#0a1c36]/40 border border-[#162e50] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs font-mono text-neutral-400">
                {ficha.cliente.persona.tipoDocumento}: <strong className="text-neutral-200">{ficha.cliente.persona.numeroDocumento}</strong>
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {ficha.cliente.persona.nombres} {ficha.cliente.persona.apellidos}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Asesor: <span className="text-neutral-300 font-medium">{ficha.empleado.persona.nombres} {ficha.empleado.persona.apellidos}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ficha.estado)}`}>
                {ficha.estado}
              </span>
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                totalSubidos === 7
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : totalSubidos > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-400'
              }`}>
                <span>{totalSubidos === 7 ? '✓ 7/7 Completo' : `${totalSubidos}/7 Digitalizados`}</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Progreso del expediente ({totalSubidos} de 7)</span>
              <span className="text-blue-400 font-bold">{porcentaje}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#050e1b] border border-[#162e50] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              feedback.tipo === 'success'
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/20 border-red-800/40 text-red-300'
            }`}>
              <span>{feedback.texto}</span>
              <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {/* Zona Multi-Drop Inteligente */}
          <div
            onClick={() => batchInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingBatch(true); }}
            onDragLeave={() => setIsDraggingBatch(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingBatch(false);
              if (e.dataTransfer.files?.length) handleBatchFiles(e.dataTransfer.files);
            }}
            className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              isDraggingBatch
                ? 'border-blue-400 bg-blue-500/15'
                : 'border-[#162e50] hover:border-blue-500/40 bg-[#050e1b]/40'
            }`}
          >
            <input
              ref={batchInputRef}
              type="file"
              multiple
              accept=".pdf, image/*"
              onChange={(e) => e.target.files?.length && handleBatchFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex items-center gap-2 text-xs text-neutral-300 font-semibold">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Haz clic o arrastra aquí varios PDFs para detección automática</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              El sistema identificará por el nombre del archivo a cuál de los 7 casilleros corresponde (ej. ficha, beneficiario, etc.).
            </p>
            {batchUploading && (
              <div className="flex items-center gap-2 text-xs text-blue-400 mt-1 font-semibold animate-pulse">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Subiendo y sincronizando con Supabase Storage...</span>
              </div>
            )}
          </div>

          {/* GRID DE LOS 7 CASILLEROS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Casilleros Oficiales del Expediente
              </span>
              <span className="text-[11px] text-neutral-500">
                Puedes subir los que tengas disponibles, así sea uno solo
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Cargando documentos del expediente...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slotsEstado.map(({ slot, documento }) => {
                  const isUploadingThis = uploadingSlot === slot.idOrder;

                  return (
                    <div
                      key={slot.idOrder}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        documento
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : 'bg-[#050e1b]/60 border-[#162e50] hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{slot.nombre}</h4>
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{slot.subtitulo}</p>
                        </div>

                        {documento ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
                            ✓ Subido
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-400 font-medium">
                            Pendiente
                          </span>
                        )}
                      </div>

                      {/* Acción del casillero */}
                      <div className="pt-2 border-t border-[#162e50]/40 flex items-center justify-between gap-2 text-xs">
                        {documento ? (
                          <>
                            <span className="text-[11px] text-neutral-300 truncate max-w-[170px]" title={documento.nombreArchivo}>
                              📄 {documento.nombreArchivo}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={documento.rutaArchivo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline"
                              >
                                Ver PDF
                              </a>
                              <label className="text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer">
                                Reemplazar
                                <input
                                  type="file"
                                  accept=".pdf, image/*"
                                  onChange={(e) => e.target.files?.[0] && handleUploadIndividual(slot.idOrder, e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-neutral-500">Sin archivo adjunto</span>
                            <label className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isUploadingThis
                                ? 'bg-blue-600/30 border-blue-500 text-blue-300 pointer-events-none'
                                : 'bg-[#0a1c36] hover:bg-blue-600/30 border-[#162e50] hover:border-blue-500/50 text-blue-300'
                            }`}>
                              {isUploadingThis ? (
                                <>
                                  <svg className="animate-spin h-3 w-3 text-blue-300" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Subiendo...</span>
                                </>
                              ) : (
                                <>
                                  <span>Subir PDF</span>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                  </svg>
                                </>
                              )}
                              <input
                                type="file"
                                accept=".pdf, image/*"
                                disabled={isUploadingThis}
                                onChange={(e) => e.target.files?.[0] && handleUploadIndividual(slot.idOrder, e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="px-6 py-4 border-t border-[#162e50]/40 flex items-center justify-end bg-[#0a1c36]/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

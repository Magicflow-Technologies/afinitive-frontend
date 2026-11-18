'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { api, DocumentoPlantilla } from '@/services/api';

export interface ClienteImportado {
  fila: number;
  fichaMadreId: string;
  codigoFicha: string;
  documento: string;
  cliente: string;
}

interface ModalImportacionMasivaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReload: () => void;
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

interface DocSubido {
  plantillaId?: string;
  slotOrder: number;
  nombre: string;
  url: string;
}

export function ModalImportacionMasiva({
  isOpen,
  onClose,
  onSuccessReload,
}: ModalImportacionMasivaProps) {
  // Estado 1: Carga de Excel
  // Estado 2: Asistente secuencial de subida de los 7 documentos opcionales por cliente
  // Estado 3: Resumen final
  const [paso, setPaso] = useState<'excel' | 'asistente_docs' | 'resumen'>('excel');

  // Excel
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plantillas cargadas de la BD
  const [plantillas, setPlantillas] = useState<DocumentoPlantilla[]>([]);

  // Clientes importados
  const [clientesExitosos, setClientesExitosos] = useState<ClienteImportado[]>([]);
  const [erroresFilas, setErroresFilas] = useState<Array<{ fila: number; documento?: string; cliente?: string; motivo: string }>>([]);

  // Asistente secuencial de documentos
  const [clienteIndex, setClienteIndex] = useState(0);
  const [documentosSubidos, setDocumentosSubidos] = useState<Record<string, Record<number, DocSubido>>>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [docUploadFeedback, setDocUploadFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);

  // Cargar plantillas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      api.obtenerPlantillasDocumento()
        .then((data) => setPlantillas(data || []))
        .catch((err) => console.warn('Error al precargar plantillas de documentos:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clienteActual = clientesExitosos[clienteIndex];

  // Mapear plantilla de BD con el slot oficial 1..7
  const findPlantillaForSlot = (slot: DocSlotConfig): DocumentoPlantilla | undefined => {
    return (
      plantillas.find((p) => p.archivo.toLowerCase().includes(slot.codigo.toLowerCase())) ||
      plantillas.find((p) => slot.keywords.some((kw) => p.nombre.toLowerCase().includes(kw))) ||
      plantillas[slot.idOrder - 1]
    );
  };

  // Documentos cargados para el cliente actual
  const docsClienteActual = clienteActual ? (documentosSubidos[clienteActual.fichaMadreId] || {}) : {};
  const totalSubidosCliente = Object.keys(docsClienteActual).length;

  // 1. Manejo del Excel
  const validarYAsignarExcel = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('Por favor selecciona un archivo con extensión .xlsx o .xls');
      return;
    }
    setSelectedFile(file);
    setImportError('');
  };

  const handleUploadExcel = async () => {
    if (!selectedFile) {
      setImportError('Debes seleccionar un archivo Excel para continuar.');
      return;
    }

    setImporting(true);
    setImportError('');

    try {
      const sessionRaw = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;

      if (!session?.persona?.id) {
        throw new Error('No se detectó una sesión activa. Inicia sesión nuevamente.');
      }

      let empleadoIdAUsar = session.persona.id;
      try {
        const empleados = await api.obtenerEmpleados();
        const empleadoLogueado = empleados.find((item) => item.persona?.id === session.persona?.id);
        if (empleadoLogueado) {
          empleadoIdAUsar = empleadoLogueado.id;
        }
      } catch (err) {
        console.warn('No se pudo precargar la lista de empleados:', err);
      }

      const res = await api.importarExcelMasivo(selectedFile, empleadoIdAUsar);

      setClientesExitosos(res.exitosos || []);
      setErroresFilas(res.errores || []);

      if (res.exitosos && res.exitosos.length > 0) {
        setClienteIndex(0);
        setPaso('asistente_docs');
      } else {
        setPaso('resumen');
      }

      onSuccessReload();
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Ocurrió un error inesperado al procesar el archivo Excel.');
    } finally {
      setImporting(false);
    }
  };

  // 2. Subida de documento a un slot específico
  const handleUploadToSlot = async (slotOrder: number, file: File) => {
    if (!clienteActual) return;

    const slotConfig = DOCUMENTOS_OFICIALES.find((s) => s.idOrder === slotOrder);
    if (!slotConfig) return;

    const matchedPlantilla = findPlantillaForSlot(slotConfig);

    setUploadingSlot(slotOrder);
    setDocUploadFeedback(null);

    try {
      const docCreado = await api.subirDocumentoHistorico(
        clienteActual.fichaMadreId,
        file,
        slotConfig.nombre,
        matchedPlantilla?.id,
      );

      setDocumentosSubidos((prev) => {
        const actual = prev[clienteActual.fichaMadreId] || {};
        return {
          ...prev,
          [clienteActual.fichaMadreId]: {
            ...actual,
            [slotOrder]: {
              plantillaId: matchedPlantilla?.id,
              slotOrder,
              nombre: file.name,
              url: docCreado.rutaArchivo,
            },
          },
        };
      });

      setDocUploadFeedback({
        tipo: 'success',
        texto: `Documento "${slotConfig.nombre}" subido exitosamente a Supabase Storage.`,
      });
      onSuccessReload();
    } catch (err: any) {
      console.error(err);
      setDocUploadFeedback({
        tipo: 'error',
        texto: err.message || `Error al subir documento ${slotConfig.nombre}.`,
      });
    } finally {
      setUploadingSlot(null);
    }
  };

  // 3. Multi-drop inteligente: reconoce los archivos por nombre
  const handleBatchFiles = async (files: FileList | File[]) => {
    if (!clienteActual) return;
    setBatchUploading(true);
    setDocUploadFeedback(null);

    let subidosCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();

      // Buscar a cuál de los 7 slots se parece más por keywords
      let matchedSlot = DOCUMENTOS_OFICIALES.find((slot) =>
        slot.keywords.some((kw) => lowerName.includes(kw))
      );

      // Si no coincidió con ninguno por palabras clave, buscar el primer slot aún vacío
      if (!matchedSlot) {
        const slotsUsados = Object.keys(documentosSubidos[clienteActual.fichaMadreId] || {}).map(Number);
        matchedSlot = DOCUMENTOS_OFICIALES.find((s) => !slotsUsados.includes(s.idOrder));
      }

      if (matchedSlot) {
        try {
          const matchedPlantilla = findPlantillaForSlot(matchedSlot);
          const docCreado = await api.subirDocumentoHistorico(
            clienteActual.fichaMadreId,
            file,
            matchedSlot.nombre,
            matchedPlantilla?.id,
          );

          setDocumentosSubidos((prev) => {
            const actual = prev[clienteActual.fichaMadreId] || {};
            return {
              ...prev,
              [clienteActual.fichaMadreId]: {
                ...actual,
                [matchedSlot!.idOrder]: {
                  plantillaId: matchedPlantilla?.id,
                  slotOrder: matchedSlot!.idOrder,
                  nombre: file.name,
                  url: docCreado.rutaArchivo,
                },
              },
            };
          });

          subidosCount++;
        } catch (err: any) {
          errors.push(`${file.name}: ${err.message}`);
        }
      } else {
        errors.push(`${file.name}: No se pudo determinar el casillero.`);
      }
    }

    setBatchUploading(false);
    onSuccessReload();

    if (errors.length === 0) {
      setDocUploadFeedback({
        tipo: 'success',
        texto: `Se subieron y asignaron ${subidosCount} documento(s) correctamente.`,
      });
    } else {
      setDocUploadFeedback({
        tipo: 'error',
        texto: `Se subieron ${subidosCount} archivo(s). Observaciones: ${errors.join('; ')}`,
      });
    }
  };

  // 4. Navegación entre clientes
  const handleSiguienteCliente = () => {
    if (clienteIndex < clientesExitosos.length - 1) {
      setClienteIndex((prev) => prev + 1);
      setDocUploadFeedback(null);
    } else {
      setPaso('resumen');
    }
  };

  const handleAnteriorCliente = () => {
    if (clienteIndex > 0) {
      setClienteIndex((prev) => prev - 1);
      setDocUploadFeedback(null);
    }
  };

  const handleCerrarTodo = () => {
    setSelectedFile(null);
    setImportError('');
    setPaso('excel');
    setClientesExitosos([]);
    setErroresFilas([]);
    setClienteIndex(0);
    setDocumentosSubidos({});
    setDocUploadFeedback(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-[#e7ebf1] rounded-3xl overflow-hidden shadow-2xl flex flex-col my-6 max-h-[92vh]">
        
        {/* CABECERA DEL MODAL */}
        <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#caa344]/10 border border-[#caa344]/20 flex items-center justify-center text-[#caa344]">
              {paso === 'excel' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : paso === 'asistente_docs' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#10233f] tracking-tight">
                {paso === 'excel'
                  ? 'Importar Fichas Masivas por Excel'
                  : paso === 'asistente_docs'
                  ? 'Digitalización de Documentos por Cliente'
                  : 'Resumen de la Importación'}
              </h2>
              <p className="text-xs text-[#8d9aae]">
                {paso === 'excel'
                  ? 'Carga masiva de expedientes y generación correlativa FM-2026-XXXXXX.'
                  : paso === 'asistente_docs'
                  ? `Cliente ${clienteIndex + 1} de ${clientesExitosos.length} — Carga los documentos que tenga disponibles (los 7 o solo algunos)`
                  : 'Proceso completado exitosamente.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCerrarTodo}
            className="p-2 rounded-xl bg-white border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#8d9aae] hover:text-[#10233f] transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-white">

          {/* ======================================================== */}
          {/* PASO 1: CARGA DE ARCHIVO EXCEL                           */}
          {/* ======================================================== */}
          {paso === 'excel' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                onDragLeave={() => setIsDraggingExcel(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExcel(false);
                  if (e.dataTransfer.files?.[0]) validarYAsignarExcel(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDraggingExcel
                    ? 'border-[#caa344] bg-[#caa344]/10 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-[#e7ebf1] hover:border-[#caa344]/60 bg-[#f7f8fb] hover:bg-[#f7f8fb]/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => e.target.files?.[0] && validarYAsignarExcel(e.target.files[0])}
                  className="hidden"
                />

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-[#caa344]/15 text-[#caa344]'
                }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {selectedFile ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      ✓ Archivo seleccionado
                    </span>
                    <p className="text-sm font-bold text-[#10233f] mt-2 font-mono">{selectedFile.name}</p>
                    <p className="text-xs text-[#8d9aae]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <span className="text-[11px] text-[#caa344] hover:text-[#b8923a] underline underline-offset-2 mt-2 block">
                      Haz clic si deseas cambiar de archivo
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-[#10233f]">Haz clic aquí o arrastra tu archivo Excel</p>
                    <p className="text-xs text-[#8d9aae] mt-1">Formatos admitidos: .xlsx o .xls</p>
                    <p className="text-[11px] text-[#8d9aae] mt-3 max-w-sm mx-auto">
                      El archivo registrará a los clientes y luego podrás subir los documentos firmados que tenga cada uno.
                    </p>
                  </div>
                )}
              </div>

              {importError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCerrarTodo}
                  disabled={importing}
                  className="px-5 py-2.5 rounded-xl border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#17233a] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUploadExcel}
                  disabled={!selectedFile || importing}
                  className="px-6 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Procesando filas de Excel...</span>
                    </>
                  ) : (
                    <>
                      <span>Importar Clientes</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: ASISTENTE DE DIGITALIZACIÓN (7 CASILLEROS)        */}
          {/* ======================================================== */}
          {paso === 'asistente_docs' && clienteActual && (
            <div className="space-y-6">
              
              {/* Barra de progreso de clientes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8d9aae]">
                    Cliente {clienteIndex + 1} de {clientesExitosos.length}
                  </span>
                  <span className="text-[#caa344] font-bold">
                    {Math.round(((clienteIndex + 1) / clientesExitosos.length) * 100)}% de clientes recorridos
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#e7ebf1] overflow-hidden">
                  <div
                    className="h-full bg-[#caa344] transition-all duration-300"
                    style={{ width: `${((clienteIndex + 1) / clientesExitosos.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Ficha resumen del cliente actual */}
              <div className="p-4 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1] flex items-center justify-between gap-4 flex-wrap shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#caa344] bg-[#caa344]/10 border border-[#caa344]/20 px-2.5 py-0.5 rounded-md">
                      {clienteActual.codigoFicha}
                    </span>
                    <span className="text-xs font-mono text-[#8d9aae]">
                      Doc: <strong className="text-[#17233a]">{clienteActual.documento}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#10233f] mt-1">{clienteActual.cliente}</h3>
                </div>

                {/* Badge de documentos subidos de este cliente */}
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    totalSubidosCliente === 7
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : totalSubidosCliente > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-[#e7ebf1] text-[#8d9aae]'
                  }`}>
                    <span>
                      {totalSubidosCliente === 7
                        ? '✓ Legajo Completo (7/7)'
                        : totalSubidosCliente > 0
                        ? `Parcial (${totalSubidosCliente}/7 documentos)`
                        : 'Sin documentos aún (0/7)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensajes de feedback */}
              {docUploadFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
                  docUploadFeedback.tipo === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span>{docUploadFeedback.texto}</span>
                  <button onClick={() => setDocUploadFeedback(null)} className="text-[#8d9aae] hover:text-[#17233a] cursor-pointer">✕</button>
                </div>
              )}

              {/* Zona Multi-Drop inteligente opcional */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingBatch(true); }}
                onDragLeave={() => setIsDraggingBatch(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingBatch(false);
                  if (e.dataTransfer.files?.[0]) handleBatchFiles(e.dataTransfer.files);
                }}
                className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                  isDraggingBatch
                    ? 'border-[#caa344] bg-[#caa344]/10'
                    : 'border-[#e7ebf1] hover:border-[#caa344]/60 bg-[#f7f8fb]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-[#17233a] font-semibold">
                  <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>¿Tienes varios archivos del cliente? Arrástralos todos aquí juntos</span>
                </div>
                <p className="text-[11px] text-[#8d9aae]">
                  El sistema detectará automáticamente cada documento por su nombre (ej. ficha, beneficiario, etc.) y lo colocará en su respectiva ranura.
                </p>
                {batchUploading && (
                  <div className="flex items-center gap-2 text-xs text-[#caa344] mt-1 font-semibold animate-pulse">
                    <svg className="animate-spin h-3.5 w-3.5 text-[#caa344]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Subiendo y clasificando archivos a Supabase Storage...</span>
                  </div>
                )}
              </div>

              {/* GRID DE LAS 7 RANURAS INDIVIDUALES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17233a] uppercase tracking-wider">
                    Casilleros Oficiales (7 Documentos)
                  </span>
                  <span className="text-[11px] text-[#8d9aae]">
                    Solo sube los que tengas disponibles, no es obligatorio tener todos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOCUMENTOS_OFICIALES.map((slot) => {
                    const docSubido = docsClienteActual[slot.idOrder];
                    const isUploadingThis = uploadingSlot === slot.idOrder;

                    return (
                      <div
                        key={slot.idOrder}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                          docSubido
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-white border-[#e7ebf1] hover:border-[#caa344]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#10233f] truncate">{slot.nombre}</h4>
                            <p className="text-[11px] text-[#8d9aae] line-clamp-1 mt-0.5">{slot.subtitulo}</p>
                          </div>

                          {docSubido ? (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                              ✓ Subido
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#f7f8fb] border border-[#e7ebf1] text-[10px] text-[#8d9aae] font-medium">
                              Pendiente
                            </span>
                          )}
                        </div>

                        {/* Estado o acción */}
                        <div className="pt-2 border-t border-[#e7ebf1] flex items-center justify-between gap-2 text-xs">
                          {docSubido ? (
                            <>
                              <span className="text-[11px] text-[#17233a] truncate max-w-[170px]" title={docSubido.nombre}>
                                📄 {docSubido.nombre}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={docSubido.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#caa344] hover:text-[#b8923a] font-semibold underline"
                                >
                                  Ver PDF
                                </a>
                                <label className="text-[11px] text-[#8d9aae] hover:text-[#17233a] cursor-pointer">
                                  Cambiar
                                  <input
                                    type="file"
                                    accept=".pdf, image/*"
                                    onChange={(e) => e.target.files?.[0] && handleUploadToSlot(slot.idOrder, e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] text-[#8d9aae]">Sin archivo adjunto</span>
                              <label className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                isUploadingThis
                                  ? 'bg-[#caa344]/20 border-[#caa344] text-[#caa344] pointer-events-none'
                                  : 'bg-white hover:bg-[#f7f8fb] border-[#e7ebf1] hover:border-[#caa344] text-[#caa344]'
                              }`}>
                                {isUploadingThis ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3 text-[#caa344]" fill="none" viewBox="0 0 24 24">
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
                                  onChange={(e) => e.target.files?.[0] && handleUploadToSlot(slot.idOrder, e.target.files[0])}
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
              </div>

              {/* Botones de navegación del asistente */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={handleAnteriorCliente}
                  disabled={clienteIndex === 0}
                  className="px-4 py-2 rounded-xl border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
                >
                  ← Cliente anterior
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaso('resumen')}
                    className="px-4 py-2 rounded-xl border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Finalizar y ver resumen
                  </button>
                  <button
                    type="button"
                    onClick={handleSiguienteCliente}
                    className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    {clienteIndex === clientesExitosos.length - 1 ? 'Finalizar todo →' : 'Siguiente cliente →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: RESUMEN FINAL                                    */}
          {/* ======================================================== */}
          {paso === 'resumen' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#10233f] tracking-tight">¡Proceso de Carga Completado!</h3>
                <p className="text-xs text-[#8d9aae] mt-1">
                  Se importaron {clientesExitosos.length} clientes. Cada expediente quedó registrado con los documentos que subiste.
                </p>
              </div>

              {/* Lista resumen de clientes y sus documentos */}
              {clientesExitosos.length > 0 && (
                <div className="text-left bg-[#f7f8fb] border border-[#e7ebf1] rounded-2xl p-4 space-y-2 max-h-56 overflow-y-auto shadow-xs">
                  <span className="text-xs font-bold text-[#10233f] block mb-2">
                    Detalle de Expedientes y Documentación:
                  </span>
                  {clientesExitosos.map((cli) => {
                    const count = Object.keys(documentosSubidos[cli.fichaMadreId] || {}).length;
                    return (
                      <div key={cli.fichaMadreId} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#e7ebf1] text-xs">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#caa344] mr-2">{cli.codigoFicha}</span>
                          <span className="text-[#10233f] font-medium">{cli.cliente}</span>
                          <span className="text-[#8d9aae] font-mono text-[11px] ml-2">({cli.documento})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          count === 7
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : count > 0
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {count === 7 ? '7/7 Completo' : count > 0 ? `${count}/7 documentos` : 'Sin docs'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Errores reportados si los hubo */}
              {erroresFilas.length > 0 && (
                <div className="text-left bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-red-700 block">
                    Filas con observaciones ({erroresFilas.length}):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {erroresFilas.map((err, i) => (
                      <p key={i} className="text-[11px] text-red-600 font-mono">
                        Fila #{err.fila}: {err.motivo}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCerrarTodo}
                className="w-full py-3 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
              >
                Volver a la lista de expedientes
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

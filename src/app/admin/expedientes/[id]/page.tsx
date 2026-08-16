'use client';

import React, { useEffect, useState, use } from 'react';
import { api, FichaMadre, TokenAcceso, DocumentoGeneral } from '@/services/api';
import Link from 'next/link';
import { FichaMadreWizard } from '@/components/FichaMadreWizard';
import type { FichaMadreResponse } from '@/lib/ficha-madre.types';

const TEMPLATE_DISPLAY_ORDER: Record<string, number> = {
  '01_ficha_cliente_pn.hbs': 1,
  '02_dj_titularidad_flujos.hbs': 2,
  '03_dj_residencia_fiscal.hbs': 3,
  '04_formato_beneficiario_final.hbs': 4,
  '05_carta_solicitud_participacion.hbs': 5,
  '06_instruccion_inversion.hbs': 6,
  '07_declaracion_inversion.hbs': 7,
  '01_carta_solicitud_participacion.hbs': 5,
  '03_formato_beneficiario_final.hbs': 4,
  '04_dj_residencia_fiscal.hbs': 3,
  '05_ficha_cliente_pn.hbs': 1,
};

const getDocumentoTemplateOrder = (archivo?: string | null) => {
  if (!archivo) {
    return Number.MAX_SAFE_INTEGER;
  }

  return TEMPLATE_DISPLAY_ORDER[archivo] ?? Number.MAX_SAFE_INTEGER;
};

export default function ExpedienteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [base, setBase] = useState<FichaMadre | null>(null);
  const [perfil, setPerfil] = useState<FichaMadreResponse | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingDocs, setCompletingDocs] = useState(false);
  const [tokens, setTokens] = useState<TokenAcceso[]>([]);
  const [tokenEmail, setTokenEmail] = useState('');
  const [firmaDocumentosCantidad, setFirmaDocumentosCantidad] = useState<2 | 5 | 7>(5);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const sessionRaw = localStorage.getItem('userSession');
      return sessionRaw ? (JSON.parse(sessionRaw)?.rol ?? '') : '';
    } catch {
      return '';
    }
  });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [autocompleteConfirmOpen, setAutocompleteConfirmOpen] = useState(false);

  // Previsualización de documento
  const [previewDoc, setPreviewDoc] = useState<DocumentoGeneral | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const tieneDocumentos = documentos.length > 0;
  const enlaceEsDeFirma = tieneDocumentos;
  const enlaceTitulo = enlaceEsDeFirma ? '0. Enlace de firma del cliente' : '0. Enlace de acceso al cliente';
  const enlaceDescripcion = enlaceEsDeFirma
    ? 'Genera y supervisa un nuevo enlace seguro para que el cliente retome la revisión y firme los documentos sin volver a llenar la ficha.'
    : 'Genera y supervisa el token que el cliente usará para completar su formulario sin registrarse.';

  const pushNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice((current) => (current?.message === message ? null : current)), 4200);
  };

  const loadExpediente = async () => {
    try {
      const [lista, perfilData, docs] = await Promise.all([
        api.obtenerFichasMadre(),
        api.obtenerFichaMadre(id),
        api.obtenerDocumentosFichaMadre(id),
      ]);
      setBase(lista.find((f) => f.id === id) ?? null);
      setPerfil(perfilData);
      setDocumentos(docs);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la información del expediente.');
    } finally {
      setLoading(false);
    }
  };

  const loadTokens = async () => {
    try {
      const allTokens = await api.obtenerTokensAcceso();
      setTokens(allTokens.filter((token) => token.fichaMadreId === id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpediente();
    loadTokens();
  }, [id]);

  const runAutocomplete = async () => {
    setCompletingDocs(true);
    setAutocompleteConfirmOpen(false);
    try {
      await api.autocompletarFormatos(id);
      pushNotice('success', 'Los 7 formatos fueron actualizados con la información de la Ficha Madre.');
      const docs = await api.obtenerDocumentosFichaMadre(id);
      setDocumentos(docs);
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible actualizar los formatos.');
    } finally {
      setCompletingDocs(false);
    }
  };

  const handleAutocomplete = async () => {
    await runAutocomplete();
  };

  const handleDownloadPdf = async () => {
    if (!base) return;

    setDownloadingPdf(true);
    try {
      const blob = await api.descargarPdfFormatos(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${base.codigo}_formatos_01_05.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible descargar el PDF consolidado.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePreviewDoc = async (doc: DocumentoGeneral) => {
    setPreviewDoc(doc);
    setPreviewHtml('');
    setLoadingPreview(true);
    try {
      const preview = await api.obtenerDocumentoPreview(doc.id);
      setPreviewHtml(preview.html);
    } catch (err: any) {
      console.error(err);
      setPreviewHtml(`<div class="p-8 text-red-500 font-bold text-center">${err.message || 'Error al cargar la previsualización.'}</div>`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUpdateFichaEstado = async (nuevoEstado: FichaMadre['estado']) => {
    try {
      await api.actualizarEstadoFichaMadre(id, nuevoEstado);
      pushNotice('success', `Estado del expediente actualizado a ${nuevoEstado}.`);
      const lista = await api.obtenerFichasMadre();
      setBase(lista.find((f) => f.id === id) ?? null);
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible actualizar el estado del expediente.');
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    setTokenMessage('');
    if (!tokenEmail.trim()) {
      setTokenMessage('Debes indicar el correo destino para generar el enlace.');
      return;
    }

    setGeneratingToken(true);
    try {
      await api.crearTokenAcceso({
        fichaMadreId: id,
        emailDestino: tokenEmail.trim(),
        documentosFirmaCantidad: firmaDocumentosCantidad,
      });
      await loadTokens();
      setTokenEmail('');
      setTokenMessage(enlaceEsDeFirma ? 'Enlace de firma generado correctamente.' : 'Enlace de acceso generado correctamente.');
    } catch (err: any) {
      console.error(err);
      setTokenMessage(err.message || 'No fue posible generar el enlace.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyTokenLink = async (token: string) => {
    const link = `${window.location.origin}/onboarding/${token}`;
    await navigator.clipboard.writeText(link);
    pushNotice('success', 'Enlace copiado al portapapeles.');
  };

  const handleOpenEmail = (emailDestino: string, token: string) => {
    const link = `${origin}/onboarding/${token}`;
    const subject = encodeURIComponent(`Acceso seguro Afinitive - ${base?.codigo ?? ''}`);
    const body = encodeURIComponent(
      `Hola,\n\nTe compartimos tu enlace seguro para ${enlaceEsDeFirma ? 'continuar con la revisión y firma de tus documentos' : 'completar tu formulario de Afinitive'}:\n${link}\n\nEste enlace es personal y de uso limitado.\n`,
    );
    window.open(`mailto:${emailDestino}?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWhatsApp = (telefono: string | undefined, token: string) => {
    if (!telefono) {
      pushNotice('info', 'El cliente no tiene teléfono registrado.');
      return;
    }

    const link = `${origin}/onboarding/${token}`;
    const normalizedPhone = telefono.replace(/[^\d]/g, '');
    const message = encodeURIComponent(
      `Hola, te compartimos tu enlace seguro para ${enlaceEsDeFirma ? 'continuar con la revisión y firma de tus documentos' : 'completar tu formulario de Afinitive'}:\n${link}`,
    );
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await api.revocarTokenAcceso(tokenId);
      pushNotice('success', 'El enlace fue cerrado correctamente.');
      await loadTokens();
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible cerrar el enlace.');
    }
  };

  const handleReactivateToken = async (tokenId: string) => {
    try {
      await api.reactivarTokenAcceso(tokenId);
      pushNotice('success', 'El enlace fue reactivado correctamente.');
      await loadTokens();
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible reactivar el enlace.');
    }
  };

  const getDocumentProgress = (estado: DocumentoGeneral['estado']) => {
    switch (estado) {
      case 'PENDIENTE':
        return 15;
      case 'GENERADO':
        return 45;
      case 'PENDIENTE_FIRMA':
        return 70;
      case 'PARCIAL_FIRMADO':
        return 85;
      case 'FIRMADO':
        return 100;
      case 'ANULADO':
        return 0;
      default:
        return 0;
    }
  };

  const canRegenerate = ['admin', 'analista'].includes(userRole);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-neutral-400">Cargando expediente...</span>
      </div>
    );
  }

  if (error || !base) {
    return <div className="p-8 text-red-400 font-bold text-center">{error || 'Expediente no encontrado.'}</div>;
  }

  const documentosOrdenados = [...documentos]
    .map((doc, index) => ({ doc, index }))
    .sort((a, b) => {
      const orderDiff =
        getDocumentoTemplateOrder(a.doc.documentoPlantilla?.archivo) -
        getDocumentoTemplateOrder(b.doc.documentoPlantilla?.archivo);

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return a.index - b.index;
    })
    .map(({ doc }) => doc);
  const getTokenPackageLabel = (cantidad?: number) => `${cantidad ?? 5} documento${(cantidad ?? 5) === 1 ? '' : 's'}`;
  const getTokenStatusLabel = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') return 'Cerrado';
    if (token.estado === 'EXPIRADO') return 'Vencido';
    if (token.estado === 'USADO') return enlaceEsDeFirma ? 'Listo para firma' : 'Activo';
    return enlaceEsDeFirma ? 'Listo para firma' : 'Activo';
  };

  const getTokenStatusStyles = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') {
      return 'bg-red-500/10 border-red-500/30 text-red-300';
    }
    if (token.estado === 'EXPIRADO') {
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    }
    if (enlaceEsDeFirma) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    }
    return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
  };

  const getTokenStatusSubtitle = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') return 'Acceso cerrado por el analista.';
    if (token.estado === 'EXPIRADO') return 'El enlace venció y debe renovarse.';
    if (enlaceEsDeFirma) return 'Puede firmar los documentos pendientes.';
    return 'Puede completar la ficha y continuar.';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-full overflow-hidden -m-8 p-8">
      {notice && (
        <div
          className={`fixed top-4 right-4 z-[60] w-full max-w-md rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${notice.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100'
            : notice.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-100'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-100'
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold opacity-80 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 1. HEADER COCKPIT - TOTALMENTE ESTÁTICO / FIJO ARRIBA (NO SCROLLEA) */}
      <div className="shrink-0 pb-5 mb-4 border-b border-[#162e50]/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/expedientes"
              className="p-2 rounded-xl bg-[#0a1c36]/60 border border-[#162e50] hover:bg-[#0a1c36] text-neutral-300 hover:text-white transition-all shadow-sm"
              title="Volver a lista de expedientes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </Link>
            <div>
              <span className="text-xs font-mono font-extrabold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                {base.codigo}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-1">
                {base.cliente.persona.nombres} {base.cliente.persona.apellidos}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pl-11">
            <span>Doc: <strong className="text-neutral-200">{base.cliente.persona.tipoDocumento} - {base.cliente.persona.numeroDocumento}</strong></span>
            <span>•</span>
            <span>Asesor: <strong className="text-neutral-200">{base.empleado.persona.nombres} {base.empleado.persona.apellidos}</strong></span>
          </div>
        </div>

        {/* Estado y Selector de Expediente */}
        <div className="flex items-center gap-3 self-start md:self-auto pl-11 md:pl-0">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Estado:</span>
          <select
            value={base.estado}
            onChange={(e) => handleUpdateFichaEstado(e.target.value as any)}
            className="px-3.5 py-2 bg-[#0a192f] border border-[#1b355a] rounded-xl text-xs font-bold text-white shadow-md focus:outline-none focus:border-blue-500 transition-all cursor-pointer [&_option]:bg-[#0a192f] [&_option]:text-white"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN_PROCESO">EN PROCESO</option>
            <option value="EN_REVISION">EN REVISIÓN</option>
            <option value="APROBADA">APROBADO</option>
            <option value="RECHAZADA">RECHAZADO</option>
          </select>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL: ÚNICA ZONA QUE SCROLLEA */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* COLUMNA IZQUIERDA: FICHA MADRE (WIZARD) - ANCHOR LG 7 */}
          <div className="lg:col-span-7 min-w-0 space-y-6">
            <div className="backdrop-blur-md bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-3xl p-6 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">1. Ficha Madre del Inversionista</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Completa y verifica los 7 pasos de la Ficha Madre para recopilar los datos de la autocompletación de formatos.
                </p>
              </div>
              <FichaMadreWizard
                fichaMadreId={id}
                initial={perfil?.fichaMadre?.inversionista}
                onSaved={(respuesta) => setPerfil(respuesta)}
              />
            </div>
          </div>

          {/* COLUMNA DERECHA: EXPEDIENTE Y ACCIONES - ANCHOR LG 5 */}
          <div className="lg:col-span-5 w-full min-w-0 space-y-6">

            {/* Listado de Documentos Generados */}
            <div className="backdrop-blur-md bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">2. Expediente de Firmas</h3>
                <p className="text-xs text-neutral-400 mt-1">Formatos listados en el expediente de inversiones.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!tieneDocumentos || documentos.length < 5 || downloadingPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0a1c36] border border-[#162e50] text-xs font-semibold text-white hover:bg-[#0d2140] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14"></path>
                  </svg>
                  {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF 01-05'}
                </button>

                {canRegenerate ? (
                  <button
                    type="button"
                    onClick={handleAutocomplete}
                    disabled={completingDocs}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-14"></path>
                    </svg>
                    {completingDocs ? 'Regenerando...' : 'Generar de nuevo'}
                  </button>
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-[#050e1b] border border-[#162e50] text-xs text-neutral-500 flex items-center">
                    Solo admin o analista pueden regenerar formatos.
                  </div>
                )}
              </div>

              {!tieneDocumentos ? (
                <div className="text-center py-10 border border-dashed border-[#162e50]/40 rounded-2xl text-neutral-500 text-xs">
                  No hay formatos generados en este expediente. Completa la Ficha Madre y usa el botón de relleno para crearlos.
                </div>
              ) : (
                <div className="space-y-3">
                  {documentosOrdenados.map((doc, index) => {
                    const firma = doc.firmas?.[0];
                    const esFirmado = firma?.estado === 'FIRMADO';
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-3 p-3 bg-[#0a1c36]/25 border border-[#162e50]/30 rounded-2xl hover:border-blue-500/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="block text-[10px] text-neutral-500 font-mono font-semibold">
                            FORMATO {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="block text-xs font-semibold text-white truncate" title={doc.nombreArchivo}>
                            {doc.nombreArchivo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {esFirmado ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase">
                              Firmado
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-[9px] font-bold uppercase">
                              Pendiente
                            </span>
                          )}

                          <button
                            onClick={() => handlePreviewDoc(doc)}
                            className="p-1.5 rounded-lg bg-[#050e1b] border border-[#162e50] hover:bg-[#0a1c36] text-blue-400 hover:text-blue-300 transition-all"
                            title="Previsualizar formato"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                            <span>Progreso del formato</span>
                            <span>{getDocumentProgress(doc.estado)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#050e1b] border border-[#162e50]/50 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${esFirmado ? 'bg-emerald-400' : 'bg-blue-500'}`}
                              style={{ width: `${getDocumentProgress(doc.estado)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="backdrop-blur-md bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{enlaceTitulo}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{enlaceDescripcion}</p>
              </div>

              <form onSubmit={handleGenerateToken} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                    Paquete de firma
                  </label>
                  <select
                    value={firmaDocumentosCantidad}
                    onChange={(e) => setFirmaDocumentosCantidad(Number(e.target.value) as 2 | 5 | 7)}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={2}>2 documentos</option>
                    <option value={5}>5 documentos</option>
                    <option value={7}>7 documentos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                    Correo destino
                  </label>
                  <input
                    type="email"
                    value={tokenEmail}
                    onChange={(e) => setTokenEmail(e.target.value)}
                    placeholder={base.cliente.persona.correo}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {tokenMessage && (
                  <div className="text-xs text-neutral-300 bg-[#050e1b] border border-[#162e50] rounded-xl px-4 py-3">
                    {tokenMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={generatingToken}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {generatingToken
                    ? enlaceEsDeFirma
                      ? 'Generando enlace de firma...'
                      : 'Generando enlace...'
                    : enlaceEsDeFirma
                      ? 'Generar enlace de firma'
                      : 'Generar enlace'}
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tokens registrados</h4>
                {tokens.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    Aún no se ha generado ningún enlace para este expediente. Si el cliente ya terminó la ficha, puedes reenviar uno nuevo para la firma.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tokens.map((token) => (
                      <div key={token.id} className="rounded-2xl border border-[#162e50]/50 bg-[#050e1b] p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getTokenStatusStyles(token)}`}
                            >
                              {getTokenStatusLabel(token)}
                            </span>
                            <p className="text-[10px] text-neutral-500 leading-tight max-w-[220px]">
                              {getTokenStatusSubtitle(token)}
                            </p>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono self-start">
                            Vence: {new Date(token.expiraEn).toLocaleString('es-PE')}
                          </span>
                        </div>

                        <div className="text-[10px] text-neutral-500 font-mono">
                          Paquete: {getTokenPackageLabel(token.documentosFirmaCantidad)}
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate text-[10px] text-neutral-400 bg-[#061325] border border-[#162e50] rounded-lg px-2 py-1">
                            {`${origin}/onboarding/${token.token}`}
                          </code>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTokenLink(token.token)}
                            className="px-3 py-2 rounded-lg bg-[#0a1c36] border border-[#162e50] text-[10px] font-semibold text-white hover:bg-[#0d2140] transition-all"
                          >
                            Copiar enlace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(token.emailDestino, token.token)}
                            className="px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30 text-[10px] font-semibold text-blue-300 hover:bg-blue-600/20 transition-all"
                          >
                            Enviar por correo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(base.cliente.persona.telefono, token.token)}
                            className="px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/20 transition-all"
                          >
                            Enviar por WhatsApp
                          </button>
                        </div>

                        {token.estado !== 'ACTIVO' ? (
                          <button
                            type="button"
                            onClick={() => handleReactivateToken(token.id)}
                            className="w-full px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/20 transition-all"
                          >
                            Reactivar enlace
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeToken(token.id)}
                            className="w-full px-3 py-2 rounded-lg bg-red-600/10 border border-red-500/30 text-[10px] font-semibold text-red-300 hover:bg-red-600/20 transition-all"
                          >
                            Cerrar enlace
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta de Autocompletado */}
            <div className="backdrop-blur-md bg-gradient-to-br from-[#0c2447]/60 to-[#061325]/80 border border-[#1d3f6d] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500" />
              <h3 className="text-lg font-bold text-white">4. Rellenar formatos</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Una vez rellenada la Ficha Madre, ejecuta la autocompletación inteligente. El sistema compilará los 7 formatos Handlebars precargados listos para su lectura y firma.
              </p>
              <div className="pt-5">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-xs text-blue-200">
                  La generación de formatos se gestiona desde la sección de expediente de firmas.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* FIN DE ZONA CON SCROLL */}

        {/* 3. MODAL DE PREVISUALIZACIÓN DE DOCUMENTO (PREMIUM A4 SIMULATOR) */}
        {previewDoc && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[90vh] bg-[#050e1b] border border-[#162e50] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
              {/* Header Modal */}
              <div className="px-6 py-4 border-b border-[#162e50]/40 flex items-center justify-between bg-[#061325]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 font-mono">
                    Previsualización de Documento
                  </span>
                  <h3 className="text-base font-bold text-white truncate max-w-lg">{previewDoc.nombreArchivo}</h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Contenido A4 Scrollable */}
              <div className="flex-1 overflow-y-auto bg-neutral-900 p-8 flex justify-center">
                {loadingPreview ? (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xs">Compilando y cargando el documento...</p>
                  </div>
                ) : (
                  <div className="shadow-2xl border border-neutral-300 rounded-sm">
                    {/* Se inyecta el HTML procesado directamente dentro de una caja con estilos aislados */}
                    <iframe
                      srcDoc={previewHtml}
                      title="Doc Preview"
                      className="w-[210mm] h-[297mm] bg-white border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 border-t border-[#162e50]/40 flex justify-end gap-3 bg-[#061325]">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wide transition-all"
                >
                  Cerrar Previsualización
                </button>
              </div>
            </div>
          </div>
        )}

        {autocompleteConfirmOpen && (
          <div className="fixed inset-0 z-[70] bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl border border-[#162e50] bg-[#061325] shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.5A1.5 1.5 0 003.19 20h17.62a1.5 1.5 0 001.3-2.14l-8.4-14.5a1.5 1.5 0 00-2.6 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">Actualizar formatos</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Aún hay formularios de la Ficha Madre pendientes. Si continúas, algunos datos de los formatos pueden quedar vacíos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setAutocompleteConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#162e50] text-neutral-300 hover:text-white hover:bg-[#0a1c36] transition-all text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={runAutocomplete}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition-all"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}
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
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
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

  const [previewDoc, setPreviewDoc] = useState<DocumentoGeneral | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
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
      const pendingIds = docs
        .filter((d) => d.estado !== 'FIRMADO' && (!d.firmas || d.firmas.some((f) => f.estado !== 'FIRMADO')))
        .map((d) => d.id);
      setSelectedDocIds((prev) => (prev.length === 0 ? pendingIds : prev));
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la información del expediente.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDocSelect = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
  };

  const handleSelectAllPending = () => {
    const pendingIds = documentos
      .filter((d) => d.estado !== 'FIRMADO' && (!d.firmas || d.firmas.some((f) => f.estado !== 'FIRMADO')))
      .map((d) => d.id);
    setSelectedDocIds(pendingIds);
  };

  const handleDeselectAll = () => {
    setSelectedDocIds([]);
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
    setUpdatingEstado(true);
    try {
      await api.actualizarEstadoFichaMadre(id, nuevoEstado);
      const estadoEtiqueta = nuevoEstado === 'APROBADA' ? 'Aprobado' : nuevoEstado === 'RECHAZADA' ? 'Rechazado' : nuevoEstado;
      pushNotice('success', `El expediente fue marcado como ${estadoEtiqueta}.`);
      const lista = await api.obtenerFichasMadre();
      setBase(lista.find((f) => f.id === id) ?? null);
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'No fue posible actualizar el estado del expediente.');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    setTokenMessage('');
    if (!tokenEmail.trim()) {
      setTokenMessage('Debes indicar el correo destino para generar el enlace.');
      return;
    }

    if (enlaceEsDeFirma && selectedDocIds.length === 0) {
      setTokenMessage('Debes seleccionar al menos un documento para enviar en el enlace de firma.');
      return;
    }

    setGeneratingToken(true);
    try {
      await api.crearTokenAcceso({
        fichaMadreId: id,
        emailDestino: tokenEmail.trim(),
        documentosFirmaCantidad: enlaceEsDeFirma ? selectedDocIds.length : firmaDocumentosCantidad,
        documentosIds: enlaceEsDeFirma ? selectedDocIds : undefined,
      });
      await loadTokens();
      setTokenEmail('');
      setTokenMessage(enlaceEsDeFirma ? 'Enlace de firma generado correctamente con los formatos seleccionados.' : 'Enlace de acceso generado correctamente.');
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
  const cantidadFirmados = documentos.filter((doc) => doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO')).length;
  const todosDocumentosFirmados = tieneDocumentos && documentos.length > 0 && cantidadFirmados === documentos.length;
  const getTokenPackageLabel = (cantidad?: number) => `${cantidad ?? 5} documento${(cantidad ?? 5) === 1 ? '' : 's'}`;
  const getTokenStatusLabel = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') return 'Enlace Cerrado';
    if (token.estado === 'EXPIRADO') return 'Enlace Vencido';
    if (token.estado === 'USADO') return 'Ficha Completada';
    return enlaceEsDeFirma ? 'Listo para Firma' : 'Enlace Activo';
  };

  const getTokenStatusStyles = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') {
      return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
    if (token.estado === 'EXPIRADO') {
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    }
    if (token.estado === 'USADO') {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
    if (enlaceEsDeFirma) {
      return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
    }
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  };

  const getTokenStatusSubtitle = (token: TokenAcceso) => {
    if (token.estado === 'REVOCADO') return 'El acceso fue cerrado o reemplazado por un nuevo enlace.';
    if (token.estado === 'EXPIRADO') return 'El enlace venció su plazo y debe generarse uno nuevo.';
    if (token.estado === 'USADO') return 'El cliente ya completó el formulario con este enlace.';
    if (enlaceEsDeFirma) return 'El cliente puede ingresar y firmar los formatos seleccionados.';
    return 'Pendiente de que el cliente complete su Ficha Madre.';
  };

  const tokenActivo = tokens.find((t) => t.estado === 'ACTIVO') || tokens[0];

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

        {/* Acciones y Estado del Expediente */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto pl-11 md:pl-0">
          {base.estado !== 'APROBADA' ? (
            <>
              <button
                type="button"
                onClick={() => handleUpdateFichaEstado('APROBADA')}
                disabled={updatingEstado}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/30 transition-all cursor-pointer disabled:opacity-50"
                title="Aprobar el expediente del cliente"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{updatingEstado ? 'Actualizando...' : 'Aprobar Expediente'}</span>
              </button>

              {base.estado === 'EN_REVISION' && (
                <button
                  type="button"
                  onClick={() => handleUpdateFichaEstado('RECHAZADA')}
                  disabled={updatingEstado}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Rechazar u observar el expediente"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Rechazar</span>
                </button>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Expediente Aprobado</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#0a192f] border border-[#1b355a] rounded-xl px-3 py-1.5 shadow-md">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Estado:</span>
            <select
              value={base.estado}
              onChange={(e) => handleUpdateFichaEstado(e.target.value as any)}
              disabled={updatingEstado}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [&_option]:bg-[#0a192f] [&_option]:text-white"
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="EN_REVISION">EN REVISIÓN</option>
              <option value="APROBADA">APROBADO</option>
              <option value="RECHAZADA">RECHAZADO</option>
            </select>
          </div>
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

            {/* Banner de Estado / Aprobación */}
            {base.estado === 'EN_REVISION' && (
              <div className="flex items-center justify-between gap-4 p-4 bg-amber-500/10 border border-amber-500/25 rounded-3xl shadow-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <h4 className="text-xs font-bold text-amber-300">Expediente en Revisión</h4>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    {todosDocumentosFirmados
                      ? 'Todas las firmas registradas (100%). Listo para aprobación final.'
                      : `${cantidadFirmados} de ${documentos.length} formatos firmados.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateFichaEstado('APROBADA')}
                  disabled={updatingEstado}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Aprobar</span>
                </button>
              </div>
            )}

            {base.estado === 'APROBADA' && (
              <div className="flex items-center gap-3.5 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl shadow-lg">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Expediente Aprobado</h4>
                  <p className="text-[11px] text-neutral-300">El expediente cuenta con aprobación y conformidad fiduciaria.</p>
                </div>
              </div>
            )}

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
                    disabled={tieneDocumentos || completingDocs}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                      tieneDocumentos
                        ? 'bg-[#0a1c36]/40 border border-[#162e50] text-neutral-500 cursor-not-allowed opacity-75'
                        : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-950/20 cursor-pointer disabled:opacity-50 disabled:pointer-events-none'
                    }`}
                    title={tieneDocumentos ? 'Los 7 formatos ya fueron generados para este expediente' : 'Generar los 7 formatos fiduciarios'}
                  >
                    {tieneDocumentos ? (
                      <>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Formatos generados (7)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-14" />
                        </svg>
                        <span>{completingDocs ? 'Generando...' : 'Generar formatos (7)'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-[#050e1b] border border-[#162e50] text-xs text-neutral-500 flex items-center">
                    Solo admin o analista pueden generar formatos.
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
                    const esFirmado = doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO');
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

              <form onSubmit={handleGenerateToken} className="space-y-4">
                {enlaceEsDeFirma ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Formatos a firmar ({selectedDocIds.length} de {documentos.length} seleccionados)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllPending}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          Todos los pendientes
                        </button>
                        <span className="text-neutral-600 text-xs">•</span>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-[11px] text-neutral-400 hover:text-neutral-300 font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          Ninguno
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 bg-[#050e1b] border border-[#162e50] rounded-2xl p-2.5">
                      {documentosOrdenados.map((doc, index) => {
                        const esDocFirmado = doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO');
                        const isSelected = selectedDocIds.includes(doc.id);

                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              if (!esDocFirmado) handleToggleDocSelect(doc.id);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                              esDocFirmado
                                ? 'bg-[#08172c]/40 border-emerald-500/20 text-neutral-500 opacity-80 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-blue-600/10 border-blue-500/50 text-white cursor-pointer hover:bg-blue-600/15'
                                  : 'bg-[#0a1c36]/20 border-[#162e50]/40 text-neutral-400 cursor-pointer hover:border-[#162e50]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={esDocFirmado ? true : isSelected}
                                disabled={esDocFirmado}
                                onChange={() => {
                                  if (!esDocFirmado) handleToggleDocSelect(doc.id);
                                }}
                                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <div className="min-w-0">
                                <span className="block text-[9px] font-mono uppercase text-neutral-500 font-bold">
                                  FORMATO {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="block text-xs font-semibold truncate max-w-[240px]" title={doc.nombreArchivo}>
                                  {doc.nombreArchivo}
                                </span>
                              </div>
                            </div>

                            {esDocFirmado ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                                ✓ Firmado
                              </span>
                            ) : isSelected ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold">
                                Seleccionado
                              </span>
                            ) : (
                              <span className="shrink-0 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-500 text-[10px]">
                                Excluido
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                      Acceso al formulario inicial
                    </label>
                    <p className="text-xs text-neutral-400 bg-[#050e1b] border border-[#162e50] rounded-xl p-3">
                      Este enlace permitirá al cliente completar los 7 pasos de su Ficha Madre de Inversionista.
                    </p>
                  </div>
                )}

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
                  disabled={generatingToken || (enlaceEsDeFirma && selectedDocIds.length === 0)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {generatingToken
                    ? enlaceEsDeFirma
                      ? 'Generando enlace de firma...'
                      : 'Generando enlace...'
                    : enlaceEsDeFirma
                      ? `Generar enlace de firma (${selectedDocIds.length} formato${selectedDocIds.length === 1 ? '' : 's'})`
                      : 'Generar enlace'}
                </button>
              </form>

              {/* Cuadro Único del Enlace Actual del Expediente */}
              <div className="space-y-2 pt-2 border-t border-[#162e50]/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Enlace actual del cliente
                  </h4>
                  {tokens.length > 1 && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      (1 activo de {tokens.length} generados)
                    </span>
                  )}
                </div>

                {!tokenActivo ? (
                  <div className="rounded-2xl border border-[#162e50]/40 bg-[#050e1b] p-4 text-center">
                    <p className="text-xs text-neutral-500">
                      Aún no se ha generado ningún enlace para este expediente. Ingresa el correo arriba y pulsa "Generar enlace" para enviar el acceso al cliente.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#162e50] bg-[#050e1b] p-4 space-y-3 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getTokenStatusStyles(tokenActivo)}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tokenActivo.estado === 'ACTIVO' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`} />
                          {getTokenStatusLabel(tokenActivo)}
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                          {getTokenStatusSubtitle(tokenActivo)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          {tokenActivo.documentos && tokenActivo.documentos.length > 0
                            ? `${tokenActivo.documentos.length} formatos a firmar`
                            : tokenActivo.documentosFirmaCantidad
                              ? `${tokenActivo.documentosFirmaCantidad} formatos`
                              : 'Ficha Madre'}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">
                          Vence: {new Date(tokenActivo.expiraEn).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#061325] border border-[#162e50] rounded-xl p-1.5 pl-3">
                      <code className="flex-1 truncate text-xs text-neutral-300 font-mono select-all">
                        {`${origin}/onboarding/${tokenActivo.token}`}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyTokenLink(tokenActivo.token)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all cursor-pointer shrink-0"
                        title="Copiar enlace"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEmail(tokenActivo.emailDestino, tokenActivo.token)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-xs font-semibold text-blue-300 hover:bg-blue-600/20 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Por Correo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(base.cliente.persona.telefono, tokenActivo.token)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/20 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                        </svg>
                        Por WhatsApp
                      </button>
                    </div>

                    {tokenActivo.estado !== 'ACTIVO' ? (
                      <button
                        type="button"
                        onClick={() => handleReactivateToken(tokenActivo.id)}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/25 transition-all cursor-pointer"
                      >
                        Reactivar este enlace
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeToken(tokenActivo.id)}
                        className="w-full px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      >
                        Cerrar / Invalidar enlace
                      </button>
                    )}
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
            <div className="w-full max-w-5xl h-[92vh] bg-[#050e1b] border border-[#162e50] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-[#162e50]/40 flex items-center justify-between bg-[#061325]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 font-mono">
                    Previsualización de Documento
                  </span>
                  <h3 className="text-base font-bold text-white truncate max-w-lg">{previewDoc.nombreArchivo}</h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Contenido A4 Scrollable con visor completo */}
              <div className="flex-1 min-h-0 relative bg-[#e2e8f0] overflow-hidden flex flex-col items-center justify-center">
                {loadingPreview ? (
                  <div className="flex flex-col items-center justify-center text-neutral-400 p-8 bg-[#050e1b] w-full h-full">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xs text-neutral-300">Compilando y cargando el documento...</p>
                  </div>
                ) : (
                  <iframe
                    srcDoc={previewHtml}
                    title="Doc Preview"
                    className="w-full h-full border-0 bg-[#e2e8f0]"
                    sandbox="allow-same-origin"
                  />
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
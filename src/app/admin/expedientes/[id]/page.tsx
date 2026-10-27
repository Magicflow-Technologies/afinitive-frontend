'use client';

import React, { useEffect, useState, use } from 'react';
import {
  api,
  FichaMadre,
  TokenAcceso,
  DocumentoGeneral,
  Fideicomiso,
  InversionFideicomiso,
} from '@/services/api';
import Link from 'next/link';
import { FichaMadreWizard } from '@/components/FichaMadreWizard';
import { ModalDocumentosFicha } from '@/components/ModalDocumentosFicha';
import { ModalAsociarFideicomiso } from '@/components/ModalAsociarFideicomiso';
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
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [autocompleteConfirmOpen, setAutocompleteConfirmOpen] = useState(false);

  const [inversiones, setInversiones] = useState<InversionFideicomiso[]>([]);
  const [catalogoFideicomisos, setCatalogoFideicomisos] = useState<Fideicomiso[]>([]);
  const [showAsociarModal, setShowAsociarModal] = useState(false);
  const [inversionAEditar, setInversionAEditar] = useState<InversionFideicomiso | null>(null);
  const [activeFideicomisoId, setActiveFideicomisoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'documentos' | 'ficha' | 'enlaces'>('documentos');

  const [previewDoc, setPreviewDoc] = useState<DocumentoGeneral | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const tieneDocumentos = documentos.length > 0;
  const enlaceEsDeFirma = tieneDocumentos;
  const enlaceTitulo = enlaceEsDeFirma ? '4. Enlace de firma del cliente' : '4. Enlace de acceso al cliente';
  const enlaceDescripcion = enlaceEsDeFirma
    ? 'Genera y supervisa un nuevo enlace seguro para que el cliente retome la revisión y firme los documentos sin volver a llenar la ficha.'
    : 'Genera y supervisa el token que el cliente usará para completar su formulario sin registrarse.';

  const pushNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice((current) => (current?.message === message ? null : current)), 4200);
  };

  const loadExpediente = async () => {
    try {
      const [lista, perfilData, docs, invs, cats] = await Promise.all([
        api.obtenerFichasMadre(),
        api.obtenerFichaMadre(id),
        api.obtenerDocumentosFichaMadre(id),
        api.obtenerInversionesFideicomiso(id).catch(() => []),
        api.obtenerFideicomisosCatalogo().catch(() => []),
      ]);
      setBase(lista.find((f) => f.id === id) ?? null);
      setPerfil(perfilData);
      setDocumentos(docs);
      setInversiones(invs);
      setCatalogoFideicomisos(cats);
      if (invs.length > 0) {
        setActiveFideicomisoId((prev) => (prev && invs.some((i) => i.id === prev) ? prev : invs[0].id));
      }
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

  const handleDownloadPack = async (inversion: InversionFideicomiso) => {
    setDownloadingPackId(inversion.id);
    try {
      const blob = await api.descargarPdfPackFideicomiso(inversion.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${base?.codigo || 'EXP'}_${inversion.fideicomiso?.nombre || 'Fideicomiso'}_Pack_Formatos_01_07.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      pushNotice('success', `Pack de 7 formatos (${inversion.fideicomiso?.nombre || 'Fideicomiso'}) descargado correctamente.`);
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'Error al descargar el pack consolidado.');
    } finally {
      setDownloadingPackId(null);
    }
  };

  const handleEliminarInversion = async (invId: string) => {
    if (!confirm('¿Estás seguro de desvincular este Fideicomiso? Se eliminarán sus 3 formatos operativos asociados.')) return;
    try {
      await api.eliminarInversionFideicomiso(invId);
      pushNotice('success', 'Inversión en fideicomiso desvinculada.');
      await loadExpediente();
    } catch (err: any) {
      console.error(err);
      pushNotice('error', err.message || 'Error al eliminar la inversión.');
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

    // Si ya cuenta con URL de archivo en Supabase Storage (http/https), mostrar directamente el PDF real
    if (doc.rutaArchivo && doc.rutaArchivo.startsWith('http')) {
      setPreviewHtml('');
      setLoadingPreview(false);
      return;
    }
    setPreviewHtml('');
    setLoadingPreview(true);
    try {
      const preview = await api.obtenerDocumentoPreview(doc.id);
      if (preview.url) {
        setPreviewDoc((prev) => (prev ? { ...prev, rutaArchivo: preview.url! } : null));
      } else {
        setPreviewHtml(preview.html || '');
      }
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

  // Formatos Maestros KYC (01 al 04): no tienen inversionFideicomisoId o su orden es <= 4
  const docsMaestrosKYC = documentosOrdenados.filter((d) => {
    const order = getDocumentoTemplateOrder(d.documentoPlantilla?.archivo);
    return order <= 4 && !d.inversionFideicomisoId;
  });

  // Documentos de Fideicomisos no vinculados (fallback para registros creados anteriormente)
  const docsFideicomisosSinAsignar = documentosOrdenados.filter((d) => {
    const order = getDocumentoTemplateOrder(d.documentoPlantilla?.archivo);
    return order > 4 && !d.inversionFideicomisoId;
  });

  // Inversión actualmente activa en los tabs
  const inversionActiva = inversiones.find((inv) => inv.id === activeFideicomisoId) || inversiones[0] || null;
  const docsInversionActiva = inversionActiva
    ? documentosOrdenados.filter((d) => d.inversionFideicomisoId === inversionActiva.id)
    : docsFideicomisosSinAsignar;
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
      return 'bg-red-50 border-red-200 text-red-600';
    }
    if (token.estado === 'EXPIRADO') {
      return 'bg-amber-50 border-amber-200 text-amber-700';
    }
    if (token.estado === 'USADO') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
    if (enlaceEsDeFirma) {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    }
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
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
    <div className="space-y-6 font-sans pb-16">
      {notice && (
        <div
          className={`fixed top-4 right-4 z-[60] w-full max-w-md rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${notice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : notice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-relaxed">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 1. CABECERA PRINCIPAL (COCKPIT) */}
      <div className="shrink-0 pb-4 mb-4 border-b border-[#e7ebf1] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/expedientes"
              className="p-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] transition-all shadow-sm"
              title="Volver a lista de expedientes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <span className="text-xs font-mono font-extrabold text-[#caa344] uppercase tracking-widest bg-[#caa344]/10 border border-[#caa344]/30 px-2.5 py-0.5 rounded-md">
                {base.codigo}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#10233f] tracking-tight mt-1">
                {base.cliente.persona.nombres} {base.cliente.persona.apellidos}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8d9aae] pl-11">
            <span>Doc: <strong className="text-[#17233a]">{base.cliente.persona.tipoDocumento} - {base.cliente.persona.numeroDocumento}</strong></span>
            <span>•</span>
            <span>Asesor: <strong className="text-[#17233a]">{base.empleado.persona.nombres} {base.empleado.persona.apellidos}</strong></span>
          </div>
        </div>

        {/* Acciones y Estado del Expediente */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto pl-11 md:pl-0">
          {!tieneDocumentos && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              title="Subir o digitalizar documentos del expediente"
            >
              <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Subir Documentos</span>
            </button>
          )}

          {base.estado !== 'APROBADA' ? (
            <>
              <button
                type="button"
                onClick={() => handleUpdateFichaEstado('APROBADA')}
                disabled={updatingEstado}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Expediente Aprobado</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white border border-[#e7ebf1] rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-[#8d9aae] uppercase tracking-wider">Estado:</span>
            <select
              value={base.estado}
              onChange={(e) => handleUpdateFichaEstado(e.target.value as any)}
              disabled={updatingEstado}
              className="bg-transparent text-xs font-bold text-[#17233a] focus:outline-none cursor-pointer"
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

      {/* MINI NAVBAR / SUB-NAVEGADOR ABAJO DE LA CABECERA */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 p-1.5 bg-white/95 backdrop-blur-md border border-[#e7ebf1] rounded-2xl shadow-sm mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'documentos'
                ? 'bg-[#caa344] text-white shadow-md shadow-[#caa344]/25'
                : 'text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Expediente & Fideicomisos</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'documentos' ? 'bg-white/25 text-white' : 'bg-[#f7f8fb] text-[#17233a] border border-[#e7ebf1]'
            }`}>
              {documentos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ficha')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ficha'
                ? 'bg-[#caa344] text-white shadow-md shadow-[#caa344]/25'
                : 'text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Ficha del Inversionista</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enlaces')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'enlaces'
                ? 'bg-[#caa344] text-white shadow-md shadow-[#caa344]/25'
                : 'text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Enlace de Firma & Acceso</span>
            {tokens.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'enlaces' ? 'bg-white/25 text-white' : 'bg-[#f7f8fb] text-[#17233a] border border-[#e7ebf1]'
              }`}>
                {tokens.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-2">
          <span className="text-[11px] font-semibold text-[#8d9aae]">Estado:</span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#f7f8fb] border border-[#e7ebf1] text-[#17233a]">
            {base.estado}
          </span>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL DE LA PESTAÑA ACTIVA */}
      <div className="space-y-6">

        {/* PESTAÑA 1: FICHA MADRE (WIZARD) */}
        {activeTab === 'ficha' && (
          <div className="bg-white border border-[#e7ebf1] rounded-3xl p-6 shadow-sm">
            <div className="mb-6 pb-4 border-b border-[#e7ebf1]">
              <h3 className="text-xl font-extrabold text-[#10233f]">1. Ficha Madre del Inversionista</h3>
              <p className="text-xs text-[#8d9aae] mt-1">
                Completa y verifica los 7 pasos de la Ficha Madre para recopilar los datos de la autocompletación de formatos.
              </p>
            </div>
            <FichaMadreWizard
              fichaMadreId={id}
              initial={perfil?.fichaMadre?.inversionista}
              readOnly={base.estado === 'APROBADA'}
              onSaved={(respuesta) => setPerfil(respuesta)}
            />
          </div>
        )}

        {/* PESTAÑA 2: EXPEDIENTE Y FIDEICOMISOS */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            {/* Header del Expediente con Botones */}
            <div className="bg-white border border-[#e7ebf1] rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#e7ebf1]">
                <div>
                  <h3 className="text-xl font-extrabold text-[#10233f]">Expediente de Firmas e Inversiones</h3>
                  <p className="text-xs text-[#8d9aae] mt-1">
                    Documentos KYC unificados del inversionista y portafolio de Fideicomisos de Inversión.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setInversionAEditar(null);
                      setShowAsociarModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-md shadow-[#caa344]/25 transition-all cursor-pointer"
                    title="Asociar este cliente a un nuevo fideicomiso"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>+ Asociar Fideicomiso</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] font-bold text-xs shadow-sm transition-all cursor-pointer"
                    title="Subir documentos físicos/digitalizados"
                  >
                    <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Subir Documentos</span>
                  </button>

                  {canRegenerate && !tieneDocumentos && (
                    <button
                      type="button"
                      onClick={handleAutocomplete}
                      disabled={completingDocs}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10233f] hover:bg-[#17233a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      title="Generar los 7 formatos oficiales"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-14" />
                      </svg>
                      <span>{completingDocs ? 'Generando...' : 'Generar Formatos Iniciales'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BLOQUE A: DOCUMENTOS MAESTROS KYC (FORMATOS 01 AL 04) */}
              <div className="pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#caa344]" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#17233a]">
                      Documentos Maestros KYC (Formatos 01 al 04)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#caa344] bg-[#caa344]/10 border border-[#caa344]/30 px-2.5 py-0.5 rounded-md font-mono font-bold">
                    Aplica a todos los Fideicomisos
                  </span>
                </div>

                {docsMaestrosKYC.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-[#e7ebf1] bg-[#f7f8fb] text-center text-xs text-[#8d9aae]">
                    Formatos 01 al 04 pendientes de generación o digitalización.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {docsMaestrosKYC.map((doc, index) => {
                      const esFirmado = doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO');
                      return (
                        <div
                          key={doc.id}
                          className="p-4 bg-[#f7f8fb] border border-[#e7ebf1] rounded-2xl flex flex-col justify-between gap-3 hover:border-[#caa344] transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono text-[#8d9aae] font-bold">
                                FORMATO {String(index + 1).padStart(2, '0')}
                              </span>
                              {esFirmado ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase">
                                  Firmado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase">
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <span className="block text-xs font-bold text-[#17233a] line-clamp-2" title={doc.nombreArchivo}>
                              {doc.nombreArchivo}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-[#e7ebf1]">
                            {doc.rutaArchivo && doc.rutaArchivo.startsWith('http') && (
                              <a
                                href={doc.rutaArchivo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-xs font-semibold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                                title="Abrir PDF en Supabase Storage"
                              >
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>Ver PDF</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePreviewDoc(doc)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-xs font-semibold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                              title="Previsualizar formato"
                            >
                              <svg className="w-3.5 h-3.5 text-[#8d9aae] group-hover:text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Vista Previa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE B: PORTAFOLIO DE INVERSIONES EN FIDEICOMISOS (FORMATOS 05 AL 07) */}
            <div className="bg-white border border-[#e7ebf1] rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#e7ebf1]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10233f]" />
                  <h4 className="text-base font-extrabold text-[#10233f]">
                    Portafolio de Fideicomisos de Inversión ({inversiones.length})
                  </h4>
                </div>
                <span className="text-[11px] text-[#8d9aae] bg-[#f7f8fb] border border-[#e7ebf1] px-3 py-1 rounded-md font-mono">
                  Formatos 05, 06 y 07 por cada Fideicomiso
                </span>
              </div>

              {/* Tabs de Fideicomisos */}
              {inversiones.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {inversiones.map((inv, idx) => {
                    const isActive = (inversionActiva?.id === inv.id);
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => setActiveFideicomisoId(inv.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                          isActive
                            ? 'bg-[#10233f] text-white shadow-md shadow-[#10233f]/20'
                            : 'bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] hover:border-[#caa344] border border-[#e7ebf1]'
                        }`}
                      >
                        <span>{inv.fideicomiso?.nombre || `Fideicomiso ${idx + 1}`}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-[#caa344] text-white font-bold' : 'bg-white text-[#17233a] border border-[#e7ebf1]'
                        }`}>
                          {inv.moneda === 'USD' ? '$' : 'S/'} {Number(inv.monto || 0).toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fideicomiso Activo */}
              {inversionActiva ? (
                <div className="rounded-2xl border border-[#e7ebf1] bg-[#f7f8fb] p-5 space-y-5">
                  {/* Ficha Cabecera */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7ebf1]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h5 className="text-base font-extrabold text-[#10233f]">
                          {inversionActiva.fideicomiso?.nombre || 'Fideicomiso'}
                        </h5>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344] uppercase">
                          {inversionActiva.estado || 'EN_PROCESO'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8d9aae] mt-0.5 line-clamp-1" title={inversionActiva.fideicomiso?.patrimonioNombreLargo || ''}>
                        {inversionActiva.fideicomiso?.patrimonioNombreLargo || inversionActiva.fideicomiso?.emisorFiduciario || 'Patrimonio en Fideicomiso'}
                      </p>
                    </div>

                    {/* Botones de acción del Fideicomiso */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadPack(inversionActiva)}
                        disabled={downloadingPackId === inversionActiva.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10233f] hover:bg-[#17233a] text-white font-bold text-xs shadow-md shadow-[#10233f]/20 hover:ring-2 hover:ring-[#caa344]/50 transition-all cursor-pointer disabled:opacity-50"
                        title="Descargar PDF con los 7 formatos consolidados"
                      >
                        <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
                        </svg>
                        <span>{downloadingPackId === inversionActiva.id ? 'Descargando...' : 'Descargar Pack (7 Formatos)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInversionAEditar(inversionActiva);
                          setShowAsociarModal(true);
                        }}
                        className="p-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                        title="Editar parámetros comerciales"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarInversion(inversionActiva.id)}
                        className="p-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                        title="Desvincular fideicomiso"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Resumen Financiero en Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm">
                      <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Monto Invertido</span>
                      <span className="font-extrabold text-[#caa344] text-sm mt-0.5 block">
                        {inversionActiva.moneda === 'USD' ? '$' : 'S/'} {Number(inversionActiva.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm">
                      <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Tasa Anual</span>
                      <span className="font-extrabold text-[#17233a] text-sm mt-0.5 block">
                        {inversionActiva.tasaInteres || '10 %'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm">
                      <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Vencimiento</span>
                      <span className="font-extrabold text-[#17233a] text-sm mt-0.5 block truncate" title={inversionActiva.vencimiento || inversionActiva.plazoEmision || ''}>
                        {inversionActiva.vencimiento || inversionActiva.plazoEmision || 'Hasta 24 meses'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm">
                      <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Cuenta Recaudación</span>
                      <span className="font-extrabold text-[#17233a] text-sm mt-0.5 block truncate" title={`${inversionActiva.bancoDestino || ''} - ${inversionActiva.numeroCuentaDestino || ''}`}>
                        {inversionActiva.bancoDestino ? `${inversionActiva.bancoDestino}` : 'Configurada en Fideicomiso'}
                      </span>
                    </div>
                  </div>

                  {/* Operaciones y Enlace a Cronograma */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm flex items-center justify-between">
                      <div>
                        <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Op. Coril</span>
                        <span className="font-bold text-[#17233a] text-xs mt-0.5 block truncate" title={inversionActiva.correoOpCoril || 'operaciones@grupocoril.com'}>
                          {inversionActiva.correoOpCoril || 'operaciones@grupocoril.com'}
                        </span>
                      </div>
                      {inversionActiva.correoOpCoril && (
                        <a
                          href={`mailto:${inversionActiva.correoOpCoril}`}
                          className="p-1.5 rounded-lg bg-[#f7f8fb] text-[#caa344] hover:bg-[#caa344]/15"
                          title="Enviar correo a Op. Coril"
                        >
                          ✉
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm flex items-center justify-between">
                      <div>
                        <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Op. Corfid</span>
                        <span className="font-bold text-[#17233a] text-xs mt-0.5 block truncate" title={inversionActiva.correoOpCorfid || 'operaciones@corfid.com.pe'}>
                          {inversionActiva.correoOpCorfid || 'operaciones@corfid.com.pe'}
                        </span>
                      </div>
                      {inversionActiva.correoOpCorfid && (
                        <a
                          href={`mailto:${inversionActiva.correoOpCorfid}`}
                          className="p-1.5 rounded-lg bg-[#f7f8fb] text-[#caa344] hover:bg-[#caa344]/15"
                          title="Enviar correo a Op. Corfid"
                        >
                          ✉
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-[#e7ebf1] shadow-sm flex items-center justify-between">
                      <div>
                        <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">Cronograma de Pagos</span>
                        <span className="font-bold text-[#17233a] text-xs mt-0.5 block truncate">
                          {inversionActiva.enlaceCronograma ? 'Enlace Disponible' : 'Pendiente de registrar'}
                        </span>
                      </div>
                      {inversionActiva.enlaceCronograma ? (
                        <a
                          href={inversionActiva.enlaceCronograma}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-sm transition-all"
                          title="Abrir Cronograma en enlace externo"
                        >
                          <span>Ver</span>
                          <span>↗</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#8d9aae] bg-[#f7f8fb] px-2 py-1 rounded-md">Sin URL</span>
                      )}
                    </div>
                  </div>

                  {/* Formatos 05, 06, 07 */}
                  <div className="space-y-3 pt-2">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#17233a] font-mono">
                      Formatos Operativos del Fideicomiso (05, 06, 07)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {docsInversionActiva.map((doc, index) => {
                        const esFirmado = doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO');
                        const orderNum = index + 5;
                        return (
                          <div
                            key={doc.id}
                            className="p-4 bg-white border border-[#e7ebf1] rounded-2xl flex flex-col justify-between gap-3 hover:border-[#caa344] transition-all group shadow-sm"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-[#8d9aae] font-bold">
                                  FORMATO {String(orderNum).padStart(2, '0')}
                                </span>
                                {esFirmado ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase">
                                    Firmado
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              <span className="block text-xs font-bold text-[#17233a] line-clamp-2" title={doc.nombreArchivo}>
                                {doc.nombreArchivo}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-[#e7ebf1]">
                              {doc.rutaArchivo && doc.rutaArchivo.startsWith('http') && (
                                <a
                                  href={doc.rutaArchivo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-xs font-semibold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                                  title="Ver PDF en Supabase Storage"
                                >
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>Ver PDF</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handlePreviewDoc(doc)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-xs font-semibold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                                title="Previsualizar formato"
                              >
                                <svg className="w-3.5 h-3.5 text-[#8d9aae] group-hover:text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Vista Previa</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-[#e7ebf1] bg-[#f7f8fb] text-center space-y-3">
                  <p className="text-xs text-[#8d9aae]">
                    No hay Fideicomisos de inversión asociados todavía a este expediente.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInversionAEditar(null);
                      setShowAsociarModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-md shadow-[#caa344]/25 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Asociar Primer Fideicomiso</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: ENLACE DE FIRMA Y ACCESO */}
        {activeTab === 'enlaces' && (
          <div className="bg-white border border-[#e7ebf1] rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
            <div className="pb-4 border-b border-[#e7ebf1]">
              <h3 className="text-xl font-extrabold text-[#10233f]">{enlaceTitulo}</h3>
              <p className="text-xs text-[#8d9aae] mt-1">{enlaceDescripcion}</p>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-5">
              {enlaceEsDeFirma ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#17233a]">
                      Formatos a firmar ({selectedDocIds.length} de {documentos.length} seleccionados)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPending}
                        className="text-[11px] text-[#caa344] hover:underline font-bold cursor-pointer"
                      >
                        Todos los pendientes
                      </button>
                      <span className="text-[#8d9aae] text-xs">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[11px] text-[#8d9aae] hover:text-[#17233a] font-semibold cursor-pointer"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 bg-[#f7f8fb] border border-[#e7ebf1] rounded-2xl p-3">
                    {documentosOrdenados.map((doc, index) => {
                      const esDocFirmado = doc.estado === 'FIRMADO' || doc.firmas?.some((f) => f.estado === 'FIRMADO');
                      const isSelected = selectedDocIds.includes(doc.id);

                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            if (!esDocFirmado) handleToggleDocSelect(doc.id);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            esDocFirmado
                              ? 'bg-white/60 border-emerald-200 text-[#8d9aae] opacity-80 cursor-not-allowed'
                              : isSelected
                                ? 'bg-white border-[#caa344] text-[#17233a] shadow-sm cursor-pointer'
                                : 'bg-white border-[#e7ebf1] text-[#8d9aae] hover:border-[#caa344]/50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={esDocFirmado ? true : isSelected}
                              disabled={esDocFirmado}
                              onChange={() => {
                                if (!esDocFirmado) handleToggleDocSelect(doc.id);
                              }}
                              className="w-4 h-4 rounded border-[#e7ebf1] text-[#caa344] accent-[#caa344] cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="min-w-0">
                              <span className="block text-[9px] font-mono uppercase text-[#8d9aae] font-bold">
                                FORMATO {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className="block text-xs font-bold text-[#17233a] truncate max-w-md" title={doc.nombreArchivo}>
                                {doc.nombreArchivo}
                              </span>
                            </div>
                          </div>

                          {esDocFirmado ? (
                            <span className="shrink-0 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase">
                              ✓ Firmado
                            </span>
                          ) : isSelected ? (
                            <span className="shrink-0 px-2.5 py-0.5 rounded-md bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344] text-[10px] font-bold">
                              Seleccionado
                            </span>
                          ) : (
                            <span className="shrink-0 px-2.5 py-0.5 rounded-md bg-[#f7f8fb] text-[#8d9aae] text-[10px]">
                              Excluido
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#f7f8fb] border border-[#e7ebf1] rounded-2xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#17233a] mb-1">
                    Acceso al formulario inicial
                  </label>
                  <p className="text-xs text-[#8d9aae]">
                    Este enlace permitirá al cliente completar los 7 pasos de su Ficha Madre de Inversionista.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#17233a] mb-1.5">
                  Correo electrónico destino *
                </label>
                <input
                  type="email"
                  value={tokenEmail}
                  onChange={(e) => setTokenEmail(e.target.value)}
                  placeholder={base.cliente.persona.correo}
                  className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-semibold text-[#17233a] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                />
              </div>

              {tokenMessage && (
                <div className="text-xs text-[#17233a] bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  {tokenMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={generatingToken || (enlaceEsDeFirma && selectedDocIds.length === 0)}
                className="w-full py-3 px-4 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-bold shadow-md shadow-[#caa344]/25 transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {generatingToken
                  ? enlaceEsDeFirma
                    ? 'Generando enlace de firma...'
                    : 'Generando enlace...'
                  : enlaceEsDeFirma
                    ? `Generar Enlace de Firma (${selectedDocIds.length} formatos)`
                    : 'Generar Enlace de Acceso'}
              </button>
            </form>

            {/* Enlace Activo */}
            <div className="pt-4 border-t border-[#e7ebf1] space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#17233a]">
                Enlace Actual del Cliente
              </h4>

              {!tokenActivo ? (
                <div className="rounded-2xl border border-dashed border-[#e7ebf1] bg-[#f7f8fb] p-6 text-center text-xs text-[#8d9aae]">
                  Aún no se ha generado ningún enlace para este expediente. Ingresa el correo arriba y pulsa "Generar Enlace".
                </div>
              ) : (
                <div className="rounded-2xl border border-[#e7ebf1] bg-[#f7f8fb] p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white border border-[#e7ebf1] text-[#17233a]">
                        <span className={`w-1.5 h-1.5 rounded-full ${tokenActivo.estado === 'ACTIVO' ? 'bg-[#caa344] animate-pulse' : 'bg-[#8d9aae]'}`} />
                        {getTokenStatusLabel(tokenActivo)}
                      </span>
                      <p className="text-[11px] text-[#8d9aae] mt-1">
                        {getTokenStatusSubtitle(tokenActivo)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#17233a] font-bold block font-mono">
                        {tokenActivo.documentos && tokenActivo.documentos.length > 0
                          ? `${tokenActivo.documentos.length} formatos a firmar`
                          : 'Ficha Madre'}
                      </span>
                      <span className="text-[9px] text-[#8d9aae] font-mono block mt-0.5">
                        Vence: {new Date(tokenActivo.expiraEn).toLocaleDateString('es-PE')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-[#e7ebf1] rounded-xl p-1.5 pl-3">
                    <code className="flex-1 truncate text-xs text-[#17233a] font-mono select-all">
                      {`${origin}/onboarding/${tokenActivo.token}`}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyTokenLink(tokenActivo.token)}
                      className="px-3 py-1.5 rounded-lg bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEmail(tokenActivo.emailDestino, tokenActivo.token)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-xs font-bold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Por Correo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(base.cliente.persona.telefono, tokenActivo.token)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-xs font-bold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                      </svg>
                      Por WhatsApp
                    </button>
                  </div>

                  {tokenActivo.estado !== 'ACTIVO' ? (
                    <button
                      type="button"
                      onClick={() => handleReactivateToken(tokenActivo.id)}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      Reactivar este enlace
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevokeToken(tokenActivo.id)}
                      className="w-full px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                    >
                      Cerrar / Invalidar enlace
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* FIN DE CONTENIDO PRINCIPAL */}

        {/* 3. MODAL DE PREVISUALIZACIÓN DE DOCUMENTO (PREMIUM A4 SIMULATOR) */}
        {previewDoc && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[92vh] bg-white border border-[#e7ebf1] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#8d9aae] font-mono">
                    Previsualización de Documento
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-bold text-[#10233f] truncate max-w-lg">{previewDoc.nombreArchivo}</h3>
                    {previewDoc.rutaArchivo && previewDoc.rutaArchivo.startsWith('http') && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        PDF en Supabase
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {previewDoc.rutaArchivo && previewDoc.rutaArchivo.startsWith('http') && (
                    <a
                      href={previewDoc.rutaArchivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Abrir en pestaña nueva</span>
                    </a>
                  )}
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 rounded-xl bg-white border border-[#e7ebf1] hover:bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido A4 Scrollable con visor completo */}
              <div className="flex-1 min-h-0 relative bg-[#f7f8fb] overflow-hidden flex flex-col items-center justify-center">
                {loadingPreview ? (
                  <div className="flex flex-col items-center justify-center text-[#8d9aae] p-8 bg-white w-full h-full">
                    <svg className="animate-spin h-8 w-8 text-[#caa344] mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xs text-[#17233a] font-medium">Compilando y cargando el documento...</p>
                  </div>
                ) : previewDoc?.rutaArchivo && previewDoc.rutaArchivo.startsWith('http') ? (
                  <iframe
                    src={previewDoc.rutaArchivo}
                    title="PDF Preview"
                    className="w-full h-full border-0"
                  />
                ) : (
                  <iframe
                    srcDoc={previewHtml}
                    title="Doc Preview"
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-same-origin"
                  />
                )}
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 border-t border-[#e7ebf1] flex justify-end gap-3 bg-[#f7f8fb]">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs uppercase tracking-wide transition-all shadow-sm cursor-pointer"
                >
                  Cerrar Previsualización
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE SUBIDA INDIVIDUAL DE DOCUMENTOS */}
        <ModalDocumentosFicha
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          ficha={base}
          onSuccessReload={loadExpediente}
        />

        {/* MODAL DE ASOCIAR / EDITAR FIDEICOMISO */}
        <ModalAsociarFideicomiso
          isOpen={showAsociarModal}
          onClose={() => setShowAsociarModal(false)}
          fichaMadreId={id}
          catalogoFideicomisos={catalogoFideicomisos}
          inversionAEditar={inversionAEditar}
          onSuccess={async () => {
            pushNotice('success', 'Inversión en Fideicomiso procesada con éxito.');
            await loadExpediente();
          }}
        />

        {autocompleteConfirmOpen && (
          <div className="fixed inset-0 z-[70] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl border border-[#e7ebf1] bg-white shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.5A1.5 1.5 0 003.19 20h17.62a1.5 1.5 0 001.3-2.14l-8.4-14.5a1.5 1.5 0 00-2.6 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#10233f]">Actualizar formatos</h4>
                  <p className="text-sm text-[#8d9aae] leading-relaxed">
                    Aún hay formularios de la Ficha Madre pendientes. Si continúas, algunos datos de los formatos pueden quedar vacíos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setAutocompleteConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e7ebf1] text-[#17233a] hover:bg-[#f7f8fb] transition-all text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={runAutocomplete}
                  className="px-5 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
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
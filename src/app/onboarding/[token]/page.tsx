'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, DocumentoGeneral } from '@/services/api';
import { FichaMadreWizard } from '@/components/FichaMadreWizard';
import { formatTitleCase } from '@/lib/formatters';
import type { FichaMadreResponse } from '@/lib/ficha-madre.types';
import { isProfileComplete } from '@/lib/ficha-madre.types';

const TEMPLATE_FILE_FALLBACKS: Record<string, string> = {
  '01_carta_solicitud_participacion.hbs': '05_carta_solicitud_participacion.hbs',
  '03_formato_beneficiario_final.hbs': '04_formato_beneficiario_final.hbs',
  '04_dj_residencia_fiscal.hbs': '03_dj_residencia_fiscal.hbs',
  '05_ficha_cliente_pn.hbs': '01_ficha_cliente_pn.hbs',
};

const TEMPLATE_DISPLAY_ORDER: Record<string, number> = {
  '01_ficha_cliente_pn.hbs': 1,
  '02_dj_titularidad_flujos.hbs': 2,
  '03_dj_residencia_fiscal.hbs': 3,
  '04_formato_beneficiario_final.hbs': 4,
  '05_carta_solicitud_participacion.hbs': 5,
  '06_instruccion_inversion.hbs': 6,
  '07_declaracion_inversion.hbs': 7,
};

const obtenerArchivoCanonicoDocumento = (documento?: DocumentoGeneral | null) => {
  const archivo = documento?.documentoPlantilla?.archivo ?? '';
  if (!archivo) return '';
  return TEMPLATE_FILE_FALLBACKS[archivo] ?? archivo;
};

const obtenerOrdenDocumento = (documento?: DocumentoGeneral | null) => {
  const archivoCanonico = obtenerArchivoCanonicoDocumento(documento);
  return TEMPLATE_DISPLAY_ORDER[archivoCanonico] ?? Number.MAX_SAFE_INTEGER;
};

const obtenerEtiquetaFormato = (documento: DocumentoGeneral, index: number) => {
  const orden = obtenerOrdenDocumento(documento);
  if (orden !== Number.MAX_SAFE_INTEGER) {
    return `Formato ${String(orden).padStart(2, '0')}`;
  }

  return `Formato ${String(index + 1).padStart(2, '0')}`;
};

export default function OnboardingFlowPage() {
  const params = useParams();
  const router = useRouter();

  // Desenvolver el token usando React.use() para Next.js 15+ compatible
  const token = typeof params?.token === 'string' ? params.token : '';

  // Estados
  const [perfil, setPerfil] = useState<FichaMadreResponse | null>(null);
  const [fichaMadreId, setFichaMadreId] = useState<string>('');
  const [documentos, setDocumentos] = useState<DocumentoGeneral[]>([]);
  const [etapa, setEtapa] = useState<'perfil' | 'firma'>('perfil');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  // Datos para la firma
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteDocumento, setFirmanteDocumento] = useState('');
  const [firmanteEmail, setFirmanteEmail] = useState('');
  const [aceptoTerminosFirma, setAceptoTerminosFirma] = useState(false);
  const [firmaError, setFirmaError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [documentosFirmaCantidad, setDocumentosFirmaCantidad] = useState<number>(5);
  const [firmaModalAbierto, setFirmaModalAbierto] = useState(false);
  const [firmaDibujada, setFirmaDibujada] = useState(false);

  // Previsualización de documento
  const [previewDoc, setPreviewDoc] = useState<DocumentoGeneral | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lienzoRef = useRef<{ dibujando: boolean; ultimaX: number; ultimaY: number }>({
    dibujando: false,
    ultimaX: 0,
    ultimaY: 0,
  });

  const inversionista = perfil?.fichaMadre?.inversionista;
  const metadata = perfil?.fichaMadre?.metadata;
  const codigo = metadata?.id_expediente || 'Expediente';
  const titular = inversionista?.titular;

  const documentosOrdenados = useMemo(() => {
    return [...documentos].sort((a, b) => {
      const ordenA = obtenerOrdenDocumento(a);
      const ordenB = obtenerOrdenDocumento(b);

      if (ordenA !== ordenB) return ordenA - ordenB;

      return a.nombreArchivo.localeCompare(b.nombreArchivo);
    });
  }, [documentos]);

  // Documentos pendientes de firma en el expediente
  const documentosPendientes = useMemo(() => {
    return documentosOrdenados.filter(
      (d) => d.estado !== 'FIRMADO' || d.firmas.length === 0 || d.firmas.some((f) => f.estado !== 'FIRMADO'),
    );
  }, [documentosOrdenados]);

  // Paquete activo para la ronda actual: si hay pendientes toma los siguientes según la cantidad asignada
  const documentosPaquete = useMemo(() => {
    const limiteValido = documentosFirmaCantidad > 0 ? documentosFirmaCantidad : 5;
    if (documentosPendientes.length > 0) {
      return documentosPendientes.slice(0, limiteValido);
    }
    return documentosOrdenados;
  }, [documentosOrdenados, documentosPendientes, documentosFirmaCantidad]);

  // El proceso está 100% finalizado cuando no queda ningún documento pendiente en toda la ficha
  const procesoFinalizado = etapa === 'firma' && documentos.length > 0 && documentosPendientes.length === 0;

  const cargarDocumentos = async (fichaMadreId: string) => {
    try {
      const docs = await api.obtenerDocumentosFichaMadre(fichaMadreId);
      setDocumentos(docs);
    } catch (err) {
      console.warn('No fue posible cargar los documentos del expediente.', err);
    }
  };

  // 1. Cargar la Ficha Madre y validar sesión
  useEffect(() => {
    if (!token) return;

    const inicializar = async () => {
      try {
        setLoading(true);
        const currentFichaMadreId = localStorage.getItem('fichaMadreId');
        const currentToken = localStorage.getItem('tokenAcceso');

        // Caso 1: Inicio de sesión a través de usuario/contraseña (token es virtual 'session')
        if (token === 'session') {
          if (!currentFichaMadreId) {
            throw new Error('No hay una sesión activa de onboarding. Por favor inicia sesión.');
          }
          const cantidadGuardada = Number(localStorage.getItem('documentosFirmaCantidad') || '5');
          setDocumentosFirmaCantidad(cantidadGuardada > 0 ? cantidadGuardada : 5);
          setFichaMadreId(currentFichaMadreId);
          const data = await api.obtenerFichaMadre(currentFichaMadreId);
          setPerfil(data);
          setEtapa(isProfileComplete(data.fichaMadre?.inversionista) ? 'firma' : 'perfil');
          await cargarDocumentos(currentFichaMadreId);
          setLoading(false);
          return;
        }

        // Caso 2: Inicio de sesión a través de magic link token (URL con token real de un solo uso)
        if (currentToken === token && currentFichaMadreId) {
          try {
            const cantidadGuardada = Number(localStorage.getItem('documentosFirmaCantidad') || '5');
            setDocumentosFirmaCantidad(cantidadGuardada > 0 ? cantidadGuardada : 5);
            setFichaMadreId(currentFichaMadreId);
            const data = await api.obtenerFichaMadre(currentFichaMadreId);
            setPerfil(data);
            setEtapa(isProfileComplete(data.fichaMadre?.inversionista) ? 'firma' : 'perfil');
            await cargarDocumentos(currentFichaMadreId);
            setLoading(false);
            return;
          } catch (e) {
            console.warn('Fallo al obtener ficha usando caché, re-validando token.', e);
          }
        }

        // Si no hay caché o falló, validamos el token de la URL (esto lo marcará como USADO en el backend)
        const tokenValido = await api.validarToken(token);
        localStorage.setItem('fichaMadreId', tokenValido.fichaMadreId);
        localStorage.setItem('tokenAcceso', tokenValido.token);
        localStorage.setItem('documentosFirmaCantidad', String(tokenValido.documentosFirmaCantidad ?? 5));
        setDocumentosFirmaCantidad(tokenValido.documentosFirmaCantidad && tokenValido.documentosFirmaCantidad > 0 ? tokenValido.documentosFirmaCantidad : 5);
        setFichaMadreId(tokenValido.fichaMadreId);

        const data = await api.obtenerFichaMadre(tokenValido.fichaMadreId);
        setPerfil(data);
        setEtapa(isProfileComplete(data.fichaMadre?.inversionista) ? 'firma' : 'perfil');
        await cargarDocumentos(tokenValido.fichaMadreId);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Tu sesión ha expirado o el token de acceso no es válido.');
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, [token]);

  const obtenerPuntoCanvas = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const prepararLienzo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    lienzoRef.current = { dibujando: false, ultimaX: 0, ultimaY: 0 };
    setFirmaDibujada(false);
  };

  useEffect(() => {
    if (!firmaModalAbierto) return;

    const frame = window.requestAnimationFrame(() => {
      prepararLienzo();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [firmaModalAbierto]);

  const iniciarFirma = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const punto = obtenerPuntoCanvas(event);
    if (!canvas || !punto) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lienzoRef.current = {
      dibujando: true,
      ultimaX: punto.x,
      ultimaY: punto.y,
    };

    ctx.beginPath();
    ctx.moveTo(punto.x, punto.y);
    setFirmaDibujada(true);
  };

  const moverFirma = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const punto = obtenerPuntoCanvas(event);
    if (!canvas || !punto || !lienzoRef.current.dibujando) return;

    event.preventDefault();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(punto.x, punto.y);
    ctx.stroke();
    lienzoRef.current.ultimaX = punto.x;
    lienzoRef.current.ultimaY = punto.y;
    setFirmaDibujada(true);
  };

  const detenerFirma = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    lienzoRef.current.dibujando = false;
  };

  const limpiarFirma = () => {
    prepararLienzo();
  };

  const abrirFirma = () => {
    if (!titular) return;

    setFirmaError('');
    setFirmanteNombre((valorActual) => valorActual.trim() ? valorActual : formatTitleCase(`${titular.nombres_apellidos || ''}`.trim()));
    setFirmanteDocumento((valorActual) => valorActual.trim() || titular.numero_documento || '');
    setFirmanteEmail((valorActual) => valorActual.trim() || titular.correo_electronico || '');
    setFirmaModalAbierto(true);
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

  const recortarCanvasFirma = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let encontrado = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        // Detectar si el pixel tiene trazo (no transparente y no blanco de fondo)
        const esTrazo = a > 15 && (r < 240 || g < 240 || b < 240);
        if (esTrazo) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          encontrado = true;
        }
      }
    }

    if (!encontrado) {
      return canvas.toDataURL('image/png');
    }

    // Margen de cortesía proporcional en píxeles reales (evita cortar terminaciones de línea)
    const padding = 12;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropMaxX = Math.min(width, maxX + padding + 1);
    const cropMaxY = Math.min(height, maxY + padding + 1);
    const cropWidth = Math.max(1, cropMaxX - cropX);
    const cropHeight = Math.max(1, cropMaxY - cropY);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return canvas.toDataURL('image/png');

    // Copiar exclusivamente el área delimitada del trazo con fondo transparente
    croppedCtx.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return croppedCanvas.toDataURL('image/png');
  };

  const guardarFirmaPaquete = async () => {
    if (!firmanteNombre.trim() || !firmanteDocumento.trim() || !firmanteEmail.trim()) {
      setFirmaError('Por favor, completa los datos del firmante.');
      return;
    }

    if (!aceptoTerminosFirma) {
      setFirmaError('Debes aceptar la declaración antes de firmar.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !firmaDibujada) {
      setFirmaError('Debes registrar tu firma antes de guardar.');
      return;
    }

    setSigning(true);
    setFirmaError('');
    try {
      const firmaImagen = recortarCanvasFirma(canvas);
      await api.firmarPaquete(token, {
        firmanteNombre: firmanteNombre.trim(),
        firmanteDocumento: firmanteDocumento.trim(),
        firmanteEmail: firmanteEmail.trim(),
        aceptaTerminos: true,
        ip: '127.0.0.1',
        userAgent: navigator.userAgent,
        firmaImagen,
      });

      const fichaId = fichaMadreId || localStorage.getItem('fichaMadreId');
      if (fichaId) {
        await cargarDocumentos(fichaId);
      }
      setFirmaModalAbierto(false);
      setNotice({ type: 'success', message: 'Tu firma fue guardada en el paquete de documentos.' });
    } catch (err: any) {
      console.error(err);
      setFirmaError(err.message || 'No fue posible completar la firma del paquete.');
    } finally {
      setSigning(false);
    }
  };

  const handlePerfilCompletado = async () => {
    setNotice({ type: 'success', message: '¡Perfil completado! Ahora puedes revisar y firmar tus documentos.' });
    const fichaId = fichaMadreId || localStorage.getItem('fichaMadreId');
    if (fichaId) {
      await cargarDocumentos(fichaId);
    }
    setEtapa('firma');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Salir de la sesión (borrar localStorage y redirigir)
  const handleLogout = () => {
    localStorage.removeItem('fichaMadreId');
    localStorage.removeItem('tokenAcceso');
    localStorage.removeItem('tokenAuth');
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#061325] text-neutral-100 font-sans">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-neutral-400">Verificando acceso y cargando datos...</p>
      </div>
    );
  }

  // Si hay error
  if (error || !perfil) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#061325] px-6 text-neutral-100 font-sans text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900/30 flex items-center justify-center text-red-500 mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Acceso No Autorizado</h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6">{error || 'El enlace que usaste es inválido o expiró.'}</p>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-200 rounded-xl text-sm transition-all"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-screen bg-[#061325] text-neutral-100 font-sans">
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
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold opacity-80 hover:opacity-100">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="flex flex-col min-h-screen w-full">
        <header className="flex items-center justify-between gap-4 border-b border-neutral-900 px-6 md:px-10 py-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold font-mono">{codigo}</span>
            <span className="hidden md:inline text-neutral-700">•</span>
            <span className="hidden md:inline text-sm text-neutral-400">
              {titular?.nombres_apellidos || 'Inversionista'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Salir
          </button>
        </header>

        {/* 2. PANTALLA PRINCIPAL */}
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-5xl mx-auto w-full">
            {procesoFinalizado ? (
              <div className="text-center space-y-6 py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500 text-violet-400 mb-4 animate-bounce">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">¡Proceso Completado!</h2>
                <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Has completado exitosamente tu perfil y has firmado los documentos de forma electrónica. Tu asesor ya ha sido notificado para revisar tu ficha.
                </p>
                <div className="pt-6">
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 font-medium text-sm transition-all"
                  >
                    Finalizar Sesión Seguro
                  </button>
                </div>
              </div>
            ) : etapa === 'perfil' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Completa tu perfil de inversionista</h2>
                  <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                    Llena los {7} pasos con tu información. Puedes guardar tu avance y continuar en cualquier momento.
                  </p>
                </div>
                <FichaMadreWizard
                  fichaMadreId={fichaMadreId || localStorage.getItem('fichaMadreId') || ''}
                  initial={inversionista}
                  onSaved={(respuesta) => setPerfil(respuesta)}
                  onComplete={handlePerfilCompletado}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Revisión y firma del paquete</h2>
                    <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                      Este enlace incluye {documentosPaquete.length} documento{documentosPaquete.length === 1 ? '' : 's'} definidos por el analista para firmar en una sola acción.
                    </p>
                  </div>
                  <button
                    onClick={() => setEtapa('perfil')}
                    className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all text-xs font-semibold"
                  >
                    Editar perfil
                  </button>
                </div>

                <div className="backdrop-blur-md bg-neutral-900/30 border border-neutral-900 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-100">Paquete de firma</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        El analista definió este paquete para que puedas revisarlo y firmarlo de una sola vez.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-xs font-semibold">
                      {documentosFirmaCantidad} documentos
                    </span>
                  </div>

                  {documentosPaquete.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-sm text-neutral-400">
                      Todavía no hay documentos listos para firmar en este paquete. Tu analista los generará en breve.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documentosPaquete.map((doc, index) => {
                        const estaFirmado = doc.estado === 'FIRMADO' || (doc.firmas.length > 0 && doc.firmas.some((f) => f.estado === 'FIRMADO'));

                        return (
                          <div
                            key={doc.id}
                            className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4 flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                                <span>{obtenerEtiquetaFormato(doc, index)}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-neutral-100 line-clamp-2">
                                {doc.nombreArchivo}
                              </h4>
                              <p className="text-xs text-neutral-500 line-clamp-2">
                                {doc.documentoPlantilla?.nombre}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewDoc(doc)}
                                className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-all"
                                title="Previsualizar documento"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${estaFirmado
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  }`}
                              >
                                {estaFirmado ? 'Firmado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <input
                        id="acepto-terminos-paquete"
                        type="checkbox"
                        checked={aceptoTerminosFirma}
                        onChange={(e) => setAceptoTerminosFirma(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-violet-600 cursor-pointer accent-violet-600"
                        disabled={signing}
                      />
                      <label htmlFor="acepto-terminos-paquete" className="text-xs text-neutral-400 cursor-pointer leading-relaxed">
                        Declaro que he revisado la información mostrada y acepto firmar electrónicamente el paquete de documentos seleccionado.
                      </label>
                    </div>

                    {firmaError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        {firmaError}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setEtapa('perfil')}
                        className="px-5 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all font-medium text-sm"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={abrirFirma}
                        disabled={!aceptoTerminosFirma || signing || documentosPaquete.length === 0}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {signing ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <span>Firmar paquete</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE DOCUMENTO */}
      {previewDoc && (
        <div className="fixed inset-0 z-[85] bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 relative bg-[#e2e8f0] overflow-hidden flex flex-col items-center justify-center">
              {loadingPreview ? (
                <div className="flex flex-col items-center justify-center text-neutral-400 p-8 bg-[#050e1b] w-full h-full">
                  <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

      {firmaModalAbierto && (
        <div className="fixed inset-0 z-[80] bg-neutral-950/90 backdrop-blur-sm flex flex-col bg-white text-slate-900">
          {/* Header Superior */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">Firma digital del expediente</h3>
              <p className="text-xs text-slate-500 mt-0.5">Traza tu firma en el recuadro y valida tus datos para completar tu registro.</p>
            </div>
            <button
              type="button"
              onClick={() => setFirmaModalAbierto(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            >
              Volver a documentos
            </button>
          </div>

          {/* Cuerpo en 2 Columnas (Split View) */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Columna Izquierda: Lienzo de Firma */}
            <div className="lg:col-span-7 flex flex-col min-h-[300px] lg:min-h-0 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recuadro de firma manuscrita</span>
                <button
                  type="button"
                  onClick={limpiarFirma}
                  disabled={signing}
                  className="px-3 py-1 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                >
                  Limpiar trazo
                </button>
              </div>

              <div className="flex-1 min-h-[240px] w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 shadow-inner overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  className="h-full w-full touch-none cursor-crosshair"
                  onPointerDown={iniciarFirma}
                  onPointerMove={moverFirma}
                  onPointerUp={detenerFirma}
                  onPointerLeave={detenerFirma}
                  onPointerCancel={detenerFirma}
                />
                <span className="absolute bottom-3 left-4 text-xs text-slate-400 font-medium pointer-events-none select-none">
                  ✍️ Dibuja tu firma aquí con el mouse o con tu dedo
                </span>
              </div>
            </div>

            {/* Columna Derecha: Datos del Firmante y Envío */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Datos de validación del firmante</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Confirma la información que figurará en el certificado de firma.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nombre completo</label>
                  <input
                    type="text"
                    value={firmanteNombre}
                    onChange={(e) => setFirmanteNombre(e.target.value)}
                    onBlur={(e) => setFirmanteNombre(formatTitleCase(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-600 font-semibold shadow-sm"
                    placeholder="Nombres y apellidos"
                    disabled={signing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Documento</label>
                    <input
                      type="text"
                      value={firmanteDocumento}
                      onChange={(e) => setFirmanteDocumento(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-600 font-semibold shadow-sm"
                      placeholder="DNI / CE"
                      disabled={signing}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Correo electrónico</label>
                    <input
                      type="email"
                      value={firmanteEmail}
                      onChange={(e) => setFirmanteEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-600 font-semibold shadow-sm"
                      placeholder="correo@ejemplo.com"
                      disabled={signing}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm">
                  <input
                    id="terminos-firma-modal"
                    type="checkbox"
                    checked={aceptoTerminosFirma}
                    onChange={(e) => setAceptoTerminosFirma(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600 cursor-pointer"
                    disabled={signing}
                  />
                  <label htmlFor="terminos-firma-modal" className="text-xs leading-relaxed text-slate-600 cursor-pointer font-medium">
                    Declaro que he revisado la información mostrada y autorizo la firma electrónica de todo el paquete de documentos.
                  </label>
                </div>

                {firmaError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl">
                    {firmaError}
                  </p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFirmaModalAbierto(false)}
                  disabled={signing}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarFirmaPaquete}
                  disabled={signing || !aceptoTerminosFirma}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-3 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {signing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Firmando y enviando...</span>
                    </>
                  ) : (
                    <span>Firmar y Enviar Expediente</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
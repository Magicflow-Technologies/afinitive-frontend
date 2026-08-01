'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, FichaMadre, FichaFormulario, DocumentoGeneral } from '@/services/api';
import FormularioDinamico from '@/components/FormularioDinamico';
import { formatTitleCase } from '@/lib/formatters';

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

const obtenerOrdenFormulario = (formulario: FichaFormulario) => {
  const nombre = formulario.formularioPlantilla?.nombre?.toLowerCase() ?? '';

  if (nombre.includes('datos personales')) return 1;
  if (nombre.includes('domicilio') || nombre.includes('residencia')) return 2;
  if (nombre.includes('pep') || nombre.includes('conyuge') || nombre.includes('cónyuge')) return 3;
  if (nombre.includes('financiera') || nombre.includes('inversion') || nombre.includes('inversión')) return 4;

  return 99;
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
  const [fichaMadre, setFichaMadre] = useState<FichaMadre | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activeFormDetail, setActiveFormDetail] = useState<FichaFormulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lienzoRef = useRef<{ dibujando: boolean; ultimaX: number; ultimaY: number }>({
    dibujando: false,
    ultimaX: 0,
    ultimaY: 0,
  });

  const formulariosOrdenados = useMemo(() => {
    const formularios = fichaMadre?.fichasFormulario || [];

    return [...formularios].sort((a, b) => {
      const ordenA = obtenerOrdenFormulario(a);
      const ordenB = obtenerOrdenFormulario(b);

      if (ordenA !== ordenB) return ordenA - ordenB;

      return (a.formularioPlantilla?.orden ?? 0) - (b.formularioPlantilla?.orden ?? 0);
    });
  }, [fichaMadre]);

  const formularios = formulariosOrdenados;
  const documentos = fichaMadre?.documentos || [];
  const documentosOrdenados = useMemo(() => {
    return [...documentos].sort((a, b) => {
      const ordenA = obtenerOrdenDocumento(a);
      const ordenB = obtenerOrdenDocumento(b);

      if (ordenA !== ordenB) return ordenA - ordenB;

      return a.nombreArchivo.localeCompare(b.nombreArchivo);
    });
  }, [documentos]);
  const documentosPaquete = useMemo(() => {
    const limiteValido = [2, 5, 7].includes(documentosFirmaCantidad) ? documentosFirmaCantidad : 5;
    return documentosOrdenados.slice(0, limiteValido);
  }, [documentosOrdenados, documentosFirmaCantidad]);
  const totalSteps = formularios.length + 1; // Formularios + Firma de documentos

  // Verificar si ya completó todo el proceso (todos los formularios e items de firma)
  const todosFormulariosListos = formularios.every((f) => f.estado === 'COMPLETADO');
  const todosDocumentosFirmados = documentosPaquete.length > 0 && documentosPaquete.every((d) => 
    d.firmas.length > 0 && d.firmas.every((f) => f.estado === 'FIRMADO')
  );
  const procesoFinalizado = todosFormulariosListos && (documentosPaquete.length === 0 || todosDocumentosFirmados);

  // 1. Cargar la Ficha Madre y validar sesión
  useEffect(() => {
    if (!token) return;
    
    const inicializar = async () => {
      try {
        setLoading(true);
        let currentFichaMadreId = localStorage.getItem('fichaMadreId');
        let currentToken = localStorage.getItem('tokenAcceso');

        // Caso 1: Inicio de sesión a través de usuario/contraseña (token es virtual 'session')
        if (token === 'session') {
          if (!currentFichaMadreId) {
            throw new Error('No hay una sesión activa de onboarding. Por favor inicia sesión.');
          }
          const cantidadGuardada = Number(localStorage.getItem('documentosFirmaCantidad') || '5');
          setDocumentosFirmaCantidad([2, 5, 7].includes(cantidadGuardada) ? cantidadGuardada : 5);
          const data = await api.obtenerFichaMadre(currentFichaMadreId);
          setFichaMadre(data);
          determinarPasoInicial(data);
          setLoading(false);
          return;
        }

        // Caso 2: Inicio de sesión a través de magic link token (URL con token real de un solo uso)
        if (currentToken === token && currentFichaMadreId) {
          try {
            const cantidadGuardada = Number(localStorage.getItem('documentosFirmaCantidad') || '5');
            setDocumentosFirmaCantidad([2, 5, 7].includes(cantidadGuardada) ? cantidadGuardada : 5);
            const data = await api.obtenerFichaMadre(currentFichaMadreId);
            setFichaMadre(data);
            determinarPasoInicial(data);
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
        setDocumentosFirmaCantidad([2, 5, 7].includes(tokenValido.documentosFirmaCantidad ?? 5) ? (tokenValido.documentosFirmaCantidad as 2 | 5 | 7) : 5);

        const data = await api.obtenerFichaMadre(tokenValido.fichaMadreId);
        setFichaMadre(data);
        determinarPasoInicial(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Tu sesión ha expirado o el token de acceso no es válido.');
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, [token]);

  // Determinar en qué paso debe comenzar el cliente
  const determinarPasoInicial = (data: FichaMadre) => {
    if (!data.fichasFormulario) return;

    const formularios = [...data.fichasFormulario].sort((a, b) => {
      const ordenA = obtenerOrdenFormulario(a);
      const ordenB = obtenerOrdenFormulario(b);

      if (ordenA !== ordenB) return ordenA - ordenB;

      return (a.formularioPlantilla?.orden ?? 0) - (b.formularioPlantilla?.orden ?? 0);
    });

    // Buscar el primer formulario que no esté COMPLETADO
    const idx = formularios.findIndex((f) => f.estado !== 'COMPLETADO');
    if (idx !== -1) {
      setActiveStep(idx);
    } else {
      // Si todos están completados, ir al paso de firma (el último)
      setActiveStep(formularios.length);
    }
  };

  // 2. Cargar el detalle del formulario activo (campos y respuestas anteriores)
  useEffect(() => {
    if (!fichaMadre || !formulariosOrdenados) return;

    // Si el paso activo corresponde a un formulario
    if (activeStep < formulariosOrdenados.length) {
      const formId = formulariosOrdenados[activeStep].id;
      
      const cargarFormulario = async () => {
        try {
          setSubmitting(true);
          const detail = await api.obtenerDetalleFormulario(formId);
          setActiveFormDetail(detail);
        } catch (err: any) {
          console.error(err);
          setError('Error al cargar los campos del formulario.');
        } finally {
          setSubmitting(false);
        }
      };

      cargarFormulario();
    } else {
      // Paso de firma de documentos, no necesitamos detalle de formulario
      setActiveFormDetail(null);
    }
  }, [activeStep, fichaMadre, formulariosOrdenados]);

  // Manejador para enviar respuestas de un formulario
  const handleFormSubmit = async (valores: Array<{ campoFormularioId: string; valor: string }>) => {
    if (!activeFormDetail || !fichaMadre) return;
    
    setSubmitting(true);
    try {
      // 1. Guardar respuestas en batch
      const respuestasGuardadas = valores.map((v) => ({
        fichaFormularioId: activeFormDetail.id,
        campoFormularioId: v.campoFormularioId,
        valor: v.valor,
      }));
      await api.guardarRespuestasBatch(respuestasGuardadas);

      // 2. Cambiar estado del formulario a COMPLETADO
      await api.actualizarEstadoFormulario(activeFormDetail.id, 'COMPLETADO');

      // 3. Recargar la ficha madre para reflejar los cambios
      const updatedFicha = await api.obtenerFichaMadre(fichaMadre.id);
      setFichaMadre(updatedFicha);

      // 4. Pasar al siguiente paso
      setActiveStep((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setNotice({ type: 'error', message: err.message || 'No fue posible guardar tus respuestas.' });
    } finally {
      setSubmitting(false);
    }
  };

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
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    lienzoRef.current = { dibujando: false, ultimaX: 0, ultimaY: 0 };
    setFirmaDibujada(false);
  };

  useEffect(() => {
    if (!firmaModalAbierto) return;

    const frame = window.requestAnimationFrame(prepararLienzo);
    const onResize = () => prepararLienzo();

    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
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
    if (!fichaMadre) return;

    setFirmaError('');
    setFirmanteNombre((valorActual) =>
      valorActual.trim()
        ? valorActual
        : formatTitleCase(`${fichaMadre.cliente.persona.nombres} ${fichaMadre.cliente.persona.apellidos}`.trim())
    );
    setFirmanteEmail((valorActual) => valorActual.trim() || fichaMadre.cliente.persona.correo || '');
    setFirmanteDocumento((valorActual) => valorActual.trim() || '');
    setFirmaModalAbierto(true);
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

    if (!fichaMadre) return;

    setSigning(true);
    setFirmaError('');
    try {
      const firmaImagen = canvas.toDataURL('image/png');
      await api.firmarPaquete(token, {
        firmanteNombre: firmanteNombre.trim(),
        firmanteDocumento: firmanteDocumento.trim(),
        firmanteEmail: firmanteEmail.trim(),
        aceptaTerminos: true,
        ip: '127.0.0.1',
        userAgent: navigator.userAgent,
        firmaImagen,
      });

      const updated = await api.obtenerFichaMadre(fichaMadre.id);
      setFichaMadre(updated);
      determinarPasoInicial(updated);
      setFirmaModalAbierto(false);
      setNotice({ type: 'success', message: 'Tu firma fue guardada en el paquete de documentos.' });
    } catch (err: any) {
      console.error(err);
      setFirmaError(err.message || 'No fue posible completar la firma del paquete.');
    } finally {
      setSigning(false);
    }
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
  if (error || !fichaMadre) {
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
          className={`fixed top-4 right-4 z-[60] w-full max-w-md rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
            notice.type === 'success'
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
      
      {/* 1. SIDEBAR DE PROGRESO (Visible en desktop) */}
      <aside className="hidden md:flex md:w-80 border-r border-neutral-900 bg-neutral-900/10 backdrop-blur-xl flex-col shrink-0 p-8 justify-between">
        <div className="space-y-8">
          {/* Cabecera Sidebar */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold font-mono">
                {fichaMadre.codigo}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100">
              {fichaMadre.cliente.persona.nombres} {fichaMadre.cliente.persona.apellidos}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Onboarding en progreso</p>
          </div>

          {/* Lista de Pasos */}
          <nav className="space-y-4">
            {formularios.map((form, index) => {
              const isActive = index === activeStep;
              const isCompleted = form.estado === 'COMPLETADO';
              
              return (
                <button
                  key={form.id}
                  onClick={() => {
                    // Solo permitir navegar a pasos completados o al paso activo
                    if (isCompleted || index <= activeStep) {
                      setActiveStep(index);
                    }
                  }}
                  className={`w-full flex items-start gap-3.5 text-left p-3.5 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-violet-600/15 border-violet-500/30 text-white font-medium shadow-md shadow-violet-950/20'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </span>
                    ) : isActive ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full border border-violet-500 text-violet-400">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full border border-neutral-800 text-neutral-600 text-xs">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold leading-none text-neutral-500 mb-1">Paso {index + 1}</span>
                    <span className="block text-sm leading-snug">{form.formularioPlantilla.nombre}</span>
                  </div>
                </button>
              );
            })}

            {/* Paso de Firma */}
            <button
              onClick={() => {
                if (todosFormulariosListos) {
                  setActiveStep(formularios.length);
                }
              }}
              disabled={!todosFormulariosListos}
              className={`w-full flex items-start gap-3.5 text-left p-3.5 rounded-2xl transition-all border ${
                activeStep === formularios.length
                  ? 'bg-violet-600/15 border-violet-500/30 text-white font-medium shadow-md'
                  : 'border-transparent text-neutral-400 disabled:opacity-40 disabled:pointer-events-none'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {todosDocumentosFirmados ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                ) : activeStep === formularios.length ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full border border-violet-500 text-violet-400">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full border border-neutral-850 text-neutral-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-semibold leading-none text-neutral-500 mb-1">Final</span>
                <span className="block text-sm leading-snug">Firma de Documentos</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Salir de la sesión
        </button>
      </aside>

      {/* 2. PANTALLA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-h-screen bg-[#061325] p-6 md:p-12 overflow-y-auto relative">
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[350px] h-[350px] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto w-full my-auto z-10">
          
          {/* Si el onboarding ya está totalmente completado */}
          {procesoFinalizado ? (
            <div className="text-center space-y-6 py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500 text-violet-400 mb-4 animate-bounce">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">¡Proceso Completado!</h2>
              <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                Has completado exitosamente todos los formularios requeridos y has firmado los documentos de forma electrónica. Tu asesor ya ha sido notificado para revisar tu ficha.
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
          ) : (
            <>
              {/* Progreso en Móvil (no se ve en desktop) */}
              <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-neutral-900">
                <div>
                  <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold font-mono">
                    Paso {activeStep + 1} de {totalSteps}
                  </span>
                  <h4 className="text-sm font-bold mt-0.5">
                    {activeStep < formularios.length 
                      ? formularios[activeStep].formularioPlantilla.nombre 
                      : 'Firma de Documentos'
                    }
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-violet-400">
                  {Math.round(((activeStep) / totalSteps) * 100)}%
                </span>
              </div>

              {/* Si es un Formulario Dinámico */}
              {activeStep < formularios.length && activeFormDetail ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
                      {activeFormDetail.formularioPlantilla.nombre}
                    </h2>
                    {activeFormDetail.formularioPlantilla.descripcion && (
                      <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                        {activeFormDetail.formularioPlantilla.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="backdrop-blur-md bg-neutral-900/30 border border-neutral-900 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <FormularioDinamico
                      campos={activeFormDetail.formularioPlantilla.camposPlantilla || []}
                      respuestasIniciales={activeFormDetail.respuestas || []}
                      onSubmit={handleFormSubmit}
                      onBack={activeStep > 0 ? () => setActiveStep((prev) => prev - 1) : undefined}
                      loading={submitting}
                    />
                  </div>
                </div>
              ) : activeStep === formularios.length ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
                      Revisión y firma del paquete
                    </h2>
                    <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                      Este enlace incluye {documentosPaquete.length} documento{documentosPaquete.length === 1 ? '' : 's'} definidos por el analista para firmar en una sola acción.
                    </p>
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
                        Todavía no hay documentos listos para firmar en este paquete.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentosPaquete.map((doc, index) => {
                          const estaFirmado = doc.firmas.length > 0 && doc.firmas.every((f) => f.estado === 'FIRMADO');

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
                              <span
                                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  estaFirmado
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                }`}
                              >
                                {estaFirmado ? 'Firmado' : 'Pendiente'}
                              </span>
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
                          onClick={() => setActiveStep(formularios.length - 1)}
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
              ) : null}
            </>
          )}
        </div>
      </main>

      {firmaModalAbierto && (
        <div className="fixed inset-0 z-[80] bg-neutral-950/95 backdrop-blur-sm">
          <div className="flex h-full w-full flex-col bg-white text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Firma digital</h3>
                <p className="text-xs text-slate-500">Traza tu firma con el dedo o con el mouse y guarda el paquete.</p>
              </div>
              <button
                type="button"
                onClick={() => setFirmaModalAbierto(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="grid flex-1 min-h-0 grid-rows-[1fr_auto]">
              <div className="p-4">
                <div className="h-full min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-inner">
                  <canvas
                    ref={canvasRef}
                    className="h-full w-full touch-none cursor-crosshair"
                    onPointerDown={iniciarFirma}
                    onPointerMove={moverFirma}
                    onPointerUp={detenerFirma}
                    onPointerLeave={detenerFirma}
                    onPointerCancel={detenerFirma}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre completo</label>
                    <input
                      type="text"
                      value={firmanteNombre}
                      onChange={(e) => setFirmanteNombre(e.target.value)}
                      onBlur={(e) => setFirmanteNombre(formatTitleCase(e.target.value))}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                      placeholder="Nombres y apellidos"
                      disabled={signing}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documento</label>
                    <input
                      type="text"
                      value={firmanteDocumento}
                      onChange={(e) => setFirmanteDocumento(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                      placeholder="DNI / CE / Pasaporte"
                      disabled={signing}
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo electrónico</label>
                  <input
                    type="email"
                    value={firmanteEmail}
                    onChange={(e) => setFirmanteEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                    placeholder="correo@ejemplo.com"
                    disabled={signing}
                  />
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <input
                    id="terminos-firma-modal"
                    type="checkbox"
                    checked={aceptoTerminosFirma}
                    onChange={(e) => setAceptoTerminosFirma(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600"
                    disabled={signing}
                  />
                  <label htmlFor="terminos-firma-modal" className="text-xs leading-relaxed text-slate-600">
                    Declaro que estoy de acuerdo con la información mostrada y autorizo la firma electrónica del paquete de documentos.
                  </label>
                </div>

                {firmaError && (
                  <p className="mt-3 text-xs font-medium text-rose-600">{firmaError}</p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    disabled={signing}
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={guardarFirmaPaquete}
                    disabled={signing}
                    className="flex-[2] rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {signing ? 'Guardando...' : 'Guardar firma'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


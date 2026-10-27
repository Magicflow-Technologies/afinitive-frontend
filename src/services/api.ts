import type { SaveInversionistaPayload, FichaMadreResponse } from '@/lib/ficha-madre.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Persona {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  direccion?: string;
}

export interface Cliente {
  id: string;
  persona: Persona;
}

export interface Empleado {
  id: string;
  persona: Persona;
  cargo: string;
  area?: string;
}

export interface Firma {
  id: string;
  documentoGeneralId: string;
  tipo: 'SIMPLE' | 'ELECTRONICA' | 'AVANZADA';
  estado: 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO';
  fechaFirma?: string;
  firmanteNombre?: string;
  firmanteDocumento?: string;
  firmanteEmail?: string;
}

export interface DocumentoPlantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  archivo: string;
  formato?: string;
  version?: number;
  activo?: boolean;
}

export interface Fideicomiso {
  id: string;
  nombre: string;
  fideicomitente?: string;
  emisorFiduciario?: string;
  patrimonioNombreLargo?: string;
  denominacionValores?: string;
  tipoValor?: string;
  monedaDefault?: string;
  tasaInteresDefault?: string;
  plazoEmisionDefault?: string;
  notario?: string;
  ruc?: string;
  titularCuenta?: string;
  bancoNombre?: string;
  numeroCuenta?: string;
  cuentaCci?: string;
  direccionFiduciario?: string;
  representanteLegal?: string;
  correoOpCorilDefault?: string;
  correoOpCorfidDefault?: string;
  activo?: boolean;
  _count?: { inversiones: number };
}

export interface InversionFideicomiso {
  id: string;
  fichaMadreId: string;
  fideicomisoId: string;
  moneda: string;
  monto: string;
  montoLetras?: string;
  tasaInteres?: string;
  plazoEmision?: string;
  serieEmision?: string;
  cantidadValores?: string;
  vigenciaInstruccion?: string;
  bancoDestino?: string;
  numeroCuentaDestino?: string;
  cuentaCciDestino?: string;
  titularCuentaDestino?: string;
  vencimiento?: string;
  correoOpCoril?: string;
  correoOpCorfid?: string;
  enlaceCronograma?: string;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'FIRMADO' | 'CANCELADO';
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  fideicomiso?: Fideicomiso;
  documentos?: DocumentoGeneral[];
}

export interface InversionPortalItem {
  id: string;
  fideicomisoId: string;
  fideicomisoNombre: string;
  patrimonioNombreLargo?: string;
  emisorFiduciario?: string;
  moneda: string;
  monto: number;
  montoLetras?: string;
  tasaInteres: string;
  plazoEmision: string;
  vencimiento: string;
  correoOpCoril: string;
  correoOpCorfid: string;
  enlaceCronograma: string;
  bancoDestino?: string;
  numeroCuentaDestino?: string;
  cuentaCciDestino?: string;
  titularCuentaDestino?: string;
  estado: string;
  documentos: Array<{
    id: string;
    nombreArchivo: string;
    estado: string;
    rutaArchivo: string;
    esFirmado: boolean;
  }>;
  createdAt: string;
}

export interface PortalInversionistaData {
  cliente: {
    id: string;
    nombres: string;
    apellidos: string;
    numeroDocumento: string;
    tipoDocumento: string;
    correo: string;
    telefono?: string;
  };
  fichaMadreId: string | null;
  codigoExpediente: string | null;
  estadoExpediente: string;
  totalInvertidoUSD: number;
  totalInvertidoPEN: number;
  totalInversiones: number;
  tasaPromedio: string;
  inversiones: InversionPortalItem[];
  documentosGenerales: Array<{
    id: string;
    nombreArchivo: string;
    estado: string;
    rutaArchivo: string;
    inversionFideicomisoId?: string;
    esFirmado: boolean;
  }>;
}

export interface ResultadoImportacionInversiones {
  totalFilas: number;
  totalExitosos: number;
  totalErrores: number;
  exitosos: Array<{
    fila: number;
    inversionista: string;
    fideicomiso: string;
    monto: number;
    moneda: string;
    tasa: string;
    vencimiento: string;
    accion: 'CREADO' | 'ACTUALIZADO';
  }>;
  errores: Array<{
    fila: number;
    inversionista: string;
    motivo: string;
  }>;
}

export interface DocumentoGeneral {
  id: string;
  fichaMadreId: string;
  documentoPlantillaId: string;
  inversionFideicomisoId?: string;
  nombreArchivo: string;
  rutaArchivo: string;
  estado: 'PENDIENTE' | 'GENERADO' | 'PENDIENTE_FIRMA' | 'PARCIAL_FIRMADO' | 'FIRMADO' | 'ANULADO';
  documentoPlantilla: {
    id: string;
    nombre: string;
    descripcion?: string;
    archivo?: string;
  };
  firmas: Firma[];
  inversionFideicomiso?: InversionFideicomiso;
}

export interface FichaMadre {
  id: string;
  codigo: string;
  clienteId: string;
  empleadoId: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  empleado: Empleado;
  documentos?: DocumentoGeneral[];
}

export interface TokenAcceso {
  id: string;
  fichaMadreId: string;
  token: string;
  emailDestino: string;
  documentosFirmaCantidad?: number;
  documentos?: { documentoGeneralId: string }[];
  estado: 'ACTIVO' | 'USADO' | 'EXPIRADO' | 'REVOCADO';
  expiraEn: string;
  usadoEn?: string;
  intentos?: number;
  maxIntentos?: number;
}

export interface CreateFichaInicialPayload {
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  empleadoId: string;
  observaciones?: string;
}

export interface CreateTokenAccesoPayload {
  fichaMadreId: string;
  emailDestino: string;
  documentosFirmaCantidad?: number;
  documentosIds?: string[];
}

export interface SignPackagePayload {
  firmanteNombre: string;
  firmanteDocumento: string;
  firmanteEmail: string;
  aceptaTerminos: boolean;
  ip?: string;
  userAgent?: string;
  firmaImagen?: string;
}

// Función auxiliar para peticiones HTTP
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la petición: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  /**
   * Valida un token de acceso del cliente.
   */
  validarToken: (token: string) => {
    return fetchAPI<TokenAcceso>(`/tokens-acceso/validate/${token}`);
  },

  /**
   * Obtiene la Ficha Madre reconstruida (perfil inversionista + metadata).
   */
  obtenerFichaMadre: (fichaMadreId: string) => {
    return fetchAPI<FichaMadreResponse>(`/fichas-madre/${fichaMadreId}`);
  },

  /**
   * Guarda (upsert) el perfil completo del inversionista de una Ficha Madre.
   */
  guardarInversionista: (fichaMadreId: string, payload: SaveInversionistaPayload) => {
    return fetchAPI<FichaMadreResponse>(`/fichas-madre/${fichaMadreId}/inversionista`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Firma electrónicamente un documento.
   */
  firmarDocumento: (
    firmaId: string,
    datos: {
      firmanteNombre: string;
      firmanteDocumento: string;
      firmanteEmail: string;
      ip?: string;
      userAgent?: string;
    }
  ) => {
    return fetchAPI<Firma>(`/firmas/${firmaId}/sign`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  /**
   * Inicia sesión con usuario y contraseña (puede requerir 2FA).
   */
  login: (username: string, password: string) => {
    return fetchAPI<
      | {
          requires2FA?: false;
          access_token: string;
          user: {
            id: string;
            username: string;
            rol: string;
            persona: {
              id: string;
              nombres: string;
              apellidos: string;
              correo: string;
            };
          };
        }
      | {
          requires2FA: true;
          challengeToken: string;
          metodo: string;
          destino: string;
          message: string;
        }
    >('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Valida el código 2FA emitido al correo.
   */
  verify2FA: (challengeToken: string, codigo: string) => {
    return fetchAPI<{
      access_token: string;
      user: {
        id: string;
        username: string;
        rol: string;
        persona: {
          id: string;
          nombres: string;
          apellidos: string;
          correo: string;
        };
      };
    }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, codigo }),
    });
  },

  /**
   * Reenvía un nuevo código 2FA.
   */
  resend2FA: (challengeToken: string) => {
    return fetchAPI<{ message: string; destino: string }>('/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ challengeToken }),
    });
  },

  /**
   * Crea un usuario para un cliente existente.
   */
  crearUsuarioCliente: (payload: {
    clienteId: string;
    username: string;
    password: string;
    requiere2FA?: boolean;
  }) => {
    return fetchAPI<any>('/usuarios/cliente', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Restablece la contraseña de un usuario.
   */
  resetPasswordUsuario: (usuarioId: string, newPassword: string) => {
    return fetchAPI<any>(`/usuarios/${usuarioId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  /**
   * Alterna el estado activo / inactivo de un usuario.
   */
  toggleActivoUsuario: (usuarioId: string) => {
    return fetchAPI<any>(`/usuarios/${usuarioId}/toggle-activo`, {
      method: 'PUT',
    });
  },

  /**
   * Alterna la exigencia de 2FA para un usuario.
   */
  toggle2FAUsuario: (usuarioId: string) => {
    return fetchAPI<any>(`/usuarios/${usuarioId}/toggle-2fa`, {
      method: 'PUT',
    });
  },

  /**
   * Obtiene todos los usuarios del sistema (internos y clientes) con rol y persona.
   */
  obtenerUsuarios: () => {
    return fetchAPI<any[]>('/usuarios');
  },

  /**
   * Obtiene todos los roles disponibles en el sistema.
   */
  obtenerRoles: () => {
    return fetchAPI<any[]>('/roles');
  },

  /**
   * Crea un usuario interno del sistema (Analista, Operador, Admin, etc.)
   */
  crearUsuarioSistema: (payload: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    cargo: string;
    area?: string;
    rolId: string;
    username: string;
    password: string;
    requiere2FA?: boolean;
  }) => {
    return fetchAPI<any>('/usuarios/sistema', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Actualiza el rol asignado a un usuario interno.
   */
  cambiarRolUsuario: (usuarioId: string, rolId: string) => {
    return fetchAPI<any>(`/usuarios/${usuarioId}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ rolId }),
    });
  },

  /**
   * Obtiene la lista de clientes registrados (con su relación de usuario).
   */
  obtenerClientes: () => {
    return fetchAPI<any[]>('/clientes');
  },

  /**
   * Obtiene la lista de empleados registrados.
   */
  obtenerEmpleados: () => {
    return fetchAPI<Empleado[]>('/empleados');
  },

  /**
   * Crea una ficha inicial con datos mínimos del cliente.
   */
  crearFichaInicial: (payload: CreateFichaInicialPayload) => {
    return fetchAPI<FichaMadre>('/fichas-madre/inicial', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Crea un token de acceso para el cliente.
   */
  crearTokenAcceso: (payload: CreateTokenAccesoPayload) => {
    return fetchAPI<TokenAcceso>('/tokens-acceso', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Revoca un token de acceso.
   */
  revocarTokenAcceso: (tokenId: string) => {
    return fetchAPI<TokenAcceso>(`/tokens-acceso/${tokenId}/revoke`, {
      method: 'PUT',
    });
  },

  /**
   * Reactiva un token de acceso.
   */
  reactivarTokenAcceso: (tokenId: string) => {
    return fetchAPI<TokenAcceso>(`/tokens-acceso/${tokenId}/reactivate`, {
      method: 'PUT',
    });
  },

  /**
   * Marca un token como consumido/usado tras completar la Ficha Madre.
   */
  consumirToken: (token: string) => {
    return fetchAPI<TokenAcceso>(`/tokens-acceso/consume/${token}`, {
      method: 'PUT',
    });
  },

  /**
   * Firma en bloque el paquete asociado a un token de acceso.
   */
  firmarPaquete: (token: string, datos: SignPackagePayload) => {
    return fetchAPI<any>(`/firmas/package/${token}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  /**
   * Obtiene todos los tokens de acceso.
   */
  obtenerTokensAcceso: () => {
    return fetchAPI<TokenAcceso[]>('/tokens-acceso');
  },

  /**
   * Obtiene el detalle de un cliente específico por su ID.
   */
  obtenerClienteDetalle: (clienteId: string) => {
    return fetchAPI<any>(`/clientes/${clienteId}`);
  },

  /**
   * Obtiene la lista de todos los expedientes Ficha Madre.
   */
  obtenerFichasMadre: () => {
    return fetchAPI<FichaMadre[]>('/fichas-madre');
  },

  /**
   * Dispara el autocompletado inteligente de los 7 formatos.
   */
  autocompletarFormatos: (fichaMadreId: string) => {
    return fetchAPI<any[]>(`/documentos-generales/generate/${fichaMadreId}`, {
      method: 'POST',
    });
  },

  /**
   * Obtiene el contenido HTML de la previsualización del documento.
   */
  obtenerDocumentoPreview: (documentoId: string) => {
    return fetchAPI<{ html?: string | null; url?: string | null }>(`/documentos-generales/${documentoId}/preview`);
  },

  /**
   * Lista los documentos generados de una Ficha Madre (con plantilla y firmas).
   */
  obtenerDocumentosFichaMadre: (fichaMadreId: string) => {
    return fetchAPI<DocumentoGeneral[]>(`/documentos-generales?fichaMadreId=${fichaMadreId}`);
  },

  /**
   * Descarga un PDF consolidado con los formatos 01 al 05.
   */
  descargarPdfFormatos: async (fichaMadreId: string) => {
    const response = await fetch(`${API_BASE_URL}/documentos-generales/pdf/${fichaMadreId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la petición: ${response.status}`);
    }
    return response.blob();
  },

  /**
   * Actualiza el estado del expediente Ficha Madre.
   */
  actualizarEstadoFichaMadre: (fichaMadreId: string, estado: FichaMadre['estado']) => {
    return fetchAPI<FichaMadre>(`/fichas-madre/${fichaMadreId}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  },

  /**
   * Sube el Excel de clientes para la importación masiva.
   */
  importarExcelMasivo: async (file: File, empleadoId?: string): Promise<{
    totalLeidos: number;
    totalExitosos: number;
    totalFallidos: number;
    exitosos: Array<{
      fila: number;
      fichaMadreId: string;
      codigoFicha: string;
      documento: string;
      cliente: string;
    }>;
    errores: Array<{
      fila: number;
      documento?: string;
      cliente?: string;
      motivo: string;
    }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (empleadoId) {
      formData.append('empleadoId', empleadoId);
    }

    const response = await fetch(`${API_BASE_URL}/importacion-masiva/excel`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la importación: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene la lista de plantillas de documentos del sistema ordenadas.
   */
  obtenerPlantillasDocumento: (): Promise<DocumentoPlantilla[]> => {
    return fetchAPI<DocumentoPlantilla[]>('/documentos-plantilla');
  },

  /**
   * Sube un documento/PDF histórico directamente a Supabase Storage y lo asocia a la Ficha Madre como FIRMADO.
   */
  subirDocumentoHistorico: async (
    fichaMadreId: string,
    file: File,
    nombreArchivo?: string,
    documentoPlantillaId?: string,
    documentoGeneralId?: string,
    inversionFideicomisoId?: string,
  ): Promise<DocumentoGeneral> => {
    const formData = new FormData();
    formData.append('file', file);
    if (nombreArchivo) {
      formData.append('nombreArchivo', nombreArchivo);
    }
    if (documentoPlantillaId) {
      formData.append('documentoPlantillaId', documentoPlantillaId);
    }
    if (documentoGeneralId) {
      formData.append('documentoGeneralId', documentoGeneralId);
    }
    if (inversionFideicomisoId) {
      formData.append('inversionFideicomisoId', inversionFideicomisoId);
    }

    const response = await fetch(`${API_BASE_URL}/documentos-generales/upload-masivo/${fichaMadreId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al subir documento: ${response.status}`);
    }

    return response.json();
  },

  // --- Módulo Fideicomisos e Inversiones ---
  obtenerFideicomisosCatalogo: (): Promise<Fideicomiso[]> => {
    return fetchAPI<Fideicomiso[]>('/fideicomisos');
  },

  crearFideicomiso: (payload: Partial<Fideicomiso>): Promise<Fideicomiso> => {
    return fetchAPI<Fideicomiso>('/fideicomisos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  actualizarFideicomiso: (id: string, payload: Partial<Fideicomiso>): Promise<Fideicomiso> => {
    return fetchAPI<Fideicomiso>(`/fideicomisos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminarFideicomiso: (id: string): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>(`/fideicomisos/${id}`, {
      method: 'DELETE',
    });
  },

  obtenerInversionesFideicomiso: (fichaMadreId: string): Promise<InversionFideicomiso[]> => {
    return fetchAPI<InversionFideicomiso[]>(`/fideicomisos/expediente/${fichaMadreId}`);
  },

  asociarInversionFideicomiso: (payload: {
    fichaMadreId: string;
    fideicomisoId: string;
    monto: string;
    moneda?: string;
    montoLetras?: string;
    tasaInteres?: string;
    plazoEmision?: string;
    serieEmision?: string;
    cantidadValores?: string;
    vigenciaInstruccion?: string;
    bancoDestino?: string;
    numeroCuentaDestino?: string;
    cuentaCciDestino?: string;
    titularCuentaDestino?: string;
    vencimiento?: string;
    correoOpCoril?: string;
    correoOpCorfid?: string;
    enlaceCronograma?: string;
    observaciones?: string;
  }): Promise<InversionFideicomiso> => {
    return fetchAPI<InversionFideicomiso>('/fideicomisos/inversion', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  actualizarInversionFideicomiso: (
    id: string,
    payload: Partial<{
      monto: string;
      moneda: string;
      montoLetras: string;
      tasaInteres: string;
      plazoEmision: string;
      serieEmision: string;
      cantidadValores: string;
      vigenciaInstruccion: string;
      bancoDestino: string;
      numeroCuentaDestino: string;
      cuentaCciDestino: string;
      titularCuentaDestino: string;
      vencimiento: string;
      correoOpCoril: string;
      correoOpCorfid: string;
      enlaceCronograma: string;
      observaciones: string;
    }>,
  ): Promise<InversionFideicomiso> => {
    return fetchAPI<InversionFideicomiso>(`/fideicomisos/inversion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminarInversionFideicomiso: (id: string): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>(`/fideicomisos/inversion/${id}`, {
      method: 'DELETE',
    });
  },

  descargarPdfPackFideicomiso: async (inversionId: string) => {
    const response = await fetch(`${API_BASE_URL}/fideicomisos/inversion/${inversionId}/pdf-pack`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al descargar pack consolidado: ${response.status}`);
    }
    return response.blob();
  },

  obtenerPortalInversionista: (clienteId: string): Promise<PortalInversionistaData> => {
    return fetchAPI<PortalInversionistaData>(`/fideicomisos/portal/${clienteId}`);
  },

  importarInversionesFideicomisoMasivo: async (file: File): Promise<ResultadoImportacionInversiones> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/fideicomisos/importar-masivo`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al importar archivo de inversiones en fideicomisos');
    }
    return response.json();
  },
};


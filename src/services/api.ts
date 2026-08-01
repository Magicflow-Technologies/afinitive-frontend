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

export interface FormularioPlantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  version: number;
  orden: number;
  camposPlantilla?: CampoFormulario[];
}

export interface CampoFormulario {
  id: string;
  nombre: string;
  etiqueta: string;
  tipo: 'TEXTO' | 'NUMERO' | 'FECHA' | 'SELECT' | 'MULTISELECT' | 'CHECKBOX' | 'TEXTAREA' | 'EMAIL' | 'TELEFONO' | 'MONEDA';
  obligatorio: boolean;
  orden: number;
  placeholder?: string;
  helpText?: string;
  valorPorDefecto?: string;
  patronValidacion?: string;
  minLength?: number;
  maxLength?: number;
  opciones?: string[] | any; // Puede ser un JSON Array de strings o similar
}

export interface RespuestaCampo {
  id: string;
  fichaFormularioId: string;
  campoFormularioId: string;
  valor: string;
  campoFormulario?: CampoFormulario;
}

export interface FichaFormulario {
  id: string;
  fichaMadreId: string;
  formularioPlantillaId: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';
  intentos: number;
  fechaInicio?: string;
  fechaFinalizacion?: string;
  formularioPlantilla: FormularioPlantilla;
  respuestas?: RespuestaCampo[];
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

export interface DocumentoGeneral {
  id: string;
  fichaMadreId: string;
  documentoPlantillaId: string;
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
  fichasFormulario?: FichaFormulario[];
  documentos?: DocumentoGeneral[];
}

export interface TokenAcceso {
  id: string;
  fichaMadreId: string;
  token: string;
  emailDestino: string;
  documentosFirmaCantidad?: number;
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
   * Obtiene la Ficha Madre con todas sus relaciones cargadas (fichasFormulario, documentos, cliente, empleado).
   */
  obtenerFichaMadre: (fichaMadreId: string) => {
    return fetchAPI<FichaMadre>(`/fichas-madre/${fichaMadreId}`);
  },

  /**
   * Obtiene la lista de formularios (FichaFormulario) asociados a una Ficha Madre.
   */
  obtenerFichasFormulario: (fichaMadreId: string) => {
    return fetchAPI<FichaFormulario[]>(`/fichas-formulario?fichaMadreId=${fichaMadreId}`);
  },

  /**
   * Obtiene el detalle de un formulario específico con su plantilla y sus campos.
   */
  obtenerDetalleFormulario: (fichaFormularioId: string) => {
    return fetchAPI<FichaFormulario>(`/fichas-formulario/${fichaFormularioId}`);
  },

  /**
   * Actualiza el estado de un formulario (por ejemplo a EN_PROCESO o COMPLETADO).
   */
  actualizarEstadoFormulario: (fichaFormularioId: string, estado: FichaFormulario['estado']) => {
    return fetchAPI<FichaFormulario>(`/fichas-formulario/${fichaFormularioId}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  },

  /**
   * Guarda de forma masiva (batch) las respuestas de los campos de un formulario.
   */
  guardarRespuestasBatch: (respuestas: Array<{ fichaFormularioId: string; campoFormularioId: string; valor: string }>) => {
    return fetchAPI<any[]>('/respuestas-campo/batch', {
      method: 'POST',
      body: JSON.stringify(respuestas),
    });
  },

  /**
   * Guarda una respuesta individual de un campo.
   */
  guardarRespuestaIndividual: (respuesta: { fichaFormularioId: string; campoFormularioId: string; valor: string }) => {
    return fetchAPI<any>('/respuestas-campo', {
      method: 'POST',
      body: JSON.stringify(respuesta),
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
   * Inicia sesión con usuario y contraseña.
   */
  login: (username: string, password: string) => {
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
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Obtiene la lista de clientes registrados.
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
    return fetchAPI<{ html: string }>(`/documentos-generales/${documentoId}/preview`);
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
};

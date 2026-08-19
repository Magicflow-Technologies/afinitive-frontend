// Tipos y catálogos para la Ficha Madre / Perfil del Inversionista.
// Mapean exactamente el payload snake_case que espera:
// PUT /fichas-madre/:id/inversionista  (SaveInversionistaDto del backend)

export interface ConyugeData {
  nombres_apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  regimen_patrimonial?: string;
  fecha_regimen?: string;
}

export interface TitularData {
  nombres_apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  nacionalidad?: string;
  sexo?: string;
  pais_nacimiento?: string;
  departamento_nacimiento?: string;
  fecha_nacimiento?: string;
  pais_residencia?: string;
  grado_instruccion?: string;
  estado_civil?: string;
  es_inversionista?: boolean;
  correo_electronico?: string;
  telefono_celular?: string;
  conyuge?: ConyugeData;
  pep?: boolean;
  pep_institucion_cargo?: string;
}

export interface DomicilioData {
  direccion_completa?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  pais_domicilio?: string;
  codigo_postal?: string;
}

export interface InformacionLaboralData {
  situacion_laboral?: string;
  profesion?: string;
  ocupacion?: string;
  empresa_centro_trabajo?: string;
  ingreso_promedio_anual?: number | string;
}

export interface PoderRegistralData {
  partida_registral?: string;
  asiento?: string;
  zona_registral?: string;
}

export interface ApoderadoData {
  nombres_apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  nacionalidad?: string;
  sexo?: string;
  estado_civil?: string;
  pais_nacimiento?: string;
  fecha_nacimiento?: string;
  pais_residencia?: string;
  grado_instruccion?: string;
  es_domiciliado?: boolean;
  correo_electronico?: string;
  telefono_celular?: string;
  domicilio?: DomicilioData;
  poder_registral?: PoderRegistralData;
}

export interface VinculacionesData {
  es_vinculado_corfid_grupo_coril?: boolean;
  ha_sido_cliente_otra_fiduciaria?: boolean;
  ha_sido_trabajador_otra_fiduciaria?: boolean;
  valor_aproximado_patrimonio?: number | string;
}

export interface OrigenFondosData {
  fondos_propios_detalle?: string;
  venta_activos_detalle?: string;
  financiamientos_detalle?: string;
  dividendos_participaciones_detalle?: string;
  contrato_obra_licitacion_detalle?: string;
  patrimonio_fideicometido_detalle?: string;
  otros_fondos_detalle?: string;
}

export interface AntecedentesPenalesData {
  es_investigado_delitos?: boolean;
  especificar_delitos?: string;
}

export interface ResidenciaFiscalPaisData {
  pais?: string;
  nit_tin?: string;
}

export interface ResidenciaFiscalData {
  tiene_residencia_fiscal_extranjera?: boolean;
  paises?: ResidenciaFiscalPaisData[];
}

export interface InversionData {
  moneda?: string;
  monto_inicial?: number | string;
  monto_inicial_letras?: string;
  origen_recursos?: string;
  banco_nombre?: string;
  numero_cuenta?: string;
  cuenta_cci?: string;
}

export interface SaveInversionistaPayload {
  es_domiciliado?: boolean;
  usar_misma_direccion_correspondencia?: boolean;
  tiene_apoderado?: boolean;

  titular?: TitularData;
  domicilio?: DomicilioData;
  direccion_correspondencia?: DomicilioData;
  informacion_laboral?: InformacionLaboralData;
  apoderado?: ApoderadoData;
  vinculaciones?: VinculacionesData;
  origen_fondos?: OrigenFondosData;
  antecedentes_penales_judiciales?: AntecedentesPenalesData;
  residencia_fiscal?: ResidenciaFiscalData;
  inversion?: InversionData;
}

// Respuesta de GET /fichas-madre/:id (vía toFichaMadreObject)
export interface FichaMadreResponse {
  fichaMadre: {
    inversionista: SaveInversionistaPayload;
    metadata: {
      id_expediente?: string;
      lugar_firma?: string;
      fecha_actual?: string;
      firmado?: boolean;
      firma_imagen?: string;
    };
  };
}

export const TIPOS_DOCUMENTO = ['DNI', 'RUC', 'CE', 'PASAPORTE'] as const;
export const SEXOS = ['MASCULINO', 'FEMENINO'] as const;
export const ESTADOS_CIVIL = [
  'SOLTERO',
  'CASADO',
  'CONVIVIENTE',
  'DIVORCIADO',
  'VIUDO',
] as const;
export const REGIMENES_PATRIMONIALES = [
  'GANANCIALES',
  'SEPARACION',
  'UNION',
] as const;
export const GRADOS_INSTRUCCION = [
  'Primaria',
  'Secundaria',
  'Superior Técnica',
  'Superior Universitaria',
  'Postgrado',
] as const;
export const SITUACIONES_LABORALES = [
  'DEPENDIENTE',
  'INDEPENDIENTE',
  'JUBILADO',
  'DESEMPLEADO',
  'OTRO',
] as const;
export const MONEDAS = [
  { value: 'USD', label: 'USD - Dólar americano', simbolo: '$' },
  { value: 'PEN', label: 'PEN - Sol peruano', simbolo: 'S/' },
  { value: 'EUR', label: 'EUR - Euro', simbolo: '€' },
] as const;
export const BANCOS = [
  'Banco de Crédito del Perú',
  'BBVA',
  'Interbank',
  'Scotiabank',
  'BanBif',
  'Banco Pichincha',
  'Caja Sullana',
  'Otro',
] as const;
export const ORIGENES_RECURSOS = [
  'Ahorros personales',
  'Remuneraciones',
  'Venta de activos',
  'Herencia',
  'Dividendos',
  'Otros',
] as const;

export const ORIGENES_FONDOS_LABELS: Record<string, string> = {
  fondos_propios_detalle: 'Fondos propios',
  venta_activos_detalle: 'Venta de activos',
  financiamientos_detalle: 'Financiamientos',
  dividendos_participaciones_detalle: 'Dividendos y participaciones',
  contrato_obra_licitacion_detalle: 'Contrato de obra / licitación',
  patrimonio_fideicometido_detalle: 'Patrimonio fideicometido',
  otros_fondos_detalle: 'Otros fondos',
};

export const PAISES_SUGERIDOS = [
  'Estados Unidos',
  'España',
  'Chile',
  'Argentina',
  'Colombia',
  'México',
  'Brasil',
  'Alemania',
  'Reino Unido',
  'Panamá',
] as const;

// ---- Helpers de completitud ----

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return true;
  const s = String(value).trim();
  return s === '' || s === 'null' || s === 'undefined';
}

function countSection<T extends object>(section: T | undefined, keys: readonly (keyof T)[]): { done: number; total: number } {
  if (!section) return { done: 0, total: keys.length };
  let done = 0;
  for (const key of keys) {
    if (!isEmptyValue((section as Record<string, unknown>)[key as string])) done++;
  }
  return { done, total: keys.length };
}

export interface CompletitudPorPaso {
  done: number;
  total: number;
  pct: number;
}

export function calcularCompletitud(payload: SaveInversionistaPayload): {
  global: CompletitudPorPaso;
  pasos: Record<string, CompletitudPorPaso>;
} {
  const inv = payload;

  const pasoTitular = countSection(inv.titular, [
    'nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad',
    'sexo', 'pais_nacimiento', 'fecha_nacimiento', 'pais_residencia',
    'grado_instruccion', 'estado_civil', 'correo_electronico', 'telefono_celular',
  ]);

  const conyugeKeys = ['nombres_apellidos', 'tipo_documento', 'numero_documento', 'regimen_patrimonial'] as const;
  const conyuge = inv.titular?.conyuge ?? {};
  const pasoConyuge = {
    done: conyugeKeys.filter((k) => !isEmptyValue(conyuge[k])).length,
    total: conyugeKeys.length,
  };

  const pasoDomicilio = countSection(inv.domicilio, [
    'direccion_completa', 'distrito', 'provincia', 'departamento', 'pais_domicilio', 'codigo_postal',
  ]);
  const pasoCorrespondencia = countSection(inv.direccion_correspondencia, [
    'direccion_completa', 'distrito', 'provincia', 'departamento', 'pais_domicilio', 'codigo_postal',
  ]);

  const pasoTitulo = (i: { done: number; total: number }) => ({
    done: i.done,
    total: i.total,
    pct: i.total === 0 ? 100 : Math.round((i.done / i.total) * 100),
  });

  const pasoLaboral = countSection(inv.informacion_laboral, [
    'situacion_laboral', 'profesion', 'ocupacion', 'empresa_centro_trabajo', 'ingreso_promedio_anual',
  ]);
  const pasoVinculaciones = countSection(inv.vinculaciones, [
    'es_vinculado_corfid_grupo_coril', 'ha_sido_cliente_otra_fiduciaria',
    'ha_sido_trabajador_otra_fiduciaria', 'valor_aproximado_patrimonio',
  ]);

  const origenKeys = Object.keys(ORIGENES_FONDOS_LABELS) as (keyof OrigenFondosData)[];
  const pasoOrigen = countSection(inv.origen_fondos, origenKeys);

  const pasoApoderado = countSection(inv.apoderado, [
    'nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad',
    'sexo', 'estado_civil', 'fecha_nacimiento', 'correo_electronico', 'telefono_celular',
  ]);
  const pasoPoder = countSection(inv.apoderado?.poder_registral, [
    'partida_registral', 'asiento', 'zona_registral',
  ]);
  const pasoAntecedentes = countSection(inv.antecedentes_penales_judiciales, [
    'es_investigado_delitos', 'especificar_delitos',
  ]);
  const paises = inv.residencia_fiscal?.paises ?? [];
  const pasoResidencia = {
    done: paises.filter((p) => !isEmptyValue(p.pais)).length,
    total: Math.max(1, paises.length),
  };

  const pasoInversion = countSection(inv.inversion, [
    'moneda', 'monto_inicial', 'origen_recursos', 'banco_nombre', 'numero_cuenta', 'cuenta_cci',
  ]);

  const pasos: Record<string, CompletitudPorPaso> = {
    titular: pasoTitulo(pasoTitular),
    conyuge: pasoTitulo(pasoConyuge),
    domicilio: pasoTitulo(pasoDomicilio),
    correspondencia: pasoTitulo(pasoCorrespondencia),
    laboral: pasoTitulo(pasoLaboral),
    vinculaciones: pasoTitulo(pasoVinculaciones),
    origen: pasoTitulo(pasoOrigen),
    apoderado: pasoTitulo(pasoApoderado),
    poder: pasoTitulo(pasoPoder),
    antecedentes: pasoTitulo(pasoAntecedentes),
    residencia: pasoTitulo(pasoResidencia),
    inversion: pasoTitulo(pasoInversion),
  };

  const secciones = Object.values(pasos);
  const done = secciones.reduce((acc, s) => acc + s.done, 0);
  const total = secciones.reduce((acc, s) => acc + s.total, 0);

  return {
    global: pasoTitulo({ done, total }),
    pasos,
  };
}

export function isProfileComplete(payload: SaveInversionistaPayload | null | undefined): boolean {
  if (!payload?.titular) return false;
  const t = payload.titular;
  const inv = payload.inversion;
  return Boolean(
    t.nombres_apellidos &&
      t.numero_documento &&
      payload.domicilio?.direccion_completa &&
      payload.informacion_laboral?.ocupacion &&
      inv?.monto_inicial,
  );
}
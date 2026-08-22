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
    id?: string;
    estado?: string;
    inversionista: SaveInversionistaPayload;
    metadata: {
      id_expediente?: string;
      estado?: string;
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

  // 1. Titular
  const titularFields: (keyof TitularData)[] = [
    'nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad',
    'sexo', 'pais_nacimiento', 'fecha_nacimiento', 'pais_residencia',
    'grado_instruccion', 'estado_civil', 'correo_electronico', 'telefono_celular',
  ];
  let titularDone = countSection(inv.titular, titularFields).done;
  let titularTotal = titularFields.length;
  if (inv.titular?.pep) {
    titularTotal += 1;
    if (!isEmptyValue(inv.titular.pep_institucion_cargo)) {
      titularDone += 1;
    }
  }
  const pasoTitular = { done: titularDone, total: titularTotal };

  // 2. Cónyuge: si es soltero, divorciado o viudo, no requiere datos -> 100%
  const estadoCivil = (inv.titular?.estado_civil ?? '').toUpperCase();
  const requiereConyuge = estadoCivil === 'CASADO' || estadoCivil === 'CONVIVIENTE';
  const conyugeKeys = ['nombres_apellidos', 'tipo_documento', 'numero_documento', 'regimen_patrimonial'] as const;
  const conyuge = inv.titular?.conyuge ?? {};
  const pasoConyuge = requiereConyuge
    ? {
        done: conyugeKeys.filter((k) => !isEmptyValue(conyuge[k])).length,
        total: conyugeKeys.length,
      }
    : { done: 1, total: 1 };

  // 3. Domicilio y correspondencia
  const pasoDom = countSection(inv.domicilio, [
    'direccion_completa', 'distrito', 'provincia', 'departamento', 'pais_domicilio',
  ]);
  const usaMismaCorrespondencia = inv.usar_misma_direccion_correspondencia !== false;
  const pasoCorresp = usaMismaCorrespondencia
    ? { done: 0, total: 0 }
    : countSection(inv.direccion_correspondencia, [
        'direccion_completa', 'distrito', 'provincia', 'departamento', 'pais_domicilio',
      ]);
  const pasoDomicilioCombined = {
    done: pasoDom.done + pasoCorresp.done,
    total: pasoDom.total + pasoCorresp.total,
  };

  // 4. Laboral y vinculaciones
  const pasoLab = countSection(inv.informacion_laboral, [
    'situacion_laboral', 'ocupacion', 'ingreso_promedio_anual',
  ]);
  const pasoLaboralCombined = {
    done: pasoLab.done,
    total: pasoLab.total,
  };

  // 5. Origen de fondos
  const origenKeys = Object.keys(ORIGENES_FONDOS_LABELS) as (keyof OrigenFondosData)[];
  const filledOrigen = origenKeys.filter((k) => !isEmptyValue(inv.origen_fondos?.[k])).length;
  const pasoOrigen = {
    done: filledOrigen > 0 ? 1 : 0,
    total: 1,
  };

  // 6. Apoderado y cumplimiento
  const tieneApoderado = Boolean(inv.tiene_apoderado);
  const pasoApod = tieneApoderado
    ? countSection(inv.apoderado, [
        'nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad',
        'sexo', 'fecha_nacimiento', 'pais_residencia',
      ])
    : { done: 0, total: 0 };
  const investigado = Boolean(inv.antecedentes_penales_judiciales?.es_investigado_delitos);
  const pasoAntecedentes = investigado
    ? countSection(inv.antecedentes_penales_judiciales, ['especificar_delitos'])
    : { done: 0, total: 0 };
  const resideFuera = Boolean(inv.residencia_fiscal?.tiene_residencia_fiscal_extranjera);
  const paises = inv.residencia_fiscal?.paises ?? [];
  const pasoResidencia = resideFuera
    ? {
        done: paises.filter((p) => !isEmptyValue(p.pais)).length,
        total: Math.max(1, paises.length),
      }
    : { done: 0, total: 0 };

  const pasoApoderadoCumplimientoCombined = {
    done: 1 + pasoApod.done + pasoAntecedentes.done + pasoResidencia.done,
    total: 1 + pasoApod.total + pasoAntecedentes.total + pasoResidencia.total,
  };

  // 7. Inversión y cuenta bancaria
  const pasoInversion = countSection(inv.inversion, [
    'moneda', 'monto_inicial', 'monto_inicial_letras', 'origen_recursos', 'banco_nombre', 'numero_cuenta', 'cuenta_cci',
  ]);

  const calcPct = (i: { done: number; total: number }) => ({
    done: i.done,
    total: i.total,
    pct: i.total === 0 ? 100 : Math.round((i.done / i.total) * 100),
  });

  const pasos: Record<string, CompletitudPorPaso> = {
    titular: calcPct(pasoTitular),
    conyuge: calcPct(pasoConyuge),
    domicilio: calcPct(pasoDomicilioCombined),
    laboral: calcPct(pasoLaboralCombined),
    origen: calcPct(pasoOrigen),
    apoderado: calcPct(pasoApoderadoCumplimientoCombined),
    inversion: calcPct(pasoInversion),
  };

  const secciones = Object.values(pasos);
  const done = secciones.reduce((acc, s) => acc + s.done, 0);
  const total = secciones.reduce((acc, s) => acc + s.total, 0);

  return {
    global: calcPct({ done, total }),
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
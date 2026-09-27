import { z } from 'zod';
import type { SaveInversionistaPayload } from '@/lib/ficha-madre.types';

// Valores del formulario (todo como string para inputs de texto/monto).
export interface FichaMadreFormValues {
  es_domiciliado: boolean;
  usar_misma_direccion_correspondencia: boolean;
  tiene_apoderado: boolean;
  titular: {
    nombres_apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    nacionalidad: string;
    sexo: string;
    pais_nacimiento: string;
    departamento_nacimiento: string;
    fecha_nacimiento: string;
    pais_residencia: string;
    grado_instruccion: string;
    estado_civil: string;
    es_inversionista: boolean;
    correo_electronico: string;
    telefono_celular: string;
    pep: boolean;
    pep_institucion_cargo: string;
    conyuge: {
      nombres_apellidos: string;
      tipo_documento: string;
      numero_documento: string;
      regimen_patrimonial: string;
      fecha_regimen: string;
    };
  };
  domicilio: {
    direccion_completa: string;
    numero: string;
    distrito: string;
    provincia: string;
    departamento: string;
    pais_domicilio: string;
    codigo_postal: string;
  };
  direccion_correspondencia: {
    direccion_completa: string;
    numero: string;
    distrito: string;
    provincia: string;
    departamento: string;
    pais_domicilio: string;
    codigo_postal: string;
  };
  informacion_laboral: {
    situacion_laboral: string;
    profesion: string;
    ocupacion: string;
    empresa_centro_trabajo: string;
    ingreso_promedio_anual: string;
  };
  apoderado: {
    nombres_apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    nacionalidad: string;
    sexo: string;
    estado_civil: string;
    pais_nacimiento: string;
    fecha_nacimiento: string;
    pais_residencia: string;
    grado_instruccion: string;
    es_domiciliado: boolean;
    correo_electronico: string;
    telefono_celular: string;
    domicilio: {
      direccion_completa: string;
      numero: string;
      distrito: string;
      provincia: string;
      departamento: string;
      pais_domicilio: string;
      codigo_postal: string;
    };
    poder_registral: {
      partida_registral: string;
      asiento: string;
      zona_registral: string;
    };
  };
  vinculaciones: {
    es_vinculado_corfid_grupo_coril: boolean;
    ha_sido_cliente_otra_fiduciaria: boolean;
    ha_sido_trabajador_otra_fiduciaria: boolean;
    valor_aproximado_patrimonio: string;
  };
  origen_fondos: {
    fondos_propios_detalle: string;
    venta_activos_detalle: string;
    financiamientos_detalle: string;
    dividendos_participaciones_detalle: string;
    contrato_obra_licitacion_detalle: string;
    patrimonio_fideicometido_detalle: string;
    otros_fondos_detalle: string;
  };
  antecedentes_penales_judiciales: {
    es_investigado_delitos: boolean;
    especificar_delitos: string;
  };
  residencia_fiscal: {
    tiene_residencia_fiscal_extranjera: boolean;
    paises: { pais: string; nit_tin: string }[];
  };
  inversion: {
    moneda: string;
    monto_inicial: string;
    monto_inicial_letras: string;
    origen_recursos: string;
    banco_nombre: string;
    numero_cuenta: string;
    cuenta_cci: string;
  };
}

const texto = z.string();
const textoReq = z.string().min(1, 'Campo requerido');

const conyugeSchema = z.object({
  nombres_apellidos: texto.default(''),
  tipo_documento: texto.default(''),
  numero_documento: texto.default(''),
  regimen_patrimonial: texto.default(''),
  fecha_regimen: texto.default(''),
});

const titularSchema = z.object({
  nombres_apellidos: textoReq,
  tipo_documento: textoReq,
  numero_documento: textoReq,
  nacionalidad: textoReq,
  sexo: textoReq,
  pais_nacimiento: textoReq,
  departamento_nacimiento: texto.default(''),
  fecha_nacimiento: textoReq,
  pais_residencia: textoReq,
  grado_instruccion: textoReq,
  estado_civil: textoReq,
  es_inversionista: z.boolean().default(true),
  correo_electronico: z.string().min(1, 'Campo requerido').email('Correo inválido'),
  telefono_celular: textoReq,
  pep: z.boolean().default(false),
  pep_institucion_cargo: texto.default(''),
  conyuge: conyugeSchema.default({
    nombres_apellidos: '',
    tipo_documento: '',
    numero_documento: '',
    regimen_patrimonial: '',
    fecha_regimen: '',
  }),
});

const domicilioSchema = z.object({
  direccion_completa: textoReq,
  numero: texto.default(''),
  distrito: textoReq,
  provincia: textoReq,
  departamento: textoReq,
  pais_domicilio: textoReq,
  codigo_postal: texto.default(''),
});

const domicilioOpcionalSchema = z.object({
  direccion_completa: texto.default(''),
  numero: texto.default(''),
  distrito: texto.default(''),
  provincia: texto.default(''),
  departamento: texto.default(''),
  pais_domicilio: texto.default(''),
  codigo_postal: texto.default(''),
});

const informacionLaboralSchema = z.object({
  situacion_laboral: textoReq,
  profesion: textoReq,
  ocupacion: textoReq,
  empresa_centro_trabajo: textoReq,
  ingreso_promedio_anual: textoReq,
});

const poderRegistralSchema = z.object({
  partida_registral: texto.default(''),
  asiento: texto.default(''),
  zona_registral: texto.default(''),
});

const apoderadoSchema = z.object({
  nombres_apellidos: texto.default(''),
  tipo_documento: texto.default(''),
  numero_documento: texto.default(''),
  nacionalidad: texto.default(''),
  sexo: texto.default(''),
  estado_civil: texto.default(''),
  pais_nacimiento: texto.default(''),
  fecha_nacimiento: texto.default(''),
  pais_residencia: texto.default(''),
  grado_instruccion: texto.default(''),
  es_domiciliado: z.boolean().default(true),
  correo_electronico: texto.default(''),
  telefono_celular: texto.default(''),
  domicilio: domicilioOpcionalSchema.default({
    direccion_completa: '',
    numero: '',
    distrito: '',
    provincia: '',
    departamento: '',
    pais_domicilio: '',
    codigo_postal: '',
  }),
  poder_registral: poderRegistralSchema.default({
    partida_registral: '',
    asiento: '',
    zona_registral: '',
  }),
});

const vinculacionesSchema = z.object({
  es_vinculado_corfid_grupo_coril: z.boolean().default(false),
  ha_sido_cliente_otra_fiduciaria: z.boolean().default(false),
  ha_sido_trabajador_otra_fiduciaria: z.boolean().default(false),
  valor_aproximado_patrimonio: textoReq,
});

const origenFondosSchema = z.object({
  fondos_propios_detalle: texto.default(''),
  venta_activos_detalle: texto.default(''),
  financiamientos_detalle: texto.default(''),
  dividendos_participaciones_detalle: texto.default(''),
  contrato_obra_licitacion_detalle: texto.default(''),
  patrimonio_fideicometido_detalle: texto.default(''),
  otros_fondos_detalle: texto.default(''),
});

const antecedentesSchema = z.object({
  es_investigado_delitos: z.boolean().default(false),
  especificar_delitos: texto.default(''),
});

const residenciaFiscalSchema = z.object({
  tiene_residencia_fiscal_extranjera: z.boolean().default(false),
  paises: z
    .array(z.object({ pais: texto.default(''), nit_tin: texto.default('') }))
    .default([]),
});

const inversionSchema = z.object({
  moneda: textoReq,
  monto_inicial: textoReq,
  monto_inicial_letras: texto.default(''),
  origen_recursos: textoReq,
  banco_nombre: texto.default(''),
  numero_cuenta: texto.default(''),
  cuenta_cci: texto.default(''),
});

const baseSchema = z.object({
  es_domiciliado: z.boolean().default(true),
  usar_misma_direccion_correspondencia: z.boolean().default(true),
  tiene_apoderado: z.boolean().default(false),
  titular: titularSchema,
  domicilio: domicilioSchema.default({
    direccion_completa: '',
    numero: '',
    distrito: '',
    provincia: '',
    departamento: '',
    pais_domicilio: '',
    codigo_postal: '',
  }),
  direccion_correspondencia: domicilioOpcionalSchema.default({
    direccion_completa: '',
    numero: '',
    distrito: '',
    provincia: '',
    departamento: '',
    pais_domicilio: '',
    codigo_postal: '',
  }),
  informacion_laboral: informacionLaboralSchema.default({
    situacion_laboral: '',
    profesion: '',
    ocupacion: '',
    empresa_centro_trabajo: '',
    ingreso_promedio_anual: '',
  }),
  apoderado: apoderadoSchema,
  vinculaciones: vinculacionesSchema.default({
    es_vinculado_corfid_grupo_coril: false,
    ha_sido_cliente_otra_fiduciaria: false,
    ha_sido_trabajador_otra_fiduciaria: false,
    valor_aproximado_patrimonio: '',
  }),
  origen_fondos: origenFondosSchema.default({
    fondos_propios_detalle: '',
    venta_activos_detalle: '',
    financiamientos_detalle: '',
    dividendos_participaciones_detalle: '',
    contrato_obra_licitacion_detalle: '',
    patrimonio_fideicometido_detalle: '',
    otros_fondos_detalle: '',
  }),
  antecedentes_penales_judiciales: antecedentesSchema.default({
    es_investigado_delitos: false,
    especificar_delitos: '',
  }),
  residencia_fiscal: residenciaFiscalSchema,
  inversion: inversionSchema.default({
    moneda: '',
    monto_inicial: '',
    monto_inicial_letras: '',
    origen_recursos: '',
    banco_nombre: '',
    numero_cuenta: '',
    cuenta_cci: '',
  }),
});

export const saveInversionistaSchema = baseSchema.superRefine((data, ctx) => {
  const estadoCivil = (data.titular?.estado_civil ?? '').toUpperCase();

  if (estadoCivil === 'CASADO' || estadoCivil === 'CONVIVIENTE') {
    const c = data.titular?.conyuge;
    const checks: Array<[keyof typeof c, string]> = [
      ['nombres_apellidos', 'Cónyuge: nombres y apellidos'],
      ['tipo_documento', 'Cónyuge: tipo de documento'],
      ['numero_documento', 'Cónyuge: número de documento'],
      ['regimen_patrimonial', 'Cónyuge: régimen patrimonial'],
    ];
    for (const [key, label] of checks) {
      if (!c?.[key] || String(c[key]).trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['titular', 'conyuge', key],
          message: `${label} es requerido`,
        });
      }
    }
  }

  if (!data.usar_misma_direccion_correspondencia) {
    const d = data.direccion_correspondencia;
    const checks: Array<[keyof typeof d, string]> = [
      ['direccion_completa', 'Dirección de correspondencia'],
      ['distrito', 'Distrito (correspondencia)'],
      ['provincia', 'Provincia (correspondencia)'],
      ['departamento', 'Departamento (correspondencia)'],
      ['pais_domicilio', 'País (correspondencia)'],
    ];
    for (const [key, label] of checks) {
      if (!d?.[key] || String(d[key]).trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['direccion_correspondencia', key],
          message: `${label} es requerido`,
        });
      }
    }
  }

  if (data.titular?.pep && !String(data.titular.pep_institucion_cargo ?? '').trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['titular', 'pep_institucion_cargo'],
      message: 'Indica la institución / cargo PEP',
    });
  }

  if (data.tiene_apoderado) {
    const a = data.apoderado;
    const checks: Array<[keyof typeof a, string]> = [
      ['nombres_apellidos', 'Apoderado: nombres y apellidos'],
      ['tipo_documento', 'Apoderado: tipo de documento'],
      ['numero_documento', 'Apoderado: número de documento'],
      ['nacionalidad', 'Apoderado: nacionalidad'],
      ['sexo', 'Apoderado: sexo'],
      ['estado_civil', 'Apoderado: estado civil'],
      ['pais_nacimiento', 'Apoderado: país de nacimiento'],
      ['fecha_nacimiento', 'Apoderado: fecha de nacimiento'],
      ['pais_residencia', 'Apoderado: país de residencia'],
    ];
    for (const [key, label] of checks) {
      if (!a?.[key] || String(a[key]).trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['apoderado', key], message: `${label} es requerido` });
      }
    }
  }

  if (data.antecedentes_penales_judiciales?.es_investigado_delitos && !String(data.antecedentes_penales_judiciales.especificar_delitos ?? '').trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['antecedentes_penales_judiciales', 'especificar_delitos'],
      message: 'Detalla los delitos / investigaciones',
    });
  }

  if (data.residencia_fiscal?.tiene_residencia_fiscal_extranjera) {
    const paises = data.residencia_fiscal.paises ?? [];
    if (paises.length === 0 || !String(paises[0]?.pais ?? '').trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['residencia_fiscal', 'paises'],
        message: 'Agrega al menos un país de residencia fiscal',
      });
    }
  }

  const origen = data.origen_fondos;
  const tieneOrigen = Object.values(origen ?? {}).some((v) => String(v ?? '').trim() !== '');
  if (!tieneOrigen) {
    ctx.addIssue({
      code: 'custom',
      path: ['origen_fondos', 'fondos_propios_detalle'],
      message: 'Detalla al menos una fuente de procedencia u origen de tus fondos',
    });
  }
}) as unknown as z.ZodType<FichaMadreFormValues, FichaMadreFormValues>;

// Campos que se validan al avanzar desde cada paso (paso 0..6).
export const STEP_TRIGGER_FIELDS: string[][] = [
  // Paso 0: Titular
  [
    'titular.nombres_apellidos',
    'titular.tipo_documento',
    'titular.numero_documento',
    'titular.nacionalidad',
    'titular.sexo',
    'titular.pais_nacimiento',
    'titular.fecha_nacimiento',
    'titular.pais_residencia',
    'titular.grado_instruccion',
    'titular.estado_civil',
    'titular.correo_electronico',
    'titular.telefono_celular',
    'titular.pep_institucion_cargo',
  ],
  // Paso 1: Cónyuge
  [
    'titular.conyuge.nombres_apellidos',
    'titular.conyuge.tipo_documento',
    'titular.conyuge.numero_documento',
    'titular.conyuge.regimen_patrimonial',
  ],
  // Paso 2: Domicilio
  [
    'domicilio.direccion_completa',
    'domicilio.departamento',
    'domicilio.provincia',
    'domicilio.distrito',
    'domicilio.pais_domicilio',
    'direccion_correspondencia.direccion_completa',
    'direccion_correspondencia.departamento',
    'direccion_correspondencia.provincia',
    'direccion_correspondencia.distrito',
    'direccion_correspondencia.pais_domicilio',
  ],
  // Paso 3: Laboral
  [
    'informacion_laboral.situacion_laboral',
    'informacion_laboral.profesion',
    'informacion_laboral.ocupacion',
    'informacion_laboral.empresa_centro_trabajo',
    'informacion_laboral.ingreso_promedio_anual',
    'vinculaciones.valor_aproximado_patrimonio',
  ],
  // Paso 4: Origen de fondos
  [
    'origen_fondos.fondos_propios_detalle',
    'origen_fondos.venta_activos_detalle',
    'origen_fondos.financiamientos_detalle',
    'origen_fondos.dividendos_participaciones_detalle',
    'origen_fondos.contrato_obra_licitacion_detalle',
    'origen_fondos.patrimonio_fideicometido_detalle',
    'origen_fondos.otros_fondos_detalle',
  ],
  // Paso 5: Apoderado y Cumplimiento
  [
    'apoderado.nombres_apellidos',
    'apoderado.tipo_documento',
    'apoderado.numero_documento',
    'apoderado.nacionalidad',
    'apoderado.sexo',
    'apoderado.estado_civil',
    'apoderado.pais_nacimiento',
    'apoderado.fecha_nacimiento',
    'apoderado.pais_residencia',
    'antecedentes_penales_judiciales.especificar_delitos',
    'residencia_fiscal.paises',
  ],
  // Paso 6: Inversión
  [
    'inversion.moneda',
    'inversion.monto_inicial',
    'inversion.origen_recursos',
  ],
];

export function defaultFormValues(): FichaMadreFormValues {
  return {
    es_domiciliado: true,
    usar_misma_direccion_correspondencia: true,
    tiene_apoderado: false,
    titular: {
      nombres_apellidos: '',
      tipo_documento: 'DNI',
      numero_documento: '',
      nacionalidad: 'Peruana',
      sexo: '',
      pais_nacimiento: 'Perú',
      departamento_nacimiento: '',
      fecha_nacimiento: '',
      pais_residencia: 'Perú',
      grado_instruccion: '',
      estado_civil: 'SOLTERO',
      es_inversionista: true,
      correo_electronico: '',
      telefono_celular: '',
      pep: false,
      pep_institucion_cargo: '',
      conyuge: {
        nombres_apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        regimen_patrimonial: 'GANANCIALES',
        fecha_regimen: '',
      },
    },
    domicilio: { direccion_completa: '', numero: '', distrito: '', provincia: '', departamento: '', pais_domicilio: 'Perú', codigo_postal: '' },
    direccion_correspondencia: { direccion_completa: '', numero: '', distrito: '', provincia: '', departamento: '', pais_domicilio: 'Perú', codigo_postal: '' },
    informacion_laboral: { situacion_laboral: '', profesion: '', ocupacion: '', empresa_centro_trabajo: '', ingreso_promedio_anual: '' },
    apoderado: {
      nombres_apellidos: '',
      tipo_documento: 'DNI',
      numero_documento: '',
      nacionalidad: 'Peruana',
      sexo: '',
      estado_civil: '',
      pais_nacimiento: 'Perú',
      fecha_nacimiento: '',
      pais_residencia: 'Perú',
      grado_instruccion: '',
      es_domiciliado: true,
      correo_electronico: '',
      telefono_celular: '',
      domicilio: { direccion_completa: '', numero: '', distrito: '', provincia: '', departamento: '', pais_domicilio: 'Perú', codigo_postal: '' },
      poder_registral: { partida_registral: '', asiento: '', zona_registral: '' },
    },
    vinculaciones: {
      es_vinculado_corfid_grupo_coril: false,
      ha_sido_cliente_otra_fiduciaria: false,
      ha_sido_trabajador_otra_fiduciaria: false,
      valor_aproximado_patrimonio: '',
    },
    origen_fondos: {
      fondos_propios_detalle: '',
      venta_activos_detalle: '',
      financiamientos_detalle: '',
      dividendos_participaciones_detalle: '',
      contrato_obra_licitacion_detalle: '',
      patrimonio_fideicometido_detalle: '',
      otros_fondos_detalle: '',
    },
    antecedentes_penales_judiciales: { es_investigado_delitos: false, especificar_delitos: '' },
    residencia_fiscal: { tiene_residencia_fiscal_extranjera: false, paises: [] },
    inversion: { moneda: 'USD', monto_inicial: '', monto_inicial_letras: '', origen_recursos: 'Ahorros personales', banco_nombre: '', numero_cuenta: '', cuenta_cci: '' },
  };
}

function isBlank(v: unknown): boolean {
  return v === undefined || v === null || String(v).trim() === '';
}

// Une los datos guardados (pueden venir con ''/null) sobre los defaults,
// preservando defaults sensatos cuando no hay dato.
export function mergeFetchedIntoDefaults(
  defaults: FichaMadreFormValues,
  fetched?: SaveInversionistaPayload | null,
): FichaMadreFormValues {
  if (!fetched) return defaults;
  const out = structuredClone(defaults);

  if (typeof fetched.es_domiciliado === 'boolean') out.es_domiciliado = fetched.es_domiciliado;
  if (typeof fetched.usar_misma_direccion_correspondencia === 'boolean')
    out.usar_misma_direccion_correspondencia = fetched.usar_misma_direccion_correspondencia;
  if (typeof fetched.tiene_apoderado === 'boolean') out.tiene_apoderado = fetched.tiene_apoderado;

  const t = fetched.titular;
  if (t) {
    for (const key of ['nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad', 'sexo', 'pais_nacimiento', 'departamento_nacimiento', 'fecha_nacimiento', 'pais_residencia', 'grado_instruccion', 'estado_civil', 'correo_electronico', 'telefono_celular', 'pep_institucion_cargo'] as const) {
      if (!isBlank(t[key])) out.titular[key] = String(t[key]);
    }
    if (typeof t.es_inversionista === 'boolean') out.titular.es_inversionista = t.es_inversionista;
    if (typeof t.pep === 'boolean') out.titular.pep = t.pep;
    const c = t.conyuge;
    if (c) {
      for (const key of ['nombres_apellidos', 'tipo_documento', 'numero_documento', 'regimen_patrimonial', 'fecha_regimen'] as const) {
        if (!isBlank(c[key])) out.titular.conyuge[key] = String(c[key]);
      }
    }
  }

  const mergeDomicilio = (src: SaveInversionistaPayload['domicilio'], dst: FichaMadreFormValues['domicilio']) => {
    if (!src) return;
    for (const key of ['direccion_completa', 'numero', 'distrito', 'provincia', 'departamento', 'pais_domicilio', 'codigo_postal'] as const) {
      if (!isBlank(src[key])) dst[key] = String(src[key]);
    }
  };
  mergeDomicilio(fetched.domicilio, out.domicilio);
  mergeDomicilio(fetched.direccion_correspondencia, out.direccion_correspondencia);

  const l = fetched.informacion_laboral;
  if (l) {
    for (const key of ['situacion_laboral', 'profesion', 'ocupacion', 'empresa_centro_trabajo', 'ingreso_promedio_anual'] as const) {
      if (!isBlank(l[key])) out.informacion_laboral[key] = String(l[key]);
    }
  }

  const a = fetched.apoderado;
  if (a) {
    for (const key of ['nombres_apellidos', 'tipo_documento', 'numero_documento', 'nacionalidad', 'sexo', 'estado_civil', 'pais_nacimiento', 'fecha_nacimiento', 'pais_residencia', 'grado_instruccion', 'correo_electronico', 'telefono_celular'] as const) {
      if (!isBlank(a[key])) out.apoderado[key] = String(a[key]);
    }
    if (typeof a.es_domiciliado === 'boolean') out.apoderado.es_domiciliado = a.es_domiciliado;
    mergeDomicilio(a.domicilio, out.apoderado.domicilio);
    const p = a.poder_registral;
    if (p) {
      for (const key of ['partida_registral', 'asiento', 'zona_registral'] as const) {
        if (!isBlank(p[key])) out.apoderado.poder_registral[key] = String(p[key]);
      }
    }
  }

  const v = fetched.vinculaciones;
  if (v) {
    for (const key of ['es_vinculado_corfid_grupo_coril', 'ha_sido_cliente_otra_fiduciaria', 'ha_sido_trabajador_otra_fiduciaria'] as const) {
      if (typeof v[key] === 'boolean') out.vinculaciones[key] = v[key] as boolean;
    }
    if (!isBlank(v.valor_aproximado_patrimonio)) out.vinculaciones.valor_aproximado_patrimonio = String(v.valor_aproximado_patrimonio);
  }

  const o = fetched.origen_fondos;
  if (o) {
    for (const key of Object.keys(out.origen_fondos) as (keyof typeof out.origen_fondos)[]) {
      if (!isBlank(o[key])) out.origen_fondos[key] = String(o[key]);
    }
  }

  const an = fetched.antecedentes_penales_judiciales;
  if (an) {
    if (typeof an.es_investigado_delitos === 'boolean') out.antecedentes_penales_judiciales.es_investigado_delitos = an.es_investigado_delitos;
    if (!isBlank(an.especificar_delitos)) out.antecedentes_penales_judiciales.especificar_delitos = String(an.especificar_delitos);
  }

  const r = fetched.residencia_fiscal;
  if (r) {
    if (typeof r.tiene_residencia_fiscal_extranjera === 'boolean') out.residencia_fiscal.tiene_residencia_fiscal_extranjera = r.tiene_residencia_fiscal_extranjera;
    if (Array.isArray(r.paises)) {
      out.residencia_fiscal.paises = r.paises.map((p) => ({ pais: p?.pais ?? '', nit_tin: p?.nit_tin ?? '' }));
    }
  }

  const i = fetched.inversion;
  if (i) {
    for (const key of ['moneda', 'monto_inicial', 'monto_inicial_letras', 'origen_recursos', 'banco_nombre', 'numero_cuenta', 'cuenta_cci'] as const) {
      if (!isBlank(i[key])) out.inversion[key] = String(i[key]);
    }
  }

  return out;
}

// Convierte los valores del formulario al payload snake_case del backend.
export function formValuesToPayload(values: FichaMadreFormValues): SaveInversionistaPayload {
  return {
    es_domiciliado: values.es_domiciliado,
    usar_misma_direccion_correspondencia: values.usar_misma_direccion_correspondencia,
    tiene_apoderado: values.tiene_apoderado,
    titular: {
      ...values.titular,
      conyuge: values.titular.conyuge,
    },
    domicilio: values.domicilio,
    direccion_correspondencia: values.usar_misma_direccion_correspondencia
      ? { ...values.domicilio }
      : values.direccion_correspondencia,
    informacion_laboral: values.informacion_laboral,
    apoderado: values.tiene_apoderado ? values.apoderado : values.apoderado,
    vinculaciones: values.vinculaciones,
    origen_fondos: values.origen_fondos,
    antecedentes_penales_judiciales: values.antecedentes_penales_judiciales,
    residencia_fiscal: values.residencia_fiscal,
    inversion: values.inversion,
  };
}
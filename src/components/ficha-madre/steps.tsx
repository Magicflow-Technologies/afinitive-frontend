import { useFormContext, useFieldArray, Controller, type FieldPath } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FieldCheckbox,
  FieldDate,
  FieldRadio,
  FieldSelect,
  FieldSwitch,
  FieldText,
  FieldTextarea,
  SectionCard,
} from './fields';
import {
  BANCOS,
  ESTADOS_CIVIL,
  GRADOS_INSTRUCCION,
  MONEDAS,
  ORIGENES_FONDOS_LABELS,
  ORIGENES_RECURSOS,
  PAISES_SUGERIDOS,
  REGIMENES_PATRIMONIALES,
  SEXOS,
  SITUACIONES_LABORALES,
  TIPOS_DOCUMENTO,
} from '@/lib/ficha-madre.types';
import type { FichaMadreFormValues } from './schema';

export function PasoTitular() {
  const { watch } = useFormContext<FichaMadreFormValues>();
  const pep = watch('titular.pep');

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Datos del titular" description="Información personal del inversionista.">
        <FieldText name="titular.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" placeholder="Ej: Florencio Jorge Vilca Taipe" />
        <FieldSelect name="titular.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
        <FieldText name="titular.numero_documento" label="Número de documento" required placeholder="Ej: 76396947" />
        <FieldText name="titular.nacionalidad" label="Nacionalidad" required placeholder="Ej: Peruana" />
        <FieldRadio name="titular.sexo" label="Sexo" required options={SEXOS} />
        <FieldText name="titular.pais_nacimiento" label="País de nacimiento" required placeholder="Ej: Perú" />
        <FieldText name="titular.departamento_nacimiento" label="Departamento de nacimiento" placeholder="Ej: Lima" />
        <FieldDate name="titular.fecha_nacimiento" label="Fecha de nacimiento" required />
        <FieldText name="titular.pais_residencia" label="País de residencia" required placeholder="Ej: Perú" />
        <FieldSelect name="titular.grado_instruccion" label="Grado de instrucción" required options={GRADOS_INSTRUCCION} placeholder="Seleccionar grado..." />
        <FieldRadio name="titular.estado_civil" label="Estado civil" required options={ESTADOS_CIVIL} />
        <FieldText name="titular.correo_electronico" label="Correo electrónico" required type="email" placeholder="correo@ejemplo.com" />
        <FieldText name="titular.telefono_celular" label="Teléfono celular" required type="tel" placeholder="Ej: 928627325" />
        <FieldSwitch
          name="titular.es_inversionista"
          label="¿Es el titular de la inversión?"
          description="Marca si esta persona es quien realizará la inversión."
        />
      </SectionCard>

      <SectionCard title="Persona Expuesta Políticamente (PEP)" description="Declaración de condición PEP según normativa PLAFT.">
        <FieldSwitch
          name="titular.pep"
          label="¿Es o ha sido Persona Expuesta Políticamente?"
          description="PEP: funcionarios públicos o personas con cargos políticos relevantes."
        />
        {pep && (
          <FieldText
            name="titular.pep_institucion_cargo"
            label="Institución / cargo"
            required
            placeholder="Ej: Congresista de la República"
            className="sm:col-span-2"
          />
        )}
      </SectionCard>
    </div>
  );
}

export function PasoConyuge() {
  const { watch } = useFormContext<FichaMadreFormValues>();
  const estadoCivil = (watch('titular.estado_civil') ?? '').toUpperCase();
  const requiereConyuge = estadoCivil === 'CASADO' || estadoCivil === 'CONVIVIENTE';

  if (!requiereConyuge) {
    return (
      <SectionCard title="Cónyuge" description="Los datos del cónyuge solo se solicitan cuando el estado civil es Casado o Conviviente.">
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Estado civil actual: <strong>{estadoCivil || 'Sin definir'}</strong>. No se requieren datos del cónyuge.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title={estadoCivil === 'CONVIVIENTE' ? 'Datos de la conviviente' : 'Datos del cónyuge'}
        description="Información del cónyuge / conviviente y del régimen patrimonial."
      >
        <FieldText name="titular.conyuge.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" placeholder="Ej: María Lucía Paredes Ríos" />
        <FieldSelect name="titular.conyuge.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
        <FieldText name="titular.conyuge.numero_documento" label="Número de documento" required placeholder="Ej: 46218973" />
        <FieldSelect name="titular.conyuge.regimen_patrimonial" label="Régimen patrimonial" required options={REGIMENES_PATRIMONIALES} />
        <FieldDate name="titular.conyuge.fecha_regimen" label="Fecha del régimen" />
      </SectionCard>
    </div>
  );
}

export function PasoDomicilio() {
  const { watch } = useFormContext<FichaMadreFormValues>();
  const mismaDireccion = watch('usar_misma_direccion_correspondencia');

  return (
    <div className="flex flex-col gap-4">
      <FieldSwitch
        name="es_domiciliado"
        label="¿Es domiciliado en el país?"
        description="Indica si reside de forma habitual en el país de la inversión."
      />
      <SectionCard title="Domicilio" description="Dirección principal del titular.">
        <FieldText name="domicilio.direccion_completa" label="Dirección completa" required placeholder="Ej: Av. Los Tulipanes 123" className="sm:col-span-2" />
        <FieldText name="domicilio.departamento" label="Departamento" required placeholder="Ej: LIMA" />
        <FieldText name="domicilio.provincia" label="Provincia" required placeholder="Ej: HUAROCHIRI" />
        <FieldText name="domicilio.distrito" label="Distrito" required placeholder="Ej: SANTA EULALIA" />
        <FieldText name="domicilio.pais_domicilio" label="País" required placeholder="Ej: Perú" />
        <FieldText name="domicilio.codigo_postal" label="Código postal" placeholder="Ej: 15559" />
      </SectionCard>

      <FieldSwitch
        name="usar_misma_direccion_correspondencia"
        label="¿La correspondencia es igual al domicilio?"
        description="Si lo desactivas, podrás ingresar una dirección de correspondencia distinta."
      />

      {!mismaDireccion && (
        <SectionCard title="Dirección de correspondencia" description="Dirección donde se enviará la documentación.">
          <FieldText name="direccion_correspondencia.direccion_completa" label="Dirección completa" required placeholder="Ej: Jr. Las Palmeras 456" className="sm:col-span-2" />
          <FieldText name="direccion_correspondencia.departamento" label="Departamento" required placeholder="Ej: LIMA" />
          <FieldText name="direccion_correspondencia.provincia" label="Provincia" required placeholder="Ej: LIMA" />
          <FieldText name="direccion_correspondencia.distrito" label="Distrito" required placeholder="Ej: MIRAFLORES" />
          <FieldText name="direccion_correspondencia.pais_domicilio" label="País" required placeholder="Ej: Perú" />
          <FieldText name="direccion_correspondencia.codigo_postal" label="Código postal" placeholder="Ej: 15074" />
        </SectionCard>
      )}
    </div>
  );
}

export function PasoLaboral() {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Perfil laboral" description="Situación laboral y actividad profesional actual.">
        <FieldSelect name="informacion_laboral.situacion_laboral" label="Situación laboral" required options={SITUACIONES_LABORALES} />
        <FieldText name="informacion_laboral.profesion" label="Profesión" required placeholder="Ej: Ingeniería de Software" />
        <FieldText name="informacion_laboral.ocupacion" label="Ocupación" required placeholder="Ej: Programador Full Stack" />
        <FieldText name="informacion_laboral.empresa_centro_trabajo" label="Empresa / centro de trabajo" required placeholder="Ej: Footloose" />
        <FieldText name="informacion_laboral.ingreso_promedio_anual" label="Ingreso promedio anual (USD)" required inputMode="decimal" placeholder="Ej: 45000.00" />
      </SectionCard>

      <SectionCard title="Vinculaciones y patrimonio" description="Vínculos con el Grupo Corfid y valor aproximado del patrimonio.">
        <FieldCheckbox
          name="vinculaciones.es_vinculado_corfid_grupo_coril"
          label="¿Está vinculado a CORFID / Grupo Coril?"
          description="Directivos, accionistas o personal de las empresas del grupo."
        />
        <FieldCheckbox
          name="vinculaciones.ha_sido_cliente_otra_fiduciaria"
          label="¿Ha sido cliente de otra fiduciaria?"
        />
        <FieldCheckbox
          name="vinculaciones.ha_sido_trabajador_otra_fiduciaria"
          label="¿Ha sido trabajador de otra fiduciaria?"
        />
        <FieldText
          name="vinculaciones.valor_aproximado_patrimonio"
          label="Valor aproximado del patrimonio (USD)"
          required
          inputMode="decimal"
          placeholder="Ej: 123100.00"
          className="sm:col-span-2"
        />
      </SectionCard>
    </div>
  );
}

const ORIGEN_KEYS = Object.keys(ORIGENES_FONDOS_LABELS) as (keyof FichaMadreFormValues['origen_fondos'])[];

export function PasoOrigenFondos() {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Origen de fondos"
        description="Detalla el origen de los fondos que se invertirán. Marca y detalla todas las fuentes que apliquen."
      >
        {ORIGEN_KEYS.map((key) => (
          <FieldTextarea
            key={key}
            name={`origen_fondos.${key}`}
            label={ORIGENES_FONDOS_LABELS[key]}
            placeholder="Describe el origen..."
            className="sm:col-span-2"
          />
        ))}
      </SectionCard>
    </div>
  );
}

export function PasoApoderadoCumplimiento() {
  const { control, watch } = useFormContext<FichaMadreFormValues>();
  const tieneApoderado = watch('tiene_apoderado');
  const investigado = watch('antecedentes_penales_judiciales.es_investigado_delitos');
  const resideFuera = watch('residencia_fiscal.tiene_residencia_fiscal_extranjera');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'residencia_fiscal.paises',
  });

  return (
    <div className="flex flex-col gap-4">
      <FieldSwitch
        name="tiene_apoderado"
        label="¿Actúa a través de un apoderado?"
        description="Si el titular otorga poder a un tercero para la inversión."
      />

      {tieneApoderado && (
        <>
          <SectionCard title="Datos del apoderado" description="Información del representante legal.">
            <FieldText name="apoderado.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" />
            <FieldSelect name="apoderado.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
            <FieldText name="apoderado.numero_documento" label="Número de documento" required />
            <FieldText name="apoderado.nacionalidad" label="Nacionalidad" required />
            <FieldRadio name="apoderado.sexo" label="Sexo" required options={SEXOS} />
            <FieldSelect name="apoderado.estado_civil" label="Estado civil" required options={ESTADOS_CIVIL} placeholder="Seleccionar..." />
            <FieldText name="apoderado.pais_nacimiento" label="País de nacimiento" required />
            <FieldDate name="apoderado.fecha_nacimiento" label="Fecha de nacimiento" required />
            <FieldText name="apoderado.pais_residencia" label="País de residencia" required />
            <FieldText name="apoderado.grado_instruccion" label="Grado de instrucción" placeholder="Opcional" />
            <FieldText name="apoderado.correo_electronico" label="Correo electrónico" type="email" />
            <FieldText name="apoderado.telefono_celular" label="Teléfono celular" type="tel" />
            <FieldSwitch name="apoderado.es_domiciliado" label="¿Es domiciliado?" />
          </SectionCard>

          <SectionCard title="Domicilio del apoderado">
            <FieldText name="apoderado.domicilio.direccion_completa" label="Dirección completa" className="sm:col-span-2" />
            <FieldText name="apoderado.domicilio.departamento" label="Departamento" />
            <FieldText name="apoderado.domicilio.provincia" label="Provincia" />
            <FieldText name="apoderado.domicilio.distrito" label="Distrito" />
            <FieldText name="apoderado.domicilio.pais_domicilio" label="País" />
            <FieldText name="apoderado.domicilio.codigo_postal" label="Código postal" />
          </SectionCard>

          <SectionCard title="Poder registral" description="Datos de inscripción del poder en registros públicos.">
            <FieldText name="apoderado.poder_registral.partida_registral" label="Partida registral" />
            <FieldText name="apoderado.poder_registral.asiento" label="Asiento" />
            <FieldText name="apoderado.poder_registral.zona_registral" label="Zona registral" />
          </SectionCard>
        </>
      )}

      <SectionCard title="Antecedentes" description="Declaración sobre investigaciones o procesos judiciales.">
        <FieldSwitch
          name="antecedentes_penales_judiciales.es_investigado_delitos"
          label="¿Es investigado o ha sido condenado por delitos?"
        />
        {investigado && (
          <FieldTextarea
            name="antecedentes_penales_judiciales.especificar_delitos"
            label="Detalle de los delitos / investigaciones"
            required
            className="sm:col-span-2"
          />
        )}
      </SectionCard>

      <SectionCard title="Residencia fiscal (FATCA)" description="Declaración de residencia fiscal fuera de Perú.">
        <FieldSwitch
          name="residencia_fiscal.tiene_residencia_fiscal_extranjera"
          label="¿Tributa o tiene residencia fiscal fuera de Perú?"
        />
        {resideFuera && (
          <div className="flex flex-col gap-3 sm:col-span-2">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">Agrega los países donde tiene residencia fiscal.</p>
            )}
            {fields.map((field, index) => (
              <PaisFila key={field.id} index={index} onRemove={() => remove(index)} />
            ))}
            <datalist id="paises-sugeridos">
              {PAISES_SUGERIDOS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <Button type="button" variant="outline" onClick={() => append({ pais: '', nit_tin: '' })} className="self-start">
              <Plus className="size-4" /> Agregar país
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function PaisFila({ index, onRemove }: { index: number; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
      <Controller<FichaMadreFormValues>
        name={`residencia_fiscal.paises.${index}.pais` as FieldPath<FichaMadreFormValues>}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <Label>País</Label>
            <Input
              list="paises-sugeridos"
              value={String(field.value ?? '')}
              onChange={field.onChange}
              placeholder="Ej: Estados Unidos"
            />
          </div>
        )}
      />
      <Controller<FichaMadreFormValues>
        name={`residencia_fiscal.paises.${index}.nit_tin` as FieldPath<FichaMadreFormValues>}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <Label>NIT / TIN</Label>
            <Input value={String(field.value ?? '')} onChange={field.onChange} placeholder="Número de identificación fiscal" />
          </div>
        )}
      />
      <div className="flex items-end pb-1">
        <Button type="button" variant="outline" size="icon" onClick={onRemove} aria-label="Eliminar país">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function PasoInversion() {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Datos de la inversión" description="Monto, moneda y origen de los recursos a invertir.">
        <FieldSelect name="inversion.moneda" label="Moneda" required options={MONEDAS} />
        <FieldText name="inversion.monto_inicial" label="Monto inicial a invertir" required inputMode="decimal" placeholder="Ej: 120000.00" />
        <FieldText name="inversion.monto_inicial_letras" label="Monto en letras" placeholder="Ej: CIENTO VEINTE MIL CON 00/100 DÓLARES AMERICANOS" className="sm:col-span-2" />
        <FieldSelect name="inversion.origen_recursos" label="Origen de los recursos" required options={ORIGENES_RECURSOS} />
      </SectionCard>

      <SectionCard title="Cuenta bancaria para abono de ganancias" description="Cuenta del cliente donde se abonarán los rendimientos.">
        <FieldSelect name="inversion.banco_nombre" label="Banco" options={BANCOS} placeholder="Seleccionar banco..." />
        <FieldText name="inversion.numero_cuenta" label="Número de cuenta" inputMode="numeric" placeholder="Ej: 191-2848571-0-79" />
        <FieldText name="inversion.cuenta_cci" label="CCI" inputMode="numeric" placeholder="Ej: 00219100284857107965" className="sm:col-span-2" />
      </SectionCard>
    </div>
  );
}
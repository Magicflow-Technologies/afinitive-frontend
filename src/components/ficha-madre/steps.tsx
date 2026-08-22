import { useEffect } from 'react';
import { useFormContext, useWatch, useFieldArray, Controller, type FieldPath } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FieldAccountNumber,
  FieldCCI,
  FieldCheckbox,
  FieldDate,
  FieldMoney,
  FieldRadio,
  FieldSelect,
  FieldSwitch,
  FieldText,
  FieldTextarea,
  SectionCard,
} from './fields';
import { montoALetras } from '@/lib/numero-a-letras';
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
  const { control } = useFormContext<FichaMadreFormValues>();
  const pep = useWatch({ control, name: 'titular.pep' });

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Datos del titular" description="Información personal del inversionista.">
        <FieldText name="titular.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" placeholder="Ej: Juan Carlos Pérez Gómez" />
        <FieldSelect name="titular.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
        <FieldText name="titular.numero_documento" label="Número de documento" required placeholder="Ej: 12345678" />
        <FieldText name="titular.nacionalidad" label="Nacionalidad" required placeholder="Ej: Peruana" />
        <FieldRadio name="titular.sexo" label="Sexo" required options={SEXOS} />
        <FieldText name="titular.pais_nacimiento" label="País de nacimiento" required placeholder="Ej: Perú" />
        <FieldText name="titular.departamento_nacimiento" label="Departamento de nacimiento" placeholder="Ej: Lima" />
        <FieldDate name="titular.fecha_nacimiento" label="Fecha de nacimiento" required />
        <FieldText name="titular.pais_residencia" label="País de residencia" required placeholder="Ej: Perú" />
        <FieldSelect name="titular.grado_instruccion" label="Grado de instrucción" required options={GRADOS_INSTRUCCION} placeholder="Seleccionar grado..." />
        <FieldRadio name="titular.estado_civil" label="Estado civil" required options={ESTADOS_CIVIL} />
        <FieldText name="titular.correo_electronico" label="Correo electrónico" required type="email" placeholder="ejemplo@correo.com" />
        <FieldText name="titular.telefono_celular" label="Teléfono celular" required type="tel" placeholder="Ej: 987654321" />
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
        {Boolean(pep) && (
          <FieldText
            name="titular.pep_institucion_cargo"
            label="Institución / cargo desempeñado"
            required
            placeholder="Ej: Ministerio de Economía - Director General"
            className="sm:col-span-2"
          />
        )}
      </SectionCard>
    </div>
  );
}

export function PasoConyuge() {
  const { control } = useFormContext<FichaMadreFormValues>();
  const estadoCivil = (useWatch({ control, name: 'titular.estado_civil' }) ?? '').toUpperCase();
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
        <FieldText name="titular.conyuge.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" placeholder="Ej: María Lucía Rojas Silva" />
        <FieldSelect name="titular.conyuge.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
        <FieldText name="titular.conyuge.numero_documento" label="Número de documento" required placeholder="Ej: 87654321" />
        <FieldSelect name="titular.conyuge.regimen_patrimonial" label="Régimen patrimonial" required options={REGIMENES_PATRIMONIALES} />
        <FieldDate name="titular.conyuge.fecha_regimen" label="Fecha del régimen" />
      </SectionCard>
    </div>
  );
}

export function PasoDomicilio() {
  const { control } = useFormContext<FichaMadreFormValues>();
  const mismaDireccion = useWatch({ control, name: 'usar_misma_direccion_correspondencia' });

  return (
    <div className="flex flex-col gap-4">
      <FieldSwitch
        name="es_domiciliado"
        label="¿Es domiciliado en el país?"
        description="Indica si reside de forma habitual en el país de la inversión."
      />
      <SectionCard title="Domicilio" description="Dirección principal del titular.">
        <FieldText name="domicilio.direccion_completa" label="Dirección completa" required placeholder="Ej: Av. Javier Prado Este 1234, Dpto. 502" className="sm:col-span-2" />
        <FieldText name="domicilio.departamento" label="Departamento" required placeholder="Ej: Lima" />
        <FieldText name="domicilio.provincia" label="Provincia" required placeholder="Ej: Lima" />
        <FieldText name="domicilio.distrito" label="Distrito" required placeholder="Ej: San Isidro" />
        <FieldText name="domicilio.pais_domicilio" label="País" required placeholder="Ej: Perú" />
        <FieldText name="domicilio.codigo_postal" label="Código postal" placeholder="Ej: 15036" />
      </SectionCard>

      <FieldSwitch
        name="usar_misma_direccion_correspondencia"
        label="¿La correspondencia es igual al domicilio?"
        description="Si lo desactivas, podrás ingresar una dirección de correspondencia distinta."
      />

      {!mismaDireccion && (
        <SectionCard title="Dirección de correspondencia" description="Dirección donde se enviará la documentación.">
          <FieldText name="direccion_correspondencia.direccion_completa" label="Dirección completa" required placeholder="Ej: Jr. Dos de Mayo 456, Of. 301" className="sm:col-span-2" />
          <FieldText name="direccion_correspondencia.departamento" label="Departamento" required placeholder="Ej: Lima" />
          <FieldText name="direccion_correspondencia.provincia" label="Provincia" required placeholder="Ej: Lima" />
          <FieldText name="direccion_correspondencia.distrito" label="Distrito" required placeholder="Ej: Miraflores" />
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
        <FieldText name="informacion_laboral.profesion" label="Profesión" required placeholder="Ej: Administración de Empresas / Economía" />
        <FieldText name="informacion_laboral.ocupacion" label="Ocupación" required placeholder="Ej: Gerente Comercial / Consultor" />
        <FieldText name="informacion_laboral.empresa_centro_trabajo" label="Empresa / centro de trabajo" required placeholder="Ej: Inversiones Globales S.A.C." />
        <FieldMoney
          name="informacion_laboral.ingreso_promedio_anual"
          label="Ingreso promedio anual"
          required
          placeholder="Ej: 50,000.00"
          currency="USD"
        />
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
        <FieldMoney
          name="vinculaciones.valor_aproximado_patrimonio"
          label="Valor aproximado del patrimonio"
          required
          placeholder="Ej: 100,000.00"
          currency="USD"
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
            placeholder="Detalla el origen o procedencia de los fondos (ej: Ahorros por remuneración, venta de inmueble, dividendos)..."
            className="sm:col-span-2"
          />
        ))}
      </SectionCard>
    </div>
  );
}

export function PasoApoderadoCumplimiento() {
  const { control } = useFormContext<FichaMadreFormValues>();
  const tieneApoderado = useWatch({ control, name: 'tiene_apoderado' });
  const investigado = useWatch({ control, name: 'antecedentes_penales_judiciales.es_investigado_delitos' });
  const resideFuera = useWatch({ control, name: 'residencia_fiscal.tiene_residencia_fiscal_extranjera' });

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
            <FieldText name="apoderado.nombres_apellidos" label="Nombres y apellidos" required className="sm:col-span-2" placeholder="Ej: Carlos Alberto Mendoza Soto" />
            <FieldSelect name="apoderado.tipo_documento" label="Tipo de documento" required options={TIPOS_DOCUMENTO} />
            <FieldText name="apoderado.numero_documento" label="Número de documento" required placeholder="Ej: 12345678" />
            <FieldText name="apoderado.nacionalidad" label="Nacionalidad" required placeholder="Ej: Peruana" />
            <FieldRadio name="apoderado.sexo" label="Sexo" required options={SEXOS} />
            <FieldSelect name="apoderado.estado_civil" label="Estado civil" required options={ESTADOS_CIVIL} placeholder="Seleccionar..." />
            <FieldText name="apoderado.pais_nacimiento" label="País de nacimiento" required placeholder="Ej: Perú" />
            <FieldDate name="apoderado.fecha_nacimiento" label="Fecha de nacimiento" required />
            <FieldText name="apoderado.pais_residencia" label="País de residencia" required placeholder="Ej: Perú" />
            <FieldText name="apoderado.grado_instruccion" label="Grado de instrucción" placeholder="Ej: Superior Completa" />
            <FieldText name="apoderado.correo_electronico" label="Correo electrónico" type="email" placeholder="apoderado@ejemplo.com" />
            <FieldText name="apoderado.telefono_celular" label="Teléfono celular" type="tel" placeholder="Ej: 987654321" />
            <FieldSwitch name="apoderado.es_domiciliado" label="¿Es domiciliado?" />
          </SectionCard>

          <SectionCard title="Domicilio del apoderado">
            <FieldText name="apoderado.domicilio.direccion_completa" label="Dirección completa" className="sm:col-span-2" placeholder="Ej: Av. Las Begonias 450, Dpto. 301" />
            <FieldText name="apoderado.domicilio.departamento" label="Departamento" placeholder="Ej: Lima" />
            <FieldText name="apoderado.domicilio.provincia" label="Provincia" placeholder="Ej: Lima" />
            <FieldText name="apoderado.domicilio.distrito" label="Distrito" placeholder="Ej: San Isidro" />
            <FieldText name="apoderado.domicilio.pais_domicilio" label="País" placeholder="Ej: Perú" />
            <FieldText name="apoderado.domicilio.codigo_postal" label="Código postal" placeholder="Ej: 15046" />
          </SectionCard>

          <SectionCard title="Poder registral" description="Datos de inscripción del poder en registros públicos.">
            <FieldText name="apoderado.poder_registral.partida_registral" label="Partida registral" placeholder="Ej: 11029384" />
            <FieldText name="apoderado.poder_registral.asiento" label="Asiento" placeholder="Ej: A00001" />
            <FieldText name="apoderado.poder_registral.zona_registral" label="Zona registral" placeholder="Ej: Zona Registral N° IX - Sede Lima" />
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
            placeholder="Detalle de la investigación o proceso judicial..."
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
            <Input value={String(field.value ?? '')} onChange={field.onChange} placeholder="Ej: 123-45-6789 (Identificación fiscal)" />
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
  const { control, setValue, getValues } = useFormContext<FichaMadreFormValues>();
  const moneda = useWatch({ control, name: 'inversion.moneda' }) || 'USD';
  const monto = useWatch({ control, name: 'inversion.monto_inicial' });
  const cci = useWatch({ control, name: 'inversion.cuenta_cci' });

  // Auto-sincronizar el monto en letras en tiempo real cuando se ingresa el monto
  useEffect(() => {
    if (monto && String(monto).trim() !== '') {
      const letras = montoALetras(monto, moneda);
      if (letras) {
        setValue('inversion.monto_inicial_letras', letras, { shouldValidate: true });
      }
    }
  }, [monto, moneda, setValue]);

  // Auto-seleccionar el banco si se ingresa un CCI con prefijo conocido y el banco está vacío
  useEffect(() => {
    if (cci) {
      const digits = String(cci).replace(/\D/g, '');
      if (digits.length >= 3) {
        const prefix = digits.slice(0, 3);
        const bancoMap: Record<string, string> = {
          '002': 'Banco de Crédito del Perú',
          '011': 'BBVA',
          '003': 'Interbank',
          '009': 'Scotiabank',
          '038': 'BanBif',
          '056': 'Banco Pichincha',
          '801': 'Caja Sullana',
        };
        const bancoMatch = bancoMap[prefix];
        const currentBanco = getValues('inversion.banco_nombre');
        if (bancoMatch && (!currentBanco || currentBanco === 'Otro')) {
          setValue('inversion.banco_nombre', bancoMatch, { shouldValidate: true });
        }
      }
    }
  }, [cci, getValues, setValue]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Datos de la inversión" description="Monto, moneda y origen de los recursos a invertir.">
        <FieldSelect name="inversion.moneda" label="Moneda" required options={MONEDAS} />
        <FieldMoney
          name="inversion.monto_inicial"
          label="Monto inicial a invertir"
          required
          placeholder="Ej: 10,000.00"
          currency={moneda}
        />
        <FieldText
          name="inversion.monto_inicial_letras"
          label="Monto en letras"
          placeholder="Ej: DIEZ MIL CON 00/100 DÓLARES AMERICANOS"
          className="sm:col-span-2"
        />
        <FieldSelect name="inversion.origen_recursos" label="Origen de los recursos" required options={ORIGENES_RECURSOS} />
      </SectionCard>

      <SectionCard title="Cuenta bancaria para abono de ganancias" description="Cuenta del cliente donde se abonarán los rendimientos.">
        <FieldSelect name="inversion.banco_nombre" label="Banco" options={BANCOS} placeholder="Seleccionar banco..." />
        <FieldAccountNumber
          name="inversion.numero_cuenta"
          label="Número de cuenta / tarjeta"
          placeholder="Ej: 4557-8901-2345-6789 o 191-2848571-0-79"
        />
        <FieldCCI
          name="inversion.cuenta_cci"
          label="Código de Cuenta Interbancario (CCI)"
          placeholder="Ej: 002-191-002848571079-65"
          className="sm:col-span-2"
        />
      </SectionCard>
    </div>
  );
}
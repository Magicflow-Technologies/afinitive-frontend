'use client';

import React, { useState, useEffect } from 'react';
import { api, InversionFideicomiso } from '@/services/api';

interface ModalAmpliacionInversionProps {
  isOpen: boolean;
  onClose: () => void;
  inversion: InversionFideicomiso | null;
  onSuccess: () => void;
}

// Convertidor de montos a letras para documentos legales
function numeroALetras(monto: number, moneda: string = 'USD'): string {
  if (isNaN(monto) || monto <= 0) return '';

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezY = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const veinteY = ['VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let res = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) res += centenas[c] + ' ';
    const du = n % 100;
    if (du >= 10 && du <= 19) {
      res += diezY[du - 10];
    } else if (du >= 20 && du <= 29) {
      res += veinteY[du - 20];
    } else {
      if (d > 0) res += decenas[d] + (u > 0 ? ' Y ' : '');
      if (u > 0) res += unidades[u];
    }
    return res.trim();
  }

  const partes = monto.toFixed(2).split('.');
  const entero = parseInt(partes[0], 10);
  const centavos = partes[1];

  if (entero === 0) return `CERO Y ${centavos}/100 ${moneda === 'USD' ? 'DÓLARES AMERICANOS' : 'SOLES'}`;

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidadesResto = entero % 1000;

  let texto = '';
  if (millones === 1) texto += 'UN MILLÓN ';
  else if (millones > 1) texto += convertirGrupo(millones) + ' MILLONES ';

  if (miles === 1) texto += 'MIL ';
  else if (miles > 1) texto += convertirGrupo(miles) + ' MIL ';

  if (unidadesResto > 0) texto += convertirGrupo(unidadesResto);

  const monedaTexto = moneda === 'USD' ? 'DÓLARES AMERICANOS' : 'SOLES';
  return `${texto.trim()} Y ${centavos}/100 ${monedaTexto}`;
}

// Formateador en vivo con comas y control de decimales
function formatMontoInput(val: string): string {
  let clean = val.replace(/[^0-9.]/g, '');

  // Permitir sólo un punto decimal
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }

  const [entero, decimal] = clean.split('.');

  let enteroFormateado = '';
  if (entero !== undefined && entero !== '') {
    const num = parseInt(entero, 10);
    enteroFormateado = isNaN(num) ? '' : num.toLocaleString('en-US');
  }

  if (decimal !== undefined) {
    return `${enteroFormateado || '0'}.${decimal.slice(0, 2)}`;
  }

  return enteroFormateado;
}

// Parseador de string formateado con comas a float
function parseMontoInput(formattedVal: string): number {
  if (!formattedVal) return 0;
  const clean = formattedVal.replace(/,/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

// Indicador amigable en lenguaje humano de magnitudes (Miles / Millones)
function getMagnitudLegible(monto: number, moneda: string = 'USD'): string {
  if (monto <= 0) return '';
  const monedaNombre = moneda === 'USD' ? 'Dólares' : 'Soles';

  if (monto >= 1000000) {
    const millones = monto / 1000000;
    const millonesStr = millones % 1 === 0 ? millones.toString() : millones.toFixed(2).replace(/\.?0+$/, '');
    const sufijo = millones === 1 ? 'Millón' : 'Millones';
    return `✨ ${millonesStr} ${sufijo} de ${monedaNombre}`;
  }

  if (monto >= 1000) {
    const miles = monto / 1000;
    const milesStr = miles % 1 === 0 ? miles.toString() : miles.toFixed(2).replace(/\.?0+$/, '');
    return `💵 ${milesStr} Mil ${monedaNombre}`;
  }

  return `💵 ${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${monedaNombre}`;
}

export function ModalAmpliacionInversion({
  isOpen,
  onClose,
  inversion,
  onSuccess,
}: ModalAmpliacionInversionProps) {
  const [montoAmpliacionTexto, setMontoAmpliacionTexto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMontoAmpliacionTexto('');
      setObservaciones('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !inversion) return null;

  const monedaSimbolo = inversion.moneda === 'USD' ? '$' : 'S/';
  const montoAnterior = Number(inversion.monto || 0);
  const ampliacionNum = parseMontoInput(montoAmpliacionTexto);
  const nuevoTotal = montoAnterior + ampliacionNum;

  const ampliacionesPrevias = inversion.ampliaciones?.length || 0;
  const proximaAmpliacionNum = ampliacionesPrevias + 1;
  const proximaVersion = ampliacionesPrevias + 2;

  const montoAmpliacionEnLetras = ampliacionNum > 0 ? numeroALetras(ampliacionNum, inversion.moneda) : '';
  const nuevoTotalEnLetras = nuevoTotal > 0 ? numeroALetras(nuevoTotal, inversion.moneda) : '';
  const magnitudLegible = getMagnitudLegible(ampliacionNum, inversion.moneda);

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMontoInput(e.target.value);
    setMontoAmpliacionTexto(formatted);
  };

  const handleAgregarPreset = (incremento: number) => {
    const nuevo = ampliacionNum + incremento;
    const formatted = nuevo.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    setMontoAmpliacionTexto(formatted);
  };

  const handleLimpiarMonto = () => {
    setMontoAmpliacionTexto('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ampliacionNum <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0 para la ampliación.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.crearAmpliacionInversion(inversion.id, {
        montoAmpliacion: ampliacionNum,
        montoAmpliacionLetras: montoAmpliacionEnLetras,
        montoNuevoTotalLetras: nuevoTotalEnLetras,
        observaciones: observaciones.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la ampliación de inversión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-[#e7ebf1] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-[#e7ebf1] flex items-center justify-between bg-gradient-to-r from-white via-white to-[#f7f8fb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344] font-bold text-lg shadow-sm">
              📈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#10233f]">
                  Ampliación de Inversión
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344]">
                  Ampliación N° {proximaAmpliacionNum} (v{proximaVersion})
                </span>
              </div>
              <p className="text-xs text-[#8d9aae] mt-0.5">
                {inversion.fideicomiso?.nombre || 'Fideicomiso'} — Genera automáticamente la Carta de Solicitud de Ampliación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8d9aae] hover:text-[#10233f] hover:bg-[#f7f8fb] transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Cards de Trazabilidad Financiera */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1]">
              <span className="block text-[10px] font-mono font-bold text-[#8d9aae] uppercase">Inversión Anterior</span>
              <span className="block text-sm font-extrabold text-[#17233a] mt-1 truncate" title={`Anterior: ${monedaSimbolo} ${montoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                {monedaSimbolo} {montoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#8d9aae] font-medium">
                {ampliacionesPrevias === 0 ? 'Inversión inicial' : `v${ampliacionesPrevias + 1}`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <span className="block text-[10px] font-mono font-bold text-amber-800 uppercase">Monto Ampliación</span>
              <span className="block text-sm font-extrabold text-amber-700 mt-1 truncate" title={`Ampliación: +${monedaSimbolo} ${ampliacionNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                + {monedaSimbolo} {ampliacionNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Nuevo aporte</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="block text-[10px] font-mono font-bold text-emerald-800 uppercase">Nuevo Total</span>
              <span className="block text-sm font-extrabold text-emerald-700 mt-1 truncate" title={`Nuevo Total: ${monedaSimbolo} ${nuevoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                {monedaSimbolo} {nuevoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Consolidado v{proximaVersion}</span>
            </div>
          </div>

          {/* Campo Monto con Formateo Dinámico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#10233f]">
                Monto a Ampliar ({inversion.moneda}) *
              </label>
              {magnitudLegible && (
                <span className="text-[11px] font-bold text-[#caa344] bg-[#caa344]/10 border border-[#caa344]/25 px-2.5 py-0.5 rounded-full animate-fade-in">
                  {magnitudLegible}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8d9aae]">
                {monedaSimbolo}
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                required
                value={montoAmpliacionTexto}
                onChange={handleMontoChange}
                placeholder="0.00 (Ej: 1,000,000)"
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-[#e7ebf1] text-base font-extrabold text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-2 focus:ring-[#caa344]/20 transition-all shadow-sm font-mono"
              />
            </div>

            {/* Atajos Rápidos de Incremento (Presets) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-[#8d9aae] uppercase mr-1">Rápido:</span>
              {[10000, 50000, 100000, 500000, 1000000].map((preset) => {
                const label = preset >= 1000000 ? `+1M` : `+${preset / 1000}k`;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAgregarPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-[#f7f8fb] hover:bg-[#caa344]/15 border border-[#e7ebf1] hover:border-[#caa344] text-[11px] font-bold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer font-mono shadow-xs"
                    title={`Sumar ${monedaSimbolo} ${preset.toLocaleString('en-US')}`}
                  >
                    {label}
                  </button>
                );
              })}
              {ampliacionNum > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiarMonto}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer ml-auto"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Desglose y Montos en Letras (Previsualización Automática) */}
          {ampliacionNum > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f7f8fb] to-white border border-[#e7ebf1] space-y-2.5 text-xs shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="block text-[10px] font-mono font-bold text-[#8d9aae] uppercase shrink-0">
                  Ampliación escrita:
                </span>
                <span className="font-bold text-[#10233f] text-right">
                  {montoAmpliacionEnLetras}
                </span>
              </div>
              <div className="pt-2 border-t border-[#e7ebf1] flex items-start justify-between gap-2">
                <span className="block text-[10px] font-mono font-bold text-emerald-800 uppercase shrink-0">
                  Nuevo saldo consolidado:
                </span>
                <span className="font-extrabold text-emerald-700 text-right">
                  {nuevoTotalEnLetras}
                </span>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#10233f] mb-1.5">
              Motivo u Observaciones de la Ampliación (Opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Aporte extraordinario de capital según instrucción del cliente..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e7ebf1] text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
            />
          </div>

          {/* Nota Informativa */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2">
            <span className="text-base shrink-0">ℹ️</span>
            <span>
              Al confirmar, se generará la <strong>Carta de Solicitud de Ampliación de Inversionista</strong> en estado <strong>Pendiente de Firma</strong>. Podrás previsualizarla idéntico al Formato 05 y enviarla al enlace de firma del cliente.
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf1]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8d9aae] hover:text-[#10233f] hover:bg-[#f7f8fb] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || ampliacionNum <= 0}
              className="px-5 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-bold shadow-md shadow-[#caa344]/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Generando Ampliación...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirmar y Generar Carta ({monedaSimbolo} {ampliacionNum > 0 ? ampliacionNum.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

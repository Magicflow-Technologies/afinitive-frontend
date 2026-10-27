'use client';

import React, { useState, useEffect } from 'react';
import { api, Fideicomiso, InversionFideicomiso } from '@/services/api';

interface ModalAsociarFideicomisoProps {
  isOpen: boolean;
  onClose: () => void;
  fichaMadreId: string;
  catalogoFideicomisos: Fideicomiso[];
  inversionAEditar?: InversionFideicomiso | null;
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

export function ModalAsociarFideicomiso({
  isOpen,
  onClose,
  fichaMadreId,
  catalogoFideicomisos,
  inversionAEditar,
  onSuccess,
}: ModalAsociarFideicomisoProps) {
  const [fideicomisoId, setFideicomisoId] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [monto, setMonto] = useState('');
  const [montoLetras, setMontoLetras] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [plazoEmision, setPlazoEmision] = useState('');
  const [serieEmision, setSerieEmision] = useState('Primera');
  const [cantidadValores, setCantidadValores] = useState('Uno (01)');
  const [vigenciaInstruccion, setVigenciaInstruccion] = useState('Seis (06) días hábiles');

  // Cuentas de recaudación / fiduciarias
  const [bancoDestino, setBancoDestino] = useState('');
  const [numeroCuentaDestino, setNumeroCuentaDestino] = useState('');
  const [cuentaCciDestino, setCuentaCciDestino] = useState('');
  const [titularCuentaDestino, setTitularCuentaDestino] = useState('');

  // Nuevos campos operativos y de cronograma
  const [vencimiento, setVencimiento] = useState('');
  const [correoOpCoril, setCorreoOpCoril] = useState('');
  const [correoOpCorfid, setCorreoOpCorfid] = useState('');
  const [enlaceCronograma, setEnlaceCronograma] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (inversionAEditar) {
      setFideicomisoId(inversionAEditar.fideicomisoId);
      setMoneda(inversionAEditar.moneda || 'USD');
      setMonto(inversionAEditar.monto || '');
      setMontoLetras(inversionAEditar.montoLetras || '');
      setTasaInteres(inversionAEditar.tasaInteres || '');
      setPlazoEmision(inversionAEditar.plazoEmision || '');
      setSerieEmision(inversionAEditar.serieEmision || 'Primera');
      setCantidadValores(inversionAEditar.cantidadValores || 'Uno (01)');
      setVigenciaInstruccion(inversionAEditar.vigenciaInstruccion || 'Seis (06) días hábiles');
      setBancoDestino(inversionAEditar.bancoDestino || '');
      setNumeroCuentaDestino(inversionAEditar.numeroCuentaDestino || '');
      setCuentaCciDestino(inversionAEditar.cuentaCciDestino || '');
      setTitularCuentaDestino(inversionAEditar.titularCuentaDestino || '');
      setVencimiento(inversionAEditar.vencimiento || '');
      setCorreoOpCoril(inversionAEditar.correoOpCoril || '');
      setCorreoOpCorfid(inversionAEditar.correoOpCorfid || '');
      setEnlaceCronograma(inversionAEditar.enlaceCronograma || '');
      setObservaciones(inversionAEditar.observaciones || '');
    } else {
      // Valor inicial por defecto al abrir para nueva asociación
      const defaultFid = catalogoFideicomisos[0];
      if (defaultFid) {
        setFideicomisoId(defaultFid.id);
        setMoneda(defaultFid.monedaDefault || 'USD');
        setTasaInteres(defaultFid.tasaInteresDefault || '10 %');
        setPlazoEmision(defaultFid.plazoEmisionDefault || 'Hasta de 24 meses. Base ACT/360.');
        setBancoDestino(defaultFid.bancoNombre || '');
        setNumeroCuentaDestino(defaultFid.numeroCuenta || '');
        setCuentaCciDestino(defaultFid.cuentaCci || '');
        setTitularCuentaDestino(defaultFid.titularCuenta || '');
        setCorreoOpCoril(defaultFid.correoOpCorilDefault || 'operaciones@grupocoril.com');
        setCorreoOpCorfid(defaultFid.correoOpCorfidDefault || 'operaciones@corfid.com.pe');
      } else {
        setFideicomisoId('');
        setMoneda('USD');
        setTasaInteres('10 %');
        setPlazoEmision('Hasta de 24 meses. Base ACT/360.');
        setBancoDestino('');
        setNumeroCuentaDestino('');
        setCuentaCciDestino('');
        setTitularCuentaDestino('');
        setCorreoOpCoril('operaciones@grupocoril.com');
        setCorreoOpCorfid('operaciones@corfid.com.pe');
      }
      setMonto('');
      setMontoLetras('');
      setSerieEmision('Primera');
      setCantidadValores('Uno (01)');
      setVigenciaInstruccion('Seis (06) días hábiles');
      setVencimiento('');
      setEnlaceCronograma('');
      setObservaciones('');
    }
  }, [isOpen, inversionAEditar, catalogoFideicomisos]);

  // Al cambiar de fideicomiso en el dropdown, autocompletar sus defaults si es nuevo
  const handleFideicomisoChange = (fidId: string) => {
    setFideicomisoId(fidId);
    const fid = catalogoFideicomisos.find((f) => f.id === fidId);
    if (fid && !inversionAEditar) {
      if (fid.monedaDefault) setMoneda(fid.monedaDefault);
      if (fid.tasaInteresDefault) setTasaInteres(fid.tasaInteresDefault);
      if (fid.plazoEmisionDefault) setPlazoEmision(fid.plazoEmisionDefault);
      if (fid.bancoNombre) setBancoDestino(fid.bancoNombre);
      if (fid.numeroCuenta) setNumeroCuentaDestino(fid.numeroCuenta);
      if (fid.cuentaCci) setCuentaCciDestino(fid.cuentaCci);
      if (fid.titularCuenta) setTitularCuentaDestino(fid.titularCuenta);
      if (fid.correoOpCorilDefault) setCorreoOpCoril(fid.correoOpCorilDefault);
      if (fid.correoOpCorfidDefault) setCorreoOpCorfid(fid.correoOpCorfidDefault);
    }
  };

  // Al cambiar monto numérico, autocompletar monto en letras si no fue modificado manualmente
  const handleMontoChange = (val: string) => {
    setMonto(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setMontoLetras(numeroALetras(num, moneda));
    }
  };

  const handleMonedaChange = (m: string) => {
    setMoneda(m);
    const num = parseFloat(monto);
    if (!isNaN(num) && num > 0) {
      setMontoLetras(numeroALetras(num, m));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fideicomisoId) {
      setError('Debes seleccionar un Fideicomiso.');
      return;
    }
    if (!monto || parseFloat(monto) <= 0) {
      setError('Debes ingresar un monto válido de inversión.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (inversionAEditar) {
        await api.actualizarInversionFideicomiso(inversionAEditar.id, {
          moneda,
          monto,
          montoLetras,
          tasaInteres,
          plazoEmision,
          serieEmision,
          cantidadValores,
          vigenciaInstruccion,
          bancoDestino,
          numeroCuentaDestino,
          cuentaCciDestino,
          titularCuentaDestino,
          vencimiento,
          correoOpCoril,
          correoOpCorfid,
          enlaceCronograma,
          observaciones,
        });
      } else {
        await api.asociarInversionFideicomiso({
          fichaMadreId,
          fideicomisoId,
          moneda,
          monto,
          montoLetras,
          tasaInteres,
          plazoEmision,
          serieEmision,
          cantidadValores,
          vigenciaInstruccion,
          bancoDestino,
          numeroCuentaDestino,
          cuentaCciDestino,
          titularCuentaDestino,
          vencimiento,
          correoOpCoril,
          correoOpCorfid,
          enlaceCronograma,
          observaciones,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar la inversión en el fideicomiso.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const esEdicion = Boolean(inversionAEditar);

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl border border-[#e7ebf1] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#10233f]">
                {esEdicion ? 'Editar Parámetros de Inversión' : 'Asociar Inversión en Fideicomiso'}
              </h3>
              <p className="text-xs text-[#8d9aae]">
                {esEdicion
                  ? 'Modifica los importes, vencimientos y cuentas fiduciarias de esta inversión.'
                  : 'Configura la inversión. Al asociar se generarán los Formatos 05, 06 y 07.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#8d9aae] hover:text-[#17233a] flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Selección del Fideicomiso */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
              Fideicomiso de Destino *
            </label>
            <select
              value={fideicomisoId}
              onChange={(e) => handleFideicomisoChange(e.target.value)}
              disabled={esEdicion}
              className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-semibold text-[#10233f] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344] disabled:opacity-60 cursor-pointer"
            >
              <option value="">Selecciona un Fideicomiso...</option>
              {catalogoFideicomisos.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre} — {f.emisorFiduciario || 'Grupo Coril'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Moneda y Montos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Moneda
              </label>
              <select
                value={moneda}
                onChange={(e) => handleMonedaChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-semibold text-[#10233f] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              >
                <option value="USD">USD ($) Dólares</option>
                <option value="PEN">PEN (S/) Soles</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Monto Nominal a Invertir *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8d9aae]">
                  {moneda === 'USD' ? '$' : 'S/'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  placeholder="50000.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-bold text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
              Monto en Letras (Legal)
            </label>
            <input
              type="text"
              value={montoLetras}
              onChange={(e) => setMontoLetras(e.target.value)}
              placeholder="CINCUENTA MIL Y 00/100 DÓLARES AMERICANOS"
              className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Tasa de Interés Nominal
              </label>
              <input
                type="text"
                value={tasaInteres}
                onChange={(e) => setTasaInteres(e.target.value)}
                placeholder="10 %"
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Plazo de Emisión
              </label>
              <input
                type="text"
                value={plazoEmision}
                onChange={(e) => setPlazoEmision(e.target.value)}
                placeholder="Hasta de 24 meses. Base ACT/360."
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Serie de Emisión
              </label>
              <input
                type="text"
                value={serieEmision}
                onChange={(e) => setSerieEmision(e.target.value)}
                placeholder="Primera"
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Cantidad Valores
              </label>
              <input
                type="text"
                value={cantidadValores}
                onChange={(e) => setCantidadValores(e.target.value)}
                placeholder="Uno (01)"
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
                Vigencia Instrucción
              </label>
              <input
                type="text"
                value={vigenciaInstruccion}
                onChange={(e) => setVigenciaInstruccion(e.target.value)}
                placeholder="Seis (06) días hábiles"
                className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
              />
            </div>
          </div>

          {/* 3. Cuentas Bancarias de Destino / Recaudación (para Formato 06) */}
          <div className="pt-2 border-t border-[#e7ebf1] space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#10233f]">
              Cuentas Bancarias Fiduciarias de Destino (Formato 06)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Banco Destino
                </label>
                <input
                  type="text"
                  value={bancoDestino}
                  onChange={(e) => setBancoDestino(e.target.value)}
                  placeholder="Banco de Crédito del Perú (BCP)"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={numeroCuentaDestino}
                  onChange={(e) => setNumeroCuentaDestino(e.target.value)}
                  placeholder="193-98765432-1-90"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Código de Cuenta Interbancario (CCI)
                </label>
                <input
                  type="text"
                  value={cuentaCciDestino}
                  onChange={(e) => setCuentaCciDestino(e.target.value)}
                  placeholder="002-193-009876543210-90"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={titularCuentaDestino}
                  onChange={(e) => setTitularCuentaDestino(e.target.value)}
                  placeholder="Patrimonio en Fideicomiso AFINITIVE..."
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
            </div>
          </div>

          {/* 4. Operaciones, Vencimiento y Cronograma */}
          <div className="pt-2 border-t border-[#e7ebf1] space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#10233f]">
              Operaciones, Vencimiento y Enlace a Cronograma
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Fecha o Plazo de Vencimiento
                </label>
                <input
                  type="text"
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                  placeholder="Ej: 31/12/2026 o 24 meses"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Correo Operaciones Coril
                </label>
                <input
                  type="email"
                  value={correoOpCoril}
                  onChange={(e) => setCorreoOpCoril(e.target.value)}
                  placeholder="operaciones@grupocoril.com"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                  Correo Operaciones Corfid
                </label>
                <input
                  type="email"
                  value={correoOpCorfid}
                  onChange={(e) => setCorreoOpCorfid(e.target.value)}
                  placeholder="operaciones@corfid.com.pe"
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8d9aae] mb-1">
                Enlace al Cronograma de Pagos (URL externa)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={enlaceCronograma}
                  onChange={(e) => setEnlaceCronograma(e.target.value)}
                  placeholder="https://drive.google.com/... o enlace del fiduciario"
                  className="w-full pl-9 pr-4 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
                />
                <svg className="w-4 h-4 text-[#8d9aae] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8d9aae] mb-1.5">
              Observaciones Internas
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas u observaciones para el analista u operador..."
              className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-medium text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] focus:ring-1 focus:ring-[#caa344]"
            />
          </div>
        </form>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-[#e7ebf1] flex items-center justify-end gap-3 bg-[#f7f8fb]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#e7ebf1] bg-white hover:bg-[#f7f8fb] text-[#17233a] font-semibold text-xs transition-all cursor-pointer shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving
              ? 'Guardando...'
              : esEdicion
                ? 'Actualizar Parámetros'
                : 'Asociar y Generar Formatos (05, 06, 07)'}
          </button>
        </div>
      </div>
    </div>
  );
}

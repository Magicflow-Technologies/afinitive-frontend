'use client';

import React from 'react';
import { Receipt, Landmark } from 'lucide-react';
import { MonthlySettlement } from '../../types/portal.types';

interface MonthlySettlementCardProps {
  settlement: MonthlySettlement;
  onDownloadLiq: (id: string, mes: string) => void;
  onDownloadIR: (id: string, mes: string) => void;
}

export default function MonthlySettlementCard({
  settlement,
  onDownloadLiq,
  onDownloadIR,
}: MonthlySettlementCardProps) {
  const isHighlighted = settlement.esDestacado;
  const formattedNeto = settlement.rendimientoNeto.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className={`p-5 rounded-xl flex items-center justify-between transition-all duration-300 ${
        isHighlighted
          ? 'bg-[#FFFbeb] border-2 border-[#C9A84C]/30 shadow-md relative overflow-hidden transform hover:-translate-y-0.5'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Badge de Consulta Frecuente si es el Mes 3 */}
      {isHighlighted && (
        <div className="absolute top-0 right-0 bg-[#C9A84C] text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg shadow-sm">
          {settlement.etiquetaDestacada || 'Consulta Frecuente'}
        </div>
      )}

      {/* Mes y Descripción */}
      <div className="flex items-center w-1/3">
        <div
          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center mr-5 border shrink-0 ${
            isHighlighted
              ? 'bg-white border-[#C9A84C]/50 text-[#C9A84C]'
              : 'bg-gray-50 border-gray-100 text-black'
          }`}
        >
          <span className="text-[9px] font-bold text-gray-400 uppercase">
            Mes {settlement.mesNumero}
          </span>
          <span className="text-sm font-bold">
            {settlement.mesAbrev}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-black">
            {settlement.titulo}
          </p>
          {settlement.subtitulo && (
            <p className={`text-[10px] mt-0.5 uppercase ${isHighlighted ? 'text-gray-500' : 'text-gray-400'}`}>
              {settlement.subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Rendimiento Neto */}
      <div className="w-1/4 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
          Rendimiento Neto
        </p>
        <p className="text-base font-medium text-black">
          $ {formattedNeto}
        </p>
      </div>

      {/* Acciones de Descarga */}
      <div className="w-1/3 flex justify-end space-x-3">
        {/* Botón Liq. Pago */}
        <button
          onClick={() => onDownloadLiq(settlement.id, settlement.mesAbrev)}
          className={`flex items-center px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
            isHighlighted
              ? 'bg-white border border-gray-200 text-black hover:bg-gray-50 shadow-sm'
              : 'border border-gray-200 text-gray-400 hover:text-black hover:bg-gray-50'
          }`}
        >
          <Receipt size={12} className="mr-2 text-gray-400 shrink-0" />
          <span>Liq. Pago</span>
        </button>

        {/* Botón Retención IR */}
        {isHighlighted ? (
          <button
            onClick={() => onDownloadIR(settlement.id, settlement.mesAbrev)}
            className="flex items-center px-4 py-2 rounded bg-[#C9A84C] border border-[#C9A84C] text-[10px] font-bold text-white hover:bg-[#b0923f] uppercase tracking-widest transition-colors shadow-md"
          >
            <Landmark size={12} className="mr-2 shrink-0" />
            <span>Descargar IR (5%)</span>
          </button>
        ) : (
          <button
            onClick={() => onDownloadIR(settlement.id, settlement.mesAbrev)}
            className="flex items-center px-4 py-2 rounded border border-gray-200 text-[10px] font-bold text-gray-400 hover:text-[#C9A84C] hover:bg-amber-50/50 hover:border-[#C9A84C]/40 uppercase tracking-widest transition-colors"
          >
            <Landmark size={12} className="mr-2 shrink-0" />
            <span>Retención IR</span>
          </button>
        )}
      </div>
    </div>
  );
}

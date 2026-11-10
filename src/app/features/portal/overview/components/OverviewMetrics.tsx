'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function OverviewMetrics() {
  const {
    totalInvestedUSD,
    totalInvestedPEN,
    totalMonthlyYieldGrossUSD,
    totalMonthlyYieldGrossPEN,
    monthsCompleted,
    loading,
  } = usePortal();

  const formattedCapitalUSD = Math.round(totalInvestedUSD).toLocaleString('en-US');
  const formattedCapitalPEN = Math.round(totalInvestedPEN).toLocaleString('en-US');

  const formattedMonthlyUSD = Math.round(totalMonthlyYieldGrossUSD).toLocaleString('en-US');
  const formattedMonthlyPEN = Math.round(totalMonthlyYieldGrossPEN).toLocaleString('en-US');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      {/* 1. Capital Invertido Fideicomisos (Multi-moneda / Bimoneda) */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Capital Invertido Fideicomisos
        </p>
        {totalInvestedUSD > 0 ? (
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-light text-gray-400">USD</span>
              <h3 className="text-5xl font-light tracking-tighter text-black">
                {formattedCapitalUSD}
              </h3>
            </div>
            {totalInvestedPEN > 0 && (
              <div className="flex items-baseline space-x-2 mt-2 pt-2 border-t border-gray-100/80">
                <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">PEN</span>
                <span className="text-xl font-light tracking-tight text-gray-800">
                  {formattedCapitalPEN}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-light text-[#C9A84C]">PEN</span>
            <h3 className="text-5xl font-light tracking-tighter text-black">
              {formattedCapitalPEN}
            </h3>
          </div>
        )}
      </div>

      {/* 2. Rendimiento Bruto Mensual (Promedio) */}
      <div>
        <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-3">
          Rendimiento Bruto Mensual (Promedio)
        </p>
        {totalMonthlyYieldGrossUSD > 0 ? (
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-light text-gray-400">USD</span>
              <h3 className="text-4xl font-light tracking-tight text-black">
                {formattedMonthlyUSD}
              </h3>
            </div>
            {totalMonthlyYieldGrossPEN > 0 && (
              <div className="flex items-baseline space-x-2 mt-2 pt-2 border-t border-gray-100/80">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PEN</span>
                <span className="text-lg font-light tracking-tight text-gray-800">
                  {formattedMonthlyPEN}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-light text-gray-400">PEN</span>
            <h3 className="text-4xl font-light tracking-tight text-black">
              {formattedMonthlyPEN}
            </h3>
          </div>
        )}
      </div>

      {/* 3. Estado del Portafolio */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
          Estado del Portafolio
        </p>
        <h3 className="text-2xl font-medium tracking-tight text-black mt-2">
          Activo / Pagando
        </h3>
        <p className="text-sm text-emerald-600 font-medium flex items-center mt-2">
          <CheckCircle2 size={16} className="mr-1.5 shrink-0" />
          <span>{monthsCompleted} meses de pagos cumplidos</span>
        </p>
      </div>
    </div>
  );
}

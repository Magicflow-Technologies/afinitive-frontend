'use client';

import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';

export default function AccumulatedFlowChart() {
  const { monthlyFlowData, loading } = usePortal();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Determinar altura máxima para escala relativa
  const maxMonto = Math.max(...monthlyFlowData.map((d) => d.montoNeto), 2000);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Flujo Acumulado (6 Meses)
        </p>
      </div>

      <div className="relative h-[220px] w-full flex items-end justify-between px-2 pt-6 pb-2 border-b border-gray-100">
        {monthlyFlowData.map((item, idx) => {
          // Altura porcentual de la barra (con un mínimo del 40% para que luzca estético como en el diseño)
          const heightPercent = Math.max(35, Math.min(95, Math.round((item.montoNeto / maxMonto) * 90)));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full px-2 group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip flotante en hover */}
              <div
                className={`absolute -top-3 transform -translate-y-full transition-all duration-200 pointer-events-none z-10 ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="bg-black text-white text-xs py-1.5 px-3 rounded shadow-lg font-mono">
                  ${item.montoNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Barra */}
              <div
                className={`w-full max-w-[36px] rounded-t transition-all duration-300 ${
                  isHovered ? 'bg-[#C9A84C]' : 'bg-[#E5E7EB] group-hover:bg-[#C9A84C]'
                }`}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Label de Mes */}
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4">
                {item.mesLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Nota sutil de pie */}
      <div className="flex justify-between items-center mt-6 text-xs text-gray-400">
        <span>Rendimiento neto acreditado por mes</span>
        <span className="font-medium text-black">Tasa retención IR: 5%</span>
      </div>
    </div>
  );
}

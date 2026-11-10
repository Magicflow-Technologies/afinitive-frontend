'use client';

import React, { useMemo } from 'react';
import { usePortal } from '../../context/PortalContext';

export default function CapitalDistributionChart() {
  const { chartSegments, loading } = usePortal();

  // Si no hay datos dinámicos, usar valores demostrativos del diseño
  const segments = useMemo(() => {
    if (chartSegments.length > 0) return chartSegments;
    return [
      {
        label: 'Fideicomiso Urbaniza',
        tasa: '(10%)',
        monto: 150000,
        montoFormateado: '$ 150,000',
        moneda: 'USD',
        percentage: 68,
        color: '#000000',
      },
      {
        label: 'Fideicomiso Grazzia',
        tasa: '(9%)',
        monto: 70000,
        montoFormateado: '$ 70,000',
        moneda: 'USD',
        percentage: 32,
        color: '#C9A84C',
      },
    ];
  }, [chartSegments]);

  // Generar el conic-gradient para el donut circular
  const conicGradient = useMemo(() => {
    let accumulated = 0;
    const parts = segments.map((seg) => {
      const start = accumulated;
      accumulated += seg.percentage;
      const end = accumulated;
      return `${seg.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [segments]);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Distribución de Capital
        </p>
      </div>

      {/* Gráfico Donut estilo Apple / Minimalista */}
      <div className="relative w-56 h-56 mx-auto flex items-center justify-center my-4">
        {/* Anillo exterior */}
        <div
          className="w-full h-full rounded-full transition-transform duration-500 hover:scale-105"
          style={{ background: conicGradient }}
        />

        {/* Círculo central recortado (cutout del 80%) */}
        <div className="absolute w-44 h-44 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Fideicomisos
          </span>
          <span className="text-xl font-light text-black mt-0.5 tracking-tight">
            {segments.length} {segments.length === 1 ? 'Activo' : 'Activos'}
          </span>
        </div>
      </div>

      {/* Leyenda limpia y elegante con soporte bimoneda */}
      <div className="mt-8 space-y-3">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex justify-between text-sm items-center">
            <span className="flex items-center text-gray-600">
              <span
                className="w-2 h-2 rounded-full mr-3 shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-normal">{seg.label}</span>
              {seg.tasa && <span className="ml-1 text-gray-400 text-xs">{seg.tasa}</span>}
            </span>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 font-mono font-medium">
                {seg.montoFormateado}
              </span>
              <span className="font-medium text-black min-w-[32px] text-right">
                {seg.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import OverviewMetrics from './components/OverviewMetrics';
import CapitalDistributionChart from './components/CapitalDistributionChart';
import AccumulatedFlowChart from './components/AccumulatedFlowChart';

export default function OverviewPage() {
  return (
    <div className="space-y-16">
      {/* 1. Métricas Clave de Visión General */}
      <OverviewMetrics />

      {/* 2. Gráficos Limpios: Distribución de Capital y Flujo Acumulado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 border-t border-gray-100 pt-16">
        <CapitalDistributionChart />
        <AccumulatedFlowChart />
      </div>
    </div>
  );
}

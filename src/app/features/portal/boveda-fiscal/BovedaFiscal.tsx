'use client';

import React from 'react';
import FiscalHeaderDescription from './components/FiscalHeaderDescription';
import SettlementHistoryList from './components/SettlementHistoryList';
import UpcomingPayments from './components/UpcomingPayments';

export default function BovedaFiscal() {
  return (
    <div className="space-y-8">
      {/* 1. Encabezado y Descripción */}
      <FiscalHeaderDescription />

      {/* 2. Historial de Liquidaciones de los últimos 6 meses */}
      <SettlementHistoryList />

      {/* 3. Próximos Pagos Programados */}
      <UpcomingPayments />
    </div>
  );
}

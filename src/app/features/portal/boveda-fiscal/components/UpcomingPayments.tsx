'use client';

import React from 'react';

export default function UpcomingPayments() {
  return (
    <div className="mt-16 border-t border-gray-200 pt-8">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
        Próximos Pagos Programados
      </h3>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-amber-400 mr-4 shrink-0" />
          <p className="text-sm font-medium text-black">
            Mes 7 (Septiembre 2026)
          </p>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Programado para el día 15
        </p>
      </div>
    </div>
  );
}

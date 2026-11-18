'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePortal } from '@/app/features/portal/context/PortalContext';

export default function PortalHeader() {
  const { clientFullName, corteFecha, loading } = usePortal();

  return (
    <header className="flex justify-between items-end mb-16 pb-8 border-b border-gray-100">
      <div>
        {/* Badge de Seguridad */}
        <div className="flex items-center space-x-2 mb-3">
          <ShieldCheck size={16} className="text-[#C9A84C]" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest">
            Entorno Cifrado y Seguro
          </span>
        </div>

        {/* Nombre del Inversionista */}
        {loading ? (
          <div className="h-10 w-80 bg-gray-200 animate-pulse rounded" />
        ) : (
          <h2 className="text-4xl font-light text-black tracking-tight font-serif">
            {clientFullName}
          </h2>
        )}
      </div>

      {/* Corte a fecha */}
      <div className="text-right">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Corte a fecha
        </p>
        <p className="text-base font-medium text-black">
          {corteFecha}
        </p>
      </div>
    </header>
  );
}

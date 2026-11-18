'use client';

import React, { useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import MonthlySettlementCard from './MonthlySettlementCard';
import { MonthlySettlement } from '../../types/portal.types';

export default function SettlementHistoryList() {
  const { totalMonthlyYieldNet, data } = usePortal();

  // Nombres de los fideicomisos para subtítulos
  const trustsSubtitle = useMemo(() => {
    if (!data?.inversiones || data.inversiones.length === 0) {
      return 'Urbaniza & Grazzia';
    }
    return data.inversiones.map((i) => i.fideicomisoNombre).join(' & ');
  }, [data]);

  const netYield = totalMonthlyYieldNet > 0 ? totalMonthlyYieldNet : 1686.25;

  const settlements: MonthlySettlement[] = [
    {
      id: 'mes-6',
      mesNumero: 6,
      mesAbrev: 'AGO',
      mesNombre: 'Agosto',
      anio: 2026,
      titulo: 'Abono Mensual Consolidado',
      subtitulo: trustsSubtitle,
      rendimientoNeto: netYield,
      tieneLiqPago: true,
      tieneRetencionIR: true,
    },
    {
      id: 'mes-5',
      mesNumero: 5,
      mesAbrev: 'JUL',
      mesNombre: 'Julio',
      anio: 2026,
      titulo: 'Abono Mensual Consolidado',
      subtitulo: trustsSubtitle,
      rendimientoNeto: netYield,
      tieneLiqPago: true,
      tieneRetencionIR: true,
    },
    {
      id: 'mes-4',
      mesNumero: 4,
      mesAbrev: 'JUN',
      mesNombre: 'Junio',
      anio: 2026,
      titulo: 'Abono Mensual Consolidado',
      subtitulo: trustsSubtitle,
      rendimientoNeto: netYield,
      tieneLiqPago: true,
      tieneRetencionIR: true,
    },
    {
      id: 'mes-3',
      mesNumero: 3,
      mesAbrev: 'MAY',
      mesNombre: 'Mayo',
      anio: 2026,
      titulo: 'Abono Mensual Consolidado',
      subtitulo: 'Comprobante Impuestos Listo',
      rendimientoNeto: netYield,
      esDestacado: true,
      etiquetaDestacada: 'Consulta Frecuente',
      tieneLiqPago: true,
      tieneRetencionIR: true,
      retencionPorcentaje: 5,
    },
    {
      id: 'mes-2',
      mesNumero: 2,
      mesAbrev: 'ABR',
      mesNombre: 'Abril',
      anio: 2026,
      titulo: 'Abono Mensual',
      subtitulo: '',
      rendimientoNeto: netYield,
      tieneLiqPago: true,
      tieneRetencionIR: true,
    },
    {
      id: 'mes-1',
      mesNumero: 1,
      mesAbrev: 'MAR',
      mesNombre: 'Marzo',
      anio: 2026,
      titulo: 'Primer Abono',
      subtitulo: '',
      rendimientoNeto: netYield,
      tieneLiqPago: true,
      tieneRetencionIR: true,
    },
  ];

  const handleDownloadLiq = (id: string, mes: string) => {
    alert(`Descargando Liquidación de Pago correspondiente a ${mes} 2026...`);
  };

  const handleDownloadIR = (id: string, mes: string) => {
    alert(`Descargando Certificado de Retención de Impuesto a la Renta (IR 5%) de ${mes} 2026...`);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6 border-b border-black pb-4">
        <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center">
          <CalendarCheck size={16} className="text-[#C9A84C] mr-2 shrink-0" />
          <span>Historial de Liquidaciones 2026</span>
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Últimos 6 meses
        </span>
      </div>

      <div className="space-y-4">
        {settlements.map((s) => (
          <MonthlySettlementCard
            key={s.id}
            settlement={s}
            onDownloadLiq={handleDownloadLiq}
            onDownloadIR={handleDownloadIR}
          />
        ))}
      </div>
    </div>
  );
}

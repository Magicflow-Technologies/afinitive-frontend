'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, PortalInversionistaData } from '@/services/api';
import { PortalContextValue, ChartSegment, MonthlyBarData } from '../types/portal.types';

const PortalContext = createContext<PortalContextValue | null>(null);

const CHART_PALETTE = ['#000000', '#C9A84C', '#374151', '#D4AF37', '#1F2937', '#9CA3AF'];

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<PortalInversionistaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenAuth = typeof window !== 'undefined' ? localStorage.getItem('tokenAuth') : null;
      const sessionRaw = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;

      if (!tokenAuth || !sessionRaw) {
        router.push('/login');
        return;
      }

      const session = JSON.parse(sessionRaw);
      let clienteId = localStorage.getItem('clienteId');

      if (!clienteId && session.persona?.id) {
        const clientes = await api.obtenerClientes();
        const match = clientes.find((c: any) => c.personaId === session.persona.id);
        if (match) {
          clienteId = match.id;
          localStorage.setItem('clienteId', match.id);
          if (match.fichaMadre?.id) {
            localStorage.setItem('fichaMadreId', match.fichaMadre.id);
          }
        }
      }

      const idToQuery = clienteId || session.persona?.id;
      if (!idToQuery) {
        throw new Error('No se pudo identificar tu cuenta de inversionista.');
      }

      const res = await api.obtenerPortalInversionista(idToQuery);
      setData(res);
      if (res.fichaMadreId) {
        localStorage.setItem('fichaMadreId', res.fichaMadreId);
      }
    } catch (err: any) {
      console.error('Error al cargar datos del portal:', err);
      setError(err.message || 'Error al cargar tu información de inversionista.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Nombre completo del cliente
  const clientFullName = useMemo(() => {
    if (!data?.cliente) return 'Inversionista Afinitive';
    return `${data.cliente.nombres} ${data.cliente.apellidos}`.trim();
  }, [data]);

  // Corte a fecha
  const corteFecha = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const hoy = new Date();
    return `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
  }, []);

  // Total invertido USD
  const totalInvestedUSD = useMemo(() => {
    if (!data) return 0;
    if (data.totalInvertidoUSD > 0) return data.totalInvertidoUSD;
    return (data.inversiones || []).reduce((acc, inv) => {
      const monto = Number(inv.monto) || 0;
      return (inv.moneda || 'USD').toUpperCase() === 'USD' ? acc + monto : acc;
    }, 0);
  }, [data]);

  // Total invertido PEN (Soles)
  const totalInvestedPEN = useMemo(() => {
    if (!data) return 0;
    if (data.totalInvertidoPEN > 0) return data.totalInvertidoPEN;
    return (data.inversiones || []).reduce((acc, inv) => {
      const monto = Number(inv.monto) || 0;
      return (inv.moneda || '').toUpperCase() === 'PEN' ? acc + monto : acc;
    }, 0);
  }, [data]);

  const hasUSD = totalInvestedUSD > 0;
  const hasPEN = totalInvestedPEN > 0;
  const isBimoneda = hasUSD && hasPEN;

  // Rendimientos brutos y netos por moneda
  const {
    totalMonthlyYieldGrossUSD,
    totalMonthlyYieldNetUSD,
    totalMonthlyYieldGrossPEN,
    totalMonthlyYieldNetPEN,
    totalMonthlyYieldGross,
    totalMonthlyYieldNet,
  } = useMemo(() => {
    if (!data?.inversiones || data.inversiones.length === 0) {
      return {
        totalMonthlyYieldGrossUSD: 0,
        totalMonthlyYieldNetUSD: 0,
        totalMonthlyYieldGrossPEN: 0,
        totalMonthlyYieldNetPEN: 0,
        totalMonthlyYieldGross: 0,
        totalMonthlyYieldNet: 0,
      };
    }

    let grossUSD = 0;
    let grossPEN = 0;

    for (const inv of data.inversiones) {
      const monto = Number(inv.monto) || 0;
      let tasaNum = 10;
      if (inv.tasaInteres) {
        const parsed = parseFloat(inv.tasaInteres.replace(',', '.').replace('%', '').trim());
        if (!isNaN(parsed) && parsed > 0) tasaNum = parsed;
      }
      const monthly = (monto * (tasaNum / 100)) / 12;

      if ((inv.moneda || '').toUpperCase() === 'PEN') {
        grossPEN += monthly;
      } else {
        grossUSD += monthly;
      }
    }

    const netUSD = grossUSD * 0.95; // Retención 5% IR
    const netPEN = grossPEN * 0.95;

    return {
      totalMonthlyYieldGrossUSD: Math.round(grossUSD),
      totalMonthlyYieldNetUSD: parseFloat(netUSD.toFixed(2)),
      totalMonthlyYieldGrossPEN: Math.round(grossPEN),
      totalMonthlyYieldNetPEN: parseFloat(netPEN.toFixed(2)),
      totalMonthlyYieldGross: Math.round(grossUSD),
      totalMonthlyYieldNet: parseFloat(netUSD.toFixed(2)),
    };
  }, [data]);

  const monthsCompleted = 6;

  // Segmentos para el Donut Chart de Distribución de Capital
  const chartSegments = useMemo<ChartSegment[]>(() => {
    if (!data?.inversiones || data.inversiones.length === 0) {
      return [];
    }

    // Normalizar a valor USD aproximado (PEN / 3.75) para calcular proporciones de torta si hay bimoneda
    const normalizedInvestments = data.inversiones.map((inv) => {
      const monto = Number(inv.monto) || 0;
      const isPen = (inv.moneda || '').toUpperCase() === 'PEN';
      const normalizedValue = isPen ? monto / 3.75 : monto;
      return { inv, monto, isPen, normalizedValue };
    });

    const totalNormalized = normalizedInvestments.reduce((acc, item) => acc + item.normalizedValue, 0);

    return normalizedInvestments.map(({ inv, monto, isPen, normalizedValue }, idx) => {
      const percentage = totalNormalized > 0 ? Math.round((normalizedValue / totalNormalized) * 100) : 0;
      const tasaStr = inv.tasaInteres ? `(${inv.tasaInteres})` : '';
      const monedaStr = isPen ? 'PEN' : 'USD';
      const simbolo = isPen ? 'S/' : '$';
      const montoFormateado = `${simbolo} ${monto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

      return {
        label: `Fideicomiso ${inv.fideicomisoNombre}`,
        tasa: tasaStr,
        monto,
        montoFormateado,
        moneda: monedaStr,
        percentage,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      };
    });
  }, [data]);

  // Flujo acumulado de 6 meses para el Bar Chart
  const monthlyFlowData = useMemo<MonthlyBarData[]>(() => {
    const net = totalMonthlyYieldNetUSD > 0 ? totalMonthlyYieldNetUSD : (totalMonthlyYieldNetPEN > 0 ? totalMonthlyYieldNetPEN : 1686.25);
    const gross = totalMonthlyYieldGrossUSD > 0 ? totalMonthlyYieldGrossUSD : (totalMonthlyYieldGrossPEN > 0 ? totalMonthlyYieldGrossPEN : 1775);
    const moneda = totalMonthlyYieldNetUSD > 0 ? 'USD' : (totalMonthlyYieldNetPEN > 0 ? 'PEN' : 'USD');

    return [
      { mesLabel: 'Mes 1', montoNeto: net, montoBruto: gross, moneda },
      { mesLabel: 'Mes 2', montoNeto: net, montoBruto: gross, moneda },
      { mesLabel: 'Mes 3', montoNeto: net, montoBruto: gross, moneda },
      { mesLabel: 'Mes 4', montoNeto: net, montoBruto: gross, moneda },
      { mesLabel: 'Mes 5', montoNeto: net, montoBruto: gross, moneda },
      { mesLabel: 'Mes 6', montoNeto: net, montoBruto: gross, moneda },
    ];
  }, [totalMonthlyYieldNetUSD, totalMonthlyYieldNetPEN, totalMonthlyYieldGrossUSD, totalMonthlyYieldGrossPEN]);

  const value: PortalContextValue = {
    data,
    loading,
    error,
    corteFecha,
    refresh: fetchData,
    clientFullName,
    totalInvestedUSD,
    totalInvestedPEN,
    hasUSD,
    hasPEN,
    isBimoneda,
    totalMonthlyYieldGross,
    totalMonthlyYieldNet,
    totalMonthlyYieldGrossUSD,
    totalMonthlyYieldGrossPEN,
    totalMonthlyYieldNetUSD,
    totalMonthlyYieldNetPEN,
    monthsCompleted,
    chartSegments,
    monthlyFlowData,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal debe ser usado dentro de un PortalProvider');
  }
  return context;
}

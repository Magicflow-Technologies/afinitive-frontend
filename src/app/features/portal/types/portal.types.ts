import { PortalInversionistaData, InversionPortalItem, DocumentoGeneral } from '@/services/api';

export interface MonthlySettlement {
  id: string;
  mesNumero: number;
  mesAbrev: string;
  mesNombre: string;
  anio: number;
  titulo: string;
  subtitulo: string;
  rendimientoNeto: number;
  moneda?: string;
  esDestacado?: boolean;
  etiquetaDestacada?: string;
  tieneLiqPago: boolean;
  tieneRetencionIR: boolean;
  retencionPorcentaje?: number;
}

export interface ChartSegment {
  label: string;
  tasa: string;
  monto: number;
  montoFormateado: string;
  moneda: string;
  percentage: number;
  color: string;
}

export interface MonthlyBarData {
  mesLabel: string;
  montoNeto: number;
  montoBruto: number;
  moneda?: string;
}

export interface PortalContextValue {
  data: PortalInversionistaData | null;
  loading: boolean;
  error: string | null;
  corteFecha: string;
  refresh: () => Promise<void>;
  clientFullName: string;
  totalInvestedUSD: number;
  totalInvestedPEN: number;
  hasUSD: boolean;
  hasPEN: boolean;
  isBimoneda: boolean;
  totalMonthlyYieldGross: number;
  totalMonthlyYieldNet: number;
  totalMonthlyYieldGrossUSD: number;
  totalMonthlyYieldGrossPEN: number;
  totalMonthlyYieldNetUSD: number;
  totalMonthlyYieldNetPEN: number;
  monthsCompleted: number;
  chartSegments: ChartSegment[];
  monthlyFlowData: MonthlyBarData[];
}

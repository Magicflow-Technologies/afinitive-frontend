'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  PortalInversionistaData,
  InversionPortalItem,
} from '@/services/api';
import { FichaMadreWizard } from '@/components/FichaMadreWizard';

// Paleta de colores para los segmentos del Donut Chart
const DONUT_COLORS = [
  '#10233f', // Navy principal
  '#caa344', // Gold principal
  '#2b4263', // Slate navy
  '#dfba5f', // Light gold
  '#1e3a5f', // Deep navy
  '#b8923a', // Dark gold
];

// Parser de tasas (ej: "10 %" -> 10, "9,00%" -> 9, "9.5%" -> 9.5)
function parseRate(rateStr?: string): number {
  if (!rateStr) return 10;
  const clean = rateStr.replace(',', '.').replace('%', '').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 10 : n;
}

// Formateador de moneda estilo muestra: "US$ 220.000,00" o "US$ 220.000"
function formatUSD(monto: number, conDecimales: boolean = false): string {
  const formatted = monto.toLocaleString('es-PE', {
    minimumFractionDigits: conDecimales ? 2 : 0,
    maximumFractionDigits: conDecimales ? 2 : 0,
  });
  return `US$ ${formatted}`;
}

export default function PortalInversionistaPage() {
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState<PortalInversionistaData | null>(null);
  const [activeSection, setActiveSection] = useState<'resumen' | 'inversiones' | 'detalle' | 'ficha' | 'formatos' | 'fuente'>('resumen');

  // Previsualización de documento
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Carga inicial de datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError('');

        const tokenAuth = localStorage.getItem('tokenAuth');
        const sessionRaw = localStorage.getItem('userSession');

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

        const data = await api.obtenerPortalInversionista(idToQuery);
        setPortalData(data);
        if (data.fichaMadreId) {
          localStorage.setItem('fichaMadreId', data.fichaMadreId);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error al cargar tu información de inversionista.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handlePreviewDoc = async (doc: any) => {
    setPreviewDoc(doc);
    setPreviewHtml('');
    setLoadingPreview(true);
    try {
      const res = await api.obtenerDocumentoPreview(doc.id);
      setPreviewHtml(res.html || '<p style="padding: 2rem; color: #8d9aae;">Documento sin contenido HTML disponible.</p>');
    } catch (err: any) {
      console.error(err);
      setPreviewHtml(
        `<div style="padding: 2rem; color: #b91c1c; font-family: sans-serif;">
          <h4>Error al cargar la previsualización</h4>
          <p>${err.message || 'No se pudo renderizar el formato.'}</p>
        </div>`
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  // Cálculos financieros derivados
  const metrics = useMemo(() => {
    if (!portalData) return null;
    const invs = portalData.inversiones || [];

    const totalUSD = invs
      .filter((i) => i.moneda !== 'PEN')
      .reduce((acc, i) => acc + (Number(i.monto) || 0), 0);

    const totalPEN = invs
      .filter((i) => i.moneda === 'PEN')
      .reduce((acc, i) => acc + (Number(i.monto) || 0), 0);

    // Interés anual nominal = suma(monto * tasa)
    let totalInteresAnualUSD = 0;
    const rates: number[] = [];
    const maturities: string[] = [];

    invs.forEach((inv) => {
      const r = parseRate(inv.tasaInteres);
      rates.push(r);
      const m = Number(inv.monto) || 0;
      if (inv.moneda !== 'PEN') {
        totalInteresAnualUSD += m * (r / 100);
      }
      if (inv.vencimiento) {
        maturities.push(inv.vencimiento.trim());
      }
    });

    // Tasa promedio ponderada
    const tasaPonderadaNum = totalUSD > 0 ? (totalInteresAnualUSD / totalUSD) * 100 : 0;
    const tasaPonderadaStr = tasaPonderadaNum > 0 ? `${tasaPonderadaNum.toFixed(2).replace('.', ',')}%` : '0,00%';

    // Donut allocation segments
    let currentDeg = 0;
    const segments: Array<{ name: string; pct: number; color: string; degStart: number; degEnd: number }> = [];

    invs.forEach((inv, idx) => {
      const m = Number(inv.monto) || 0;
      const pct = totalUSD > 0 ? (m / totalUSD) * 100 : (100 / invs.length);
      const spanDeg = (pct / 100) * 360;
      const color = DONUT_COLORS[idx % DONUT_COLORS.length];
      segments.push({
        name: inv.fideicomisoNombre,
        pct,
        color,
        degStart: currentDeg,
        degEnd: currentDeg + spanDeg,
      });
      currentDeg += spanDeg;
    });

    // Donut gradient string
    let conicGradient = '#10233f 0deg 360deg';
    if (segments.length > 0) {
      conicGradient = segments
        .map((s) => `${s.color} ${s.degStart.toFixed(2)}deg ${s.degEnd.toFixed(2)}deg`)
        .join(', ');
    }

    // Donut center label: ej "US$ 220k"
    let donutCenterAmount = 'US$ 0';
    if (totalUSD >= 1000000) {
      donutCenterAmount = `US$ ${(totalUSD / 1000000).toFixed(1)}M`;
    } else if (totalUSD >= 1000) {
      donutCenterAmount = `US$ ${(totalUSD / 1000).toFixed(0)}k`;
    } else {
      donutCenterAmount = `US$ ${totalUSD}`;
    }

    // Vencimientos
    const minRate = rates.length > 0 ? Math.min(...rates) : 10;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 10;
    const tasaMinMaxStr =
      minRate === maxRate
        ? `${minRate.toFixed(2).replace('.', ',')}% anual`
        : `${minRate.toFixed(2).replace('.', ',')}% / ${maxRate.toFixed(2).replace('.', ',')}% anual`;

    // Años únicos de vencimiento
    const yearsSet = new Set<string>();
    maturities.forEach((m) => {
      const yearMatch = m.match(/\b(20\d\d)\b/);
      if (yearMatch) yearsSet.add(yearMatch[1]);
    });
    const aniosVencimientos = Array.from(yearsSet).join(' y ') || '2027';

    // Próximo vencimiento
    const proximoVencimiento = maturities[0] || 'Por definir';
    const vencimientoPosterior = maturities.length > 1 ? maturities[1] : maturities[0] || 'Por definir';

    // Nombres de fideicomisos unidos: "GRAZZIA y URBANIZA"
    const nombresFideicomisosTexto =
      invs.length === 1
        ? invs[0].fideicomisoNombre
        : invs.length === 2
          ? `${invs[0].fideicomisoNombre} y ${invs[1].fideicomisoNombre}`
          : invs.map((i) => i.fideicomisoNombre).join(', ');

    return {
      totalUSD,
      totalPEN,
      totalInteresAnualUSD,
      tasaPonderadaStr,
      segments,
      conicGradient,
      donutCenterAmount,
      tasaMinMaxStr,
      aniosVencimientos,
      proximoVencimiento,
      vencimientoPosterior,
      nombresFideicomisosTexto,
    };
  }, [portalData]);

  // Fecha de corte formateada en español
  const fechaCorte = useMemo(() => {
    const ahora = new Date();
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${ahora.getDate()} de ${meses[ahora.getMonth()]}, ${ahora.getFullYear()}`;
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f8fb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(202, 163, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#caa344', marginBottom: 14 }}>
          ◈
        </div>
        <div style={{ color: '#10233f', fontWeight: 700, fontSize: 16 }}>Cargando Perfil de Inversiones...</div>
        <div style={{ color: '#8d9aae', fontSize: 12, marginTop: 4 }}>Entorno cifrado y seguro AFINITIVE</div>
      </div>
    );
  }

  if (error || !portalData || !metrics) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#fff', border: '1px solid #e7ebf1', borderRadius: 16, padding: 36, textAlign: 'center', boxShadow: '0 8px 30px rgba(16,35,63,0.06)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 700 }}>
            ✕
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#10233f', fontSize: 22, margin: '0 0 8px' }}>
            No fue posible cargar el portal
          </h2>
          <p style={{ color: '#8d9aae', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
            {error || 'Ocurrió un inconveniente al consultar tu portafolio de inversiones.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#caa344', color: '#fff', border: 0, padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Reintentar
            </button>
            <button
              onClick={handleLogout}
              style={{ background: '#fff', color: '#17233a', border: '1px solid #e7ebf1', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { cliente, totalInversiones, inversiones } = portalData;

  return (
    <>
      {/* ESTILOS EXACTOS BASADOS EN UN CLIENTE_MUESTRA.HTML */}
      <style jsx global>{`
        :root {
          --navy: #10233f;
          --gold: #caa344;
          --muted: #8d9aae;
          --line: #e7ebf1;
          --bg: #f7f8fb;
          --ink: #17233a;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        a {
          color: #1f5fbf;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .portal-app {
          min-height: 100vh;
          display: flex;
        }
        .portal-sidebar {
          width: 286px;
          background: #fff;
          border-right: 1px solid var(--line);
          padding: 46px 32px;
          flex: 0 0 286px;
          display: flex;
          flex-direction: column;
        }
        .portal-brand {
          font: 24px Georgia, serif;
          letter-spacing: 4px;
          color: #0b172c;
        }
        .portal-brand-sub {
          margin-top: 8px;
          color: #7d8da5;
          font-size: 10px;
          letter-spacing: 3px;
          font-weight: 600;
        }
        .portal-nav-title {
          margin: 64px 0 16px;
          color: #b2bdcc;
          font-size: 11px;
          letter-spacing: 1.7px;
          font-weight: 700;
        }
        .portal-nav a,
        .portal-nav button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 15px 16px;
          color: #8090a6;
          border-left: 2px solid transparent;
          font-size: 13.5px;
          background: transparent;
          border-top: 0;
          border-right: 0;
          border-bottom: 0;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .portal-nav a:hover,
        .portal-nav button:hover {
          color: var(--navy);
          background: #fbfbfc;
          text-decoration: none;
        }
        .portal-nav a.active,
        .portal-nav button.active {
          color: var(--gold);
          border-left-color: var(--gold);
          background: #fbfbfc;
          font-weight: 600;
        }
        .portal-nav .icon {
          display: inline-block;
          width: 25px;
        }
        .portal-sidebar-foot {
          margin-top: auto;
          padding-top: 32px;
          color: #b2bdcc;
          font-size: 11px;
          line-height: 1.6;
        }
        .portal-logout-btn {
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--line);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #8090a6;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .portal-logout-btn:hover {
          color: #b91c1c;
          border-color: #fca5a5;
          background: #fef2f2;
        }
        .portal-main {
          flex: 1;
          padding: 42px 64px 64px;
          max-width: 1280px;
        }
        .portal-topline {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .portal-eyebrow {
          color: var(--gold);
          font-size: 11px;
          letter-spacing: 1.4px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .portal-eyebrow:before {
          content: '◈';
          margin-right: 10px;
        }
        .portal-title {
          margin: 18px 0 8px;
          font: 400 38px/1.1 Georgia, serif;
          color: #070f1c;
        }
        .portal-subtitle {
          color: var(--muted);
          font-size: 14px;
        }
        .portal-asof {
          text-align: right;
          color: #8c9ab0;
          font-size: 12px;
          letter-spacing: 1.1px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .portal-asof strong {
          display: block;
          margin-top: 10px;
          color: var(--ink);
          font-size: 16px;
          letter-spacing: 0;
          text-transform: none;
        }
        .portal-rule {
          border: 0;
          border-top: 1px solid var(--line);
          margin: 30px 0 35px;
        }
        .portal-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }
        .portal-metric {
          background: #fff;
          border: 1px solid #edf0f5;
          padding: 24px;
          min-height: 122px;
          box-shadow: 0 4px 16px #10233f08;
        }
        .portal-metric-label {
          color: #8d9aae;
          font-size: 11px;
          letter-spacing: 1.3px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .portal-metric-value {
          margin-top: 14px;
          font-size: 28px;
          line-height: 1.05;
          font-weight: 700;
          color: #17233a;
        }
        .portal-metric-value small {
          font-size: 15px;
          color: #8593a8;
          font-weight: 500;
        }
        .portal-metric.gold .portal-metric-value {
          color: var(--gold);
        }
        .portal-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin: 42px 0 17px;
        }
        .portal-section-title {
          margin: 0;
          font: 400 25px Georgia, serif;
          color: #070f1c;
        }
        .portal-section-note {
          color: var(--muted);
          font-size: 13px;
        }
        .portal-grid {
          display: grid;
          grid-template-columns: 1.05fr 1.95fr;
          gap: 24px;
        }
        .portal-card {
          background: #fff;
          border: 1px solid #edf0f5;
          box-shadow: 0 18px 45px #10233f14;
        }
        .portal-allocation,
        .portal-detail-card {
          padding: 29px 30px;
        }
        .portal-donut-wrap {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        .portal-donut {
          width: 174px;
          height: 174px;
          border-radius: 50%;
          position: relative;
          flex: 0 0 auto;
        }
        .portal-donut:after {
          content: '';
          position: absolute;
          inset: 31px;
          background: #fff;
          border-radius: 50%;
        }
        .portal-donut-center {
          position: absolute;
          z-index: 1;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: var(--navy);
        }
        .portal-donut-center strong {
          font-size: 24px;
          font-weight: 800;
        }
        .portal-donut-center span {
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
        }
        .portal-legend {
          margin: 0;
          padding: 0;
          list-style: none;
          flex: 1;
        }
        .portal-legend li {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin: 13px 0;
          font-size: 13px;
        }
        .portal-legend .label {
          color: #53657d;
          display: flex;
          align-items: center;
        }
        .portal-legend .pct {
          font-weight: 700;
          color: #314461;
        }
        .portal-dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .portal-small-rule {
          border: 0;
          border-top: 1px solid var(--line);
          margin: 24px 0;
        }
        .portal-summary-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .portal-summary-item label,
        .portal-detail-item label {
          display: block;
          color: var(--muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .portal-summary-item strong {
          display: block;
          margin-top: 7px;
          font-size: 17px;
          color: var(--ink);
        }
        .portal-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 28px;
        }
        .portal-detail-item {
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }
        .portal-detail-item div {
          margin-top: 7px;
          font-size: 15px;
          color: var(--ink);
          font-weight: 500;
        }
        .portal-table-card {
          overflow: hidden;
        }
        .portal-table-wrap {
          overflow-x: auto;
        }
        .portal-investments {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }
        .portal-investments th {
          text-align: left;
          background: #f8fafc;
          color: #7b8ba0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }
        .portal-investments td {
          padding: 19px 18px;
          border-bottom: 1px solid var(--line);
          font-size: 14px;
          vertical-align: top;
        }
        .portal-investments tr:last-child td {
          border-bottom: 0;
        }
        .portal-fund {
          font-weight: 700;
          color: var(--navy);
        }
        .portal-amount {
          font-size: 17px;
          font-weight: 650;
          white-space: nowrap;
        }
        .portal-rate {
          color: var(--gold);
          font-weight: 700;
        }
        .portal-maturity {
          white-space: nowrap;
        }
        .portal-schedule {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #1f5fbf;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }
        .portal-schedule:hover {
          text-decoration: underline;
        }
        .portal-source {
          margin-top: 18px;
          color: #9aa6b7;
          font-size: 11px;
          line-height: 1.6;
        }
        .portal-pill {
          display: inline-block;
          background: #f5edd7;
          color: #946e17;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .portal-footer {
          margin-top: 36px;
          color: #9aa6b7;
          font-size: 11px;
          line-height: 1.7;
        }

        /* RESPONSIVE SEGÚN MUESTRA */
        @media (max-width: 980px) {
          .portal-sidebar {
            width: 220px;
            flex-basis: 220px;
            padding: 32px 20px;
          }
          .portal-main {
            padding: 34px 28px;
          }
          .portal-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
          .portal-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 680px) {
          .portal-app {
            display: block;
          }
          .portal-sidebar {
            width: 100%;
            padding: 24px 20px;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }
          .portal-nav-title,
          .portal-sidebar-foot {
            display: none;
          }
          .portal-nav {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 6px;
          }
          .portal-nav a,
          .portal-nav button {
            padding: 10px 12px;
            white-space: nowrap;
            border-left: 0;
            border-bottom: 2px solid transparent;
            font-size: 12.5px;
          }
          .portal-nav a.active,
          .portal-nav button.active {
            border-bottom-color: var(--gold);
            border-left-color: transparent;
          }
          .portal-main {
            padding: 28px 18px 44px;
          }
          .portal-topline {
            display: block;
          }
          .portal-asof {
            text-align: left;
            margin-top: 20px;
          }
          .portal-metrics {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .portal-metric {
            padding: 18px 15px;
            min-height: 105px;
          }
          .portal-metric-value {
            font-size: 22px;
          }
          .portal-detail-grid {
            grid-template-columns: 1fr;
          }
          .portal-donut-wrap {
            display: block;
          }
          .portal-donut {
            margin: 0 auto 24px;
          }
        }
      `}</style>

      <div className="portal-app">
        {/* SIDEBAR NAVEGACIÓN */}
        <aside className="portal-sidebar">
          <div className="portal-brand">AFINITIVE</div>
          <div className="portal-brand-sub">WEALTH MANAGEMENT</div>

          <div className="portal-nav-title">NAVEGACIÓN</div>
          <nav className="portal-nav">
            <button
              type="button"
              className={activeSection === 'resumen' ? 'active' : ''}
              onClick={() => {
                setActiveSection('resumen');
                const el = document.getElementById('resumen');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">◔</span>Visión general
            </button>

            <button
              type="button"
              className={activeSection === 'inversiones' ? 'active' : ''}
              onClick={() => {
                setActiveSection('inversiones');
                const el = document.getElementById('inversiones');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">▣</span>Portafolio activo
            </button>

            <button
              type="button"
              className={activeSection === 'detalle' ? 'active' : ''}
              onClick={() => {
                setActiveSection('detalle');
                const el = document.getElementById('detalle');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">◉</span>Detalle financiero
            </button>

            <button
              type="button"
              className={activeSection === 'ficha' ? 'active' : ''}
              onClick={() => {
                setActiveSection('ficha');
                const el = document.getElementById('ficha');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">📄</span>Mi Ficha Madre (KYC)
            </button>

            <button
              type="button"
              className={activeSection === 'formatos' ? 'active' : ''}
              onClick={() => {
                setActiveSection('formatos');
                const el = document.getElementById('formatos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">📁</span>Formatos Oficiales
            </button>

            <button
              type="button"
              className={activeSection === 'fuente' ? 'active' : ''}
              onClick={() => {
                setActiveSection('fuente');
                const el = document.getElementById('fuente');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="icon">▤</span>Fuente y enlaces
            </button>
          </nav>

          <div className="portal-sidebar-foot">
            <div>Perfil consolidado a partir del registro de operaciones disponible.</div>
            <button
              type="button"
              onClick={handleLogout}
              className="portal-logout-btn"
            >
              <span>✕</span> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="portal-main">
          {/* CABECERA TOPLINE */}
          <div className="portal-topline">
            <div>
              <div className="portal-eyebrow">Entorno cifrado y seguro</div>
              <h1 className="portal-title">{cliente.nombres} {cliente.apellidos}</h1>
              <div className="portal-subtitle">Resumen de inversiones por fideicomiso</div>
            </div>
            <div className="portal-asof">
              Corte a fecha
              <strong>{fechaCorte}</strong>
            </div>
          </div>

          <hr className="portal-rule" />

          {/* MÉTRICAS PRINCIPALES */}
          <section id="resumen" className="portal-metrics">
            <div className="portal-metric">
              <div className="portal-metric-label">Inversiones registradas</div>
              <div className="portal-metric-value">
                {totalInversiones} <small>operaciones</small>
              </div>
            </div>

            <div className="portal-metric">
              <div className="portal-metric-label">Capital invertido</div>
              <div className="portal-metric-value">
                {formatUSD(metrics.totalUSD)}
              </div>
            </div>

            <div className="portal-metric gold">
              <div className="portal-metric-label">Tasa promedio ponderada</div>
              <div className="portal-metric-value">
                {metrics.tasaPonderadaStr}
              </div>
            </div>

            <div className="portal-metric">
              <div className="portal-metric-label">Próximo vencimiento</div>
              <div className="portal-metric-value" style={{ fontSize: 22 }}>
                {metrics.proximoVencimiento}
              </div>
            </div>
          </section>

          {/* DISTRIBUCIÓN DEL PORTAFOLIO */}
          <div className="portal-section-head">
            <h2 className="portal-section-title">Distribución del portafolio</h2>
            <span className="portal-pill">{totalInversiones} {totalInversiones === 1 ? 'fideicomiso' : 'fideicomisos'}</span>
          </div>

          <section className="portal-grid">
            {/* CARD ALLOCATION (DONUT + SUMMARY) */}
            <article className="portal-card portal-allocation">
              <div className="portal-donut-wrap">
                <div
                  className="portal-donut"
                  style={{
                    background: `conic-gradient(${metrics.conicGradient})`,
                  }}
                >
                  <div className="portal-donut-center">
                    <strong>{metrics.donutCenterAmount}</strong>
                    <span>total invertido</span>
                  </div>
                </div>

                <ul className="portal-legend">
                  {metrics.segments.map((seg, idx) => (
                    <li key={idx}>
                      <span className="label">
                        <span className="portal-dot" style={{ background: seg.color }} />
                        {seg.name}
                      </span>
                      <span className="pct">{seg.pct.toFixed(1).replace('.', ',')}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <hr className="portal-small-rule" />

              <div className="portal-summary-list">
                <div className="portal-summary-item">
                  <label>Interés anual nominal</label>
                  <strong>{formatUSD(metrics.totalInteresAnualUSD)}</strong>
                </div>
                <div className="portal-summary-item">
                  <label>Vencimientos registrados</label>
                  <strong>{metrics.aniosVencimientos}</strong>
                </div>
              </div>
            </article>

            {/* CARD DETALLE FINANCIERO */}
            <article id="detalle" className="portal-card portal-detail-card">
              <div className="portal-section-note" style={{ marginBottom: 6 }}>
                Datos consolidados del registro
              </div>
              <div className="portal-detail-grid">
                <div className="portal-detail-item">
                  <label>Cliente</label>
                  <div>{cliente.nombres} {cliente.apellidos}</div>
                </div>
                <div className="portal-detail-item">
                  <label>Fideicomisos</label>
                  <div>{metrics.nombresFideicomisosTexto}</div>
                </div>
                <div className="portal-detail-item">
                  <label>Capital total</label>
                  <div>{formatUSD(metrics.totalUSD, true)}</div>
                </div>
                <div className="portal-detail-item">
                  <label>Tasa mínima / máxima</label>
                  <div>{metrics.tasaMinMaxStr}</div>
                </div>
                <div className="portal-detail-item">
                  <label>Vencimiento más próximo</label>
                  <div>{metrics.proximoVencimiento}</div>
                </div>
                <div className="portal-detail-item">
                  <label>Vencimiento posterior</label>
                  <div>{metrics.vencimientoPosterior}</div>
                </div>
              </div>
            </article>
          </section>

          {/* DETALLE DE INVERSIONES (TABLA EXACTA) */}
          <div className="portal-section-head" id="inversiones">
            <h2 className="portal-section-title">Detalle de inversiones</h2>
            <span className="portal-section-note">Importes y fechas según la base de operaciones</span>
          </div>

          <section className="portal-card portal-table-card">
            <div className="portal-table-wrap">
              <table className="portal-investments">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fideicomiso</th>
                    <th>Monto invertido</th>
                    <th>Tasa anual</th>
                    <th>Vencimiento</th>
                    <th>Correos de operación</th>
                    <th>Cronograma</th>
                  </tr>
                </thead>
                <tbody>
                  {inversiones.map((inv, idx) => (
                    <tr key={inv.id}>
                      <td>{idx + 1}</td>
                      <td className="portal-fund">{inv.fideicomisoNombre}</td>
                      <td className="portal-amount">{formatUSD(inv.monto, true)}</td>
                      <td className="portal-rate">{inv.tasaInteres}</td>
                      <td className="portal-maturity">{inv.vencimiento}</td>
                      <td>
                        {inv.correoOpCoril && (
                          <div>
                            <a href={`mailto:${inv.correoOpCoril}`} style={{ color: 'inherit' }}>
                              {inv.correoOpCoril}
                            </a>
                          </div>
                        )}
                        {inv.correoOpCorfid && (
                          <div style={{ marginTop: 3 }}>
                            <a href={`mailto:${inv.correoOpCorfid}`} style={{ color: 'inherit' }}>
                              {inv.correoOpCorfid}
                            </a>
                          </div>
                        )}
                        {!inv.correoOpCoril && !inv.correoOpCorfid && (
                          <span style={{ color: '#8d9aae' }}>operaciones@grupocoril.com</span>
                        )}
                      </td>
                      <td>
                        {inv.enlaceCronograma ? (
                          <a
                            className="portal-schedule"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={inv.enlaceCronograma}
                          >
                            ↗ Ver cronograma
                          </a>
                        ) : (
                          <span style={{ color: '#8d9aae', fontSize: 13 }}>En preparación</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECCIÓN MI FICHA MADRE (KYC) */}
          <div className="portal-section-head" id="ficha" style={{ marginTop: 52 }}>
            <h2 className="portal-section-title">Mi Ficha Madre (KYC)</h2>
            <span className="portal-section-note">
              Formulario de conocimiento del inversionista (pasos colapsados por defecto)
            </span>
          </div>

          <section className="portal-card" style={{ padding: '28px 30px' }}>
            {portalData.fichaMadreId ? (
              <FichaMadreWizard
                fichaMadreId={portalData.fichaMadreId}
                readOnly={portalData.estadoExpediente === 'APROBADA'}
                onSaved={() => {}}
              />
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#8d9aae', fontSize: 13 }}>
                No tienes un expediente de Ficha Madre activo en este momento.
              </div>
            )}
          </section>

          {/* SECCIÓN FORMATOS OFICIALES */}
          <div className="portal-section-head" id="formatos" style={{ marginTop: 52 }}>
            <h2 className="portal-section-title">Formatos Oficiales y Documentos</h2>
            <span className="portal-section-note">Formatos suscritos o pendientes de firma</span>
          </div>

          <section className="portal-card" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {portalData.documentosGenerales.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e7ebf1',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8d9aae', fontWeight: 700 }}>
                        FORMATO {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          background: doc.esFirmado ? '#ecfdf5' : '#fef3c7',
                          color: doc.esFirmado ? '#047857' : '#b45309',
                          border: doc.esFirmado ? '1px solid #a7f3d0' : '1px solid #fde68a',
                        }}
                      >
                        {doc.esFirmado ? 'Firmado' : 'Pendiente'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#17233a', lineHeight: 1.4 }}>
                      {doc.nombreArchivo}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #e7ebf1' }}>
                    <button
                      type="button"
                      onClick={() => handlePreviewDoc(doc)}
                      style={{
                        flex: 1,
                        background: '#fff',
                        border: '1px solid #e7ebf1',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#17233a',
                        cursor: 'pointer',
                      }}
                    >
                      Vista previa
                    </button>
                    {doc.rutaArchivo && doc.rutaArchivo.startsWith('http') && (
                      <a
                        href={doc.rutaArchivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#fff',
                          border: '1px solid #e7ebf1',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 12,
                          color: '#caa344',
                        }}
                        title="Descargar PDF"
                      >
                        📥
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FUENTE Y NOTA AL PIE */}
          <div id="fuente" className="portal-source">
            Fuente de datos: Registro oficial de operaciones AFINITIVE. La tasa promedio ponderada y el interés anual nominal son cálculos derivados de los importes y tasas pactados. Los enlaces abren los cronogramas alojados en Google Drive o repositorios fiduciarios.
          </div>

          <div className="portal-footer">
            AFINITIVE Wealth Management · Perfil privado de consulta · Generado el {fechaCorte}
          </div>
        </main>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE DOCUMENTO */}
      {previewDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(16, 35, 63, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 860,
              maxHeight: '90vh',
              background: '#fff',
              border: '1px solid #e7ebf1',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e7ebf1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10233f' }}>{previewDoc.nombreArchivo}</div>
                <div style={{ fontSize: 11, color: '#8d9aae', fontFamily: 'monospace' }}>Previsualización Oficial de Formato</div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: '#fff',
                  border: '1px solid #e7ebf1',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#8d9aae',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {loadingPreview ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#8d9aae', fontSize: 13 }}>
                  Cargando contenido del documento...
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  style={{ fontSize: 13, lineHeight: 1.6 }}
                />
              )}
            </div>

            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e7ebf1',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: '#caa344',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

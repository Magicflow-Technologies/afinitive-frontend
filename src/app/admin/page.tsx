'use client';

import React, { useEffect, useState } from 'react';
import { api, FichaMadre } from '@/services/api';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [fichas, setFichas] = useState<FichaMadre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.obtenerFichasMadre();
        setFichas(data);
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar métricas del panel principal.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-[#caa344] mr-2" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-[#8d9aae]">Cargando métricas...</span>
      </div>
    );
  }

  // Cálculos estadísticos
  const totalFichas = fichas.length;
  const pendientes = fichas.filter((f) => f.estado === 'PENDIENTE').length;
  const enRevision = fichas.filter((f) => f.estado === 'EN_REVISION' || f.estado === 'EN_PROCESO').length;
  const aprobadas = fichas.filter((f) => f.estado === 'APROBADA').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#10233f] tracking-tight">
          Resumen General
        </h1>
        <p className="text-sm text-[#8d9aae] mt-1.5">
          Estado actual y métricas de los procesos de onboarding de Afinitive.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <span className="block text-xs uppercase font-semibold text-[#8d9aae] tracking-wider">Total Expedientes</span>
          <span className="block text-3xl font-black text-[#10233f] mt-2">{totalFichas}</span>
        </div>

        <div className="bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <span className="block text-xs uppercase font-semibold text-[#8d9aae] tracking-wider">Pendientes de Registro</span>
          <span className="block text-3xl font-black text-amber-600 mt-2">{pendientes}</span>
        </div>

        <div className="bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <span className="block text-xs uppercase font-semibold text-[#8d9aae] tracking-wider">En Revisión de Formatos</span>
          <span className="block text-3xl font-black text-orange-600 mt-2">{enRevision}</span>
        </div>

        <div className="bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <span className="block text-xs uppercase font-semibold text-[#8d9aae] tracking-wider">Aprobadas / Listas</span>
          <span className="block text-3xl font-black text-emerald-700 mt-2">{aprobadas}</span>
        </div>
      </div>

      {/* Sección Informativa / Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="md:col-span-2 bg-white border border-[#e7ebf1] rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-[#10233f]">Próximos pasos recomendados</h3>
          <p className="text-sm text-[#8d9aae] leading-relaxed">
            Como analista de backoffice, tu labor comienza cuando un cliente acepta trabajar con Afinitive.
            Debes asegurar que la <strong className="text-[#17233a]">Ficha Madre</strong> esté completamente rellenada y validar los datos. 
            Una vez validada, el sistema autocompletará los formatos restantes para dejarlos listos para su firma.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/expedientes"
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              Ver todos los expedientes
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#e7ebf1] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-[#10233f] mb-2">Semilla de Datos</h3>
            <p className="text-xs text-[#8d9aae] leading-relaxed">
              La base de datos contiene clientes de prueba precargados para que puedas simular el flujo completo del perfil del Analista y verificar los documentos generados.
            </p>
          </div>
          <div className="pt-4 border-t border-[#e7ebf1] text-xs text-[#caa344] font-semibold font-mono">
            Expedientes de Onboarding
          </div>
        </div>
      </div>
    </div>
  );
}

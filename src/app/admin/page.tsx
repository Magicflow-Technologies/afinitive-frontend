'use client';

import React, { useEffect, useState } from 'react';
import { api, FichaMadre } from '@/services/api';
import Link from 'next/link';

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
        <svg className="animate-spin h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-neutral-400">Cargando métricas...</span>
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
        <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Resumen General
        </h1>
        <p className="text-sm text-neutral-400 mt-1.5">
          Estado actual y métricas de los procesos de onboarding de Afinitive.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <span className="block text-xs uppercase font-semibold text-neutral-500 tracking-wider">Total Expedientes</span>
          <span className="block text-3xl font-black text-white mt-2">{totalFichas}</span>
        </div>

        <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-yellow-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <span className="block text-xs uppercase font-semibold text-neutral-500 tracking-wider">Pendientes de Registro</span>
          <span className="block text-3xl font-black text-yellow-500 mt-2">{pendientes}</span>
        </div>

        <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-orange-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <span className="block text-xs uppercase font-semibold text-neutral-500 tracking-wider">En Revisión de Formatos</span>
          <span className="block text-3xl font-black text-orange-500 mt-2">{enRevision}</span>
        </div>

        <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-green-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <span className="block text-xs uppercase font-semibold text-neutral-500 tracking-wider">Aprobadas / Listas</span>
          <span className="block text-3xl font-black text-green-500 mt-2">{aprobadas}</span>
        </div>
      </div>

      {/* Sección Informativa / Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="md:col-span-2 backdrop-blur-md bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white">Próximos pasos recomendados</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Como analista de backoffice, tu labor comienza cuando un cliente acepta trabajar con Afinitive.
            Debes asegurar que la <strong>Ficha Madre</strong> esté completamente rellenada y validar los datos. 
            Una vez validada, el sistema autocompletará los 7 formatos restantes (Carta de Solicitud, Declaración Jurada, etc.) para dejarlos listos para su firma.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/expedientes"
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
            >
              Ver todos los expedientes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </Link>
          </div>
        </div>

        <div className="backdrop-blur-md bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Semilla de Datos</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              La base de datos contiene un cliente de prueba precargado (`Carlos Alberto Gonzales Prado`) para que puedas simular el flujo completo del perfil del Analista y verificar los documentos generados.
            </p>
          </div>
          <div className="pt-4 border-t border-[#162e50]/40 text-xs text-neutral-500 font-semibold font-mono">
            Expediente de prueba: FM-2026-001
          </div>
        </div>
      </div>
    </div>
  );
}

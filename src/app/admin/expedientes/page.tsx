'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, FichaMadre } from '@/services/api';
import { formatTitleCase } from '@/lib/formatters';

export default function ExpedientesList() {
  const router = useRouter();
  const [fichas, setFichas] = useState<FichaMadre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingFicha, setCreatingFicha] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    tipoDocumento: 'DNI' as 'DNI' | 'RUC' | 'CE' | 'PASAPORTE',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    observaciones: '',
  });

  useEffect(() => {
    const fetchFichas = async () => {
      try {
        const data = await api.obtenerFichasMadre();
        setFichas(data);
      } catch (err: any) {
        console.error(err);
        setError('Error al obtener la lista de expedientes.');
      } finally {
        setLoading(false);
      }
    };
    fetchFichas();
  }, []);

  const handleCreateFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.numeroDocumento.trim() || !createForm.nombres.trim() || !createForm.apellidos.trim() || !createForm.correo.trim()) {
      setCreateError('Completa los campos mínimos para crear la ficha.');
      return;
    }

    setCreatingFicha(true);
    try {
      const sessionRaw = localStorage.getItem('userSession');
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const empleados = await api.obtenerEmpleados();
      const empleado =
        empleados.find((item) => item.persona.id === session?.persona?.id) ||
        (empleados.length === 1 ? empleados[0] : null);

      if (!empleado) {
        throw new Error('No se pudo resolver el empleado asignado al usuario actual.');
      }

      const ficha = await api.crearFichaInicial({
        tipoDocumento: createForm.tipoDocumento,
        numeroDocumento: createForm.numeroDocumento.trim(),
        nombres: formatTitleCase(createForm.nombres.trim()),
        apellidos: formatTitleCase(createForm.apellidos.trim()),
        correo: createForm.correo.trim(),
        telefono: createForm.telefono.trim() || undefined,
        direccion: createForm.direccion.trim() ? formatTitleCase(createForm.direccion.trim()) : undefined,
        observaciones: createForm.observaciones.trim() ? formatTitleCase(createForm.observaciones.trim()) : undefined,
        empleadoId: empleado.id,
      });

      const refreshed = await api.obtenerFichasMadre();
      setFichas(refreshed);
      setShowCreateModal(false);
      setCreateForm({
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        nombres: '',
        apellidos: '',
        correo: '',
        telefono: '',
        direccion: '',
        observaciones: '',
      });
      router.push(`/admin/expedientes/${ficha.id}`);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'No fue posible crear la ficha inicial.');
    } finally {
      setCreatingFicha(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-neutral-400">Cargando expedientes...</span>
      </div>
    );
  }

  const filteredFichas = fichas.filter((ficha) => {
    const matchesSearch =
      ficha.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${ficha.cliente.persona.nombres} ${ficha.cliente.persona.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ficha.cliente.persona.numeroDocumento.includes(searchTerm);

    const matchesStatus = statusFilter === 'TODOS' || ficha.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (estado: FichaMadre['estado']) => {
    const badges = {
      PENDIENTE: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      EN_PROCESO: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      EN_REVISION: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      COMPLETADA: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      APROBADA: 'bg-green-500/15 border-green-500/40 text-green-400 font-bold',
      RECHAZADA: 'bg-red-500/10 border-red-500/30 text-red-400',
    };
    return badges[estado] || 'bg-neutral-800 border-neutral-700 text-neutral-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expedientes de Clientes</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Revisión de Fichas Madre y generación de formatos de firmas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-950/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Crear ficha de cliente
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-[#0a1c36]/20 border border-[#162e50]/30 rounded-2xl p-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por código, nombre o documento del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm text-white placeholder-neutral-600"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm text-white"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="APROBADA">Aprobado</option>
            <option value="RECHAZADA">Rechazado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-[#0a1c36]/10 border border-[#162e50]/30 rounded-2xl overflow-hidden shadow-xl">
        {filteredFichas.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m15 0v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3"></path>
            </svg>
            <p className="text-sm">No se encontraron expedientes con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#162e50]/40 bg-[#0a1c36]/20 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Identificación</th>
                  <th className="px-6 py-4">Asesor Asignado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">F. Registro</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162e50]/20 text-sm">
                {filteredFichas.map((ficha) => (
                  <tr key={ficha.id} className="hover:bg-[#0a1c36]/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400">
                      {ficha.codigo}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {ficha.cliente.persona.nombres} {ficha.cliente.persona.apellidos}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      <span className="text-xs font-mono uppercase bg-[#162e50]/40 border border-[#162e50]/60 px-1.5 py-0.5 rounded text-neutral-300 mr-2">
                        {ficha.cliente.persona.tipoDocumento}
                      </span>
                      {ficha.cliente.persona.numeroDocumento}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {ficha.empleado.persona.nombres} {ficha.empleado.persona.apellidos}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ficha.estado)}`}>
                        {ficha.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-500">
                      {new Date(ficha.createdAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/expedientes/${ficha.id}`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Ver Expediente
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#061325] border border-[#162e50] rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#162e50]/50">
              <div>
                <h2 className="text-lg font-bold text-white">Crear ficha inicial</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Registra los datos mínimos del cliente para abrir su expediente.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-[#0a1c36] border border-[#162e50] text-neutral-400 hover:text-white hover:bg-[#0d2140] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateFicha} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Tipo de documento</label>
                  <select
                    value={createForm.tipoDocumento}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, tipoDocumento: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Número de documento</label>
                  <input
                    type="text"
                    value={createForm.numeroDocumento}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Ingresa el documento"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Nombres</label>
                  <input
                    type="text"
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, nombres: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, nombres: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nombres del cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Apellidos</label>
                  <input
                    type="text"
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, apellidos: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, apellidos: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Apellidos del cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Correo</label>
                  <input
                    type="email"
                    value={createForm.correo}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="correo@cliente.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Dirección</label>
                  <input
                    type="text"
                    value={createForm.direccion}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, direccion: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Observaciones</label>
                  <textarea
                    value={createForm.observaciones}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, observaciones: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 min-h-[110px]"
                    placeholder="Notas iniciales de la conversación con el cliente"
                  />
                </div>
              </div>

              {createError && (
                <div className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#162e50] text-neutral-300 hover:text-white hover:bg-[#0a1c36] transition-all text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingFicha}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {creatingFicha ? 'Creando...' : 'Crear ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

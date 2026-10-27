'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, FichaMadre } from '@/services/api';
import { formatTitleCase } from '@/lib/formatters';
import { ModalImportacionMasiva } from '@/components/ModalImportacionMasiva';
import { ModalImportarInversionesFideicomiso } from '@/components/ModalImportarInversionesFideicomiso';

export default function ExpedientesList() {
  const router = useRouter();
  const [fichas, setFichas] = useState<FichaMadre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportInversionesModal, setShowImportInversionesModal] = useState(false);
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
      PENDIENTE: 'bg-amber-50 border-amber-200 text-amber-700',
      EN_PROCESO: 'bg-blue-50 border-blue-200 text-blue-700',
      EN_REVISION: 'bg-orange-50 border-orange-200 text-orange-700',
      COMPLETADA: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      APROBADA: 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold',
      RECHAZADA: 'bg-red-50 border-red-200 text-red-700',
    };
    return badges[estado] || 'bg-[#f7f8fb] border-[#e7ebf1] text-[#8d9aae]';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#10233f] tracking-tight">Expedientes de Clientes</h1>
          <p className="text-sm text-[#8d9aae] mt-1">
            Revisión de Fichas Madre y generación de formatos de firmas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportInversionesModal(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] font-semibold text-sm transition-all shadow-xs cursor-pointer"
            title="Importar archivo Excel o HTML con inversiones en fideicomisos asignadas"
          >
            <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Importar Inversiones Fideicomisos
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#caa344]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar Fichas Masivas
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Crear ficha de cliente
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e7ebf1] rounded-2xl p-4 shadow-xs">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8d9aae]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por código, nombre o documento del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl focus:outline-none focus:border-[#caa344] transition-all text-sm text-[#10233f] placeholder-[#8d9aae]"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl focus:outline-none focus:border-[#caa344] transition-all text-sm text-[#10233f]"
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
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#e7ebf1] rounded-2xl overflow-hidden shadow-xs">
        {filteredFichas.length === 0 ? (
          <div className="py-16 text-center text-[#8d9aae]">
            <svg className="w-12 h-12 mx-auto mb-4 text-[#8d9aae]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m15 0v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3"></path>
            </svg>
            <p className="text-sm">No se encontraron expedientes con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e7ebf1] bg-[#f7f8fb] text-xs font-semibold text-[#8d9aae] uppercase tracking-wider">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Identificación</th>
                  <th className="px-6 py-4">Asesor Asignado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">F. Registro</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7ebf1] text-sm">
                {filteredFichas.map((ficha) => (
                  <tr key={ficha.id} className="hover:bg-[#f7f8fb]/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#caa344]">
                      {ficha.codigo}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#10233f]">
                      {ficha.cliente.persona.nombres} {ficha.cliente.persona.apellidos}
                    </td>
                    <td className="px-6 py-4 text-[#8d9aae]">
                      <span className="text-xs font-mono uppercase bg-[#f7f8fb] border border-[#e7ebf1] px-1.5 py-0.5 rounded text-[#17233a] mr-2">
                        {ficha.cliente.persona.tipoDocumento}
                      </span>
                      {ficha.cliente.persona.numeroDocumento}
                    </td>
                    <td className="px-6 py-4 text-[#17233a]">
                      {ficha.empleado.persona.nombres} {ficha.empleado.persona.apellidos}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ficha.estado)}`}>
                        {ficha.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#8d9aae]">
                      {new Date(ficha.createdAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/expedientes/${ficha.id}`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-white border border-[#e7ebf1] hover:border-[#caa344] hover:text-[#caa344] text-[#17233a] rounded-lg text-xs font-semibold transition-all shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-[#e7ebf1] rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7ebf1] bg-[#f7f8fb]">
              <div>
                <h2 className="text-lg font-bold text-[#10233f]">Crear ficha inicial</h2>
                <p className="text-xs text-[#8d9aae] mt-1">
                  Registra los datos mínimos del cliente para abrir su expediente.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-white border border-[#e7ebf1] text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateFicha} className="p-6 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Tipo de documento</label>
                  <select
                    value={createForm.tipoDocumento}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, tipoDocumento: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Número de documento</label>
                  <input
                    type="text"
                    value={createForm.numeroDocumento}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="Ingresa el documento"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Nombres</label>
                  <input
                    type="text"
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, nombres: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, nombres: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="Nombres del cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Apellidos</label>
                  <input
                    type="text"
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, apellidos: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, apellidos: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="Apellidos del cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Correo</label>
                  <input
                    type="email"
                    value={createForm.correo}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="correo@cliente.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Dirección</label>
                  <input
                    type="text"
                    value={createForm.direccion}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, direccion: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344]"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#8d9aae] uppercase tracking-wide mb-2">Observaciones</label>
                  <textarea
                    value={createForm.observaciones}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                    onBlur={(e) => setCreateForm((prev) => ({ ...prev, observaciones: formatTitleCase(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-[#10233f] text-sm focus:outline-none focus:border-[#caa344] min-h-[110px]"
                    placeholder="Notas iniciales de la conversación con el cliente"
                  />
                </div>
              </div>

              {createError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e7ebf1] text-[#17233a] hover:bg-[#f7f8fb] transition-all text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingFicha}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white text-sm font-bold transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer shadow-xs"
                >
                  {creatingFicha ? 'Creando...' : 'Crear ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN MASIVA Y DIGITALIZACIÓN */}
      <ModalImportacionMasiva
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccessReload={async () => {
          const data = await api.obtenerFichasMadre();
          setFichas(data);
        }}
      />

      {/* MODAL DE IMPORTACIÓN MASIVA DE INVERSIONES EN FIDEICOMISOS */}
      <ModalImportarInversionesFideicomiso
        isOpen={showImportInversionesModal}
        onClose={() => setShowImportInversionesModal(false)}
        onSuccessReload={async () => {
          const data = await api.obtenerFichasMadre();
          setFichas(data);
        }}
      />
    </div>
  );
}

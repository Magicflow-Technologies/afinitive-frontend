'use client';

import React, { useEffect, useState } from 'react';
import { api, Fideicomiso } from '@/services/api';

export default function FideicomisosAdminPage() {
  const [fideicomisos, setFideicomisos] = useState<Fideicomiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // Modal para Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFid, setEditingFid] = useState<Fideicomiso | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    fideicomitente: 'AFINITIVE S.A.C.',
    emisorFiduciario: 'Grupo Coril Sociedad Titulizadora S.A.',
    patrimonioNombreLargo: '',
    denominacionValores: 'BONOS DE TITULIZACIÓN – PF AFINITIVE',
    tipoValor: 'Bonos de Titulización',
    monedaDefault: 'USD',
    tasaInteresDefault: '10 %',
    plazoEmisionDefault: 'Hasta de 24 meses. Base ACT/360.',
    notario: 'Notario Público de Lima Dr. Eduardo Laos de Lama',
    ruc: '',
    bancoNombre: 'Banco de Crédito del Perú (BCP)',
    numeroCuenta: '',
    cuentaCci: '',
    titularCuenta: '',
    direccionFiduciario: '',
    representanteLegal: '',
    correoOpCorilDefault: 'operacionesst@grupocoril.com',
    correoOpCorfidDefault: 'operacionescorfid@corfid.com.pe',
    activo: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.obtenerFideicomisosCatalogo();
      setFideicomisos(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar el catálogo de fideicomisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserRole(parsed.rol || '');
      } catch (e) {}
    }
    loadData();
  }, []);

  const isAdmin = userRole.toLowerCase() === 'admin';

  const handleOpenCreate = () => {
    setEditingFid(null);
    setFormData({
      nombre: '',
      fideicomitente: 'AFINITIVE S.A.C.',
      emisorFiduciario: 'Grupo Coril Sociedad Titulizadora S.A.',
      patrimonioNombreLargo: '',
      denominacionValores: 'BONOS DE TITULIZACIÓN – PF AFINITIVE',
      tipoValor: 'Bonos de Titulización',
      monedaDefault: 'USD',
      tasaInteresDefault: '10 %',
      plazoEmisionDefault: 'Hasta de 24 meses. Base ACT/360.',
      notario: 'Notario Público de Lima Dr. Eduardo Laos de Lama',
      ruc: '',
      bancoNombre: 'Banco de Crédito del Perú (BCP)',
      numeroCuenta: '',
      cuentaCci: '',
      titularCuenta: '',
      direccionFiduciario: '',
      representanteLegal: '',
      correoOpCorilDefault: 'operacionesst@grupocoril.com',
      correoOpCorfidDefault: 'operacionescorfid@corfid.com.pe',
      activo: true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fid: Fideicomiso) => {
    setEditingFid(fid);
    setFormData({
      nombre: fid.nombre || '',
      fideicomitente: fid.fideicomitente || 'AFINITIVE S.A.C.',
      emisorFiduciario: fid.emisorFiduciario || 'Grupo Coril Sociedad Titulizadora S.A.',
      patrimonioNombreLargo: fid.patrimonioNombreLargo || '',
      denominacionValores: fid.denominacionValores || 'BONOS DE TITULIZACIÓN – PF AFINITIVE',
      tipoValor: fid.tipoValor || 'Bonos de Titulización',
      monedaDefault: fid.monedaDefault || 'USD',
      tasaInteresDefault: fid.tasaInteresDefault || '10 %',
      plazoEmisionDefault: fid.plazoEmisionDefault || 'Hasta de 24 meses. Base ACT/360.',
      notario: fid.notario || '',
      ruc: fid.ruc || '',
      bancoNombre: fid.bancoNombre || '',
      numeroCuenta: fid.numeroCuenta || '',
      cuentaCci: fid.cuentaCci || '',
      titularCuenta: fid.titularCuenta || '',
      direccionFiduciario: fid.direccionFiduciario || '',
      representanteLegal: fid.representanteLegal || '',
      correoOpCorilDefault: fid.correoOpCorilDefault || 'operacionesst@grupocoril.com',
      correoOpCorfidDefault: fid.correoOpCorfidDefault || 'operacionescorfid@corfid.com.pe',
      activo: fid.activo !== false,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setModalError('El nombre del fideicomiso es obligatorio.');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      if (editingFid) {
        await api.actualizarFideicomiso(editingFid.id, formData);
      } else {
        await api.crearFideicomiso(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Error al guardar el fideicomiso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fid: Fideicomiso) => {
    const msg = fid._count?.inversiones
      ? `El fideicomiso "${fid.nombre}" tiene ${fid._count.inversiones} inversiones vinculadas. ¿Deseas desactivarlo del catálogo?`
      : `¿Estás seguro de eliminar el fideicomiso "${fid.nombre}"?`;

    if (!confirm(msg)) return;

    try {
      await api.eliminarFideicomiso(fid.id);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al eliminar el fideicomiso.');
    }
  };

  // Filtrado de búsqueda
  const filtered = fideicomisos.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      f.nombre.toLowerCase().includes(q) ||
      (f.emisorFiduciario && f.emisorFiduciario.toLowerCase().includes(q)) ||
      (f.patrimonioNombreLargo && f.patrimonioNombreLargo.toLowerCase().includes(q)) ||
      (f.bancoNombre && f.bancoNombre.toLowerCase().includes(q))
    );
  });

  if (!isAdmin && userRole) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
          🔒
        </div>
        <h2 className="text-lg font-bold text-[#10233f]">Acceso Administrativo Requerido</h2>
        <p className="text-xs text-[#8d9aae] max-w-sm mt-1">
          Solo los administradores tienen permisos para crear o modificar el catálogo de fideicomisos oficiales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#10233f] tracking-tight">
              Catálogo Oficial de Fideicomisos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344] uppercase">
              Exclusivo Administrador
            </span>
          </div>
          <p className="text-xs text-[#8d9aae] mt-1">
            Los fideicomisos configurados aquí alimentan automáticamente el selector de <strong>&quot;Fideicomiso de Destino&quot;</strong> utilizado por analistas y operadores al asociar clientes en sus expedientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-md shadow-[#caa344]/25 transition-all cursor-pointer self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Crear Fideicomiso</span>
        </button>
      </div>

      {/* 2. COCKPIT DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#e7ebf1] shadow-xs">
          <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">
            Fideicomisos en Catálogo
          </span>
          <span className="text-2xl font-extrabold text-[#10233f] mt-1 block">
            {fideicomisos.length}
          </span>
          <span className="text-[11px] text-[#8d9aae] mt-0.5 block">
            Disponibles para selección
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e7ebf1] shadow-xs">
          <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">
            Inversiones Vinculadas
          </span>
          <span className="text-2xl font-extrabold text-[#caa344] mt-1 block">
            {fideicomisos.reduce((acc, f) => acc + (f._count?.inversiones || 0), 0)}
          </span>
          <span className="text-[11px] text-[#8d9aae] mt-0.5 block">
            Participaciones activas de clientes
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e7ebf1] shadow-xs">
          <span className="block text-[#8d9aae] text-[10px] font-mono font-bold uppercase">
            Emisores Fiduciarios
          </span>
          <span className="text-2xl font-extrabold text-[#17233a] mt-1 block">
            Grupo Coril / Corfid
          </span>
          <span className="text-[11px] text-[#8d9aae] mt-0.5 block">
            Sociedades titulizadoras oficiales
          </span>
        </div>
      </div>

      {/* 3. BARRA DE BÚSQUEDA */}
      <div className="bg-white border border-[#e7ebf1] rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8d9aae]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar fideicomiso por nombre, emisor fiduciario, banco o patrimonio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-semibold text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
          />
        </div>
      </div>

      {/* 4. LISTADO DE FIDEICOMISOS */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#8d9aae]">
          Cargando catálogo de fideicomisos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#e7ebf1] rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f7f8fb] text-[#8d9aae] flex items-center justify-center mx-auto text-xl">
            🏛️
          </div>
          <h3 className="text-base font-bold text-[#10233f]">No se encontraron fideicomisos</h3>
          <p className="text-xs text-[#8d9aae] max-w-sm mx-auto">
            {searchTerm
              ? 'No hay resultados que coincidan con la búsqueda.'
              : 'Aún no se han registrado fideicomisos en el sistema. Crea uno con el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((fid) => (
            <div
              key={fid.id}
              className="bg-white border border-[#e7ebf1] hover:border-[#caa344] rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                {/* Cabecera Tarjeta */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#8d9aae] uppercase block">
                      Fideicomiso
                    </span>
                    <h3 className="text-base font-extrabold text-[#10233f] group-hover:text-[#caa344] transition-colors">
                      {fid.nombre}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#caa344]/15 border border-[#caa344]/30 text-[#caa344] font-mono">
                    {fid._count?.inversiones || 0} {fid._count?.inversiones === 1 ? 'inversión' : 'inversiones'}
                  </span>
                </div>

                <p className="text-xs text-[#8d9aae] line-clamp-2 mb-4" title={fid.patrimonioNombreLargo || ''}>
                  {fid.patrimonioNombreLargo || fid.emisorFiduciario || 'Patrimonio en Fideicomiso'}
                </p>

                {/* Parámetros por Defecto */}
                <div className="space-y-2 p-3 rounded-2xl bg-[#f7f8fb] border border-[#e7ebf1] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Moneda / Tasa:</span>
                    <span className="font-bold text-[#17233a]">
                      {fid.monedaDefault || 'USD'} • <strong className="text-[#caa344]">{fid.tasaInteresDefault || '10 %'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Plazo Emisión:</span>
                    <span className="font-medium text-[#17233a] truncate max-w-[150px]" title={fid.plazoEmisionDefault || ''}>
                      {fid.plazoEmisionDefault || 'Hasta 24 meses'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Banco:</span>
                    <span className="font-medium text-[#17233a] truncate max-w-[150px]" title={fid.bancoNombre || ''}>
                      {fid.bancoNombre || 'No asignado'}
                    </span>
                  </div>

                  {fid.numeroCuenta && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#e7ebf1]">
                      <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Cuenta:</span>
                      <span className="font-mono text-[11px] text-[#17233a]">{fid.numeroCuenta}</span>
                    </div>
                  )}

                  {fid.correoOpCorilDefault && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#e7ebf1]">
                      <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Op. Coril:</span>
                      <span className="text-[11px] text-[#17233a] truncate max-w-[160px]" title={fid.correoOpCorilDefault}>
                        {fid.correoOpCorilDefault}
                      </span>
                    </div>
                  )}

                  {fid.correoOpCorfidDefault && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#8d9aae] text-[10px] uppercase font-mono font-bold">Op. Corfid:</span>
                      <span className="text-[11px] text-[#17233a] truncate max-w-[160px]" title={fid.correoOpCorfidDefault}>
                        {fid.correoOpCorfidDefault}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(fid)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] text-xs font-semibold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(fid)}
                  className="p-1.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs transition-all cursor-pointer"
                  title="Eliminar o desactivar fideicomiso"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. MODAL CREAR / EDITAR FIDEICOMISO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[80] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl border border-[#e7ebf1] shadow-2xl flex flex-col overflow-hidden font-sans">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#e7ebf1] flex items-center justify-between bg-[#f7f8fb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344] font-black">
                  🏛️
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#10233f]">
                    {editingFid ? 'Editar Fideicomiso Oficial' : 'Registrar Nuevo Fideicomiso'}
                  </h3>
                  <p className="text-xs text-[#8d9aae]">
                    Al guardarlo, quedará disponible en el selector de &quot;Fideicomiso de Destino&quot; para operadores y analistas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-[#e7ebf1] hover:border-[#caa344] text-[#8d9aae] hover:text-[#17233a] flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {modalError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                  {modalError}
                </div>
              )}

              {/* Nombre y Emisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d9aae] mb-1">
                    Nombre del Fideicomiso *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: AWM LIBRE 2 o GRAZZIA"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-bold text-[#10233f] focus:outline-none focus:border-[#caa344]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d9aae] mb-1">
                    Emisor Fiduciario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.emisorFiduciario}
                    onChange={(e) => setFormData({ ...formData, emisorFiduciario: e.target.value })}
                    placeholder="Grupo Coril Sociedad Titulizadora S.A."
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              {/* Fideicomitente y Patrimonio Nombre Largo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d9aae] mb-1">
                    Fideicomitente
                  </label>
                  <input
                    type="text"
                    value={formData.fideicomitente}
                    onChange={(e) => setFormData({ ...formData, fideicomitente: e.target.value })}
                    placeholder="AFINITIVE S.A.C."
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d9aae] mb-1">
                    RUC del Fideicomiso
                  </label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    placeholder="20609876543"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d9aae] mb-1">
                  Patrimonio Nombre Largo (Legal)
                </label>
                <input
                  type="text"
                  value={formData.patrimonioNombreLargo}
                  onChange={(e) => setFormData({ ...formData, patrimonioNombreLargo: e.target.value })}
                  placeholder="Patrimonio en Fideicomiso AFINITIVE – D. Leg. N° 861..."
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                />
              </div>

              {/* Valores Comerciales por Defecto */}
              <div className="pt-2 border-t border-[#e7ebf1] space-y-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#10233f]">
                  Parámetros Financieros por Defecto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Moneda por Defecto
                    </label>
                    <select
                      value={formData.monedaDefault}
                      onChange={(e) => setFormData({ ...formData, monedaDefault: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-semibold text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    >
                      <option value="USD">USD ($) Dólares</option>
                      <option value="PEN">PEN (S/) Soles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Tasa de Interés por Defecto
                    </label>
                    <input
                      type="text"
                      value={formData.tasaInteresDefault}
                      onChange={(e) => setFormData({ ...formData, tasaInteresDefault: e.target.value })}
                      placeholder="10 %"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Plazo de Emisión
                    </label>
                    <input
                      type="text"
                      value={formData.plazoEmisionDefault}
                      onChange={(e) => setFormData({ ...formData, plazoEmisionDefault: e.target.value })}
                      placeholder="Hasta de 24 meses"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>
                </div>
              </div>

              {/* Cuenta Bancaria de Recaudación */}
              <div className="pt-2 border-t border-[#e7ebf1] space-y-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#10233f]">
                  Cuenta Bancaria Fiduciaria de Destino
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={formData.bancoNombre}
                      onChange={(e) => setFormData({ ...formData, bancoNombre: e.target.value })}
                      placeholder="Banco de Crédito del Perú (BCP)"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.numeroCuenta}
                      onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                      placeholder="193-98765432-1-90"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Código CCI
                    </label>
                    <input
                      type="text"
                      value={formData.cuentaCci}
                      onChange={(e) => setFormData({ ...formData, cuentaCci: e.target.value })}
                      placeholder="002-193-009876543210-90"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.titularCuenta}
                      onChange={(e) => setFormData({ ...formData, titularCuenta: e.target.value })}
                      placeholder="Patrimonio en Fideicomiso AFINITIVE..."
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>
                </div>
              </div>

              {/* Correos de Operación por Defecto */}
              <div className="pt-2 border-t border-[#e7ebf1] space-y-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#10233f]">
                  Correos de Operaciones para Contacto del Cliente
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Correo Op. Coril por Defecto
                    </label>
                    <input
                      type="email"
                      value={formData.correoOpCorilDefault}
                      onChange={(e) => setFormData({ ...formData, correoOpCorilDefault: e.target.value })}
                      placeholder="operacionesst@grupocoril.com"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#8d9aae] mb-1">
                      Correo Op. Corfid por Defecto
                    </label>
                    <input
                      type="email"
                      value={formData.correoOpCorfidDefault}
                      onChange={(e) => setFormData({ ...formData, correoOpCorfidDefault: e.target.value })}
                      placeholder="operacionescorfid@corfid.com.pe"
                      className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl font-medium text-[#10233f] focus:outline-none focus:border-[#caa344]"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-[#e7ebf1] flex items-center justify-end gap-3 bg-[#f7f8fb]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#e7ebf1] bg-white hover:bg-[#f7f8fb] text-[#17233a] font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#caa344] hover:bg-[#b8923a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? 'Guardando...'
                  : editingFid
                    ? 'Actualizar Fideicomiso'
                    : 'Crear Fideicomiso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Briefcase,
  Lock,
  UserCheck,
  UserX,
} from 'lucide-react';

interface RolItem {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface UsuarioItem {
  id: string;
  username: string;
  activo: boolean;
  requiere2FA: boolean;
  ultimoAcceso?: string;
  debeCambiarPassword: boolean;
  rolId: string;
  rol: RolItem;
  persona: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    empleado?: {
      id: string;
      cargo: string;
      area?: string;
    } | null;
  };
}

export default function UsuariosSistemaPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    tipoDocumento: 'DNI' as 'DNI' | 'RUC' | 'CE' | 'PASAPORTE',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    cargo: '',
    area: '',
    rolId: '',
    username: '',
    password: '',
    requiere2FA: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // Estados Modal Reset Password
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [copiedResetPass, setCopiedResetPass] = useState(false);

  // Cargar usuarios y roles
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        api.obtenerUsuarios(),
        api.obtenerRoles(),
      ]);
      setUsuarios(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0 && !createForm.rolId) {
        setCreateForm((prev) => ({ ...prev, rolId: rolesData[0].id }));
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Error al cargar los usuarios del sistema.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generarPasswordSegura = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      cargo: '',
      area: '',
      rolId: roles[0]?.id || '',
      username: '',
      password: generarPasswordSegura(),
      requiere2FA: false,
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (
      !createForm.numeroDocumento.trim() ||
      !createForm.nombres.trim() ||
      !createForm.apellidos.trim() ||
      !createForm.correo.trim() ||
      !createForm.cargo.trim() ||
      !createForm.rolId ||
      !createForm.username.trim() ||
      !createForm.password.trim()
    ) {
      setCreateError('Por favor completa todos los campos requeridos (*).');
      return;
    }

    try {
      setActionLoading('create');
      await api.crearUsuarioSistema(createForm);
      setFeedback({
        type: 'success',
        message: `Usuario @${createForm.username} creado exitosamente con el rol seleccionado.`,
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Error al registrar el usuario del sistema.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenResetModal = (usuario: UsuarioItem) => {
    setSelectedUser(usuario);
    setResetPassword(generarPasswordSegura());
    setResetError('');
    setCopiedResetPass(false);
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!resetPassword.trim() || resetPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setActionLoading('reset');
      await api.resetPasswordUsuario(selectedUser.id, resetPassword);
      setFeedback({
        type: 'success',
        message: `Contraseña restablecida exitosamente para @${selectedUser.username}.`,
      });
      setShowResetModal(false);
      await loadData();
    } catch (err: any) {
      setResetError(err.message || 'Error al restablecer contraseña.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActivo = async (usuarioId: string) => {
    try {
      setActionLoading(usuarioId);
      await api.toggleActivoUsuario(usuarioId);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al cambiar estado de cuenta.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle2FA = async (usuarioId: string) => {
    try {
      setActionLoading(usuarioId);
      await api.toggle2FAUsuario(usuarioId);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al cambiar estado 2FA.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRol = async (usuarioId: string, rolId: string) => {
    try {
      setActionLoading(usuarioId);
      await api.cambiarRolUsuario(usuarioId, rolId);
      setFeedback({ type: 'success', message: 'Rol de usuario actualizado.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al actualizar rol.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = (text: string, isReset = false) => {
    navigator.clipboard.writeText(text);
    if (isReset) {
      setCopiedResetPass(true);
      setTimeout(() => setCopiedResetPass(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  // Filtrado de usuarios
  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.persona.nombres} ${u.persona.apellidos}`.toLowerCase();
    const email = (u.persona.correo || '').toLowerCase();
    const doc = (u.persona.numeroDocumento || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const cargo = (u.persona.empleado?.cargo || '').toLowerCase();

    const matchesSearch =
      fullName.includes(term) ||
      email.includes(term) ||
      doc.includes(term) ||
      username.includes(term) ||
      cargo.includes(term);

    if (filterRol === 'TODOS') return matchesSearch;
    return matchesSearch && u.rol?.nombre?.toLowerCase() === filterRol.toLowerCase();
  });

  // Badge de color por rol
  const getRolBadgeColor = (rolName: string) => {
    const r = rolName.toLowerCase();
    if (r === 'admin') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (r === 'analista') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (r === 'operador') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (r === 'cliente') return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* 1. Header con botón nuevo usuario */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#10233f] tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-[#caa344]" />
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-[#8d9aae] mt-1">
            Gestión del personal interno: Administradores, Analistas, Operadores y Gerencias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs font-semibold text-[#17233a] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#caa344]' : 'text-[#8d9aae]'}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#caa344] hover:bg-[#b8923a] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Usuario Interno</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase font-semibold cursor-pointer ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 3. Barra de Búsqueda y Filtros por Rol */}
      <div className="bg-white border border-[#e7ebf1] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
        {/* Input Buscador */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#8d9aae] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo, usuario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] transition-all"
          />
        </div>

        {/* Filtros de Rol */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setFilterRol('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterRol === 'TODOS'
                ? 'bg-[#caa344] text-white shadow-xs'
                : 'bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] border border-[#e7ebf1]'
            }`}
          >
            Todos ({usuarios.length})
          </button>
          {roles.map((r) => {
            const count = usuarios.filter((u) => u.rol?.nombre?.toLowerCase() === r.nombre.toLowerCase()).length;
            return (
              <button
                key={r.id}
                onClick={() => setFilterRol(r.nombre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer uppercase ${
                  filterRol.toLowerCase() === r.nombre.toLowerCase()
                    ? 'bg-[#caa344] text-white shadow-xs'
                    : 'bg-[#f7f8fb] text-[#8d9aae] hover:text-[#17233a] border border-[#e7ebf1]'
                }`}
              >
                {r.nombre} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tabla de Usuarios del Sistema */}
      <div className="bg-white border border-[#e7ebf1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f8fb] text-[#8d9aae] uppercase tracking-wider font-semibold border-b border-[#e7ebf1]">
              <tr>
                <th className="py-4 px-6">Colaborador / Cargo</th>
                <th className="py-4 px-6">Contacto y Doc</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6 text-center">Rol Asignado</th>
                <th className="py-4 px-6 text-center">2FA (Correo)</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-center">Último Ingreso</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf1] text-[#17233a]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8d9aae]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#caa344]" />
                      <span>Cargando usuarios del sistema...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8d9aae]">
                    No se encontraron usuarios con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => {
                  const isActionBusy = actionLoading === u.id;
                  const cargo = u.persona.empleado?.cargo || 'Colaborador';
                  const area = u.persona.empleado?.area;

                  return (
                    <tr key={u.id} className="hover:bg-[#f7f8fb]/80 transition-colors">
                      {/* Colaborador */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#10233f] text-sm">
                          {u.persona.nombres} {u.persona.apellidos}
                        </div>
                        <div className="text-[#8d9aae] text-xs flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3 h-3 text-[#8d9aae]" />
                          <span>{cargo}</span>
                          {area && <span className="text-[#8d9aae] font-mono">({area})</span>}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-6">
                        <div className="font-mono text-[#17233a]">{u.persona.correo}</div>
                        <div className="text-[#8d9aae] text-[11px] font-mono mt-0.5">
                          {u.persona.tipoDocumento}: {u.persona.numeroDocumento}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-6 font-mono font-bold text-[#caa344]">
                        @{u.username}
                      </td>

                      {/* Rol con Selector Rápido */}
                      <td className="py-4 px-6 text-center">
                        <select
                          value={u.rolId}
                          onChange={(e) => handleChangeRol(u.id, e.target.value)}
                          disabled={isActionBusy}
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border focus:outline-none cursor-pointer ${getRolBadgeColor(
                            u.rol?.nombre || '',
                          )} bg-white`}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-white text-[#10233f]">
                              {r.nombre.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 2FA Toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggle2FA(u.id)}
                          disabled={isActionBusy}
                          title="Alternar requerimiento de 2FA"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                            u.requiere2FA
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : 'bg-[#f7f8fb] border-[#e7ebf1] text-[#8d9aae] hover:bg-neutral-100'
                          }`}
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${u.requiere2FA ? 'text-blue-600' : 'text-[#8d9aae]'}`} />
                          <span>{u.requiere2FA ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Estado Cuenta Toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleActivo(u.id)}
                          disabled={isActionBusy}
                          title="Alternar suspensión de acceso"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                            u.activo
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span>{u.activo ? 'Habilitado' : 'Suspendido'}</span>
                        </button>
                      </td>

                      {/* Último Ingreso */}
                      <td className="py-4 px-6 text-center text-[#8d9aae] font-mono text-[11px]">
                        {u.ultimoAcceso
                          ? new Date(u.ultimoAcceso).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenResetModal(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#caa344]" />
                          <span>Reset Clave</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREAR USUARIO DEL SISTEMA                                        */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e7ebf1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#caa344]/10 border border-[#caa344]/20 flex items-center justify-center text-[#caa344]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10233f]">Nuevo Usuario del Sistema</h3>
                  <p className="text-xs text-[#8d9aae]">
                    Crea un colaborador interno (Analista, Operador, Admin, etc.)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#8d9aae] hover:text-[#10233f] text-lg font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {createError}
                </div>
              )}

              {/* Sección 1: Datos Personales */}
              <div className="text-xs font-bold uppercase tracking-wider text-[#caa344] border-b border-[#e7ebf1] pb-1">
                1. Datos Personales
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Tipo Doc *</label>
                  <select
                    value={createForm.tipoDocumento}
                    onChange={(e: any) => setCreateForm({ ...createForm, tipoDocumento: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] focus:outline-none focus:border-[#caa344]"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné Ext.</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">N° Documento *</label>
                  <input
                    type="text"
                    required
                    value={createForm.numeroDocumento}
                    onChange={(e) => {
                      const doc = e.target.value;
                      setCreateForm((prev) => ({
                        ...prev,
                        numeroDocumento: doc,
                        username: prev.username || doc.toLowerCase(),
                      }));
                    }}
                    placeholder="Número de identidad"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm({ ...createForm, nombres: e.target.value })}
                    placeholder="Nombres completos"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm({ ...createForm, apellidos: e.target.value })}
                    placeholder="Apellidos completos"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Correo Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={createForm.correo}
                    onChange={(e) => setCreateForm({ ...createForm, correo: e.target.value })}
                    placeholder="ej. usuario@afinitive.pe"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] font-mono focus:outline-none focus:border-[#caa344]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              {/* Sección 2: Puesto Interno */}
              <div className="text-xs font-bold uppercase tracking-wider text-[#caa344] border-b border-[#e7ebf1] pb-1 pt-2">
                2. Cargo y Área
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={createForm.cargo}
                    onChange={(e) => setCreateForm({ ...createForm, cargo: e.target.value })}
                    placeholder="ej. Analista de Riesgos"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Área / Departamento</label>
                  <input
                    type="text"
                    value={createForm.area}
                    onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                    placeholder="ej. Operaciones"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344]"
                  />
                </div>
              </div>

              {/* Sección 3: Credenciales & Rol */}
              <div className="text-xs font-bold uppercase tracking-wider text-[#caa344] border-b border-[#e7ebf1] pb-1 pt-2">
                3. Credenciales y Permisos
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17233a] mb-1">Rol de Acceso *</label>
                <select
                  value={createForm.rolId}
                  onChange={(e) => setCreateForm({ ...createForm, rolId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] font-bold uppercase focus:outline-none focus:border-[#caa344]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-white text-[#10233f]">
                      {r.nombre.toUpperCase()} {r.descripcion ? `— ${r.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17233a] mb-1">Nombre de Usuario (@username) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().trim() })}
                    placeholder="ej. cperez"
                    className="w-full px-3 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] font-mono focus:outline-none focus:border-[#caa344]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#17233a]">Contraseña *</label>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, password: generarPasswordSegura() })}
                      className="text-xs text-[#caa344] hover:text-[#b8923a] font-semibold cursor-pointer"
                    >
                      🎲 Generar
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full pl-3 pr-16 py-2 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] font-mono focus:outline-none focus:border-[#caa344]"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(createForm.password)}
                        className="p-1 text-[#8d9aae] hover:text-[#10233f]"
                        title="Copiar contraseña"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-[#8d9aae] hover:text-[#10233f]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox 2FA */}
              <div className="p-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="user2fa"
                  checked={createForm.requiere2FA}
                  onChange={(e) => setCreateForm({ ...createForm, requiere2FA: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#caa344] focus:ring-[#caa344] border-[#e7ebf1] bg-white accent-[#caa344]"
                />
                <label htmlFor="user2fa" className="text-xs text-[#17233a] cursor-pointer">
                  <strong className="block text-[#10233f]">Activar autenticación 2FA por correo para este colaborador</strong>
                  <span className="text-[#8d9aae]">Se le enviará un código de verificación de 6 dígitos a su correo en cada inicio de sesión.</span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] text-[#17233a] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="px-5 py-2 bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'create' ? 'Creando Usuario...' : 'Crear Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: RESTABLECER CONTRASEÑA                                          */}
      {/* ========================================================================= */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#e7ebf1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#caa344]/10 border border-[#caa344]/20 flex items-center justify-center text-[#caa344]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10233f]">Restablecer Contraseña</h3>
                  <p className="text-xs text-[#8d9aae]">
                    Usuario: @{selectedUser.username} ({selectedUser.persona.nombres})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-[#8d9aae] hover:text-[#10233f] text-lg font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {resetError}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-[#17233a]">Nueva Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setResetPassword(generarPasswordSegura())}
                    className="text-xs text-[#caa344] hover:text-[#b8923a] font-semibold cursor-pointer"
                  >
                    🎲 Generar Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-sm text-[#10233f] font-mono focus:outline-none focus:border-[#caa344]"
                    placeholder="Nueva clave"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(resetPassword, true)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#10233f] cursor-pointer"
                      title="Copiar contraseña"
                    >
                      {copiedResetPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#10233f] cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] text-[#17233a] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'reset'}
                  className="px-5 py-2 bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'reset' ? 'Actualizando...' : 'Restablecer Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

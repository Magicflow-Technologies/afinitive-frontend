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
    if (r === 'admin') return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
    if (r === 'analista') return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    if (r === 'operador') return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
    if (r === 'cliente') return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* 1. Header con botón nuevo usuario */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Gestión del personal interno: Administradores, Analistas, Operadores y Gerencias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0a1c36] hover:bg-[#162e50] border border-[#162e50] rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Usuario Interno</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
              : 'bg-red-950/20 border-red-900/40 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
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
      <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Input Buscador */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo, usuario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filtros de Rol */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setFilterRol('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterRol === 'TODOS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#0a1c36] text-neutral-400 hover:text-white border border-[#162e50]'
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-[#0a1c36] text-neutral-400 hover:text-white border border-[#162e50]'
                }`}
              >
                {r.nombre} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tabla de Usuarios del Sistema */}
      <div className="backdrop-blur-md bg-[#0a1c36]/20 border border-[#162e50]/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a1c36]/60 text-neutral-400 uppercase tracking-wider font-semibold border-b border-[#162e50]/60">
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
            <tbody className="divide-y divide-[#162e50]/30 text-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span>Cargando usuarios del sistema...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No se encontraron usuarios con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => {
                  const isActionBusy = actionLoading === u.id;
                  const cargo = u.persona.empleado?.cargo || 'Colaborador';
                  const area = u.persona.empleado?.area;

                  return (
                    <tr key={u.id} className="hover:bg-[#0a1c36]/30 transition-colors">
                      {/* Colaborador */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">
                          {u.persona.nombres} {u.persona.apellidos}
                        </div>
                        <div className="text-neutral-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3 h-3 text-neutral-500" />
                          <span>{cargo}</span>
                          {area && <span className="text-neutral-500 font-mono">({area})</span>}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-6">
                        <div className="font-mono text-neutral-300">{u.persona.correo}</div>
                        <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                          {u.persona.tipoDocumento}: {u.persona.numeroDocumento}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-6 font-mono font-bold text-blue-400">
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
                          )} bg-[#050e1b]`}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-[#061325] text-white">
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
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                              : 'bg-neutral-800/40 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${u.requiere2FA ? 'text-blue-400' : 'text-neutral-500'}`} />
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
                              ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                              : 'bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span>{u.activo ? 'Habilitado' : 'Suspendido'}</span>
                        </button>
                      </td>

                      {/* Último Ingreso */}
                      <td className="py-4 px-6 text-center text-neutral-400 font-mono text-[11px]">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1c36] hover:bg-[#162e50] border border-[#162e50] hover:border-amber-500/40 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#061325] border border-[#162e50] rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#162e50] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo Usuario del Sistema</h3>
                  <p className="text-xs text-neutral-400">
                    Crea un colaborador interno (Analista, Operador, Admin, etc.)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400">
                  {createError}
                </div>
              )}

              {/* Sección 1: Datos Personales */}
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#162e50]/60 pb-1">
                1. Datos Personales
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Tipo Doc *</label>
                  <select
                    value={createForm.tipoDocumento}
                    onChange={(e: any) => setCreateForm({ ...createForm, tipoDocumento: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné Ext.</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">N° Documento *</label>
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
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={createForm.nombres}
                    onChange={(e) => setCreateForm({ ...createForm, nombres: e.target.value })}
                    placeholder="Nombres completos"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={createForm.apellidos}
                    onChange={(e) => setCreateForm({ ...createForm, apellidos: e.target.value })}
                    placeholder="Apellidos completos"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Correo Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={createForm.correo}
                    onChange={(e) => setCreateForm({ ...createForm, correo: e.target.value })}
                    placeholder="ej. usuario@afinitive.pe"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Sección 2: Puesto Interno */}
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#162e50]/60 pb-1 pt-2">
                2. Cargo y Área
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={createForm.cargo}
                    onChange={(e) => setCreateForm({ ...createForm, cargo: e.target.value })}
                    placeholder="ej. Analista de Riesgos"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Área / Departamento</label>
                  <input
                    type="text"
                    value={createForm.area}
                    onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                    placeholder="ej. Operaciones"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Sección 3: Credenciales & Rol */}
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#162e50]/60 pb-1 pt-2">
                3. Credenciales y Permisos
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Rol de Acceso *</label>
                <select
                  value={createForm.rolId}
                  onChange={(e) => setCreateForm({ ...createForm, rolId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white font-bold uppercase"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre.toUpperCase()} {r.descripcion ? `— ${r.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Nombre de Usuario (@username) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().trim() })}
                    placeholder="ej. cperez"
                    className="w-full px-3 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-400">Contraseña *</label>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, password: generarPasswordSegura() })}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
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
                      className="w-full pl-3 pr-16 py-2 bg-[#050e1b] border border-[#162e50] rounded-xl text-xs text-white font-mono"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(createForm.password)}
                        className="p-1 text-neutral-400 hover:text-white"
                        title="Copiar contraseña"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox 2FA */}
              <div className="p-3 bg-[#0a1c36]/40 border border-[#162e50] rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="user2fa"
                  checked={createForm.requiere2FA}
                  onChange={(e) => setCreateForm({ ...createForm, requiere2FA: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-700 bg-[#050e1b]"
                />
                <label htmlFor="user2fa" className="text-xs text-neutral-300 cursor-pointer">
                  <strong className="block text-white">Activar autenticación 2FA por correo para este colaborador</strong>
                  Se le enviará un código de verificación de 6 dígitos a su correo en cada inicio de sesión.
                </label>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#162e50]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#0a1c36] hover:bg-[#162e50] border border-[#162e50] text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#061325] border border-[#162e50] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#162e50] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Restablecer Contraseña</h3>
                  <p className="text-xs text-neutral-400">
                    Usuario: @{selectedUser.username} ({selectedUser.persona.nombres})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-neutral-500 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {resetError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400">
                  {resetError}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-neutral-400">Nueva Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setResetPassword(generarPasswordSegura())}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
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
                    className="w-full pl-3.5 pr-20 py-2.5 bg-[#050e1b] border border-[#162e50] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                    placeholder="Nueva clave"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(resetPassword, true)}
                      className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                      title="Copiar contraseña"
                    >
                      {copiedResetPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#162e50]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-[#0a1c36] hover:bg-[#162e50] border border-[#162e50] text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'reset'}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-lg shadow-amber-600/20 disabled:opacity-50"
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

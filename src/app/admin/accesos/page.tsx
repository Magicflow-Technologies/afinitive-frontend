'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  KeyRound,
  Search,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Lock,
  UserPlus,
} from 'lucide-react';

interface ClienteItem {
  id: string;
  personaId: string;
  activo: boolean;
  persona: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    usuario?: {
      id: string;
      username: string;
      activo: boolean;
      requiere2FA: boolean;
      ultimoAcceso?: string;
      debeCambiarPassword: boolean;
      rol?: {
        nombre: string;
      };
    } | null;
  };
  fichaMadre?: {
    id: string;
    codigo: string;
    estado: string;
  } | null;
}

export default function AccesosClientesPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'CON_ACCESO' | 'SIN_ACCESO'>('TODOS');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Modal Crear Credenciales
  const [selectedCliente, setSelectedCliente] = useState<ClienteItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [requiere2FA, setRequiere2FA] = useState(true);
  const [createModalError, setCreateModalError] = useState('');

  // Estados del Modal Reset Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetModalError, setResetModalError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Cargar lista de clientes
  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await api.obtenerClientes();
      setClientes(data);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'No se pudo cargar la lista de clientes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Generador de contraseñas seguras
  const generarPasswordSegura = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Abrir modal de creación
  const handleOpenCreateModal = (cliente: ClienteItem) => {
    setSelectedCliente(cliente);
    // Sugiere username basado en su documento o correo
    const suggested = cliente.persona.numeroDocumento || cliente.persona.correo.split('@')[0];
    setNewUsername(suggested.toLowerCase().trim());
    setNewPassword(generarPasswordSegura());
    setRequiere2FA(true);
    setCreateModalError('');
    setShowCreateModal(true);
  };

  // Enviar creación de usuario
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;

    if (!newUsername.trim() || !newPassword.trim()) {
      setCreateModalError('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setCreateModalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setActionLoading('create');
      setCreateModalError('');

      await api.crearUsuarioCliente({
        clienteId: selectedCliente.id,
        username: newUsername.trim(),
        password: newPassword,
        requiere2FA,
      });

      setFeedback({
        type: 'success',
        message: `Credenciales creadas con éxito para ${selectedCliente.persona.nombres}. Usuario: ${newUsername}`,
      });
      setShowCreateModal(false);
      await loadClientes();
    } catch (err: any) {
      setCreateModalError(err.message || 'Error al crear credenciales de usuario.');
    } finally {
      setActionLoading(null);
    }
  };

  // Abrir modal de reset de contraseña
  const handleOpenResetModal = (cliente: ClienteItem) => {
    setSelectedCliente(cliente);
    setResetPassword(generarPasswordSegura());
    setResetModalError('');
    setCopiedKey(false);
    setShowResetModal(true);
  };

  // Enviar reset de contraseña
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente?.persona?.usuario?.id) return;

    if (!resetPassword.trim() || resetPassword.length < 6) {
      setResetModalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setActionLoading('reset');
      setResetModalError('');

      await api.resetPasswordUsuario(selectedCliente.persona.usuario.id, resetPassword);

      setFeedback({
        type: 'success',
        message: `Contraseña actualizada para ${selectedCliente.persona.usuario.username}.`,
      });
      setShowResetModal(false);
      await loadClientes();
    } catch (err: any) {
      setResetModalError(err.message || 'Error al actualizar contraseña.');
    } finally {
      setActionLoading(null);
    }
  };

  // Alternar Activo / Inactivo
  const handleToggleActivo = async (usuarioId: string) => {
    try {
      setActionLoading(usuarioId);
      await api.toggleActivoUsuario(usuarioId);
      await loadClientes();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al alternar estado de usuario.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Alternar 2FA
  const handleToggle2FA = async (usuarioId: string) => {
    try {
      setActionLoading(usuarioId);
      await api.toggle2FAUsuario(usuarioId);
      await loadClientes();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al alternar 2FA.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Copiar al portapapeles
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtrado de clientes
  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${c.persona.nombres} ${c.persona.apellidos}`.toLowerCase();
    const doc = (c.persona.numeroDocumento || '').toLowerCase();
    const email = (c.persona.correo || '').toLowerCase();
    const user = (c.persona.usuario?.username || '').toLowerCase();

    const matchesSearch = fullName.includes(term) || doc.includes(term) || email.includes(term) || user.includes(term);

    const hasAccount = !!c.persona.usuario;
    if (filterStatus === 'CON_ACCESO') return matchesSearch && hasAccount;
    if (filterStatus === 'SIN_ACCESO') return matchesSearch && !hasAccount;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* 1. Header con estadísticas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#10233f] tracking-tight flex items-center gap-3">
            <Lock className="w-8 h-8 text-[#caa344]" />
            Accesos de Clientes
          </h1>
          <p className="text-sm text-[#8d9aae] mt-1">
            Administración de credenciales, activación de cuentas y autenticación 2FA por correo.
          </p>
        </div>

        <button
          onClick={loadClientes}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] rounded-xl text-xs font-semibold text-[#17233a] hover:text-[#caa344] transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 2. Banner de Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border ${
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

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="bg-white border border-[#e7ebf1] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
        {/* Input Buscador */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#8d9aae] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cliente, DNI, correo o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-xs text-[#10233f] placeholder-[#8d9aae] focus:outline-none focus:border-[#caa344] transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'TODOS'
                ? 'bg-[#caa344] text-white shadow-xs'
                : 'bg-white text-[#8d9aae] hover:text-[#17233a] border border-[#e7ebf1]'
            }`}
          >
            Todos ({clientes.length})
          </button>
          <button
            onClick={() => setFilterStatus('CON_ACCESO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'CON_ACCESO'
                ? 'bg-[#caa344] text-white shadow-xs'
                : 'bg-white text-[#8d9aae] hover:text-[#17233a] border border-[#e7ebf1]'
            }`}
          >
            Con Acceso ({clientes.filter((c) => !!c.persona.usuario).length})
          </button>
          <button
            onClick={() => setFilterStatus('SIN_ACCESO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'SIN_ACCESO'
                ? 'bg-[#caa344] text-white shadow-xs'
                : 'bg-white text-[#8d9aae] hover:text-[#17233a] border border-[#e7ebf1]'
            }`}
          >
            Sin Cuenta ({clientes.filter((c) => !c.persona.usuario).length})
          </button>
        </div>
      </div>

      {/* 4. Tabla de Clientes y Accesos */}
      <div className="bg-white border border-[#e7ebf1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f8fb] text-[#8d9aae] uppercase tracking-wider font-semibold border-b border-[#e7ebf1]">
              <tr>
                <th className="py-4 px-6">Cliente / Documento</th>
                <th className="py-4 px-6">Correo Electrónico</th>
                <th className="py-4 px-6">Usuario del Sistema</th>
                <th className="py-4 px-6 text-center">2FA (Correo)</th>
                <th className="py-4 px-6 text-center">Estado Cuenta</th>
                <th className="py-4 px-6 text-center">Último Ingreso</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf1] text-[#17233a]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8d9aae]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#caa344]" />
                      <span>Cargando directorio de clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8d9aae]">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => {
                  const usuario = cliente.persona.usuario;
                  const isActionBusy = actionLoading === usuario?.id;

                  return (
                    <tr
                      key={cliente.id}
                      className="hover:bg-[#f7f8fb]/60 transition-colors group"
                    >
                      {/* Cliente */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#10233f] text-sm">
                          {cliente.persona.nombres} {cliente.persona.apellidos}
                        </div>
                        <div className="text-[#8d9aae] text-[11px] font-mono mt-0.5">
                          {cliente.persona.tipoDocumento}: {cliente.persona.numeroDocumento}
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-4 px-6 font-mono text-[#17233a]">
                        {cliente.persona.correo}
                      </td>

                      {/* Usuario / Rol */}
                      <td className="py-4 px-6">
                        {usuario ? (
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[#caa344]">
                              @{usuario.username}
                            </span>
                            <span className="text-[10px] text-[#8d9aae] uppercase tracking-widest font-semibold">
                              Rol: {usuario.rol?.nombre || 'cliente'}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#f7f8fb] text-[#8d9aae] border border-[#e7ebf1]">
                            <UserX className="w-3 h-3" />
                            Sin cuenta creada
                          </span>
                        )}
                      </td>

                      {/* 2FA (Correo) Toggle */}
                      <td className="py-4 px-6 text-center">
                        {usuario ? (
                          <button
                            onClick={() => handleToggle2FA(usuario.id)}
                            disabled={isActionBusy}
                            title="Haz clic para activar o desactivar 2FA"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                              usuario.requiere2FA
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-[#f7f8fb] border-[#e7ebf1] text-[#8d9aae]'
                            }`}
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${usuario.requiere2FA ? 'text-blue-600' : 'text-[#8d9aae]'}`} />
                            <span>{usuario.requiere2FA ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        ) : (
                          <span className="text-[#8d9aae] font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Estado Cuenta (Activo / Inactivo) Toggle */}
                      <td className="py-4 px-6 text-center">
                        {usuario ? (
                          <button
                            onClick={() => handleToggleActivo(usuario.id)}
                            disabled={isActionBusy}
                            title="Haz clic para activar o desactivar acceso"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                              usuario.activo
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            <span>{usuario.activo ? 'Habilitado' : 'Suspendido'}</span>
                          </button>
                        ) : (
                          <span className="text-[#8d9aae] font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Último Ingreso */}
                      <td className="py-4 px-6 text-center text-[#8d9aae] font-mono text-[11px]">
                        {usuario?.ultimoAcceso
                          ? new Date(usuario.ultimoAcceso).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : usuario
                          ? 'Nunca'
                          : '—'}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        {usuario ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenResetModal(cliente)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] hover:border-[#caa344] text-[#17233a] hover:text-[#caa344] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                              <span>Reset Clave</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenCreateModal(cliente)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#caa344] hover:bg-[#b8923a] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Crear Credenciales</span>
                          </button>
                        )}
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
      {/* 5. MODAL: CREAR CREDENCIALES DE CLIENTE                                    */}
      {/* ========================================================================= */}
      {showCreateModal && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-[#e7ebf1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center text-[#caa344]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10233f]">Crear Acceso a Cliente</h3>
                  <p className="text-xs text-[#8d9aae]">
                    {selectedCliente.persona.nombres} {selectedCliente.persona.apellidos}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#8d9aae] hover:text-[#17233a] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {createModalError}
                </div>
              )}

              {/* Nombre de Usuario */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#8d9aae] mb-1.5">
                  Nombre de Usuario (Username)
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-sm text-[#10233f] font-mono focus:outline-none focus:border-[#caa344]"
                  placeholder="ej. jorge.perez o 72481920"
                />
              </div>

              {/* Contraseña Inicial */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-[#8d9aae]">
                    Contraseña Inicial
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generarPasswordSegura())}
                    className="text-xs text-[#caa344] hover:text-[#b8923a] font-semibold cursor-pointer"
                  >
                    🎲 Generar Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl text-sm text-[#10233f] font-mono focus:outline-none focus:border-[#caa344]"
                    placeholder="Contraseña del cliente"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(newPassword)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#17233a] cursor-pointer"
                      title="Copiar contraseña"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#17233a] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkbox 2FA */}
              <div className="p-3 bg-[#f7f8fb] border border-[#e7ebf1] rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="requiere2fa"
                  checked={requiere2FA}
                  onChange={(e) => setRequiere2FA(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#caa344] focus:ring-[#caa344] border-[#e7ebf1]"
                />
                <label htmlFor="requiere2fa" className="text-xs text-[#17233a] cursor-pointer">
                  <strong className="block text-[#10233f]">Exigir autenticación 2FA por correo</strong>
                  Al iniciar sesión, se le enviará un código de verificación a{' '}
                  <span className="text-[#caa344] font-mono">{selectedCliente.persona.correo}</span>.
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] text-[#17233a] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="px-5 py-2 bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: RESTABLECER CONTRASEÑA                                          */}
      {/* ========================================================================= */}
      {showResetModal && selectedCliente?.persona?.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#e7ebf1] rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-[#e7ebf1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10233f]">Restablecer Contraseña</h3>
                  <p className="text-xs text-[#8d9aae]">
                    Usuario: @{selectedCliente.persona.usuario.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-[#8d9aae] hover:text-[#17233a] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {resetModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {resetModalError}
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-[#8d9aae]">
                    Nueva Contraseña
                  </label>
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
                      onClick={() => handleCopy(resetPassword)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#17233a] cursor-pointer"
                      title="Copiar contraseña"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-1.5 text-[#8d9aae] hover:text-[#17233a] cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#8d9aae]">
                Al restablecer la contraseña, se reiniciarán los intentos fallidos de acceso y se marcará la cuenta para solicitar cambio de contraseña en su próximo inicio de sesión.
              </p>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7ebf1]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f7f8fb] border border-[#e7ebf1] text-[#17233a] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'reset'}
                  className="px-5 py-2 bg-[#caa344] hover:bg-[#b8923a] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
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

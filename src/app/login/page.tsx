'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Llamar al endpoint de login
      const res = await api.login(username.trim(), password);
      
      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('tokenAuth', res.access_token);
      localStorage.setItem('userSession', JSON.stringify(res.user));

      // 2. Redireccionar según el rol
      if (res.user.rol === 'cliente') {
        // Para clientes, buscamos su Ficha Madre activa
        try {
          const clientes = await api.obtenerClientes();
          const cliente = clientes.find((c: any) => c.personaId === res.user.persona.id);
          
          if (!cliente) {
            throw new Error('No se encontró el registro de cliente asociado a tu cuenta.');
          }

          const detalle = await api.obtenerClienteDetalle(cliente.id);
          if (!detalle.fichaMadre) {
            throw new Error('No tienes un proceso de onboarding activo actualmente.');
          }

          // Guardamos datos del onboarding en localStorage
          localStorage.setItem('fichaMadreId', detalle.fichaMadre.id);
          localStorage.setItem('tokenAcceso', 'auth_session'); // Indicador de que entra autenticado

          // Redirigir a su onboarding usando un token virtual 'session'
          router.push(`/onboarding/session`);
        } catch (err: any) {
          localStorage.clear();
          throw new Error(err.message || 'Error al cargar tu expediente de onboarding.');
        }
      } else {
        // Para roles administrativos (admin, operador, analista)
        router.push('/admin');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Credenciales incorrectas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#061325] text-white overflow-hidden font-sans">
      {/* Luces y degradados de fondo inspirados en el Azul de Afinitive */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md px-6 z-10">
        {/* Cabecera con Logotipo e imagen institucional */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-36 h-36 rounded-full bg-[#0a1c36] border border-[#162e50] shadow-2xl p-4 mb-4 transition-transform hover:scale-105 duration-300">
            <Image
              src="/logo.jpg"
              alt="Afinitive Logo"
              width={140}
              height={140}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Afinitive
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Plataforma de Onboarding e Inversiones
          </p>
        </div>

        {/* Formulario de Login (Glassmorphism de alta calidad) */}
        <div className="backdrop-blur-md bg-[#0a1c36]/40 border border-[#162e50] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Usuario / Identificación
              </label>
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-neutral-600 text-sm font-medium"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Contraseña
                </label>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-neutral-600 text-sm font-medium"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:pointer-events-none group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mi cuenta</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-xs text-neutral-500 space-y-1">
          <div>Afinitive &copy; {new Date().getFullYear()}. Todos los derechos reservados.</div>
          <div className="text-neutral-600">Acceso protegido mediante encriptación SSL/TLS de extremo a extremo.</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function OnboardingLoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Por favor, ingresa tu token de acceso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validamos el token con el backend
      const res = await api.validarToken(token.trim());
      
      // Guardamos la fichaMadreId y el token en localStorage para persistencia
      localStorage.setItem('fichaMadreId', res.fichaMadreId);
      localStorage.setItem('tokenAcceso', res.token);
      
      // Redirigimos a la página de onboarding con el token
      router.push(`/onboarding/${res.token}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'El token ingresado no es válido, ya expiró o fue usado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-neutral-950 overflow-hidden text-neutral-100 font-sans">
      {/* Círculos de luz de fondo para efecto inmersivo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-6 z-10">
        {/* Cabecera / Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-4 transition-transform hover:scale-105 duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Afinitive Onboarding
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Ingresa tu clave de acceso seguro para continuar tu proceso
          </p>
        </div>

        {/* Tarjeta de Login (Glassmorphism) */}
        <div className="backdrop-blur-md bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-neutral-300 mb-2">
                Token de Acceso Seguro
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  placeholder="Introduce tu token aquí..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-neutral-100 placeholder-neutral-600 text-sm font-mono"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                El token te fue enviado por correo electrónico por tu asesor de Afinitive.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 disabled:opacity-55 disabled:pointer-events-none group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Onboarding</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-xs text-neutral-600">
          Afinitive &copy; {new Date().getFullYear()}. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}

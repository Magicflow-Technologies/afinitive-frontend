'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    const token = localStorage.getItem('tokenAuth');

    if (!session || !token) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(session);
      // Validar que el rol tenga acceso administrativo
      if (!['admin', 'operador', 'analista'].includes(parsed.rol)) {
        router.push('/login');
        return;
      }
      setUser(parsed);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('tokenAuth');
    localStorage.removeItem('fichaMadreId');
    localStorage.removeItem('tokenAcceso');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#061325] text-white font-sans">
        <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-neutral-400">Verificando credenciales...</p>
      </div>
    );
  }

  const navLinks = [
    {
      name: 'Panel Principal',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path>
        </svg>
      ),
    },
    {
      name: 'Expedientes / Clientes',
      path: '/admin/expedientes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-[#050e1b] text-neutral-200 font-sans overflow-hidden">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-[#162e50] bg-[#061325] flex flex-col justify-between p-6 shrink-0 z-20">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border border-[#162e50] overflow-hidden bg-[#0a1c36] p-1 flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt="Afinitive"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <span className="block text-sm font-bold text-white tracking-wider uppercase">Afinitive</span>
              <span className="block text-[10px] text-neutral-500 uppercase tracking-widest font-semibold font-mono">
                {user?.rol} panel
              </span>
            </div>
          </div>

          {/* Menú Links */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/admin' && pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all border text-sm ${
                    isActive
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-semibold shadow-inner'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0a1c36]/30'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-4 pt-6 border-t border-[#162e50]/60">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 uppercase">
              {user?.persona?.nombres[0] || 'U'}
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-white truncate">
                {user?.persona?.nombres} {user?.persona?.apellidos}
              </span>
              <span className="block text-xs text-neutral-500 truncate">
                {user?.persona?.correo}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-900/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-xs font-semibold tracking-wide uppercase transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#050e1b] relative">
        {/* Lights & Blobs background */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

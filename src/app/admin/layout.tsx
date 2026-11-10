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
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#f7f8fb] text-[#10233f] font-sans">
        <svg className="animate-spin h-8 w-8 text-[#caa344] mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-[#8d9aae]">Verificando credenciales...</p>
      </div>
    );
  }

  const isAdmin = user?.rol?.toLowerCase() === 'admin';

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
      name: 'Expedientes / Onboarding',
      path: '/admin/expedientes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      ),
    },
    {
      name: 'Accesos de Clientes',
      path: '/admin/accesos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      ),
    },
    ...(isAdmin
      ? [
          {
            name: 'Catálogo de Fideicomisos',
            path: '/admin/fideicomisos',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            ),
          },
          {
            name: 'Usuarios del Sistema',
            path: '/admin/usuarios',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen bg-[#f7f8fb] text-[#17233a] font-sans overflow-hidden">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-[#e7ebf1] bg-white flex flex-col justify-between p-6 shrink-0 z-20 shadow-sm">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border border-[#e7ebf1] overflow-hidden bg-[#f7f8fb] p-1 flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt="Afinitive"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <span className="block text-sm font-bold text-[#10233f] tracking-wider uppercase">Afinitive</span>
              <span className="block text-[10px] text-[#8d9aae] uppercase tracking-widest font-semibold font-mono">
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all border text-sm cursor-pointer ${
                    isActive
                      ? 'bg-[#caa344]/10 border-[#caa344]/40 text-[#caa344] font-bold shadow-xs'
                      : 'border-transparent text-[#8d9aae] hover:text-[#17233a] hover:bg-[#f7f8fb]'
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
        <div className="space-y-4 pt-6 border-t border-[#e7ebf1]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#caa344]/15 border border-[#caa344]/30 flex items-center justify-center font-bold text-[#caa344] uppercase text-sm">
              {user?.persona?.nombres[0] || 'U'}
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-[#10233f] truncate">
                {user?.persona?.nombres} {user?.persona?.apellidos}
              </span>
              <span className="block text-xs text-[#8d9aae] truncate">
                {user?.persona?.correo}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f8fb] relative">
        <div className="flex-1 overflow-y-auto p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

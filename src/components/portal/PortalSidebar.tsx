'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PieChart,
  Wallet,
  Landmark,
  Phone,
  Mail,
  LogOut,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const menuItems: MenuItem[] = [
  { label: 'Visión General', icon: PieChart, href: '/portal' },
  { label: 'Portafolio Activo', icon: Wallet, href: '/portal/portafolio' },
  { label: 'Bóveda Fiscal y Pagos', icon: Landmark, href: '/portal/boveda-fiscal' },
];

export default function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <aside className="w-72 flex flex-col justify-between pb-8 pt-12 px-8 border-r border-gray-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.015)] shrink-0 z-10">
      <div>
        {/* Brand Header */}
        <div className="mb-16">
          <h1 className="text-2xl font-bold tracking-widest text-black mb-1 font-serif">
            AFINITIVE
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A84C] font-bold">
            Wealth Management
          </p>
        </div>

        {/* Navegación */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4 mt-8">
            Navegación
          </p>
          {menuItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center px-4 py-3.5 text-left transition-all duration-300 rounded-r-lg ${
                  active
                    ? 'text-[#C9A84C] font-medium border-l-2 border-[#C9A84C] bg-gray-50/50'
                    : 'text-gray-400 hover:text-black border-l-2 border-transparent hover:bg-gray-50/30'
                }`}
              >
                <item.icon size={16} className="mr-4 shrink-0" />
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Concierge Desk & Sesión */}
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">
            Concierge Desk
          </p>
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            {/* Wealth Advisor */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Wealth Advisor</p>
                <p className="text-sm font-semibold text-black">Ricardo Bertalmio</p>
              </div>
              <a
                href="tel:+51987654321"
                title="Llamar a Wealth Advisor"
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#C9A84C] shadow-sm hover:scale-105 transition-transform border border-gray-100"
              >
                <Phone size={13} />
              </a>
            </div>

            {/* Operaciones */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Operaciones</p>
                <p className="text-sm font-semibold text-black">Irina Portillo</p>
              </div>
              <a
                href="mailto:operaciones@afinitive.com"
                title="Enviar correo a Operaciones"
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm hover:text-black hover:scale-105 transition-all border border-gray-100"
              >
                <Mail size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 text-xs text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
        >
          <LogOut size={14} className="mr-2" />
          <span>Cerrar sesión segura</span>
        </button>
      </div>
    </aside>
  );
}

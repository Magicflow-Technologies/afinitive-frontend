import React from 'react';
import PortalSidebar from '@/components/portal/PortalSidebar';
import PortalHeader from '@/components/portal/PortalHeader';
import { PortalProvider } from '@/app/features/portal/context/PortalContext';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAFA] text-black selection:bg-[#C9A84C] selection:text-white">
        {/* Sidebar Minimalista */}
        <PortalSidebar />

        {/* Contenido Principal con Scroll suave */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-12 lg:p-16">
            {/* Header Común */}
            <PortalHeader />

            {/* Vista seleccionada por ruta */}
            <div className="fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </PortalProvider>
  );
}

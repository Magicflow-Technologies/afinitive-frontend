'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function PortfolioTable() {
  const { data, loading, totalInvestedUSD, totalInvestedPEN } = usePortal();

  const inversiones = data?.inversiones || [];

  const formattedTotalUSD = totalInvestedUSD.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTotalPEN = totalInvestedPEN.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-16 bg-gray-100 rounded animate-pulse" />
        <div className="h-16 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-10">
        <h3 className="text-xs font-bold text-black uppercase tracking-widest">
          Estructuras Fiduciarias
        </h3>
        <span className="text-xs text-gray-400 font-medium">
          {inversiones.length} {inversiones.length === 1 ? 'Vehículo activo' : 'Vehículos activos'}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Proyecto / Vehículo
              </th>
              <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Gestor Fiduciario
              </th>
              <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Tasa Anual
              </th>
              <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Vencimiento
              </th>
              <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                Capital / Moneda
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {inversiones.length > 0 ? (
              inversiones.map((inv) => {
                const montoNum = Number(inv.monto) || 0;
                const formattedMonto = montoNum.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const monedaStr = (inv.moneda || 'USD').toUpperCase();
                const isPen = monedaStr === 'PEN';

                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-6">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-black">
                          Fideicomiso {inv.fideicomisoNombre}
                        </p>
                        {inv.enlaceCronograma && (
                          <a
                            href={inv.enlaceCronograma}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir Cronograma Oficial"
                            className="text-gray-400 hover:text-[#C9A84C] transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {inv.patrimonioNombreLargo || 'Bono Titulizado Inmobiliario'}
                      </p>
                    </td>

                    <td className="py-6 text-sm text-gray-500">
                      {inv.emisorFiduciario || 'Coril / Corfid'}
                    </td>

                    <td className="py-6 text-sm font-medium text-black text-center bg-gray-50/30 group-hover:bg-white">
                      {inv.tasaInteres || '10.00%'}
                    </td>

                    <td className="py-6 text-sm text-gray-500 text-center">
                      {inv.vencimiento || '28/01/2027'}
                    </td>

                    <td className="py-6 text-right">
                      <div className="flex items-baseline justify-end space-x-1.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isPen ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                          {monedaStr}
                        </span>
                        <span className="text-lg font-medium text-black">
                          {formattedMonto}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              /* Demostración si aún no tiene inversiones */
              <>
                <tr className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-6">
                    <p className="font-semibold text-black">Fideicomiso URBANIZA</p>
                    <p className="text-xs text-gray-400 mt-1">Bono Titulizado Inmobiliario</p>
                  </td>
                  <td className="py-6 text-sm text-gray-500">Coril / Corfid</td>
                  <td className="py-6 text-sm font-medium text-black text-center bg-gray-50/30 group-hover:bg-white">10.00%</td>
                  <td className="py-6 text-sm text-gray-500 text-center">28/01/2027</td>
                  <td className="py-6 text-lg font-medium text-black text-right">
                    <span className="text-xs text-gray-400 mr-1.5">USD</span>150,000.00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-6">
                    <p className="font-semibold text-black">Fideicomiso GRAZZIA</p>
                    <p className="text-xs text-gray-400 mt-1">Bono Titulizado Inmobiliario</p>
                  </td>
                  <td className="py-6 text-sm text-gray-500">Coril / Corfid</td>
                  <td className="py-6 text-sm font-medium text-black text-center bg-gray-50/30 group-hover:bg-white">9.00%</td>
                  <td className="py-6 text-sm text-gray-500 text-center">27/02/2027</td>
                  <td className="py-6 text-lg font-medium text-black text-right">
                    <span className="text-xs text-gray-400 mr-1.5">USD</span>70,000.00
                  </td>
                </tr>
              </>
            )}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-black">
              <td colSpan={3} className="py-6 text-[11px] font-bold text-black uppercase tracking-widest">
                Exposición Total Fiduciaria
              </td>
              <td colSpan={2} className="py-6 text-right">
                {inversiones.length > 0 ? (
                  <div className="flex flex-col items-end">
                    {totalInvestedUSD > 0 && (
                      <div className="text-2xl font-light text-black">
                        <span className="text-base text-gray-400 font-normal mr-1.5">USD</span>
                        {formattedTotalUSD}
                      </div>
                    )}
                    {totalInvestedPEN > 0 && (
                      <div className="text-xl font-light text-gray-800 mt-0.5">
                        <span className="text-xs text-[#C9A84C] font-semibold mr-1.5">PEN</span>
                        {formattedTotalPEN}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-light text-black">$ 220,000.00</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

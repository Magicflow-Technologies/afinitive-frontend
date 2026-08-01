'use client';

import { useState, useEffect } from 'react';
import { CampoFormulario, RespuestaCampo } from '@/services/api';
import { formatTitleCase, shouldFormatTextValue } from '@/lib/formatters';

interface FormularioDinamicoProps {
  campos: CampoFormulario[];
  respuestasIniciales?: RespuestaCampo[];
  onSubmit: (valores: Array<{ campoFormularioId: string; valor: string }>) => Promise<void>;
  onBack?: () => void;
  loading: boolean;
}

export default function FormularioDinamico({
  campos,
  respuestasIniciales = [],
  onSubmit,
  onBack,
  loading,
}: FormularioDinamicoProps) {
  // Estado local para los valores del formulario
  const [formData, setFormData] = useState<Record<string, string>>({});
  // Estado para los errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar respuestas iniciales al montar o cambiar los campos
  useEffect(() => {
    const iniciales: Record<string, string> = {};
    campos.forEach((campo) => {
      // 1. Buscar en las respuestas guardadas
      const respGuardada = respuestasIniciales.find((r) => r.campoFormularioId === campo.id);
      if (respGuardada) {
        iniciales[campo.id] = respGuardada.valor;
      } else {
        // 2. Si no hay respuesta, usar el valor por defecto
        iniciales[campo.id] = campo.valorPorDefecto || '';
      }
    });
    setFormData(iniciales);
    setErrors({});
  }, [campos, respuestasIniciales]);

  // Manejador del cambio de valor en un input
  const handleChange = (campoId: string, valor: string) => {
    setFormData((prev) => ({ ...prev, [campoId]: valor }));
    // Limpiar error al escribir
    if (errors[campoId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[campoId];
        return copy;
      });
    }
  };

  const handleFormattedChange = (campo: CampoFormulario, valor: string) => {
    handleChange(campo.id, valor);
  };

  const handleFormattedBlur = (campo: CampoFormulario, valor: string) => {
    if (shouldFormatTextValue(campo.tipo)) {
      handleChange(campo.id, formatTitleCase(valor));
    }
  };

  // Validar todos los campos del formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    campos.forEach((campo) => {
      const valor = (formData[campo.id] || '').trim();

      // 1. Requerido
      if (campo.obligatorio && !valor) {
        nuevosErrores[campo.id] = 'Este campo es obligatorio.';
        return;
      }

      if (valor) {
        // 2. Tipo Email
        if (campo.tipo === 'EMAIL') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(valor)) {
            nuevosErrores[campo.id] = 'Ingresa un correo electrónico válido.';
          }
        }

        // 3. Min/Max Length
        if (campo.minLength && valor.length < campo.minLength) {
          nuevosErrores[campo.id] = `Debe tener al menos ${campo.minLength} caracteres.`;
        }
        if (campo.maxLength && valor.length > campo.maxLength) {
          nuevosErrores[campo.id] = `No debe exceder los ${campo.maxLength} caracteres.`;
        }

        // 4. Expresión regular personalizada
        if (campo.patronValidacion) {
          try {
            const regex = new RegExp(campo.patronValidacion);
            if (!regex.test(valor)) {
              nuevosErrores[campo.id] = 'El formato ingresado no es válido.';
            }
          } catch (e) {
            console.error('Patrón de validación incorrecto para el campo:', campo.nombre);
          }
        }
      }
    });

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validarFormulario()) {
      const payload = campos.map((campo) => {
        const valor = formData[campo.id] || '';
        return {
          campoFormularioId: campo.id,
          valor: shouldFormatTextValue(campo.tipo) ? formatTitleCase(valor) : valor,
        };
      });
      onSubmit(payload);
    }
  };

  // Parsear opciones de select/multiselect
  const parseOpciones = (opciones: any): string[] => {
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    if (typeof opciones === 'string') {
      try {
        const parsed = JSON.parse(opciones);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Si no es un JSON válido, separar por comas como fallback
        return opciones.split(',').map((o) => o.trim());
      }
    }
    return [];
  };

  // Renderizar un input específico según el TipoCampo
  const renderInput = (campo: CampoFormulario) => {
    const valor = formData[campo.id] || '';
    const hasError = !!errors[campo.id];
    const inputBaseClass = `w-full px-4 py-3 bg-neutral-900 border ${
      hasError ? 'border-red-500/70 focus:ring-red-500' : 'border-neutral-800 focus:border-violet-500 focus:ring-violet-500'
    } rounded-xl focus:outline-none focus:ring-1 transition-all text-neutral-100 placeholder-neutral-600 text-sm`;

    switch (campo.tipo) {
      case 'TEXTAREA':
        return (
          <textarea
            id={campo.id}
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            onBlur={(e) => handleFormattedBlur(campo, e.target.value)}
            placeholder={campo.placeholder || ''}
            className={`${inputBaseClass} min-h-[100px] resize-y`}
            disabled={loading}
          />
        );

      case 'SELECT': {
        const opciones = parseOpciones(campo.opciones);
        return (
          <select
            id={campo.id}
            value={valor}
            onChange={(e) => handleChange(campo.id, e.target.value)}
            className={`${inputBaseClass} appearance-none cursor-pointer`}
            disabled={loading}
          >
            <option value="">Selecciona una opción...</option>
            {opciones.map((opc, idx) => (
              <option key={idx} value={opc}>
                {opc}
              </option>
            ))}
          </select>
        );
      }

      case 'MULTISELECT': {
        const opciones = parseOpciones(campo.opciones);
        const seleccionadas = valor ? valor.split(',').map((v) => v.trim()) : [];
        
        const toggleOpcion = (opc: string) => {
          let nuevasSelecciones;
          if (seleccionadas.includes(opc)) {
            nuevasSelecciones = seleccionadas.filter((s) => s !== opc);
          } else {
            nuevasSelecciones = [...seleccionadas, opc];
          }
          handleChange(campo.id, nuevasSelecciones.join(', '));
        };

        return (
          <div className="flex flex-wrap gap-2 p-1">
            {opciones.map((opc, idx) => {
              const active = seleccionadas.includes(opc);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleOpcion(opc)}
                  disabled={loading}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {opc}
                </button>
              );
            })}
          </div>
        );
      }

      case 'CHECKBOX':
        return (
          <div className="flex items-center gap-3 py-1">
            <input
              id={campo.id}
              type="checkbox"
              checked={valor === 'true'}
              onChange={(e) => handleChange(campo.id, e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 rounded border-neutral-800 bg-neutral-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-neutral-950 focus:ring-2 transition-all cursor-pointer accent-violet-600"
              disabled={loading}
            />
            <label htmlFor={campo.id} className="text-sm text-neutral-300 cursor-pointer select-none">
              {campo.placeholder || 'Acepto los términos'}
            </label>
          </div>
        );

      case 'FECHA':
        return (
          <input
            id={campo.id}
            type="date"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            className={inputBaseClass}
            disabled={loading}
          />
        );

      case 'NUMERO':
        return (
          <input
            id={campo.id}
            type="number"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            onBlur={(e) => handleFormattedBlur(campo, e.target.value)}
            placeholder={campo.placeholder || ''}
            className={inputBaseClass}
            disabled={loading}
          />
        );

      case 'MONEDA':
        return (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 text-sm">
              $
            </div>
          <input
            id={campo.id}
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            onBlur={(e) => handleFormattedBlur(campo, e.target.value)}
            placeholder={campo.placeholder || '0.00'}
            className={`${inputBaseClass} pl-9`}
            disabled={loading}
            />
          </div>
        );

      case 'EMAIL':
        return (
          <input
            id={campo.id}
            type="email"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            placeholder={campo.placeholder || 'correo@ejemplo.com'}
            className={inputBaseClass}
            disabled={loading}
          />
        );

      case 'TELEFONO':
        return (
          <input
            id={campo.id}
            type="tel"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            placeholder={campo.placeholder || '+51 999 999 999'}
            className={inputBaseClass}
            disabled={loading}
          />
        );

      case 'TEXTO':
      default:
        return (
          <input
            id={campo.id}
            type="text"
            value={valor}
            onChange={(e) => handleFormattedChange(campo, e.target.value)}
            onBlur={(e) => handleFormattedBlur(campo, e.target.value)}
            placeholder={campo.placeholder || ''}
            className={inputBaseClass}
            disabled={loading}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        {campos.map((campo) => (
          <div key={campo.id} className="space-y-2">
            <label htmlFor={campo.id} className="flex items-center gap-1 text-sm font-medium text-neutral-300">
              {campo.etiqueta}
              {campo.obligatorio && <span className="text-red-500 font-bold">*</span>}
            </label>
            
            {renderInput(campo)}

            {campo.helpText && !errors[campo.id] && (
              <p className="text-xs text-neutral-500 pl-1">{campo.helpText}</p>
            )}

            {errors[campo.id] && (
              <p className="text-xs text-red-400 pl-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                {errors[campo.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-neutral-900 gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all font-medium text-sm disabled:opacity-40"
          >
            Atrás
          </button>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] transition-all text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-55"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span>Guardar y Continuar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

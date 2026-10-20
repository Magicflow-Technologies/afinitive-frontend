"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/services/api";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Estados para el flujo de 2FA
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [challengeToken, setChallengeToken] = useState("");
  const [destino, setDestino] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Temporizador para el reenvío de OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Procesa la redirección y almacenamiento de sesión tras autenticación exitosa
   */
  const handleSuccessfulAuth = async (res: { access_token: string; user: any }) => {
    localStorage.setItem("tokenAuth", res.access_token);
    localStorage.setItem("userSession", JSON.stringify(res.user));

    if (res.user.rol === "cliente") {
      try {
        const clientes = await api.obtenerClientes();
        const cliente = clientes.find(
          (c: any) => c.personaId === res.user.persona.id,
        );

        if (!cliente) {
          throw new Error("No se encontró el registro de cliente asociado a tu cuenta.");
        }

        const detalle = await api.obtenerClienteDetalle(cliente.id);
        if (!detalle.fichaMadre) {
          throw new Error("No tienes un proceso de onboarding activo actualmente.");
        }

        localStorage.setItem("fichaMadreId", detalle.fichaMadre.id);
        localStorage.setItem("tokenAcceso", "auth_session");
        router.push(`/onboarding/session`);
      } catch (err: any) {
        localStorage.clear();
        throw new Error(err.message || "Error al cargar tu expediente de onboarding.");
      }
    } else {
      router.push("/admin");
    }
  };

  // 1. Paso 1: Envío de usuario y contraseña
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.login(username.trim(), password);

      // Si el backend solicita 2FA
      if (res.requires2FA) {
        setChallengeToken(res.challengeToken);
        setDestino(res.destino);
        setStep("2fa");
        setCooldown(60); // 60 segundos antes de permitir reenviar
        setOtpError("");
      } else {
        // Acceso directo sin 2FA
        await handleSuccessfulAuth(res);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Credenciales incorrectas o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Paso 2: Verificación del código 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setOtpError("Por favor, ingresa los 6 dígitos del código de verificación.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    setResendSuccess("");

    try {
      const res = await api.verify2FA(challengeToken, cleanCode);
      await handleSuccessfulAuth(res);
    } catch (err: any) {
      console.error(err);
      setOtpError(err.message || "Código incorrecto o expirado.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Reenviar código OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    setOtpError("");
    setResendSuccess("");

    try {
      const res = await api.resend2FA(challengeToken);
      setResendSuccess(res.message || "Nuevo código enviado a tu correo.");
      setCooldown(60);
      setOtpCode("");
    } catch (err: any) {
      setOtpError(err.message || "Error al reenviar el código.");
    } finally {
      setOtpLoading(false);
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

        {/* CONTENEDOR PRINCIPAL */}
        <div className="backdrop-blur-md bg-[#0a1c36]/40 border border-[#162e50] rounded-3xl p-8 shadow-2xl transition-all duration-300">
          {step === "credentials" ? (
            /* ============================================================ */
            /* PASO 1: FORMULARIO DE CREDENCIALES                           */
            /* ============================================================ */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2"
                >
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
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Contraseña
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-neutral-600 text-sm font-medium"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute right-3 cursor-pointer text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
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
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a mi cuenta</span>
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      ></path>
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ============================================================ */
            /* PASO 2: VERIFICACIÓN 2FA (CÓDIGO POR CORREO)                 */
            /* ============================================================ */
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Verificación de Seguridad</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Hemos enviado un código numérico de 6 dígitos a:
                </p>
                <p className="text-sm font-semibold text-blue-400 font-mono mt-0.5">
                  {destino}
                </p>
              </div>

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-center text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3"
                >
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); // Solo números
                      setOtpCode(val);
                    }}
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-3.5 px-4 bg-[#050e1b] border border-[#162e50] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-neutral-700 transition-all font-bold"
                    disabled={otpLoading}
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {otpError && (
                <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  <span>{otpError}</span>
                </div>
              )}

              {resendSuccess && (
                <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 text-center">
                  {resendSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Validando código...</span>
                  </>
                ) : (
                  <span>Validar e Ingresar</span>
                )}
              </button>

              {/* Botón de reenvío y volver */}
              <div className="flex items-center justify-between pt-2 border-t border-[#162e50]/40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtpCode("");
                    setOtpError("");
                    setResendSuccess("");
                  }}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || otpLoading}
                  className="text-blue-400 hover:text-blue-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  {cooldown > 0 ? (
                    <span>Reenviar en {cooldown}s</span>
                  ) : (
                    <span>¿No te llegó? Reenviar</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-xs text-neutral-500 space-y-1">
          <div>
            Afinitive &copy; {new Date().getFullYear()}. Todos los derechos reservados.
          </div>
          <div className="text-neutral-600">
            Acceso protegido con autenticación de dos factores (2FA).
          </div>
        </div>
      </div>
    </div>
  );
}

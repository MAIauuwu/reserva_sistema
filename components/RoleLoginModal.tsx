"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, GraduationCap, UserRound, X } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client-config";

type Props = {
  onClose: () => void;
  onGoToRegister: () => void;
  onAuthenticated?: (email: string) => void;
};

const roles = [
  { id: "estudiante", label: "Estudiante", icon: UserRound },
  { id: "profesor", label: "Profesor", icon: GraduationCap },
];

export function RoleLoginModal({
  onClose,
  onGoToRegister,
  onAuthenticated,
}: Props) {
  const [activeRole, setActiveRole] = useState(roles[0].id);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const badge = useMemo(() => {
    if (!message) return "";
    return message.startsWith("✅") ? "text-green-600" : "text-action-danger";
  }, [message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setMessage("Completa correo y contraseña para continuar.");
      return;
    }
    try {
      setLoading(true);
      const credentials = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      setMessage(`✅ Sesión iniciada como ${activeRole}.`);
      onAuthenticated?.(credentials.user.email ?? "");
    } catch (error) {
      console.error("Error al iniciar sesión", error);
      if (error instanceof FirebaseError) {
        if (error.code === "auth/invalid-credential") {
          setMessage("❌ Credenciales inválidas. Verifica tu correo o clave.");
          return;
        }
        if (error.code === "auth/user-not-found") {
          setMessage("❌ No encontramos una cuenta con ese correo.");
          return;
        }
      }
      setMessage("❌ No pudimos iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="glass-card pastel-border relative w-full max-w-lg rounded-3xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-pastel-accent p-2 text-pastel-dark hover:bg-pastel-primary"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-3 text-center">
          <div className="mx-auto rounded-full bg-pastel-accent p-3 text-pastel-dark">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-pastel-dark">
            Accede a tus clases
          </h2>
          <p className="text-sm text-gray-600">
            Elige tu rol y usa tus credenciales para continuar.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                activeRole === role.id
                  ? "border-pastel-primary bg-pastel-highlight text-pastel-dark"
                  : "border-transparent bg-white/80 text-gray-500 hover:border-pastel-primary/40"
              }`}
            >
              <role.icon className="mb-2 h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {role.label}
              </span>
              <p className="text-xs text-gray-500">
                {role.id === "estudiante"
                  ? "Ve tus reservas confirmadas."
                  : "Gestiona horarios y aprobaciones."}
              </p>
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pastel-dark">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-2xl border border-pastel-primary/40 bg-white/80 p-3 text-sm text-pastel-dark placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
              placeholder="alumno@tuacademia.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pastel-dark">
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="w-full rounded-2xl border border-pastel-primary/40 bg-white/80 p-3 text-sm text-pastel-dark placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pastel-primary py-3 font-semibold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-60"
          >
            {loading ? "Validando..." : `Ingresar como ${activeRole}`}
          </button>
          <button
            type="button"
            onClick={onGoToRegister}
            className="w-full rounded-full border border-pastel-primary/60 py-3 text-sm font-semibold text-pastel-dark transition hover:bg-white"
          >
            ¿Sin cuenta? Regístrate primero
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${badge}`}>{message}</p>
        )}
      </div>
    </div>
  );
}


"use client";

import { FormEvent, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/firebase/client-config";

type Props = {
  onSuccess?: (email: string, role: string) => void;
};

const initialForm = {
  name: "",
  email: "",
  phone: "",
  avatar: "",
  role: "estudiante",
  password: "",
};

export function ClientRegistration({ onSuccess }: Props) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.name || !form.email) {
      setFeedback("Completa nombre y correo para continuar.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setFeedback("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const registeredEmail = form.email;
      const selectedRole = form.role;

      const credentials = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (form.name || form.avatar) {
        await updateProfile(credentials.user, {
          displayName: form.name || undefined,
          photoURL: form.avatar || undefined,
        });
      }

      const { password, ...profileData } = form;

      await addDoc(collection(db, "clientes"), {
        ...profileData,
        uid: credentials.user.uid,
        createdAt: new Date(),
      });

      try {
        await fetch("/api/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registeredEmail,
            name: form.name,
            role: selectedRole,
          }),
        });
      } catch (welcomeError) {
        console.warn("No se pudo enviar el correo de bienvenida:", welcomeError);
      }

      setFeedback("✅ Registro exitoso. Revisa tu correo para ingresar.");
      setForm(initialForm);
      onSuccess?.(registeredEmail, selectedRole);
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          setFeedback("❌ Este correo ya tiene una cuenta activa.");
          return;
        }
        if (error.code === "auth/weak-password") {
          setFeedback("❌ La contraseña es demasiado débil.");
          return;
        }
      }
      setFeedback("❌ No se pudo registrar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="registro"
      className="glass-card pastel-border rounded-2xl p-6 shadow-xl space-y-4"
    >
      <h3 className="text-2xl font-bold text-pastel-dark">
        Crea tu cuenta y gestiona tus reservas
      </h3>
      <p className="text-sm text-gray-600">
        Guarda tus datos para acceder a tus clases confirmadas cuando quieras.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-pastel-dark">
            Nombre completo
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
            placeholder="Jane Doe"
          />
        </div>
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
            className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
            placeholder="tu@email.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-pastel-dark">
            Crea una contraseña
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-pastel-dark">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
            placeholder="+54 9 11 2222 3333"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-pastel-dark">
            Rol del usuario
          </label>
          <div className="flex gap-3">
            {["estudiante", "profesor"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role }))}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                  form.role === role
                    ? "border-pastel-primary bg-pastel-highlight text-pastel-dark"
                    : "border-pastel-primary/30 bg-white/70 text-gray-500 hover:border-pastel-primary/60"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-pastel-dark">
            Foto de perfil (opcional)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-pastel-primary/40 px-6 py-4 text-center text-xs text-gray-500 hover:border-pastel-primary">
              <span className="font-semibold text-pastel-dark">
                Subir imagen
              </span>
              <span>JPG o PNG (máx. 1MB)</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    setFeedback("❌ La imagen debe pesar menos de 1MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setForm((prev) => ({
                      ...prev,
                      avatar: typeof reader.result === "string" ? reader.result : "",
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Previsualización"
                className="h-16 w-16 rounded-full border border-pastel-primary object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full border border-dashed border-pastel-primary/50 text-center text-[10px] text-gray-400 flex items-center justify-center">
                Sin foto
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-pastel-primary py-3 font-semibold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Registrarme"}
        </button>
      </form>

      {feedback && (
        <p
          className={`text-sm ${
            feedback.startsWith("✅") ? "text-green-600" : "text-action-danger"
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}


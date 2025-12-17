"use client";

import { useState, useEffect } from "react";
import { FormEvent } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client-config";
import { Calendar, Users, LayoutDashboard, X, Sparkles, DollarSign } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

type Props = {
  user: FirebaseUser;
};

type Slot = {
  id: string;
  date: string;
  maxStudents: number;
  currentStudents: number;
  students: string[];
  professorEmail: string;
  professorName: string;
  status: "open" | "full" | "closed";
  createdAt: Date;
  price: number;
  description: string;
  allowedModalities: string[];
};

export function ProfessorDashboard({ user }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    maxStudents: 1,
    price: 15000,
    description: "",
    allowedModalities: ["online"] as string[]
  });

  useEffect(() => {
    const slotsQuery = query(
      collection(db, "cupos"),
      where("professorEmail", "==", user.email)
    );

    const unsubscribe = onSnapshot(slotsQuery, (snapshot) => {
      const slotsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          maxStudents: data.maxStudents || 10,
          currentStudents: data.students?.length || 0,
          students: data.students || [],
          professorEmail: data.professorEmail,
          professorName: data.professorName,
          status:
            data.students?.length >= (data.maxStudents || 10)
              ? "full"
              : data.status || "open",
          createdAt: data.createdAt?.toDate() || new Date(),
          price: data.price || 0,
          description: data.description || "",
          allowedModalities: data.allowedModalities || ["online"]
        } as Slot;
      });
      setSlots(slotsData.sort((a, b) => a.date.localeCompare(b.date)));
    });

    return () => unsubscribe();
  }, [user.email]);

  const handleCreateSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!formData.date) {
      setMessage("❌ Selecciona una fecha y hora.");
      return;
    }
    if (formData.allowedModalities.length === 0) {
      setMessage("❌ Selecciona al menos una modalidad.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "cupos"), {
        date: formData.date,
        maxStudents: formData.maxStudents,
        price: Number(formData.price),
        description: formData.description || "Clase particular",
        allowedModalities: formData.allowedModalities,
        students: [],
        professorEmail: user.email,
        professorName: user.displayName || user.email?.split("@")[0] || "Profesor",
        status: "open",
        createdAt: new Date(),
      });

      setMessage("✅ Cupo creado exitosamente con precio y detalles.");
      // Reset form but keep defaults
      setFormData({
        date: "",
        maxStudents: 1,
        price: 15000,
        description: "",
        allowedModalities: ["online"]
      });
    } catch (error) {
      console.error("Error al crear cupo:", error);
      setMessage("❌ No se pudo crear el cupo. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSlot = async (slotId: string) => {
    try {
      await updateDoc(doc(db, "cupos", slotId), {
        status: "closed",
      });
      setMessage("✅ Cupo cerrado.");
    } catch (error) {
      console.error("Error al cerrar cupo:", error);
      setMessage("❌ No se pudo cerrar el cupo.");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupo?")) return;

    try {
      await deleteDoc(doc(db, "cupos", slotId));
      setMessage("✅ Cupo eliminado.");
    } catch (error) {
      console.error("Error al eliminar cupo:", error);
      setMessage("❌ No se pudo eliminar el cupo.");
    }
  };

  const loadFictitiousData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16); // format for datetime-local

    setFormData({
      date: dateStr,
      maxStudents: 1,
      price: 25000,
      description: "Clase Intensiva de Matemáticas",
      allowedModalities: ["online", "presencial"]
    });
    setMessage("✨ Datos de prueba cargados.");
  };

  const toggleModality = (modality: string) => {
    setFormData(prev => {
      const current = prev.allowedModalities;
      if (current.includes(modality)) {
        return { ...prev, allowedModalities: current.filter(m => m !== modality) };
      } else {
        return { ...prev, allowedModalities: [...current, modality] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-pastel-accent p-3 text-pastel-dark">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-pastel-dark">
                Dashboard Profesor
              </h2>
              <p className="text-sm text-gray-600">
                Crea y gestiona tus clases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadFictitiousData}
            className="flex items-center gap-2 text-xs font-bold text-pastel-primary hover:text-pastel-dark transition bg-white/50 px-3 py-2 rounded-full border border-pastel-primary/30"
          >
            <Sparkles className="h-4 w-4" />
            Cargar datos ejemplo
          </button>
        </div>

        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pastel-dark">
                Título / Descripción
              </label>
              <input
                type="text"
                placeholder="Ej: Matemáticas Avanzadas"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pastel-dark">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, date: event.target.value }))
                }
                className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pastel-dark">
                Precio (CLP)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseInt(event.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 pl-10 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pastel-dark block mb-2">
                Modalidades
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white/60 px-3 py-2 rounded-lg border border-gray-100 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={formData.allowedModalities.includes("online")}
                    onChange={() => toggleModality("online")}
                    className="rounded text-pastel-primary focus:ring-pastel-primary"
                  />
                  <span className="text-sm text-gray-700">Online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white/60 px-3 py-2 rounded-lg border border-gray-100 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={formData.allowedModalities.includes("presencial")}
                    onChange={() => toggleModality("presencial")}
                    className="rounded text-pastel-primary focus:ring-pastel-primary"
                  />
                  <span className="text-sm text-gray-700">Presencial</span>
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pastel-primary py-3 font-semibold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Publicar Clase"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm font-bold ${message.startsWith("✅")
                ? "text-green-600"
                : "text-action-danger"
              }`}
          >
            {message}
          </p>
        )}
      </div>

      <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl">
        <h3 className="mb-4 text-2xl font-bold text-pastel-dark">
          Mis clases publicadas
        </h3>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no has publicado ninguna clase.
          </p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-2xl border border-pastel-primary/30 bg-white/80 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-1 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-pastel-primary">
                        {slot.description || "Clase"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-lg font-semibold text-pastel-dark">
                          {new Date(slot.date).toLocaleString("es-ES", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        <DollarSign className="h-3 w-3" />
                        {slot.price.toLocaleString("es-CL")}
                      </div>
                      <div className="flex gap-1">
                        {slot.allowedModalities.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs capitalize">{m}</span>
                        ))}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${slot.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {slot.status === "open" ? "Activo" : "Cerrado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {slot.status === "open" && (
                      <button
                        onClick={() => handleCloseSlot(slot.id)}
                        className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-200"
                      >
                        Cerrar
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

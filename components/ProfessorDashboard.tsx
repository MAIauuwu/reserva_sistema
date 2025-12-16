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
import { Calendar, Users, Clock, X, CheckCircle, LayoutDashboard } from "lucide-react";
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
};

export function ProfessorDashboard({ user }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    maxStudents: 10,
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

    try {
      setLoading(true);
      await addDoc(collection(db, "cupos"), {
        date: formData.date,
        maxStudents: formData.maxStudents,
        students: [],
        professorEmail: user.email,
        professorName: user.displayName || user.email,
        status: "open",
        createdAt: new Date(),
      });

      setMessage("✅ Cupo creado exitosamente.");
      setFormData({ date: "", maxStudents: 10 });
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

  return (
    <div className="space-y-6">
      <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-pastel-accent p-3 text-pastel-dark">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-pastel-dark">
              Dashboard Profesor
            </h2>
            <p className="text-sm text-gray-600">
              Crea y gestiona cupos para tus clases
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pastel-dark">
                Fecha y hora del cupo
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
                Cupos disponibles
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.maxStudents}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxStudents: parseInt(event.target.value) || 10,
                  }))
                }
                className="w-full rounded-xl border border-pastel-primary/40 bg-white/80 p-3 text-gray-800 placeholder:text-gray-400 focus:border-pastel-primary focus:outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pastel-primary py-3 font-semibold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cupo"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              message.startsWith("✅")
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
          Mis cupos creados
        </h3>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no has creado ningún cupo. Usa el formulario de arriba para
            crear uno.
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
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-pastel-primary" />
                      <p className="text-lg font-semibold text-pastel-dark">
                        {new Date(slot.date).toLocaleString("es-ES", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {slot.currentStudents}/{slot.maxStudents} estudiantes
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          slot.status === "open"
                            ? "bg-green-100 text-green-700"
                            : slot.status === "full"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {slot.status === "open"
                          ? "Abierto"
                          : slot.status === "full"
                          ? "Lleno"
                          : "Cerrado"}
                      </span>
                    </div>
                    {slot.students.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Estudiantes: {slot.students.join(", ")}
                      </div>
                    )}
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


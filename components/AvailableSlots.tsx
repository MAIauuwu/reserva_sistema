"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client-config";
import { Calendar, Users, ShoppingCart, Info, UserCheck } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { useCart } from "@/context/CartContext";

type Props = {
  user: FirebaseUser | null;
};

type Slot = {
  id: string;
  date: string;
  maxStudents: number;
  currentStudents: number;
  students: string[];
  professorEmail: string;
  professorName: string;
  description?: string;
  price?: number;
  allowedModalities?: ("online" | "presencial")[];
  status: "open" | "full" | "closed";
};

export function AvailableSlots({ user }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const { addToCart, items } = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const slotsQuery = query(
      collection(db, "cupos"),
      where("status", "==", "open")
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
          professorName: data.professorName,
          description: data.description,
          price: data.price || 15000,
          allowedModalities: data.allowedModalities || ["online"],
          status: data.status || "open",
        } as Slot;
      });
      setSlots(
        slotsData
          .filter((slot) => slot.currentStudents < slot.maxStudents)
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    });

    return () => unsubscribe();
  }, []);

  const handleAddToCart = (slot: Slot) => {
    // Default to first available modality or online
    const defaultModality = slot.allowedModalities?.[0] || "online";

    addToCart({
      id: slot.id,
      date: slot.date,
      professorName: slot.professorName,
      professorEmail: slot.professorEmail,
      description: slot.description,
      price: slot.price || 15000,
      modality: defaultModality
    });
  };

  const seedProfessors = async () => {
    try {
      setIsSeeding(true);

      const randomModalities = () => {
        const r = Math.random();
        if (r < 0.33) return ["online"];
        if (r < 0.66) return ["presencial"];
        return ["online", "presencial"];
      }

      const professors = [
        { name: "Dr. Gregory House", email: "house@princeton.edu", desc: "Diagnóstico Diferencial y Casos Complejos", price: 25000 },
        { name: "Lic. Walter White", email: "heisenberg@chem.com", desc: "Química Avanzada y Procesos", price: 15000 },
        { name: "Prof. Minerva McGonagall", email: "minerva@hogwarts.edu", desc: "Transformaciones y Disciplina Estricta", price: 18000 },
        { name: "Tony Stark", email: "tony@stark.com", desc: "Ingeniería, Mecatrónica y Futuro", price: 50000 },
        { name: "Dra. Ellen Ripley", email: "ripley@nostromo.space", desc: "Supervivencia y Manejo de Crisis", price: 15000 }
      ];

      const baseDate = new Date();
      baseDate.setHours(10, 0, 0, 0);

      for (let i = 0; i < professors.length; i++) {
        const prof = professors[i];
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i + 1); // Un día diferente para cada uno

        await addDoc(collection(db, "cupos"), {
          professorName: prof.name,
          professorEmail: prof.email,
          description: prof.desc,
          price: prof.price,
          allowedModalities: randomModalities(),
          date: date.toISOString().slice(0, 16), // Format for datetime-local
          maxStudents: 5,
          students: [],
          status: "open",
          createdAt: new Date()
        });
      }
      setMessage("✅ Profesores cargados exitosamente.");
    } catch (e) {
      console.error(e);
      setMessage("❌ Error al cargar datos.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-pastel-accent p-3 text-pastel-dark">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-pastel-dark">
            Cupos disponibles
          </h3>
          <p className="text-sm text-gray-600">
            Únete a las clases abiertas por profesores
          </p>
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${message.startsWith("✅")
            ? "text-green-600"
            : "text-action-danger"
            }`}
        >
          {message}
        </p>
      )}

      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <p className="text-sm text-gray-500">
            No hay cupos disponibles en este momento.
          </p>
          <button
            onClick={seedProfessors}
            disabled={isSeeding}
            className="flex items-center gap-2 rounded-xl bg-pastel-primary/20 px-4 py-2 text-sm font-semibold text-pastel-dark transition hover:bg-pastel-primary/40 disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            {isSeeding ? "Cargando..." : "Cargar Cupos de Ejemplo"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const isJoined = user?.email
              ? slot.students.includes(user.email)
              : false;
            const isFull = slot.currentStudents >= slot.maxStudents;

            return (
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
                    <p className="font-bold text-pastel-dark">
                      {slot.professorName}
                    </p>
                    {slot.description && (
                      <div className="my-2 flex w-fit items-center gap-2 rounded-lg bg-pastel-secondary px-3 py-1.5 text-sm text-gray-600">
                        <Info className="h-4 w-4 text-pastel-primary" />
                        {slot.description}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                        ${(slot.price || 15000).toLocaleString("es-CL")}
                      </span>
                      {slot.allowedModalities?.map(m => (
                        <span key={m} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {slot.currentStudents}/{slot.maxStudents} estudiantes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isJoined ? (
                      <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-700">
                        Inscrito
                      </span>
                    ) : isFull ? (
                      <span className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-semibold text-yellow-700">
                        Lleno
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(slot)}
                        disabled={items.some(i => i.id === slot.id)}
                        className="flex items-center gap-2 rounded-full bg-pastel-primary px-4 py-2 text-xs font-semibold text-pastel-dark transition hover:bg-pastel-highlight disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {items.some(i => i.id === slot.id) ? "En carrito" : "Agregar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

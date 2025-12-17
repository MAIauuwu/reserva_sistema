"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/client-config";
import { Calendar, Users, ShoppingCart } from "lucide-react";
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
  status: "open" | "full" | "closed";
};

export function AvailableSlots({ user }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const { addToCart, items } = useCart();
  const [message, setMessage] = useState<string | null>(null);

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

  // const handleJoinSlot logic removed in favor of Cart

  const handleAddToCart = (slot: Slot) => {
    addToCart({
      id: slot.id,
      date: slot.date,
      professorName: slot.professorName,
      professorEmail: slot.professorEmail
    });
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
        <p className="text-sm text-gray-500">
          No hay cupos disponibles en este momento. Los profesores crearán nuevos
          cupos pronto.
        </p>
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
                    <p className="text-sm text-gray-600 mb-2">
                      Profesor: {slot.professorName}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        {items.some(i => i.id === slot.id) ? "En el carrito" : "Agregar"}
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


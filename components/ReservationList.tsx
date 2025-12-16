"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/client-config";

type Props = {
  email: string;
};

type Reservation = {
  id: string;
  date: string;
  status: string;
};

export function ReservationList({ email }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setReservations([]);
      setLoading(false);
      return;
    }

    const reservationsQuery = query(
      collection(db, "reservas"),
      where("email", "==", email),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
      const nextReservations = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          status: data.status ?? "pending",
        } as Reservation;
      });
      setReservations(nextReservations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [email]);

  return (
    <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-pastel-dark">
            Tus reservas
          </h3>
          <p className="text-sm text-gray-600">
            Seguimiento en tiempo real para {email}
          </p>
        </div>
        <span className="rounded-full bg-pastel-accent px-4 py-1 text-sm font-semibold text-pastel-dark">
          {email ? `${reservations.length} reservas` : "Sin correo"}
        </span>
      </div>

      {!email ? (
        <p className="text-sm text-gray-500">
          Ingresa tu correo registrado para ver tus clases confirmadas.
        </p>
      ) : loading ? (
        <p className="text-sm text-gray-500">Cargando reservas...</p>
      ) : reservations.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aún no tienes reservas registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="rounded-xl border border-pastel-primary/30 bg-white/80 p-4"
            >
              <p className="text-lg font-semibold text-pastel-dark">
                {new Date(reservation.date).toLocaleString("es-ES", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-sm text-gray-600 capitalize">
                Estado: {reservation.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


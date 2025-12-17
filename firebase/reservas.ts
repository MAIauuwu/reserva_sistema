
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from "firebase/firestore";
import { db } from "./client-config";

const COLLECTION_NAME = "reservas";

/**
 * Verifica si un horario está disponible.
 * Retorna true si NO hay reservas para esa fecha/hora.
 */
export async function horarioDisponible(fechaHora: string): Promise<boolean> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("fechaHora", "==", fechaHora)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error verificando disponibilidad:", error);
        throw error;
    }
}

/**
 * Guarda una nueva reserva.
 */
export async function guardarReserva(fechaHora: string): Promise<void> {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            fechaHora,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error guardando reserva:", error);
        throw error;
    }
}

/**
 * Cancela (elimina) una reserva por su fecha/hora.
 * Nota: Si hay múltiples reservas con la misma fecha (que no debería ocurrir si se usa horarioDisponible),
 * esto podría borrar solo una o requerir lógica adicional. Borramos todas las coincidencias por seguridad.
 */
export async function cancelarReserva(fechaHora: string): Promise<void> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("fechaHora", "==", fechaHora)
        );
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(document =>
            deleteDoc(doc(db, COLLECTION_NAME, document.id))
        );

        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error cancelando reserva:", error);
        throw error;
    }
}

"use client";

import { useCart } from "@/context/CartContext";
import { X, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/client-config";

export function Cart() {
    const { items, removeFromCart, clearCart, isOpen, toggleCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        setLoading(true);
        try {
            // Crear reservas en Firestore
            await Promise.all(items.map(async (item) => {
                await addDoc(collection(db, "reservas"), {
                    cupoId: item.id,
                    date: item.date,
                    professorName: item.professorName,
                    professorEmail: item.professorEmail,
                    studentName: formData.name,
                    studentEmail: formData.email,
                    status: "confirmed",
                    createdAt: new Date()
                });
            }));

            // Limpiar y éxito
            setSuccess(true);
            clearCart();
            setTimeout(() => {
                setSuccess(false);
                toggleCart();
            }, 3000);

        } catch (error) {
            console.error("Error en checkout", error);
            alert("Hubo un error al procesar tu pedido.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleCart}
                className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-pastel-primary text-pastel-dark shadow-2xl transition hover:scale-110"
            >
                <ShoppingCart className="h-8 w-8" />
                {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-action-danger text-xs font-bold text-white shadow-md">
                        {items.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition animate-in fade-in">
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl transition-transform sm:w-[450px] animate-in slide-in-from-right">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-pastel-dark flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" /> Tu Carrito
                    </h2>
                    <button onClick={toggleCart} className="rounded-full p-2 hover:bg-gray-100 transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {success ? (
                    <div className="rounded-xl bg-green-50 p-6 text-center text-green-800 border border-green-200">
                        <h3 className="text-xl font-bold mb-2">¡Solicitud Enviada!</h3>
                        <p>Hemos procesado tu solicitud de reserva correctamente.</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                        <p>Tu carrito está vacío.</p>
                        <button
                            onClick={toggleCart}
                            className="mt-4 text-pastel-primary font-semibold hover:underline"
                        >
                            Volver a cupos
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-8">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 shadow-sm bg-gray-50/50">
                                    <div>
                                        <p className="font-semibold text-pastel-dark">{item.professorName}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(item.date).toLocaleString("es-ES", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-400 hover:text-action-danger transition p-2 hover:bg-white rounded-full"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-bold text-pastel-dark mb-4">Completa tu solicitud</h3>
                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:border-pastel-primary transition"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:border-pastel-primary transition"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-pastel-primary py-4 text-lg font-bold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-50 mt-4 active:scale-95"
                                >
                                    {loading ? "Procesando..." : `Confirmar Reserva (${items.length})`}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

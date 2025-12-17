"use client";

import { useCart } from "@/context/CartContext";
import { X, ShoppingCart, Trash2, CreditCard, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/client-config";

export function Cart() {
    const { items, removeFromCart, updateItemModality, clearCart, isOpen, toggleCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<"review" | "payment">("review");
    const [paymentMethod, setPaymentMethod] = useState<"transfer" | "webpay" | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;
        if (step === "review") {
            setStep("payment");
            return;
        }
        if (!paymentMethod) {
            alert("Selecciona un método de pago");
            return;
        }

        setLoading(true);
        try {
            // Simular proceso de pago
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Crear reservas en Firestore
            await Promise.all(items.map(async (item) => {
                await addDoc(collection(db, "reservas"), {
                    cupoId: item.id,
                    date: item.date,
                    professorName: item.professorName,
                    professorEmail: item.professorEmail,
                    studentName: formData.name,
                    studentEmail: formData.email,
                    price: item.price,
                    modality: item.modality,
                    paymentMethod,
                    status: "paid", // Simulamos que ya pagó
                    createdAt: new Date()
                });
            }));

            // Limpiar y éxito
            setSuccess(true);
            clearCart();
            setTimeout(() => {
                setSuccess(false);
                setStep("review");
                setPaymentMethod(null);
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
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl transition-transform sm:w-[500px] animate-in slide-in-from-right">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-pastel-dark flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        {step === "review" ? "Tu Carrito" : "Pago"}
                    </h2>
                    <button onClick={toggleCart} className="rounded-full p-2 hover:bg-gray-100 transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {success ? (
                    <div className="rounded-xl bg-green-50 p-6 text-center text-green-800 border border-green-200 animate-in zoom-in">
                        <h3 className="text-xl font-bold mb-2">¡Pago Exitoso!</h3>
                        <p>Tus tutorías han sido reservadas y confirmadas.</p>
                        <p className="text-sm mt-2 opacity-75">Te hemos enviado un correo con los detalles.</p>
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
                    <form onSubmit={handleCheckout} className="flex flex-col h-[calc(100vh-150px)]">
                        {step === "review" ? (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="relative rounded-xl border border-gray-100 p-4 shadow-sm bg-gray-50/50">
                                        <div className="pr-8">
                                            <p className="font-semibold text-pastel-dark">{item.professorName}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.date).toLocaleString("es-ES", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">{item.description}</p>
                                            )}
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="font-bold text-pastel-primary">
                                                    ${item.price.toLocaleString("es-CL")}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItemModality(item.id, "online")}
                                                        className={`px-2 py-1 text-xs rounded-full border transition ${item.modality === "online"
                                                                ? "bg-pastel-primary text-pastel-dark border-pastel-primary"
                                                                : "bg-white text-gray-500 border-gray-200 hover:border-pastel-primary"
                                                            }`}
                                                    >
                                                        Online
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItemModality(item.id, "presencial")}
                                                        className={`px-2 py-1 text-xs rounded-full border transition ${item.modality === "presencial"
                                                                ? "bg-pastel-primary text-pastel-dark border-pastel-primary"
                                                                : "bg-white text-gray-500 border-gray-200 hover:border-pastel-primary"
                                                            }`}
                                                    >
                                                        Presencial
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.id)}
                                            className="absolute top-3 right-3 text-gray-400 hover:text-action-danger transition p-1 hover:bg-white rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                <div className="mt-6 space-y-3 border-t pt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-pastel-primary transition"
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
                                            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-pastel-primary transition"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-6 animate-in slide-in-from-right">
                                <div className="bg-pastel-secondary/30 p-4 rounded-xl border border-pastel-primary/20">
                                    <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
                                    <p className="text-3xl font-extrabold text-pastel-dark">${totalPrice.toLocaleString("es-CL")}</p>
                                    <p className="text-xs text-gray-500 mt-1">{items.length} tutoría(s)</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="font-semibold text-pastel-dark">Selecciona método de pago</p>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("webpay")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${paymentMethod === "webpay"
                                                ? "border-pastel-primary bg-pastel-primary/10"
                                                : "border-gray-100 hover:border-pastel-primary/50"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3 font-medium text-gray-700">
                                            <div className="bg-orange-500 text-white p-2 rounded-lg">
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            WebPay (Crédito/Débito)
                                        </span>
                                        {paymentMethod === "webpay" && <div className="h-3 w-3 bg-pastel-primary rounded-full" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("transfer")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${paymentMethod === "transfer"
                                                ? "border-pastel-primary bg-pastel-primary/10"
                                                : "border-gray-100 hover:border-pastel-primary/50"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3 font-medium text-gray-700">
                                            <div className="bg-blue-500 text-white p-2 rounded-lg">
                                                <ArrowRightLeft className="h-5 w-5" />
                                            </div>
                                            Transferencia Bancaria
                                        </span>
                                        {paymentMethod === "transfer" && <div className="h-3 w-3 bg-pastel-primary rounded-full" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t bg-white">
                            {step === "review" ? (
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600">Total estimado</span>
                                    <span className="text-xl font-bold text-pastel-dark">${totalPrice.toLocaleString("es-CL")}</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setStep("review")}
                                    className="mb-3 w-full text-sm text-gray-500 hover:text-pastel-dark underline"
                                >
                                    Volver atrás
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (step === "review" && (!formData.name || !formData.email)) || (step === "payment" && !paymentMethod)}
                                className="w-full rounded-xl bg-pastel-primary py-4 text-lg font-bold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-50 active:scale-95"
                            >
                                {loading
                                    ? "Procesando..."
                                    : step === "review"
                                        ? "Ir a Pagar"
                                        : `Pagar $${totalPrice.toLocaleString("es-CL")}`
                                }
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

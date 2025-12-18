"use client";

import { useCart } from "@/context/CartContext";
import { X, ShoppingCart, Trash2, CreditCard, ArrowRightLeft, FileText, CheckCircle2 } from "lucide-react";
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

            // Enviar correo de confirmación
            await fetch("/api/send-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    items: items,
                    total: totalPrice,
                    paymentMethod
                }),
            });

            // Limpiar y éxito
            setSuccess(true);
            clearCart();
            setTimeout(() => {
                setSuccess(false);
                setStep("review");
                setPaymentMethod(null);
                toggleCart();
            }, 4000);

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

        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition animate-in fade-in"
            onClick={toggleCart} // Close when clicking backdrop
        >
            <div
                className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl transition-transform sm:w-[500px] animate-in slide-in-from-right"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
            >
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
                            onClick={() => {
                                toggleCart();
                                document.getElementById("calendario")?.scrollIntoView({ behavior: "smooth" });
                            }}
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
                                {/* Cotización Header */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <FileText className="h-24 w-24 text-pastel-dark" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cotización de Servicio</p>
                                        <h3 className="text-3xl font-black text-pastel-dark mb-1">${totalPrice.toLocaleString("es-CL")}</h3>
                                        <p className="text-sm text-gray-500">{items.length} servicios seleccionados</p>
                                    </div>
                                </div>

                                {/* Detalle de Cotización */}
                                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-xs font-bold text-gray-500 uppercase px-1">Detalle del costo</p>
                                    {items.map((item, idx) => (
                                        <div key={item.id + idx} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{item.professorName}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    {item.modality === 'online' ? '🌐 Online' : '📍 Presencial'} • {item.description || "Asesoría"}
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-700">${item.price.toLocaleString("es-CL")}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center px-3">
                                        <span className="font-bold text-gray-800">Total Final</span>
                                        <span className="font-bold text-pastel-primary text-lg">${totalPrice.toLocaleString("es-CL")}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <p className="font-semibold text-pastel-dark">Método de pago seguro</p>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("webpay")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition group ${paymentMethod === "webpay"
                                            ? "border-pastel-primary bg-pastel-primary/5"
                                            : "border-gray-100 hover:border-pastel-primary/50 hover:bg-white"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3 font-medium text-gray-700">
                                            <div className={`p-2 rounded-lg transition ${paymentMethod === 'webpay' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            WebPay (Crédito/Débito)
                                        </span>
                                        {paymentMethod === "webpay" && <CheckCircle2 className="h-5 w-5 text-pastel-primary" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("transfer")}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition group ${paymentMethod === "transfer"
                                            ? "border-pastel-primary bg-pastel-primary/5"
                                            : "border-gray-100 hover:border-pastel-primary/50 hover:bg-white"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3 font-medium text-gray-700">
                                            <div className={`p-2 rounded-lg transition ${paymentMethod === 'transfer' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                                <ArrowRightLeft className="h-5 w-5" />
                                            </div>
                                            Transferencia Bancaria
                                        </span>
                                        {paymentMethod === "transfer" && <CheckCircle2 className="h-5 w-5 text-pastel-primary" />}
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

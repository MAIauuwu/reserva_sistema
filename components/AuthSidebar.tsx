"use client";

import { useState, FormEvent, useMemo } from "react";
import { X, UserRound, GraduationCap, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/firebase/client-config";
import { FirebaseError } from "firebase/app";
import { addDoc, collection } from "firebase/firestore";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onAuthenticated?: (email: string) => void;
};

type Mode = "login" | "register";

export function AuthSidebar({ isOpen, onClose, onAuthenticated }: Props) {
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Login State
    const [loginRole, setLoginRole] = useState("estudiante");
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });

    // Register State
    const [registerForm, setRegisterForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "estudiante"
    });

    const badge = useMemo(() => {
        if (!message) return "";
        return message.startsWith("✅") ? "text-green-600" : "text-action-danger";
    }, [message]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!loginForm.email || !loginForm.password) {
            setMessage("Ingresa correo y contraseña.");
            return;
        }

        try {
            setLoading(true);
            const creds = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
            setMessage(`✅ ¡Bienvenido de nuevo!`);
            setTimeout(() => {
                onAuthenticated?.(creds.user.email || "");
                onClose();
            }, 1000);
        } catch (error) {
            console.error(error);
            if (error instanceof FirebaseError) {
                if (error.code === "auth/invalid-credential") setMessage("❌ Credenciales incorrectas.");
                else setMessage("❌ Error al iniciar sesión.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!registerForm.email || !registerForm.password || !registerForm.name) {
            setMessage("Completa todos los campos.");
            return;
        }

        if (registerForm.password.length < 6) {
            setMessage("La contraseña debe tener 6 caracteres o más.");
            return;
        }

        try {
            setLoading(true);
            const creds = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);

            await updateProfile(creds.user, { displayName: registerForm.name });

            // Guardar en Firestore
            await addDoc(collection(db, "clientes"), {
                uid: creds.user.uid,
                name: registerForm.name,
                email: registerForm.email,
                role: registerForm.role,
                createdAt: new Date()
            });

            setMessage("✅ Cuenta creada exitosamente.");
            setTimeout(() => {
                onAuthenticated?.(creds.user.email || "");
                onClose();
            }, 1000);

        } catch (error) {
            console.error(error);
            if (error instanceof FirebaseError) {
                if (error.code === "auth/email-already-in-use") setMessage("❌ El correo ya está registrado.");
                else setMessage("❌ Error al crear cuenta.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition animate-in fade-in">
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl transition-transform sm:w-[450px] animate-in slide-in-from-right">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-pastel-dark flex items-center gap-2">
                        {mode === "login" ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
                        {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Role Selector (Visual only for Login, Functional for Register) */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        {["estudiante", "profesor"].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => mode === 'login' ? setLoginRole(r) : setRegisterForm({ ...registerForm, role: r })}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition ${(mode === 'login' ? loginRole : registerForm.role) === r
                                        ? "bg-white text-pastel-dark shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {mode === "login" ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="w-full rounded-xl border border-gray-200 p-3 focus:border-pastel-primary focus:outline-none transition bg-gray-50"
                                    placeholder="ejemplo@correo.com"
                                    value={loginForm.email}
                                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full rounded-xl border border-gray-200 p-3 focus:border-pastel-primary focus:outline-none transition bg-gray-50"
                                    placeholder="••••••••"
                                    value={loginForm.password}
                                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-pastel-primary py-3 font-bold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-50 mt-2"
                            >
                                {loading ? "Entrando..." : "Ingresar"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-200 p-3 focus:border-pastel-primary focus:outline-none transition bg-gray-50"
                                    placeholder="Tu nombre"
                                    value={registerForm.name}
                                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="w-full rounded-xl border border-gray-200 p-3 focus:border-pastel-primary focus:outline-none transition bg-gray-50"
                                    placeholder="ejemplo@correo.com"
                                    value={registerForm.email}
                                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full rounded-xl border border-gray-200 p-3 focus:border-pastel-primary focus:outline-none transition bg-gray-50"
                                    placeholder="Mínimo 6 caracteres"
                                    value={registerForm.password}
                                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-pastel-primary py-3 font-bold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-50 mt-2"
                            >
                                {loading ? "Creando cuenta..." : "Registrarme"}
                            </button>
                        </form>
                    )}

                    {message && (
                        <div className={`p-3 rounded-xl text-center text-sm font-medium ${message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {message}
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={() => {
                                setMode(mode === "login" ? "register" : "login");
                                setMessage(null);
                            }}
                            className="text-sm text-gray-500 hover:text-pastel-dark underline transition font-medium"
                        >
                            {mode === "login"
                                ? "¿Sin cuenta? Regístrate primero"
                                : "¿Ya tienes cuenta? Inicia sesión"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

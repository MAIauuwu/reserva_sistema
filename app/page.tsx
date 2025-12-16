"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock3, MailCheck, Users } from "lucide-react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, type User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/client-config";
import { ClientRegistration } from "@/components/ClientRegistration";
import { RoleLoginModal } from "@/components/RoleLoginModal";
import { Sidebar } from "@/components/Sidebar";
import { ProfessorDashboard } from "@/components/ProfessorDashboard";
import { AvailableSlots } from "@/components/AvailableSlots";
import { TurnoButton } from "@/components/TurnoButton";

type BookingCalendarProps = {
  email: string;
  name: string;
  canBook: boolean;
};

const simulatedUser = {
  email: "ejemplo@cliente.com",
  name: "Juan Pérez",
};

const perks = [
  {
    title: "Confirmación inmediata",
    description: "Recibe un correo con los detalles de tu clase al reservar.",
    icon: MailCheck,
  },
  {
    title: "Calendario amigable",
    description: "Usa fechas y horas en tu zona horaria sin complicaciones.",
    icon: Calendar,
  },
  {
    title: "Clientes felices",
    description: "Gestiona tus clases y registros en un solo lugar seguro.",
    icon: Users,
  },
];

function BookingCalendar({ email, name, canBook }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const badgeStyle = useMemo(() => {
    if (!message) return "";
    return message.startsWith("✅") ? "text-green-600" : "text-action-danger";
  }, [message]);

  const handleBook = async () => {
    if (!selectedDate) {
      setMessage("Selecciona fecha y hora para reservar.");
      return;
    }
    if (!canBook || !email) {
      setMessage("Inicia sesión con tu cuenta para reservar.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "reservas"), {
        date: selectedDate,
        email,
        name,
        status: "pending",
        createdAt: new Date(),
      });

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, date: selectedDate, name }),
      });

      const result = await emailResponse.json();
      if (emailResponse.ok && result.message?.includes("enviado")) {
        setMessage("✅ ¡Reserva creada y correo enviado!");
      } else {
        setMessage(
          "✅ Reserva creada, pero no se pudo enviar el email. Revisa los logs."
        );
      }
      setSelectedDate("");
    } catch (error) {
      console.error("Error al procesar la reserva:", error);
      setMessage("❌ Ocurrió un error. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card pastel-border rounded-2xl p-8 shadow-xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-pastel-accent p-3 text-pastel-dark">
          <Clock3 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-pastel-dark">
            Elige fecha y hora
          </h3>
          <p className="text-sm text-gray-600">
            Reservando como {name} ({email})
          </p>
        </div>
      </div>

      <input
        type="datetime-local"
        value={selectedDate}
        onChange={(event) => {
          setSelectedDate(event.target.value);
          setMessage(null);
        }}
        className="w-full rounded-2xl border border-pastel-primary/50 bg-white/90 p-4 text-lg focus:border-pastel-primary focus:outline-none"
      />

      <button
        onClick={handleBook}
        disabled={loading || !selectedDate || !canBook}
        className="w-full rounded-full bg-pastel-primary py-4 text-lg font-semibold text-pastel-dark shadow-lg transition hover:bg-pastel-highlight disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Reservar clase"}
      </button>

      {!canBook && (
        <p className="text-center text-sm text-action-danger">
          Inicia sesión para confirmar tu reserva.
        </p>
      )}

      {message && <p className={`text-center text-sm ${badgeStyle}`}>{message}</p>}

      <p className="text-xs text-gray-500 text-center">
        Tu solicitud llega al administrador y recibirás un correo de confirmación
        final al aprobarla.
      </p>
    </div>
  );
}

export default function Home() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [viewerEmail, setViewerEmail] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState("calendario");
  const [userRole, setUserRole] = useState<string | null>(null);

  const normalizedViewerEmail = viewerEmail.trim();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSessionUser(user);
      if (user?.email) {
        setViewerEmail(user.email);
        // Obtener el rol del usuario desde Firestore
        try {
          const clientesQuery = query(
            collection(db, "clientes"),
            where("email", "==", user.email)
          );
          const snapshot = await getDocs(clientesQuery);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            setUserRole(userData.role || null);
          }
        } catch (error) {
          console.error("Error al obtener rol del usuario:", error);
        }
      } else {
        setViewerEmail("");
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToast("Sesión cerrada correctamente.");
      setCurrentView("calendario");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleViewChange = (view: string) => {
    if (view === "login") {
      setShowLoginModal(true);
    } else if (view === "registro") {
      setCurrentView("registro");
    } else {
      setCurrentView(view);
    }
  };

  const activeUser = sessionUser?.email
    ? {
        email: sessionUser.email,
        name: sessionUser.displayName || "Tu cuenta",
      }
    : simulatedUser;

  return (
    <main className="min-h-screen bg-pastel-secondary py-12">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <div>
          <button
            className="rounded-full bg-action-danger px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-xl transition hover:bg-red-700"
            onClick={() => setShowLoginModal(true)}
          >
            Registrar alumno
          </button>
        </div>
        <TurnoButton />
      </div>
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        user={sessionUser}
        userRole={userRole}
        onLogout={handleLogout}
      />
      
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 md:px-8">
        {currentView === "dashboard" && userRole === "profesor" && sessionUser ? (
          <ProfessorDashboard user={sessionUser} />
        ) : currentView === "registro" ? (
          <div className="space-y-8">
            <header className="rounded-3xl bg-pastel-light p-10 text-center shadow-2xl">
              <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-pastel-accent px-5 py-2 text-sm font-semibold text-pastel-dark">
                <Calendar className="h-4 w-4" />
                Crea tu cuenta
              </div>
              <h1 className="mt-6 text-5xl font-extrabold text-pastel-dark">
                Únete a nuestro sistema de reservas
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Regístrate como estudiante o profesor y comienza a gestionar tus clases de manera sencilla.
              </p>
            </header>
            <div className="mx-auto max-w-2xl">
              <ClientRegistration
                onSuccess={(email, role) => {
                  setToast(
                    `✅ ${role} registrado correctamente. Revisa tu correo para iniciar sesión.`
                  );
                  setTimeout(() => {
                    setCurrentView("calendario");
                    setShowLoginModal(true);
                  }, 2000);
                }}
              />
            </div>
          </div>
        ) : currentView === "calendario" ? (
          <>
            <header className="rounded-3xl bg-pastel-light p-10 text-center shadow-2xl">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-pastel-accent px-5 py-2 text-sm font-semibold text-pastel-dark">
            <Calendar className="h-4 w-4" />
            Ideal para academias y estudios creativos
          </div>
          <h1 className="mt-6 text-5xl font-extrabold text-pastel-dark">
            Sistema de Reservas para tus clases
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Gestiona horarios, confirma asistencia y envía emails en minutos.
            Todo con colores pasteles, un flujo elegante y sin complicaciones.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              className="w-full rounded-full border border-pastel-primary/60 py-3 text-lg font-semibold text-pastel-dark transition hover:bg-pastel-highlight sm:w-auto sm:px-8"
              onClick={() =>
                document
                  .getElementById("calendario")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Ver calendario
            </button>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[3fr,2fr]" id="calendario">
          <div className="space-y-6">
            <BookingCalendar
              email={activeUser.email}
              name={activeUser.name}
              canBook={Boolean(sessionUser?.email)}
            />
            <AvailableSlots user={sessionUser} />
          </div>
          <div className="glass-card pastel-border flex flex-col gap-6 rounded-2xl p-6 shadow-xl">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-start gap-4">
                <div className="rounded-2xl bg-pastel-accent p-3 text-pastel-dark">
                  <perk.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-pastel-dark">
                    {perk.title}
                  </h4>
                  <p className="text-sm text-gray-600">{perk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        ) : (
          <div className="glass-card pastel-border rounded-2xl p-8 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-pastel-dark">
              Vista no disponible
            </h2>
            <p className="mt-2 text-gray-600">
              Selecciona una opción del menú para continuar.
            </p>
          </div>
        )}

        {toast && (
          <div className="pointer-events-none fixed left-1/2 top-8 z-40 -translate-x-1/2 rounded-full bg-pastel-dark/80 px-6 py-3 text-sm font-semibold text-white shadow-xl">
            {toast}
          </div>
        )}
        {showRegistration && (
          <div className="rounded-2xl bg-pastel-light p-6 text-center text-sm text-gray-600 shadow">
            ¡Estás en la sección de registro! Completa el formulario para empezar.
          </div>
        )}
        {showLoginModal && (
          <RoleLoginModal
            onClose={() => setShowLoginModal(false)}
            onAuthenticated={(email) => {
              if (email) {
                setViewerEmail(email);
              }
              setShowLoginModal(false);
              setToast("Sesión iniciada. Ya puedes reservar tu clase.");
              document
                .getElementById("calendario")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            onGoToRegister={() => {
              setShowLoginModal(false);
              setShowRegistration(true);
              document
                .getElementById("registro")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}
      </div>
    </main>
  );
}

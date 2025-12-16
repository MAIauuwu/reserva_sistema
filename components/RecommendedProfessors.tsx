"use client";

import { Quote } from "lucide-react";

const highlights = [
  {
    name: "María Luca",
    specialty: "Yoga Flow",
    comment:
      "Las alumnas adoran su energía suave y las playlists pastel tranquilas.",
  },
  {
    name: "Javier Sanchez",
    specialty: "Fullstack Developer",
    comment:
      "Sus clases personalizadas se agendan completo cada semana. Recomendado. muy buen profesor",
  },
  {
    name: "Lucía Varela",
    specialty: "Ilustración digital",
    comment:
      "Integra feedback en vivo y mantiene a los alumnos motivados todo el mes.",
  },
];

export function RecommendedProfessors() {
  return (
    <div className="glass-card pastel-border rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-pastel-accent p-2 text-pastel-dark">
          <Quote className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-pastel-dark">
            Profes recomendados
          </h3>
          <p className="text-xs uppercase text-gray-500">
            Comentarios destacados de la comunidad
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {highlights.map((professor) => (
          <li
            key={professor.name}
            className="rounded-2xl border border-pastel-primary/25 bg-white/80 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-pastel-dark">
                  {professor.name}
                </p>
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {professor.specialty}
                </span>
              </div>
              <span className="text-3xl text-pastel-primary">★</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">“{professor.comment}”</p>
          </li>
        ))}
      </ul>
    </div>
  );
}



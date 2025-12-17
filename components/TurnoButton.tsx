"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface Farmacia {
  local_id: string;
  nombre_local: string;
  direccion: string;
  comuna: string;
  telefono: string;
  fecha_inicio?: string;
  fecha_termino?: string;
  hora_apertura?: string;
  hora_cierre?: string;
}

type RawFarmacia = Record<string, unknown>;

export function TurnoButton() {
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [selectedComuna, setSelectedComuna] = useState<string>('');

  const normalizeRaw = (r: RawFarmacia): Farmacia => {
    const get = (keys: string[]) => {
      for (const k of keys) {
        if (r[k] !== undefined && r[k] !== null) return String(r[k]);
      }
      return '';
    };

    return {
      local_id: get(['local_id', 'id', 'localId']),
      nombre_local: get(['local_nombre', 'nombre_local', 'local_nombre', 'local']),
      direccion: get(['local_direccion', 'direccion', 'local_direccion']),
      comuna: get(['comuna_nombre', 'comuna', 'comuna_nombre']),
      telefono: get(['local_telefono', 'telefono', 'local_telefono']),
      fecha_inicio: get(['fecha_inicio', 'fk_inicio', 'inicio']),
      fecha_termino: get(['fecha_termino', 'fk_termino', 'termino', 'fecha_fin']),
      hora_apertura: get(['funcionamiento_hora_apertura', 'hora_apertura', 'apertura']),
      hora_cierre: get(['funcionamiento_hora_cierre', 'hora_cierre', 'cierre']),
    };
  };

  const comunas = Array.from(new Set(farmacias.map((f) => f.comuna).filter(Boolean))).sort();

  // Función para verificar si una farmacia está de turno hoy
  const isOpenToday = (farmacia: Farmacia): boolean => {
    if (!farmacia.fecha_inicio || !farmacia.fecha_termino) {
      return true; // Si no tiene fechas, asumimos que siempre está disponible
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Parsear fechas (puede ser DD/MM/YYYY o YYYY-MM-DD)
      const parseDate = (dateStr: string): Date => {
        const parts = dateStr.includes('/')
          ? dateStr.split('/')
          : dateStr.split('-');

        if (dateStr.includes('/')) {
          // DD/MM/YYYY
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          // YYYY-MM-DD
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      };

      const inicio = parseDate(farmacia.fecha_inicio);
      const termino = parseDate(farmacia.fecha_termino);

      return today >= inicio && today <= termino;
    } catch (e) {
      console.warn('Error parsing dates for farmacia:', farmacia.nombre_local, e);
      return true;
    }
  };

  // Filtrar por comuna Y por fecha actual
  const filtered = farmacias.filter((f) => {
    const matchComuna = !selectedComuna || f.comuna === selectedComuna;
    const matchDate = isOpenToday(f);
    return matchComuna && matchDate;
  });

  const fetchFarmacias = async () => {
    try {
      setLoading(true);
      const LOCAL_API = '/api/farmacias';
      const REMOTE_API = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

      // Try local proxy first
      try {
        const response = await fetch(LOCAL_API, { cache: 'no-store' });
        if (response.ok) {
          const text = await response.text().catch(() => '');
          setRawResponse(text);
          console.log('[Local Proxy] Response:', text.slice(0, 200));

          const parsed = text ? JSON.parse(text) : null;

          // Check if it's directly an array (new format)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = (parsed as RawFarmacia[]).map(normalizeRaw);
            setFarmacias(normalized);
            setErrorMessage(null);
            setShowModal(true);
            return;
          }

          // Check if it's { data: [...] } format (old format)
          const body = parsed as { success?: boolean; data?: RawFarmacia[]; error?: string } | null;
          if (body?.success && Array.isArray(body.data) && body.data.length > 0) {
            const normalized = body.data.map(normalizeRaw);
            setFarmacias(normalized);
            setErrorMessage(null);
            setShowModal(true);
            return;
          }
        }
      } catch (e) {
        console.warn('[Local Proxy] Failed:', e);
      }

      // Fallback 1: allorigins.win
      try {
        console.log('[Fallback 1] Trying api.allorigins.win...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(REMOTE_API)}`;
        const resp = await fetch(proxyUrl, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`Status ${resp.status}`);

        const text = await resp.text();
        setRawResponse(text);
        console.log('[Fallback 1] Response length:', text.length, 'First 300 chars:', text.slice(0, 300));

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          console.warn('[Fallback 1] JSON parse failed:', parseErr);
          throw new Error('Invalid JSON from proxy');
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = (parsed as RawFarmacia[]).map(normalizeRaw);
          setFarmacias(normalized);
          setErrorMessage(null);
          setShowModal(true);
          return;
        }

        if (parsed?.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
          const normalized = (parsed.data as RawFarmacia[]).map(normalizeRaw);
          setFarmacias(normalized);
          setErrorMessage(null);
          setShowModal(true);
          return;
        }

        throw new Error('No array found in response');
      } catch (fallbackErr) {
        console.warn('[Fallback 1] Failed:', fallbackErr);
      }

      // If both failed, show error with raw data
      setErrorMessage('No se pudo obtener la lista de farmacias. Revisa la consola del navegador.');
      setShowModal(true);
    } catch (error) {
      console.error('Unexpected error fetching farmacias:', error);
      setErrorMessage('Error inesperado al obtener farmacias.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.9);
          }
        }
        
        .pulsing-button {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={fetchFarmacias}
        disabled={loading}
        className="pulsing-button flex items-center gap-2 rounded-full bg-red-500 px-6 py-4 text-base font-bold text-white shadow-2xl transition-all hover:bg-red-600 disabled:opacity-70"
      >
        <AlertCircle className="h-5 w-5" />
        {loading ? "Cargando..." : "FARMACIA DE TURNO"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Farmacias de Turno
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="mb-6 text-sm text-gray-500">
              📅 {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="w-full md:w-48 flex-shrink-0 md:order-2">
                <label className="mb-2 block text-sm font-bold text-gray-800">📍 Filtrar por Comuna</label>
                <select
                  value={selectedComuna}
                  onChange={(e) => setSelectedComuna(e.target.value)}
                  className="mb-3 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none font-medium"
                >
                  <option value="">Todas las comunas ({comunas.length})</option>
                  {comunas.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 text-xs text-blue-800 hidden md:block">
                  <p><strong>Nota:</strong> Mostrando farmacias con turno activo para hoy.</p>
                </div>
              </div>

              <div className="flex-1 w-full md:order-1">
                {errorMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-lg font-bold text-red-700 mb-2">¡Ups! Algo salió mal</p>
                    <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
                    <button
                      onClick={fetchFarmacias}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-sm font-bold transition"
                    >
                      Intentar de nuevo
                    </button>
                    <p className="mt-6 text-xs text-gray-500">
                      Si el problema persiste, puedes visitar el sitio oficial del <a href="https://farmanet.minsal.cl/maps/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Minsal</a>.
                    </p>
                  </div>
                ) : farmacias.length > 0 ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">
                        Resultados encontrados: <span className="text-gray-900 font-bold">{filtered.length}</span>
                      </p>
                    </div>
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      {filtered.map((farmacia) => (
                        <div
                          key={farmacia.local_id}
                          className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-red-100"
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                          </div>
                          <div className="relative z-10">
                            <span className="mb-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                              {farmacia.comuna}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">
                              {farmacia.nombre_local}
                            </h3>
                            <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <span>📍</span> {farmacia.direccion}
                              </p>
                              <p className="flex items-center gap-2">
                                <span>📞</span> {farmacia.telefono}
                              </p>
                            </div>

                            {(farmacia.hora_apertura || farmacia.hora_cierre) && (
                              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-800 text-xs font-bold border border-green-100 w-fit">
                                <span>🕐 Horario de Turno:</span>
                                <span>{farmacia.hora_apertura} - {farmacia.hora_cierre}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
                      💊
                    </div>
                    <p className="text-lg font-semibold text-gray-700">No se encontraron farmacias</p>
                    <p className="text-gray-500 text-sm">Prueba cambiando el filtro de comuna.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-white font-bold tracking-wide shadow-lg transition hover:bg-slate-800 hover:scale-[1.01]"
            >
              Cerrar listado
            </button>
          </div>
        </div>
      )}
    </>
  );
}

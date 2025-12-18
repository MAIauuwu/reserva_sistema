"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [selectedComuna, setSelectedComuna] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isOpenToday = (farmacia: Farmacia): boolean => {
    if (!farmacia.fecha_inicio || !farmacia.fecha_termino) {
      return true;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const parseDate = (dateStr: string): Date => {
        const parts = dateStr.includes('/')
          ? dateStr.split('/')
          : dateStr.split('-');
        if (dateStr.includes('/')) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      };
      const inicio = parseDate(farmacia.fecha_inicio);
      const termino = parseDate(farmacia.fecha_termino);
      return today >= inicio && today <= termino;
    } catch (e) {
      return true;
    }
  };

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

      try {
        const response = await fetch(LOCAL_API, { cache: 'no-store' });
        if (response.ok) {
          const text = await response.text();
          setRawResponse(text);
          const parsed = text ? JSON.parse(text) : null;

          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = (parsed as RawFarmacia[]).map(normalizeRaw);
            setFarmacias(normalized);
            setErrorMessage(null);
            setShowModal(true);
            return;
          }
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

      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(REMOTE_API)}`;
        const resp = await fetch(proxyUrl, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const text = await resp.text();
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = (parsed as RawFarmacia[]).map(normalizeRaw);
          setFarmacias(normalized);
          setErrorMessage(null);
          setShowModal(true);
          return;
        }
        if (parsed?.data && Array.isArray(parsed.data)) {
          const normalized = (parsed.data as RawFarmacia[]).map(normalizeRaw);
          setFarmacias(normalized);
          setErrorMessage(null);
          setShowModal(true);
          return;
        }
      } catch (fallbackErr) {
        console.warn('[Fallback 1] Failed:', fallbackErr);
      }

      setErrorMessage('No se pudo obtener la lista de farmacias. Revisa la consola del navegador.');
      setShowModal(true);
    } catch (error) {
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
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.9); }
        }
        .pulsing-button { animation: pulse-glow 1.5s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>

      <button
        onClick={fetchFarmacias}
        disabled={loading}
        className="pulsing-button flex items-center gap-2 rounded-full bg-red-500 px-6 py-4 text-base font-bold text-white shadow-2xl transition-all hover:bg-red-600 disabled:opacity-70"
      >
        <AlertCircle className="h-5 w-5" />
        {loading ? "Cargando..." : "FARMACIA DE TURNO"}
      </button>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header + Filter Section (Fixed at Top) */}
            <div className="flex-shrink-0 bg-white p-6 sm:p-8 border-b border-gray-100 z-10 shadow-sm relative">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-none">
                    Farmacias de Turno
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    📍 Filtrar por Comuna:
                  </label>
                  <div className="relative w-full">
                    <select
                      value={selectedComuna}
                      onChange={(e) => setSelectedComuna(e.target.value)}
                      className="w-full appearance-none rounded-lg border-2 border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 focus:border-red-500 focus:outline-none transition-colors hover:border-red-200"
                    >
                      <option value="">Todas las comunas ({comunas.length})</option>
                      {comunas.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable List Section (Takes Remaining Height) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50 custom-scrollbar">
              {errorMessage ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="bg-red-100 rounded-full p-4 mb-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-red-700 mb-2">¡Ups! Algo salió mal</p>
                  <p className="text-sm text-red-600 mb-6 max-w-md">{errorMessage}</p>
                  <button
                    onClick={fetchFarmacias}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition shadow-lg shadow-red-200"
                  >
                    Intentar de nuevo
                  </button>
                  <p className="mt-8 text-xs text-gray-500">
                    <a href="https://farmanet.minsal.cl/maps/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Ver en sitio oficial Minsal</a>
                  </p>
                </div>
              ) : farmacias.length > 0 ? (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 flex items-center justify-between px-2">
                    <p className="text-sm font-medium text-gray-500">
                      Mostrando farmacias de turno para hoy
                    </p>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                      {filtered.length} Resultados
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {filtered.map((farmacia) => (
                      <div
                        key={farmacia.local_id}
                        className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition">
                          <AlertCircle className="h-24 w-24 text-red-500" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                            <span className="mb-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {farmacia.comuna}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3">
                              {farmacia.nombre_local}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p className="flex items-start gap-2">
                                <span className="mt-0.5">📍</span> {farmacia.direccion}
                              </p>
                              <p className="flex items-center gap-2">
                                <span>📞</span> {farmacia.telefono}
                              </p>
                            </div>
                          </div>

                          {(farmacia.hora_apertura || farmacia.hora_cierre) && (
                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs font-bold text-green-700">
                              <span className="text-base">🕒</span>
                              <span>{farmacia.hora_apertura} - {farmacia.hora_cierre}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm text-4xl">
                    💊
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">No se encontraron farmacias</p>
                  <p className="text-gray-500">Prueba cambiando el filtro de comuna.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

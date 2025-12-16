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

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {errorMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                    <p className="mt-2 text-xs text-red-600">Intenta recargar o vuelve más tarde.</p>
                  </div>
                ) : farmacias.length > 0 ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">Resultados: <span className="font-medium text-gray-900">{filtered.length}</span></p>
                    </div>
                    <div className="space-y-4">
                      {filtered.map((farmacia) => (
                        <div
                          key={farmacia.local_id}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100"
                        >
                          <h3 className="text-lg font-semibold text-gray-900">
                            {farmacia.nombre_local}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">
                            📍 {farmacia.direccion}, {farmacia.comuna}
                          </p>
                          <p className="text-sm text-gray-600">
                            📞 {farmacia.telefono}
                          </p>
                          {(farmacia.fecha_inicio || farmacia.hora_apertura) && (
                            <div className="mt-2 space-y-1">
                              {farmacia.fecha_inicio && (
                                <p className="text-xs text-blue-700 font-medium">
                                  📅 Período: {farmacia.fecha_inicio} al {farmacia.fecha_termino || 'indefinido'}
                                </p>
                              )}
                              {farmacia.hora_apertura && (
                                <p className="text-xs text-green-700 font-medium">
                                  🕐 Horario: {farmacia.hora_apertura} - {farmacia.hora_cierre || 'variable'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No hay farmacias disponibles.</p>
                )}
              </div>

              <div className="w-48 flex-shrink-0">
                <label className="mb-2 block text-xs font-medium text-gray-800">Filtrar por comuna</label>
                <select
                  value={selectedComuna}
                  onChange={(e) => setSelectedComuna(e.target.value)}
                  className="mb-3 w-full rounded-md border px-2 py-2 text-sm text-gray-800"
                >
                  <option value="">Todas las comunas ({comunas.length})</option>
                  {comunas.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-full bg-gray-900 px-6 py-3 text-white font-semibold transition hover:bg-gray-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

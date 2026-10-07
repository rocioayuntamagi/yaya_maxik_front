"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Cierre = {
  _id: string;
  openedAt: string;
  closedAt: string | null;
  finalBalance: number | null;
};

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleString("es-AR") : "Sin fecha registrada";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export default function HistorialDeCajas() {
  const router = useRouter();
  const [history, setHistory] = useState<Cierre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadHistory = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/cash/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo cargar el historial de cajas");
        if (!Array.isArray(data)) throw new Error("Respuesta inválida del historial de cajas");
        const sorted = (data as Cierre[]).sort((a, b) =>
          new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
        );
        if (active) setHistory(sorted);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el historial de cajas");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Historial de cierres de caja</h1>
        {loading ? <p className="mt-6">Cargando historial...</p> : error ? (
          <p role="alert" className="mt-6 text-red-700">{error}</p>
        ) : history.length === 0 ? (
          <p className="mt-6 text-slate-600">No hay cajas cerradas todavía.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {history.map(cash => (
              <li key={cash._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-slate-600">Apertura</dt>
                    <dd className="mt-1 font-medium">{formatDate(cash.openedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-600">Cierre</dt>
                    <dd className="mt-1 font-medium">{formatDate(cash.closedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-600">Balance final</dt>
                    <dd className="mt-1 font-semibold">{cash.finalBalance == null ? "Sin balance registrado" : formatMoney(cash.finalBalance)}</dd>
                  </div>
                </dl>
                <Link href={`/caja/historial/${cash._id}`} className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Ver detalle
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

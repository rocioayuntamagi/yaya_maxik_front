"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DailySummary = {
  totalVentas: number;
  totalesPorMetodo: { efectivo: number; tarjeta: number; transferencia: number };
  fiadoGenerado: number;
  fiadoRecuperado: number;
  gastos: number;
  balanceDia: number;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadSummary = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/dashboard/today", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudo cargar el resumen diario");
        if (active) setSummary(data as DailySummary);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el resumen diario");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSummary();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard del kiosco</h1>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="indicadores-diarios" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="indicadores-diarios" className="text-xl font-semibold">Indicadores diarios</h2>
            {loading ? <p className="mt-4 text-slate-600">Cargando indicadores...</p> : error ? (
              <p role="alert" className="mt-4 text-red-700">{error}</p>
            ) : summary && (
              <dl className="mt-4 space-y-3">
                {([
                  ["Total de ventas del día", summary.totalVentas],
                  ["Efectivo", summary.totalesPorMetodo.efectivo],
                  ["Tarjeta", summary.totalesPorMetodo.tarjeta],
                  ["Transferencia", summary.totalesPorMetodo.transferencia],
                  ["Fiado generado", summary.fiadoGenerado],
                  ["Fiado recuperado", summary.fiadoRecuperado],
                  ["Gastos del día", summary.gastos],
                  ["Balance del día", summary.balanceDia],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-slate-600">{label}</dt>
                    <dd className="font-semibold">{formatMoney(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="graficos-listados" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="graficos-listados" className="text-xl font-semibold">Gráficos y listados</h2>
            <div className="mt-4 text-slate-600">Espacio reservado para gráficos y listados futuros.</div>
          </section>
        </div>
      </div>
    </main>
  );
}

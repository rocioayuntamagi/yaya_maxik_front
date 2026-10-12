"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DailySummary = {
  totalVentas: number;
  totalesPorMetodo: { efectivo: number; tarjeta: number; transferencia: number };
  fiadoGenerado: number;
  fiadoRecuperado: number;
  gastos: number;
  balanceDia: number;
};

type DailySale = {
  _id: string;
  total: number;
  paymentMethod: string;
  cancelled?: boolean;
  products: { product: { _id: string; name: string } | string | null; quantity: number }[];
};

type RankedProduct = { id: string; name: string; quantity: number };

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sales, setSales] = useState<DailySale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;
    const loadSales = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/sales/today", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudieron cargar las ventas del día");
        if (!Array.isArray(data)) throw new Error("Respuesta inválida de ventas del día");
        if (active) setSales(data as DailySale[]);
      } catch (err) {
        if (active) setSalesError(err instanceof Error ? err.message : "No se pudieron cargar las ventas del día");
      } finally {
        if (active) setSalesLoading(false);
      }
    };

    loadSales();
    return () => { active = false; };
  }, [router]);

  const { salesByMethod, ranking } = useMemo(() => {
    const totals = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    const products = new Map<string, RankedProduct>();

    for (const sale of sales) {
      if (sale.cancelled) continue;
      if (sale.paymentMethod === "efectivo") totals.efectivo += sale.total;
      else if (["debito", "credito", "mercadopago", "tarjeta"].includes(sale.paymentMethod)) totals.tarjeta += sale.total;
      else if (sale.paymentMethod === "transferencia") totals.transferencia += sale.total;

      for (const [index, item] of (sale.products || []).entries()) {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) continue;
        const product = item.product;
        const id = typeof product === "string" ? product : product?._id || `${sale._id}:${index}`;
        const name = typeof product === "string" ? "Producto sin nombre" : product?.name || "Producto eliminado";
        const existing = products.get(id);
        if (existing) existing.quantity += item.quantity;
        else products.set(id, { id, name, quantity: item.quantity });
      }
    }

    return {
      salesByMethod: totals,
      ranking: [...products.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es")),
    };
  }, [sales]);

  const maxSales = Math.max(...Object.values(salesByMethod));

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
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  <div key={label} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-sm text-slate-600">{label}</dt>
                    <dd className="mt-2 break-words text-lg font-semibold">{formatMoney(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="graficos-listados" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="graficos-listados" className="text-xl font-semibold">Gráficos y listados</h2>
            {salesLoading ? <p className="mt-4 text-slate-600">Cargando ventas...</p> : salesError ? (
              <p role="alert" className="mt-4 text-red-700">{salesError}</p>
            ) : (
              <div className="mt-5 space-y-6">
                <section aria-labelledby="ventas-metodo">
                  <h3 id="ventas-metodo" className="font-semibold">Ventas por método de pago</h3>
                  <p className="mt-1 text-sm text-slate-600">No incluye ventas fiadas.</p>
                  {maxSales === 0 && <p className="mt-3 text-sm text-slate-600">No hay ventas cobradas hoy.</p>}
                  <div className="mt-3 space-y-3">
                    {([
                      ["Efectivo", salesByMethod.efectivo],
                      ["Tarjeta", salesByMethod.tarjeta],
                      ["Transferencia", salesByMethod.transferencia],
                    ] as const).map(([label, amount]) => (
                      <div key={label}>
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span>{label}</span>
                          <span>{formatMoney(amount)}</span>
                        </div>
                        <div aria-hidden="true" className="mt-1 h-3 rounded bg-slate-100">
                          <div className="h-full rounded bg-slate-500" style={{ width: `${maxSales > 0 ? (amount / maxSales) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="ranking-productos">
                  <h3 id="ranking-productos" className="font-semibold">Productos más vendidos del día</h3>
                  {ranking.length === 0 ? <p className="mt-3 text-sm text-slate-600">No hay productos vendidos hoy.</p> : (
                    <ol className="mt-3 max-h-72 list-decimal space-y-2 overflow-y-auto pl-5">
                      {ranking.map((product) => (
                        <li key={product.id}>
                          <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="min-w-0 break-words">{product.name}</span>
                            <strong className="shrink-0">{product.quantity} u.</strong>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

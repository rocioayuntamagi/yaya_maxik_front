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

type WeeklyDay = {
  fecha: string;
  totalVentas: number;
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
type LowStockProduct = { name: string; category: string; stock: number };

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
const formatDay = (fecha: string) => fecha.split("-").reverse().join("/");

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sales, setSales] = useState<DailySale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState("");
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState("");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;
    const loadWeekly = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/dashboard/week", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudo cargar el resumen semanal");
        if (!Array.isArray(data) || data.length !== 7) throw new Error("Respuesta inválida del resumen semanal");
        if (active) setWeekly(data as WeeklyDay[]);
      } catch (err) {
        if (active) setWeeklyError(err instanceof Error ? err.message : "No se pudo cargar el resumen semanal");
      } finally {
        if (active) setWeeklyLoading(false);
      }
    };

    loadWeekly();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;
    const loadLowStock = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/products/low-stock", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudo cargar el stock bajo");
        if (!Array.isArray(data)) throw new Error("Respuesta inválida de stock bajo");
        const products = (data as LowStockProduct[])
          .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, "es"))
          .slice(0, 5);
        if (active) setLowStock(products);
      } catch (err) {
        if (active) setStockError(err instanceof Error ? err.message : "No se pudo cargar el stock bajo");
      } finally {
        if (active) setStockLoading(false);
      }
    };

    loadLowStock();
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

  const { ticketAverage, mostUsedMethod } = useMemo(() => {
    const activeSales = sales.filter((sale) => !sale.cancelled);
    const methods = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Fiado: 0 };
    let total = 0;

    for (const sale of activeSales) {
      total += sale.total;
      if (sale.paymentMethod === "efectivo") methods.Efectivo++;
      else if (["debito", "credito", "mercadopago", "tarjeta"].includes(sale.paymentMethod)) methods.Tarjeta++;
      else if (sale.paymentMethod === "transferencia") methods.Transferencia++;
      else if (sale.paymentMethod === "fiado") methods.Fiado++;
    }

    const mostUsed = Object.entries(methods).reduce<[string, number] | null>(
      (best, [label, count]) => count > 0 && (!best || count > best[1]) ? [label, count] : best,
      null
    );
    return {
      ticketAverage: activeSales.length ? total / activeSales.length : null,
      mostUsedMethod: mostUsed,
    };
  }, [sales]);

  const topProduct = ranking[0];
  const maxSales = Math.max(...Object.values(salesByMethod));
  const maxWeeklySales = Math.max(0, ...weekly.map((day) => day.totalVentas));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard del kiosco</h1>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="indicadores-diarios" className="min-w-0 rounded-lg border border-slate-200 bg-white p-5">
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

            <section aria-labelledby="indicadores-avanzados" className="mt-6 border-t border-slate-200 pt-4">
              <h3 id="indicadores-avanzados" className="font-semibold">Indicadores avanzados</h3>
              {salesLoading ? <p className="mt-3 text-sm text-slate-600">Cargando indicadores...</p> : salesError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{salesError}</p>
              ) : (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {([
                    ["Ticket promedio del día", ticketAverage === null ? "Sin ventas" : formatMoney(ticketAverage)],
                    ["Producto más vendido del día", topProduct ? `${topProduct.name} (${topProduct.quantity} u.)` : "Sin ventas"],
                    ["Método de pago más utilizado", mostUsedMethod
                      ? `${mostUsedMethod[0]} (${mostUsedMethod[1]} ${mostUsedMethod[1] === 1 ? "venta" : "ventas"})`
                      : "Sin ventas"],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <dt className="text-sm text-slate-600">{label}</dt>
                      <dd className="mt-2 break-words text-lg font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="font-semibold">Últimos 7 días</h3>
              {weeklyLoading ? <p className="mt-3 text-sm text-slate-600">Cargando resumen semanal...</p> : weeklyError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{weeklyError}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="text-slate-600">
                        <th scope="col" className="px-2 py-2 text-left font-medium">Fecha</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Ventas</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Fiado generado</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Fiado recuperado</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Gastos</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekly.map((day) => (
                        <tr key={day.fecha} className="border-t border-slate-100">
                          <td className="whitespace-nowrap px-2 py-2">{formatDay(day.fecha)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">{formatMoney(day.totalVentas)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">{formatMoney(day.fiadoGenerado)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">{formatMoney(day.fiadoRecuperado)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">{formatMoney(day.gastos)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">{formatMoney(day.balanceDia)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="graficos-listados" className="min-w-0 rounded-lg border border-slate-200 bg-white p-5">
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
            <section aria-labelledby="ventas-semana" className="mt-6 border-t border-slate-200 pt-4">
              <h3 id="ventas-semana" className="font-semibold">Ventas de los últimos 7 días</h3>
              {weeklyLoading ? <p className="mt-3 text-sm text-slate-600">Cargando ventas semanales...</p> : weeklyError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{weeklyError}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {weekly.map((day) => (
                    <div key={day.fecha}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>{formatDay(day.fecha)}</span>
                        <span>{formatMoney(day.totalVentas)}</span>
                      </div>
                      <div aria-hidden="true" className="mt-1 h-3 rounded bg-slate-100">
                        <div
                          className="h-full rounded bg-slate-500"
                          style={{ width: `${maxWeeklySales > 0 ? (Math.max(0, day.totalVentas) / maxWeeklySales) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="stock-bajo" className="mt-6 border-t border-slate-200 pt-4">
              <h3 id="stock-bajo" className="font-semibold">Productos con stock bajo</h3>
              {stockLoading ? <p className="mt-3 text-sm text-slate-600">Cargando productos...</p> : stockError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{stockError}</p>
              ) : lowStock.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">Todo en orden: no hay productos con stock bajo.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-200">
                  {lowStock.map((product, index) => (
                    <li key={`${product.name}-${product.category}-${index}`} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{product.name}</p>
                        <p className="text-slate-600">{product.category}</p>
                      </div>
                      <span className="shrink-0">Stock: {product.stock}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

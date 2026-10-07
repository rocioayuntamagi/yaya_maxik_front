"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Movimiento = {
  _id: string;
  paymentMethod: string;
  date?: string;
  createdAt?: string;
};

type Venta = Movimiento & { total: number };
type Pago = Movimiento & { amount: number };
type Gasto = Movimiento & { amount: number; category: string; description?: string };

type CierreDetalle = {
  cashRegister: { _id: string; openedAt: string; closedAt: string | null };
  totalsAtClose: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    fiadoGenerado: number;
    fiadoRecuperado: number;
    gastos: number;
    balanceFinal: number | null;
  };
  finalBalance: number | null;
  ventas: Venta[];
  pagos: Pago[];
  gastos: Gasto[];
};

const formatMoney = (amount: number | null | undefined) =>
  amount == null ? "Sin dato" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleString("es-AR") : "Sin fecha registrada";

const formatMovementDate = (movement: Movimiento) =>
  formatDate(movement.date || movement.createdAt);

export default function DetalleCierreDeCaja() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<CierreDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadDetail = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/cash/history/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo cargar el detalle del cierre");
        if (!data.cashRegister || !data.totalsAtClose || !Array.isArray(data.ventas) || !Array.isArray(data.pagos) || !Array.isArray(data.gastos)) {
          throw new Error("Respuesta inválida del detalle de cierre");
        }
        if (active) setDetail(data as CierreDetalle);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del cierre");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetail();
    return () => { active = false; };
  }, [id, router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <Link href="/caja/historial" className="text-sm font-semibold text-blue-700 hover:underline">
            Volver al historial
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Detalle del cierre de caja</h1>
        </header>

        {loading ? <p>Cargando detalle...</p> : error ? (
          <p role="alert" className="text-red-700">{error}</p>
        ) : detail && (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Datos de la caja</h2>
              <p className="mt-1 break-all text-sm text-slate-600">Caja: {detail.cashRegister._id}</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-slate-600">Apertura</dt>
                  <dd className="mt-1 font-medium">{formatDate(detail.cashRegister.openedAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Cierre</dt>
                  <dd className="mt-1 font-medium">{formatDate(detail.cashRegister.closedAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Balance final</dt>
                  <dd className="mt-1 font-semibold">{formatMoney(detail.finalBalance)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Totales del cierre</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ["Efectivo", detail.totalsAtClose.efectivo],
                  ["Tarjeta", detail.totalsAtClose.tarjeta],
                  ["Transferencia", detail.totalsAtClose.transferencia],
                  ["Fiado generado", detail.totalsAtClose.fiadoGenerado],
                  ["Fiado recuperado", detail.totalsAtClose.fiadoRecuperado],
                  ["Gastos", detail.totalsAtClose.gastos],
                  ["Balance final", detail.totalsAtClose.balanceFinal],
                ] as const).map(([label, amount]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <dt className="text-sm text-slate-600">{label}</dt>
                    <dd className="mt-2 break-all text-xl font-semibold">{formatMoney(amount)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Ventas del turno ({detail.ventas.length})</h2>
              {detail.ventas.length === 0 ? <p className="mt-4 text-slate-600">No hay ventas en este turno.</p> : (
                <ul className="mt-4 max-h-80 divide-y divide-slate-200 overflow-y-auto">
                  {detail.ventas.map(v => (
                    <li key={v._id} className="flex flex-wrap justify-between gap-2 py-3">
                      <span className="min-w-0 flex-1 break-words">Venta #{v._id.slice(-6)} · {formatMovementDate(v)} · {v.paymentMethod}</span>
                      <strong className="shrink-0">{formatMoney(v.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Pagos del turno ({detail.pagos.length})</h2>
              {detail.pagos.length === 0 ? <p className="mt-4 text-slate-600">No hay pagos en este turno.</p> : (
                <ul className="mt-4 max-h-80 divide-y divide-slate-200 overflow-y-auto">
                  {detail.pagos.map(p => (
                    <li key={p._id} className="flex flex-wrap justify-between gap-2 py-3">
                      <span className="min-w-0 flex-1 break-words">Pago #{p._id.slice(-6)} · {formatMovementDate(p)} · {p.paymentMethod}</span>
                      <strong className="shrink-0">{formatMoney(p.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Gastos del turno ({detail.gastos.length})</h2>
              {detail.gastos.length === 0 ? <p className="mt-4 text-slate-600">No hay gastos en este turno.</p> : (
                <ul className="mt-4 max-h-80 divide-y divide-slate-200 overflow-y-auto">
                  {detail.gastos.map(g => (
                    <li key={g._id} className="flex flex-wrap justify-between gap-2 py-3">
                      <span className="min-w-0 flex-1 break-words">{g.category}{g.description ? ` · ${g.description}` : ""} · {formatMovementDate(g)} · {g.paymentMethod}</span>
                      <strong className="shrink-0">{formatMoney(g.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

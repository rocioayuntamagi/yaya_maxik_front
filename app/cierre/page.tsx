"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Movimiento = {
  _id: string;
  paymentMethod: string;
  date?: string;
  createdAt?: string;
};

type Venta = Movimiento & { total: number };
type Pago = Movimiento & { amount: number };
type Gasto = Movimiento & { amount: number; category: string; description?: string };

type Preview = {
  cashRegisterId: string;
  totals: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    fiadoGenerado: number;
    fiadoRecuperado: number;
    gastos: number;
    balanceFinal: number;
  };
  ventas: Venta[];
  pagos: Pago[];
  gastos: Gasto[];
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

const formatDate = (movement: Movimiento) =>
  movement.date || movement.createdAt
    ? new Date(movement.date || movement.createdAt || "").toLocaleString("es-AR")
    : "Sin fecha";

export default function CierreDeCaja() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Cargar ventas del turno
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadPreview = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/cash/preview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo cargar la previsualización");
        if (active) setPreview(data as Preview);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar la previsualización");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();
    return () => { active = false; };
  }, [router]);

  // Exportar a Excel (simple CSV)
  const exportarExcel = () => {
    if (!preview) return;
    const filas = preview.ventas.map(v => `${v._id},${v.paymentMethod},${v.total}`);
    const contenido = ["ID,Medio de pago,Total", ...filas].join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cierre_del_dia.csv";
    link.click();
  };

  const cerrarCaja = async () => {
    if (closing || !window.confirm("¿Confirmás el cierre definitivo de la caja? No se puede deshacer.")) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setClosing(true);
    setCloseError("");
    try {
      const res = await fetch("http://localhost:4000/api/cash/close", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setCloseError(res.status === 409
          ? "No hay una caja abierta o la caja ya fue cerrada."
          : data.message || "No se pudo cerrar la caja.");
        return;
      }
      window.alert(data.message || "Caja cerrada correctamente");
      router.replace("/caja");
    } catch {
      setCloseError("No se pudo conectar con el servidor para cerrar la caja.");
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <p className="p-8">Cargando previsualización del cierre...</p>;
  if (error) return <p role="alert" className="p-8">{error}</p>;
  if (!preview) return null;

  const { totals, ventas, pagos, gastos } = preview;
  const resumen = [
    ["Efectivo", totals.efectivo],
    ["Tarjeta", totals.tarjeta],
    ["Transferencia", totals.transferencia],
    ["Fiado generado", totals.fiadoGenerado],
    ["Fiado recuperado", totals.fiadoRecuperado],
    ["Gastos", totals.gastos],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Previsualización del cierre de caja</h1>
          <p className="mt-2 text-sm text-slate-600">Caja: {preview.cashRegisterId}</p>
        </header>

        <section aria-label="Totales del turno" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumen.map(([label, amount]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{formatMoney(amount)}</p>
            </div>
          ))}
          <div className="rounded-lg bg-slate-900 p-5 text-white sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-slate-200">Balance final del turno</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(totals.balanceFinal)}</p>
          </div>
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={cerrarCaja}
            disabled={closing}
            className="rounded bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {closing ? "Cerrando caja..." : "Cerrar caja"}
          </button>
          {closeError && <p role="alert" className="text-red-700">{closeError}</p>}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Ventas del turno ({ventas.length})</h2>
            <button type="button" onClick={exportarExcel} className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">
              Exportar ventas (CSV)
            </button>
          </div>
          {ventas.length === 0 ? <p className="mt-4 text-slate-600">No hay ventas en este turno.</p> : (
            <ul className="mt-4 divide-y divide-slate-200">
              {ventas.map(v => (
                <li key={v._id} className="flex flex-wrap justify-between gap-2 py-3">
                  <span>Venta #{v._id.slice(-6)} · {formatDate(v)} · {v.paymentMethod}</span>
                  <strong>{formatMoney(v.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Pagos del turno ({pagos.length})</h2>
          {pagos.length === 0 ? <p className="mt-4 text-slate-600">No hay pagos en este turno.</p> : (
            <ul className="mt-4 divide-y divide-slate-200">
              {pagos.map(p => (
                <li key={p._id} className="flex flex-wrap justify-between gap-2 py-3">
                  <span>Pago #{p._id.slice(-6)} · {formatDate(p)} · {p.paymentMethod}</span>
                  <strong>{formatMoney(p.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Gastos del turno ({gastos.length})</h2>
          {gastos.length === 0 ? <p className="mt-4 text-slate-600">No hay gastos en este turno.</p> : (
            <ul className="mt-4 divide-y divide-slate-200">
              {gastos.map(g => (
                <li key={g._id} className="flex flex-wrap justify-between gap-2 py-3">
                  <span>{g.category}{g.description ? ` · ${g.description}` : ""} · {formatDate(g)} · {g.paymentMethod}</span>
                  <strong>{formatMoney(g.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Reference = { _id: string; name: string } | string | null;

type StockMovement = {
  _id: string;
  product: Reference;
  type: string;
  quantity: number;
  reason: string;
  user: Reference;
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  ingreso: "Ingreso",
  ajuste_positivo: "Ajuste positivo",
  ajuste_negativo: "Ajuste negativo",
  perdida: "Pérdida",
};

const referenceName = (reference: Reference, fallback: string) =>
  typeof reference === "string" ? reference : reference?.name || fallback;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin fecha" : date.toLocaleString("es-AR");
};

export default function StockMovementsPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadMovements = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/stock-movements", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudieron cargar los movimientos");
        if (!Array.isArray(data)) throw new Error("Respuesta inválida de movimientos de stock");
        const sorted = (data as StockMovement[]).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b._id.localeCompare(a._id)
        );
        if (active) setMovements(sorted);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar los movimientos");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMovements();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Movimientos de stock</h1>
        {loading ? <p className="mt-6 text-slate-600">Cargando movimientos...</p> : error ? (
          <p role="alert" className="mt-6 text-red-700">{error}</p>
        ) : movements.length === 0 ? (
          <p className="mt-6 text-slate-600">Todavía no hay movimientos de stock registrados.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Cantidad</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {movements.map((movement) => (
                  <tr key={movement._id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(movement.createdAt)}</td>
                    <td className="px-4 py-3">{referenceName(movement.product, "Producto no disponible")}</td>
                    <td className="whitespace-nowrap px-4 py-3">{typeLabels[movement.type] || movement.type}</td>
                    <td className="px-4 py-3 text-right">{movement.quantity.toLocaleString("es-AR", { maximumFractionDigits: 10 })}</td>
                    <td className="max-w-xs break-words px-4 py-3">{movement.reason}</td>
                    <td className="px-4 py-3">{referenceName(movement.user, "Usuario no disponible")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

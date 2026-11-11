"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { _id: string; name: string; category: string; stock: number };
type MovementType = "ingreso" | "ajuste_positivo" | "ajuste_negativo" | "perdida";

const movementTypes: { value: MovementType; label: string }[] = [
  { value: "ingreso", label: "Ingreso" },
  { value: "ajuste_positivo", label: "Ajuste positivo" },
  { value: "ajuste_negativo", label: "Ajuste negativo" },
  { value: "perdida", label: "Pérdida" },
];

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [product, setProduct] = useState("");
  const [type, setType] = useState<MovementType | "">("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    const loadProducts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(data.message || "No se pudieron cargar los productos");
        if (!Array.isArray(data)) throw new Error("Respuesta inválida de productos");
        if (active) {
          const sorted = (data as Product[]).sort((a, b) => a.name.localeCompare(b.name, "es"));
          setProducts(sorted);
          const requestedProduct = new URLSearchParams(window.location.search).get("product");
          if (requestedProduct && sorted.some((item) => item._id === requestedProduct)) {
            setProduct(requestedProduct);
          }
        }
      } catch (err) {
        if (active) setProductsError(err instanceof Error ? err.message : "No se pudieron cargar los productos");
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");

    const amount = Number(quantity);
    if (!product || !type || !reason.trim()) {
      setError("Completá producto, tipo y motivo para registrar el movimiento.");
      return;
    }
    if (!quantity.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("La cantidad debe ser un número mayor a cero.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:4000/api/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product, type, quantity: amount, reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(data.message || "No se pudo registrar el movimiento");
      setSuccess("Movimiento de stock registrado correctamente.");
      setProduct("");
      setType("");
      setQuantity("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Registrar movimiento de stock</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-5">
          <div>
            <label htmlFor="movement-product" className="mb-1 block text-sm font-medium">Producto</label>
            <select
              id="movement-product"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              disabled={productsLoading || products.length === 0}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Seleccioná un producto</option>
              {products.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} - {item.category} (stock: {item.stock})
                </option>
              ))}
            </select>
            {productsLoading ? <p className="mt-2 text-sm text-slate-600">Cargando productos...</p> : productsError ? (
              <p role="alert" className="mt-2 text-sm text-red-700">{productsError}</p>
            ) : products.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No hay productos disponibles para registrar movimientos.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="movement-type" className="mb-1 block text-sm font-medium">Tipo de movimiento</label>
            <select
              id="movement-type"
              value={type}
              onChange={(event) => setType(event.target.value as MovementType | "")}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Seleccioná un tipo</option>
              {movementTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="movement-quantity" className="mb-1 block text-sm font-medium">Cantidad</label>
            <input
              id="movement-quantity"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="movement-reason" className="mb-1 block text-sm font-medium">Motivo</label>
            <textarea
              id="movement-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700">{success}</p>}
          <button
            type="submit"
            disabled={submitting || productsLoading || products.length === 0}
            className="rounded bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Registrando..." : "Registrar movimiento"}
          </button>
        </form>
      </div>
    </main>
  );
}

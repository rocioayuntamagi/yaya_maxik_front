"use client";

import { useEffect, useState } from "react";
import styles from "./editar.module.css";
import { useRouter } from "next/navigation";

export default function EditarCompraClient({ id }: { id: string }) {
  const router = useRouter();

  const [purchase, setPurchase] = useState<any>(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      // Obtener compra
      const res = await fetch(`http://localhost:4000/api/purchases/${id}`, {
        headers,
      });
      const data = await res.json();
      setPurchase(data);

      // Obtener productos
      const resProd = await fetch("http://localhost:4000/api/products", {
        headers,
      });
      setProducts(await resProd.json());
    };

    fetchData();
  }, [id]);

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...purchase.items];
    updated[index][field] = value;
    setPurchase({ ...purchase, items: updated });
  };

  const addItem = () => {
    setPurchase({
      ...purchase,
      items: [...purchase.items, { product: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const updated = purchase.items.filter((_: any, i: number) => i !== index);
    setPurchase({ ...purchase, items: updated });
  };

  const total = purchase?.items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      items: purchase.items,
      total,
    };

    const res = await fetch(`http://localhost:4000/api/purchases/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/compras/${id}`);
    } else {
      alert("Error al actualizar compra");
    }
  };

  if (!purchase) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Editar compra</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {purchase.items.map((item: any, index: number) => (
          <div key={index} className={styles.row}>
            <select
              className={styles.select}
              value={item.product?._id || item.product}
              onChange={(e) =>
                updateItem(index, "product", e.target.value)
              }
            >
              <option value="">Seleccionar producto</option>
              {products.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              className={styles.input}
              value={item.quantity}
              onChange={(e) =>
                updateItem(index, "quantity", Number(e.target.value))
              }
            />

            <input
              type="number"
              className={styles.input}
              value={item.price}
              onChange={(e) =>
                updateItem(index, "price", Number(e.target.value))
              }
            />

            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeItem(index)}
            >
              X
            </button>
          </div>
        ))}

        <button type="button" className={styles.addBtn} onClick={addItem}>
          + Agregar producto
        </button>

        <h2 className={styles.total}>Total: ${total}</h2>

        <button className={styles.saveBtn} disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(`/compras/${id}`)}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

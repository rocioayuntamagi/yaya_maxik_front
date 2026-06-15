"use client";

import { useEffect, useState } from "react";
import styles from "./compra.module.css";
import { useRouter } from "next/navigation";

export default function RegistrarCompra({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [provider, setProvider] = useState<any>(null);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Cargar proveedor y productos
  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      const resProv = await fetch(
        `http://localhost:4000/api/providers/${id}`,
        { headers }
      );
      setProvider(await resProv.json());

      const resProd = await fetch("http://localhost:4000/api/products", {
        headers,
      });
      setProducts(await resProd.json());
    };

    fetchData();
  }, [id]);

  const addItem = () => {
    setItems([...items, { product: "", quantity: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      provider: id,
      items,
      total,
      date: new Date(),
    };

    const res = await fetch("http://localhost:4000/api/purchases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/proveedores/${id}`);
    } else {
      alert("Error al registrar compra");
    }
  };

  if (!provider) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Registrar compra a {provider.name}</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.subtitle}>Productos</h2>

        {items.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <select
              className={styles.select}
              value={item.product}
              onChange={(e) =>
                updateItem(index, "product", e.target.value)
              }
              required
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
              placeholder="Cantidad"
              value={item.quantity}
              onChange={(e) =>
                updateItem(index, "quantity", Number(e.target.value))
              }
              required
            />

            <input
              type="number"
              className={styles.input}
              placeholder="Precio compra"
              value={item.price}
              onChange={(e) =>
                updateItem(index, "price", Number(e.target.value))
              }
              required
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
          {loading ? "Guardando..." : "Registrar compra"}
        </button>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(`/proveedores/${id}`)}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

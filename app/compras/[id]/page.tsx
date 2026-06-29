"use client";

import { useEffect, useState } from "react";
import styles from "./compra.module.css";
import { useRouter } from "next/navigation";

export default function VerCompra({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [purchase, setPurchase] = useState<any>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    const fetchPurchase = async () => {
      const res = await fetch(`http://localhost:4000/api/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setPurchase(data);
    };

    fetchPurchase();
  }, [id]);

  if (!purchase) return <div className={styles.loading}>Cargando compra...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Compra #{purchase._id.slice(-6)}</h1>

      {/* DATOS PRINCIPALES */}
      <section className={styles.card}>
        <div className={styles.info}>
          <strong>Proveedor:</strong> {purchase.provider?.name}
        </div>
        <div className={styles.info}>
          <strong>Fecha:</strong>{" "}
          {new Date(purchase.date).toLocaleDateString()}
        </div>
        <div className={styles.info}>
          <strong>Total:</strong> ${purchase.total}
        </div>
      </section>

      {/* ITEMS DE LA COMPRA */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Productos comprados</h2>

        <div className={styles.table}>
          {purchase.items.map((item: any, index: number) => (
            <div key={index} className={styles.row}>
              <div>{item.product?.name}</div>
              <div>{item.quantity} u.</div>
              <div>${item.price}</div>
              <div>${item.quantity * item.price}</div>
            </div>
          ))}
        </div>
      </section>

      <button
  className={styles.deleteBtn}
  onClick={async () => {
    if (!confirm("¿Eliminar esta compra? Esta acción no se puede deshacer.")) return;

    const res = await fetch(`http://localhost:4000/api/purchases/${purchase._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      router.push(`/proveedores/${purchase.provider._id}`);
    } else {
      alert("Error al eliminar compra");
    }
  }}
>
  Eliminar compra
</button>


      <button className={styles.backBtn} onClick={() => router.back()}>
        Volver
      </button>
    </div>
  );
}

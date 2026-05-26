"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Deudas() {
  const router = useRouter();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const [clients, setClients] = useState<any[]>([]);

  // Proteger ruta
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) router.push("/login");
  }, []);

  // Cargar clientes
  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("http://localhost:4000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // Filtrar solo los que deben plata
      const debtors = data.filter((c: any) => c.balance < 0);

      setClients(debtors);
    };

    fetchClients();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={() => router.push("/caja")}
        style={{
          padding: "10px 15px",
          background: "gray",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Volver a Caja
      </button>

      <h1>Clientes con Deuda</h1>

      {clients.length === 0 && (
        <p>No hay clientes con deudas pendientes.</p>
      )}

      {clients.map((c) => (
        <div
          key={c._id}
          style={{
            padding: 15,
            borderBottom: "1px solid #ddd",
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <strong>{c.name}</strong>
            <br />
            Debe:{" "}
            <strong style={{ color: "red" }}>
              ${Math.abs(c.balance)}
            </strong>
          </div>

          <button
            onClick={() => router.push(`/deudas/${c._id}`)}
            style={{
              padding: "8px 12px",
              background: "blue",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Ver detalle
          </button>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DetalleDeuda() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const [client, setClient] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);

  // Estados para registrar pago
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // -------------------------
  // PROTEGER RUTA
  // -------------------------
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) router.push("/login");
  }, []);

  // -------------------------
  // CARGAR CLIENTE
  // -------------------------
  useEffect(() => {
    const fetchClient = async () => {
      const res = await fetch(`http://localhost:4000/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setClient(data);
    };

    fetchClient();
  }, [id]);

  // -------------------------
  // CARGAR VENTAS FIADAS
  // -------------------------
  useEffect(() => {
    const fetchSales = async () => {
      const res = await fetch(
        `http://localhost:4000/api/sales?customer=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      // Filtrar solo ventas fiadas
      const fiadas = data.filter(
        (s: any) => s.paymentMethod === "fiado"
      );

      setSales(fiadas);
    };

    fetchSales();
  }, [id]);

  // -------------------------
  // REGISTRAR PAGO
  // -------------------------
  const registerPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    const res = await fetch("http://localhost:4000/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer: id,
        amount: Number(paymentAmount),
      }),
    });

    const data = await res.json();

    alert("Pago registrado correctamente");

    // 🔥 Actualizar balance con el valor REAL del backend
    setClient((prev: any) => ({
      ...prev,
      balance: data.newBalance,
    }));

    setPaymentAmount("");
    setShowPayment(false);
  };

  if (!client) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      {/* VOLVER */}
      <button
        onClick={() => router.push("/deudas")}
        style={{
          padding: "10px 15px",
          background: "gray",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Volver
      </button>

      {/* TITULO */}
      <h1>Deuda de {client.name}</h1>

      {/* SALDO */}
      <h2>
        Saldo actual:{" "}
        <span style={{ color: client.balance < 0 ? "red" : "green" }}>
          ${Math.abs(client.balance)}
        </span>
      </h2>

      {/* BOTÓN REGISTRAR PAGO */}
      <button
        onClick={() => setShowPayment(true)}
        style={{
          padding: "10px 15px",
          background: "green",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginTop: 20,
        }}
      >
        Registrar pago
      </button>

      {/* FORMULARIO DE PAGO */}
      {showPayment && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            border: "1px solid #ccc",
            background: "#f9f9f9",
          }}
        >
          <h3>Registrar pago</h3>

          <input
            type="number"
            placeholder="Monto"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            style={{ padding: 10, width: "100%", marginBottom: 10 }}
          />

          <button
            onClick={registerPayment}
            style={{
              padding: "10px 15px",
              background: "blue",
              color: "white",
              border: "none",
              cursor: "pointer",
              marginRight: 10,
            }}
          >
            Confirmar pago
          </button>

          <button
            onClick={() => setShowPayment(false)}
            style={{
              padding: "10px 15px",
              background: "gray",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* LISTA DE VENTAS FIADAS */}
      <h3 style={{ marginTop: 30 }}>Ventas fiadas</h3>

      {sales.length === 0 && <p>No tiene ventas fiadas registradas.</p>}

      {sales.map((s) => (
        <div
          key={s._id}
          style={{
            padding: 15,
            borderBottom: "1px solid #ddd",
            marginTop: 10,
          }}
        >
          <strong>Fecha:</strong>{" "}
          {new Date(s.createdAt).toLocaleString("es-AR")}
          <br />
          <strong>Total:</strong> ${s.total}
          <br />
          <strong>Productos:</strong>
          <ul>
            {s.products.map((p: any, i: number) => (
              <li key={i}>
                {p.name} x {p.quantity} — ${p.price}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

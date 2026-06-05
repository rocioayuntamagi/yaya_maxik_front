"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CierreDeCaja() {
  const router = useRouter();

 type Venta = {
  id: number;
  cliente: string;
  total: number;
  fecha: string;        // ISO date
  metodoPago: string;   // efectivo / tarjeta / cuenta corriente
};


const [ventas, setVentas] = useState<Venta[]>([]);

  const [totalDia, setTotalDia] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar ventas del día
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchVentas = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/sales/today", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setVentas(data);
          const total = data.reduce((acc, v) => acc + v.total, 0);
          setTotalDia(total);
        }
      } catch (error) {
        console.error("Error cargando ventas del día:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  // Exportar a Excel (simple CSV)
  const exportarExcel = () => {
    const filas = ventas.map(v => `${v.id},${v.cliente},${v.total}`);
    const contenido = ["ID,Cliente,Total", ...filas].join("\n");

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "cierre_del_dia.csv";
    link.click();
  };

  // Confirmar cierre
  const confirmarCierre = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return <p style={{ padding: 30 }}>Cargando cierre del día...</p>;

  return (
    <div style={{ padding: 30 }}>
      <h1>Cierre de Caja</h1>

      <h3 style={{ marginTop: 20 }}>Ventas del día:</h3>

      {ventas.length === 0 ? (
        <p>No hay ventas registradas hoy.</p>
      ) : (
        <ul>
          {ventas.map(v => (
            <li key={v.id}>
              Venta #{v.id} — Cliente: {v.cliente} — Total: ${v.total}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 20 }}>Total del día: ${totalDia}</h2>

      <button
        onClick={exportarExcel}
        style={{
          marginTop: 30,
          padding: "12px 20px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        📄 Exportar Excel
      </button>

      <button
        onClick={confirmarCierre}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          fontSize: "18px",
          background: "red",
          color: "white",
          cursor: "pointer",
        }}
      >
        ✔ Confirmar cierre y cerrar sesión
      </button>
    </div>
  );
}

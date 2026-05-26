"use client";

import { useRouter } from "next/navigation";

export default function Configuracion() {
  const router = useRouter();

  return (
    <div style={{ padding: 30 }}>
      <h1>Configuración</h1>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => router.push("/deudas")}
          style={{
            padding: "15px 20px",
            fontSize: "18px",
            width: "100%",
            marginBottom: "15px",
            cursor: "pointer",
          }}
        >
          📘 Clientes deudores
        </button>

        <button
          onClick={() => router.push("/productos")}
          style={{
            padding: "15px 20px",
            fontSize: "18px",
            width: "100%",
            marginBottom: "15px",
            cursor: "pointer",
          }}
        >
          📦 Productos (agregar / modificar)
        </button>

        <button
          onClick={() => router.push("/proveedores")}
          style={{
            padding: "15px 20px",
            fontSize: "18px",
            width: "100%",
            marginBottom: "15px",
            cursor: "pointer",
          }}
        >
          🏭 Proveedores
        </button>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "15px 20px",
            fontSize: "18px",
            width: "100%",
            marginTop: "30px",
            cursor: "pointer",
            background: "#ccc",
          }}
        >
          ⬅️ Volver
        </button>
      </div>
    </div>
  );
}

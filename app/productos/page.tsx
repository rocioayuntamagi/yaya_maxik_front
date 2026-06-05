"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Tipo de producto
type Producto = {
  _id: string;
  name: string;
  price: number;
  stock: number;
};

export default function ProductosPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar productos
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: Producto[] = await res.json();
        setProductos(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Crear producto
  const crearProducto = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:4000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        stock: Number(stock),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setProductos([...productos, data.product]);
      setName("");
      setPrice("");
      setStock("");
    } else {
      alert(data.message || "Error al crear producto");
    }
  };

  if (loading) return <p style={{ padding: 30 }}>Cargando productos...</p>;

  return (
    <div style={{ padding: 30 }}>
      <h1>Productos</h1>

      {/* Formulario */}
      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #ccc",
          borderRadius: 8,
          width: 350,
        }}
      >
        <h3>Agregar producto</h3>

        <input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        />

        <input
          placeholder="Precio"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        />

        <input
          placeholder="Stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        />

        <button
          onClick={crearProducto}
          style={{
            marginTop: 15,
            padding: "10px 20px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          ➕ Crear producto
        </button>
      </div>

      {/* Lista */}
      <h2 style={{ marginTop: 30 }}>Listado</h2>

      {productos.length === 0 ? (
        <p>No hay productos cargados.</p>
      ) : (
        <ul>
          {productos.map((p) => (
            <li key={p._id}>
              {p.name} — ${p.price} — Stock: {p.stock}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          cursor: "pointer",
          background: "#ccc",
        }}
      >
        ⬅ Volver
      </button>
    </div>
  );
}

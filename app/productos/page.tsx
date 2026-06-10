"use client";

import { useState, useEffect } from "react";
import ProductForm from "./productForm";
import styles from "./productos.module.css";

// ⭐ TIPO DE PRODUCTO (evita todos tus errores)
type Producto = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
};

export default function ProductosPage() {
  // ⭐ TIPADO CORRECTO DEL ESTADO
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // ⭐ CARGAR PRODUCTOS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:4000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        // ⭐ VALIDACIÓN + TIPADO
        if (Array.isArray(data)) {
          const productosValidos = data.filter(
            (p: any) => p && typeof p.name === "string"
          );
          setProductos(productosValidos);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ⭐ FILTRO DE BÚSQUEDA
  const productosFiltrados = productos.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ⭐ CUANDO SE CREA UN PRODUCTO DESDE EL MODAL
  const handleProductCreated = (nuevoProducto: Producto) => {
    setProductos((prev) => [...prev, nuevoProducto]);
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <input
          className={styles.search}
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          ➕ Agregar producto
        </button>
      </div>

      {/* GRILLA */}
      {loading ? (
        <p className={styles.loading}>Cargando productos...</p>
      ) : (
        <div className={styles.grid}>
          {productosFiltrados.map((p) => (
            <div key={p._id} className={styles.card}>
              <h3>{p.name}</h3>
              <p className={styles.price}>${p.price}</p>
              <p className={styles.stock}>Stock: {p.stock}</p>

              <div className={styles.cardActions}>
                <button className={styles.editBtn}>Editar</button>
                <button className={styles.deleteBtn}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <ProductForm
              onClose={() => setShowModal(false)}
              onProductCreated={handleProductCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

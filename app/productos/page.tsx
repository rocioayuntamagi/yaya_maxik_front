"use client";

import { useState, useEffect, useRef } from "react";
import ProductForm from "./productForm";
import ProductDetail from "./productDetail"; // ⭐ nuevo componente
import styles from "./productos.module.css";
import { Producto } from "../types/producto";
import { useRouter } from "next/navigation";


export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Modal para crear
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ⭐ Modal para ver detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const [search, setSearch] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();

  // ⭐ Animación de partículas (NO TOCADO)
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const DOTS = 70;
    const dots = Array.from({ length: DOTS }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const CONN_DIST = 130;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONN_DIST) {
            const opacity = (1 - dist / CONN_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(108,123,255,${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,123,255,${d.alpha})`;
        ctx.fill();

        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ⭐ Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:4000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
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

  // ⭐ Filtrar productos
  const productosFiltrados = productos.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ⭐ Cuando se crea un producto
  const handleProductCreated = (nuevoProducto: Producto) => {
    setProductos((prev) => [...prev, nuevoProducto]);
  };

  const handleProductUpdate = async (updatedProduct: Producto) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:4000/api/products/${updatedProduct._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedProduct),
    });

    const data = await res.json();

    // ⭐ Actualizar el estado local
    setProductos((prev) =>
      prev.map((p) => (p._id === data._id ? data : p))
    );

  } catch (err) {
    console.error("Error actualizando producto:", err);
  }
};

const handleProductDelete = async (id: string) => {
  try {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:4000/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // actualizar estado local
    setProductos((prev) => prev.filter((p) => p._id !== id));
  } catch (err) {
    console.error("Error eliminando producto:", err);
  }
};


  return (
    <div className={styles.page}>

      <button
  className={styles.circleBtn}
  onClick={() => router.push("/caja")}
>
  ←
</button>

      <canvas ref={canvasRef} className={styles.canvas} />

      {/* HEADER */}
      <div className={styles.header}>
        <input
          className={styles.search}
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className={styles.addBtn}
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Agregar producto
        </button>
      </div>

      {/* GRILLA */}
      {loading ? (
        <p className={styles.loading}>Cargando productos...</p>
      ) : (
        <div className={styles.grid}>
          {productosFiltrados.map((p) => (
            <div
              key={p._id}
              className={styles.card}
              onClick={() => {
                setSelectedProduct(p);
                setShowDetailModal(true);
              }}
            >
              <h3>{p.name}</h3>
              <p className={styles.price}>${p.price}</p>
              <p className={styles.stock}>Stock: {p.stock}</p>
              <p className={styles.cardHint}>Haga click para ver producto</p>

              <div className={styles.cardActions}>
                <button
  className={styles.deleteBtn}
  onClick={(e) => {
    e.stopPropagation();
    handleProductDelete(p._id!);
  }}
>
  Eliminar
</button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA CREAR */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <ProductForm
              onClose={() => setShowCreateModal(false)}
              onProductCreated={handleProductCreated}
            />
          </div>
        </div>
      )}

      {/* MODAL PARA VER DETALLE */}
      {showDetailModal && selectedProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setSelectedProduct(null);
            setShowDetailModal(false);
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <ProductDetail
              producto={selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                setShowDetailModal(false);
              }}
              onSave={handleProductUpdate} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

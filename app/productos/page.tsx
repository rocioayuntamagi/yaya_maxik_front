"use client";

import { useState, useEffect, useRef } from "react";
import ProductForm from "./productForm";
import ProductDetail from "./productDetail"; // ⭐ nuevo componente
import styles from "./productos.module.css";
import { Producto } from "../types/producto";
import { useRouter } from "next/navigation";

// ⭐ Normaliza el nombre de categoría para agrupar sin duplicar por mayúsculas/minúsculas
const categoryKey = (cat?: string) => (cat || "Sin categoría").trim().toLowerCase();
const categoryLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);


export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Modal para crear
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ⭐ Modal para ver detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const [search, setSearch] = useState("");

  // ⭐ Categoría seleccionada (abre el popup a pantalla completa)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

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

  // ⭐ Cerrar popup de categoría con ESC
  useEffect(() => {
    if (!selectedCategory) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCategory(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedCategory]);

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

  // ⭐ Filtrar productos (búsqueda global, top de la página)
  const productosFiltrados = productos.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ⭐ Agrupar por categoría (normalizada) para armar los tiles y sus contadores
  const productosPorCategoria = productosFiltrados.reduce((acc, p) => {
    const key = categoryKey(p.category);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Producto[]>);

  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) =>
    a.localeCompare(b, "es")
  );

  // ⭐ Productos de la categoría abierta en el popup, con su propio buscador
  const productosDeCategoria = selectedCategory
    ? (productosPorCategoria[selectedCategory] || []).filter((p) =>
        p.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : [];

  const hayBusquedaGlobal = search.trim() !== "";

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

      {!selectedCategory && (
        <button
          className={styles.circleBtn}
          onClick={() => router.push("/caja")}
        >
          ←
        </button>
      )}

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

      {loading ? (
        <p className={styles.loading}>Cargando productos...</p>
      ) : categoriasOrdenadas.length === 0 ? (
        <p className={styles.loading}>No se encontraron productos.</p>
      ) : hayBusquedaGlobal ? (
        // ⭐ Mientras hay texto en el buscador, se muestran los resultados
        // directamente agrupados por categoría (sin pasar por los tiles)
        categoriasOrdenadas.map((key) => (
          <div key={key} style={{ marginBottom: 32 }}>
            <h2
              style={{
                margin: "24px 0 12px 0",
                fontSize: "1.2rem",
                color: "#e8eaf0",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: 8,
              }}
            >
              {categoryLabel(key)}
              <span style={{ opacity: 0.5, fontSize: "0.85rem", marginLeft: 8 }}>
                ({productosPorCategoria[key].length})
              </span>
            </h2>

            <div className={styles.grid}>
              {productosPorCategoria[key].map((p) => (
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
          </div>
        ))
      ) : (
        // ⭐ TILES DE CATEGORÍA (vista por defecto, sin búsqueda activa)
        <div className={styles.grid}>
          {categoriasOrdenadas.map((key) => (
            <div
              key={key}
              className={styles.card}
              onClick={() => {
                setSelectedCategory(key);
                setCategorySearch("");
              }}
            >
              <h3>{categoryLabel(key)}</h3>
              <p className={styles.stock}>
                {productosPorCategoria[key].length} producto
                {productosPorCategoria[key].length !== 1 ? "s" : ""}
              </p>
              <p className={styles.cardHint}>Haga click para ver la categoría</p>
            </div>
          ))}
        </div>
      )}

      {/* POPUP DE CATEGORÍA — pantalla completa */}
      {selectedCategory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#0b0d14",
            zIndex: 9000,
            overflowY: "auto",
            padding: "24px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h1 style={{ color: "#e8eaf0", margin: 0 }}>
              {categoryLabel(selectedCategory)}
            </h1>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                className={styles.search}
                placeholder="Buscar en esta categoría..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />

              <button
                className={styles.addBtn}
                onClick={() => setShowCreateModal(true)}
              >
                ➕ Agregar producto
              </button>

              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e8eaf0",
                  fontSize: 18,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {productosDeCategoria.length === 0 ? (
            <p className={styles.loading}>No hay productos en esta categoría.</p>
          ) : (
            <div className={styles.grid}>
              {productosDeCategoria.map((p) => (
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
        </div>
      )}

      {/* MODAL PARA CREAR */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          style={{ zIndex: 9500 }}
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
          style={{ zIndex: 9500 }}
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
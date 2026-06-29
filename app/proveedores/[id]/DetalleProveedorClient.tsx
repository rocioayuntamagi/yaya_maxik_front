"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./detalle.module.css";
import { useRouter } from "next/navigation";

export default function DetalleProveedorClient({ id }: { id: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [provider, setProvider] = useState<any>(null);
  const [purchases, setPurchases] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ── Animación partículas ──
  useEffect(() => {
     const canvas = canvasRef.current;
  if (!canvas) return; // ← evita el error

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 70 }, () => ({
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
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(108,123,255,${(1 - dist / CONN_DIST) * 0.18})`;
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

  // ── Cargar datos ──
  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      const resProv = await fetch(
        `http://localhost:4000/api/providers/${id}`,
        { headers }
      );
      setProvider(await resProv.json());

      const resPurch = await fetch(
        `http://localhost:4000/api/purchases/provider/${id}`,
        { headers }
      );
      setPurchases(await resPurch.json());
    };

    fetchData();
  }, [id]);

  if (!provider) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => router.push("/proveedores")}>
          ← Volver
        </button>

        <div className={styles.header}>
  <h1 className={styles.title}>{provider.name}</h1>

{/* ELIMINAR PROVEEDOR */}
  <button
    className={styles.deleteTopBtn}
    onClick={() => setShowDeletePopup(true)}
  >
    Eliminar
  </button>

{showDeletePopup && (
  <div className={styles.popupOverlay}>
    <div className={styles.popupBox}>
      <h3>¿Seguro que querés eliminar este proveedor?</h3>
      <p>Esta acción no se puede deshacer.</p>

      {/* Si hay error, lo mostramos acá */}
      {deleteError && (
        <div className={styles.errorMessage}>
          {deleteError}
        </div>
      )}

      <div className={styles.popupActions}>
        <button
          className={styles.confirmBtn}
          onClick={async () => {
            const res = await fetch(
              `http://localhost:4000/api/providers/${provider._id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (res.ok) {
              router.push("/proveedores");
            } else {
              const data = await res.json();
              setDeleteError(data.message ?? "Error al eliminar proveedor");
            }
          }}
        >
          Sí, eliminar
        </button>

        <button
          className={styles.cancelBtn}
          onClick={() => {
            setDeleteError(null);
            setShowDeletePopup(false);
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}


</div>


        {/* DATOS DEL PROVEEDOR */}
        <section className={styles.card}>
          <div className={styles.subtitle}>Datos del proveedor</div>
          <div className={styles.info}>📞 {provider.phone || "Sin teléfono"}</div>
          <div className={styles.info}>📧 {provider.email || "Sin email"}</div>
          <div className={styles.info}>📍 {provider.address || "Sin dirección"}</div>
          <div className={styles.info}>🏷 {provider.category || "Sin rubro"}</div>

          <button
            className={styles.buyBtn}
            onClick={() => router.push(`/proveedores/${id}/compra`)}
          >
            Registrar compra
          </button>
        </section>


        {/* HISTORIAL */}
        <section className={styles.section}>
          <div className={styles.subtitle}>Historial de compras</div>

          {purchases.length === 0 ? (
            <p className={styles.empty}>
              Este proveedor no tiene compras registradas.
            </p>
          ) : (
            <div className={styles.table}>
              {purchases.map((p: any) => (
                <div key={p._id} className={styles.row}>
                  <span>{new Date(p.date).toLocaleDateString("es-AR")}</span>
                  <span>${(p.total ?? 0).toLocaleString("es-AR")}</span>

                  <span>{p.items.length} producto{p.items.length !== 1 ? "s" : ""}</span>
                  <button
                    className={styles.viewBtn}
                    onClick={() => router.push(`/compras/${p._id}`)}
                  >
                    Ver compra
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

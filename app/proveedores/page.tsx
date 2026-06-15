"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./proveedores.module.css";
import { useRouter } from "next/navigation";

export default function ProveedoresPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ── Animación partículas ──
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
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
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

  // ── Cargar proveedores ──
  useEffect(() => {
    const fetchProviders = async () => {
      const res = await fetch("http://localhost:4000/api/providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProviders(data);
    };
    fetchProviders();
  }, []);

  const filtered = providers.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.content}>
        <h1 className={styles.title}>Proveedores</h1>
        <p className={styles.subtitle}>
          {filtered.length} proveedor{filtered.length !== 1 ? "es" : ""} registrado
          {filtered.length !== 1 ? "s" : ""}
        </p>

        {/* TOPBAR */}
        <div className={styles.topbar}>
          <input
            className={styles.search}
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={styles.addBtn}
            onClick={() => router.push("/proveedores/nuevo")}
          >
            + Agregar proveedor
          </button>
        </div>

        {/* LISTADO */}
        <div className={styles.list}>
          {filtered.map((prov: any) => (
            <div key={prov._id} className={styles.card}>
              <div className={styles.name}>{prov.name}</div>
              <div className={styles.info}>📞 {prov.phone || "Sin teléfono"}</div>
              <div className={styles.info}>📧 {prov.email || "Sin email"}</div>

              <div className={styles.actions}>
                <button
                  className={styles.viewBtn}
                  onClick={() => router.push(`/proveedores/${prov._id}`)}
                >
                  Ver detalles
                </button>
                <button
                  className={styles.buyBtn}
                  onClick={() => router.push(`/proveedores/${prov._id}/compra`)}
                >
                  Registrar compra
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
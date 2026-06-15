"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./nuevo.module.css";
import { useRouter } from "next/navigation";

export default function NuevoProveedor() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("http://localhost:4000/api/providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, phone, email, address, category }),
    });

    setLoading(false);
    if (res.ok) router.push("/proveedores");
    else alert("Error al crear proveedor");
  };

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.content}>
        <h1 className={styles.title}>Agregar proveedor</h1>
        <p className={styles.subtitle}>Completá los datos del nuevo proveedor</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>Nombre</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className={styles.label}>Teléfono</label>
          <input
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className={styles.label}>Dirección</label>
          <input
            className={styles.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <label className={styles.label}>Rubro</label>
          <input
            className={styles.input}
            placeholder="Bebidas, limpieza, almacén..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button className={styles.saveBtn} disabled={loading}>
            {loading ? "Guardando..." : "Guardar proveedor"}
          </button>

          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/proveedores")}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
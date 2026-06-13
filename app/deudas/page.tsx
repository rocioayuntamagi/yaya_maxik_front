"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./deudas.module.css";

type Cliente = {
  _id: string;
  name: string;
  balance: number;
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function ClientPopup({ client, onClose }: { client: Cliente; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState("");

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Cargar ventas fiadas del cliente
  useEffect(() => {
    const fetchDebt = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:4000/api/deudas/${client._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error cargando deuda:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebt();
  }, [client]);

  const total = items.reduce((acc, i) => acc + i.total, 0);

  const markAsPaid = async (saleId: string) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:4000/api/deudas/pagar/${saleId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    setItems((prev) => prev.filter((i) => i.saleId !== saleId));
  };

  const handlePartialPayment = async () => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:4000/api/deudas/pago-parcial/${client._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: Number(partial) }),
    });

    setPartial("");
    onClose();
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>

        {/* HEADER DEL POPUP (tu diseño original) */}
        <div className={styles.popupHeader}>
          <div>
            <div className={styles.popupName}>{client.name}</div>
            <div className={styles.popupTotalLabel}>Deuda total</div>
            <div className={styles.popupTotal}>
              ${total.toLocaleString("es-AR")}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* CONTENIDO REAL DE LA DEUDA */}
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            Este cliente no tiene ventas fiadas registradas.
          </p>
        ) : (
          <div className={styles.itemsList}>
            {items.map((i) => (
              <div key={i.saleId} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemDate}>
                    {new Date(i.date).toLocaleDateString()}
                  </div>

                  {i.products.map((p: any, idx: number) => (
                    <div key={idx} className={styles.itemProduct}>
                      {p.quantity}× {p.name} — ${p.subtotal}
                    </div>
                  ))}

                  <div className={styles.itemTotal}>
                    Total venta: ${i.total}
                  </div>
                </div>

                <button
                  className={styles.paidBtn}
                  onClick={() => markAsPaid(i.saleId)}
                >
                  Pagado
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PAGO PARCIAL */}
        <div className={styles.partialBox}>
          <input
            className={styles.input}
            placeholder="Pago parcial..."
            value={partial}
            onChange={(e) => setPartial(e.target.value)}
          />

          <button className={styles.saveBtn} onClick={handlePartialPayment}>
            Registrar pago parcial
          </button>
        </div>

      </div>
    </div>
  );
}


export default function Deudas() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

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

  // ── Proteger ruta ──
  useEffect(() => {
    if (!token) router.push("/login");
  }, []);

  // ── Cargar clientes ──
  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("http://localhost:4000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Cliente[] = await res.json();
      setClients(data.filter((c) => c.balance < 0));
    };
    fetchClients();
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.content}>

        {/* TOPBAR */}
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>Clientes deudores</h1>
            <p className={styles.subtitle}>
              {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} con saldo pendiente
            </p>
          </div>
          <div className={styles.topRight}>
            <input
              className={styles.search}
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className={styles.backBtn} onClick={() => router.push("/caja")}>
              ← Volver
            </button>
          </div>
        </div>

        {/* GRILLA */}
        {filtered.length === 0 ? (
          <p className={styles.empty}>No hay clientes con deudas pendientes.</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((c) => (
              <div
                key={c._id}
                className={styles.card}
                onClick={() => setSelectedClient(c)}
              >
                <div className={styles.avatar}>{initials(c.name)}</div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{c.name}</div>
                  <div className={styles.debt}>
                    ${Math.abs(c.balance).toLocaleString("es-AR")}
                  </div>
                </div>
                <div className={styles.cardChevron}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP */}
      {selectedClient && (
        <ClientPopup
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./caja.module.css";

export default function Caja() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  // Estado para el popup de configuración
  const [showConfig, setShowConfig] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  // Cargar clientes para fiado
  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("http://localhost:4000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClients(data);
    };

    fetchClients();
  }, []);

  // Buscar productos
  const searchProducts = async (value: string) => {
    setQuery(value);

    if (value.length < 1) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `http://localhost:4000/api/products/search?q=${value}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setResults(data);
  };

  // Agregar al carrito
  const addToCart = (product: any) => {
    const existing = cart.find((item) => item._id === product._id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    setResults([]);
    setQuery("");
  };

  // Aumentar cantidad
  const increaseQuantity = (index: number) => {
    const newCart = [...cart];
    newCart[index].quantity++;
    setCart(newCart);
  };

  // Disminuir cantidad
  const decreaseQuantity = (index: number) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity--;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  // Eliminar item
  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Confirmar venta
  const confirmSale = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (paymentMethod === "fiado" && !selectedClient) {
      alert("Seleccioná un cliente para fiar");
      return;
    }

    const saleData = {
      products: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod,
      customer: paymentMethod === "fiado" ? selectedClient : null,
    };

    const res = await fetch("http://localhost:4000/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });

    await res.json();

    alert("Venta registrada correctamente");

    setCart([]);
    setPaymentMethod("efectivo");
    setSelectedClient("");
  };

  return (
    <div className={styles.container}>
      {/* COLUMNA IZQUIERDA */}
      <div>
        <h1 style={{ marginBottom: 20 }}>Caja</h1>

        {/* BUSCADOR */}
        <input
          type="text"
          placeholder="Escaneá o escribí el nombre..."
          value={query}
          onChange={(e) => searchProducts(e.target.value)}
          className={styles.searchInput}
        />

        {/* RESULTADOS */}
        {results.length > 0 && (
          <div className={styles.resultsBox}>
            {results.map((p) => (
              <div
                key={p._id}
                onClick={() => addToCart(p)}
                className={styles.resultItem}
              >
                <span>{p.name}</span>
                <strong>${p.price}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA */}
      <div>
        <h2 style={{ marginBottom: 10 }}>Carrito</h2>

        <div className={styles.cartBox}>
          {cart.map((item, i) => (
            <div key={i} className={styles.cartItem}>
              <div>
                <strong>{item.name}</strong>
                <br />
                <span style={{ color: "#666" }}>${item.price}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => decreaseQuantity(i)}
                  className={`${styles.qtyBtn} ${styles.qtyMinus}`}
                >
                  -
                </button>

                <span style={{ fontSize: "18px", width: "30px", textAlign: "center" }}>
                  {item.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(i)}
                  className={`${styles.qtyBtn} ${styles.qtyPlus}`}
                >
                  +
                </button>

                <button
                  onClick={() => removeItem(i)}
                  className={styles.deleteBtn}
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className={styles.totalBox}>
          <div className={styles.totalLabel}>TOTAL</div>

          <div className={styles.totalAmount}>
            ${cart.reduce((acc, item) => acc + item.price * item.quantity, 0)}
          </div>

          {/* MÉTODO DE PAGO */}
          <label style={{ fontWeight: "bold" }}>Medio de pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.paymentSelect}
          >
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">Mercado Pago</option>
            <option value="fiado">Cuenta corriente (fiado)</option>
          </select>

          {/* CLIENTE FIADO */}
          {paymentMethod === "fiado" && (
            <div style={{ marginTop: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Cliente</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={styles.paymentSelect}
              >
                <option value="">Elegir cliente...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BOTÓN CONFIRMAR */}
          <button onClick={confirmSale} className={styles.confirmBtn}>
            Confirmar venta
          </button>
        </div>

        {/* RUEDITA DE CONFIGURACIÓN */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "32px",
              cursor: "pointer",
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* POPUP DE CONFIGURACIÓN */}
      {showConfig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "350px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
              Configuración
            </h2>

            <button
              onClick={() => router.push("/deudas")}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "10px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              📘 Clientes deudores
            </button>

            <button
              onClick={() => router.push("/productos")}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "10px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              📦 Productos (agregar / modificar)
            </button>

            <button
              onClick={() => router.push("/proveedores")}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "10px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              🏭 Proveedores
            </button>

            <button
              onClick={() => setShowConfig(false)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "20px",
                background: "#ccc",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ❌ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

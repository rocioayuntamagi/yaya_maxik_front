"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./caja.module.css";

export default function Caja() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // NUEVO: popup de datos de pago
const firstInputRef = useRef<HTMLInputElement | null>(null);


  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentData, setPaymentData] = useState<any>({});
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const [ticketText, setTicketText] = useState("");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  
  

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

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

  useEffect(() => {
  if (!showPaymentPopup) return;

  const handleKey = (e: KeyboardEvent) => {
    // ESC cierra el popup
    if (e.key === "Escape") {
      setShowPaymentPopup(false);
    }

    // ENTER confirma la venta
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmPayment();
    }
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [showPaymentPopup, paymentData]);

useEffect(() => {
  if (showPaymentPopup && firstInputRef.current) {
    firstInputRef.current.focus();
  }
}, [showPaymentPopup]);

  
  const searchProducts = async (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    }

    if (e.key === "Enter" && selectedIndex >= 0) {
      addToCart(results[selectedIndex]);
      setSelectedIndex(-1);
      setQuery("");
      setResults([]);
    }
  };

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
    setSelectedIndex(-1);
  };

  const increaseQuantity = (index: number) => {
    const newCart = [...cart];
    newCart[index].quantity++;
    setCart(newCart);
  };

  const decreaseQuantity = (index: number) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity--;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // NUEVO: en vez de guardar directo, abrimos popup de datos de pago
  const confirmSale = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (paymentMethod === "fiado" && !selectedClient) {
      alert("Seleccioná un cliente para fiar");
      return;
    }

    // inicializar datos según medio de pago
    const base: any = {};
    if (paymentMethod === "efectivo") {
      base.receivedAmount = total;
      base.change = 0;
    }
    if (paymentMethod === "debito" || paymentMethod === "credito") {
      base.cardBrand = "";
      base.cardLast4 = "";
      base.authCode = "";
      base.operationNumber = "";
      if (paymentMethod === "credito") {
        base.installments = 1;
        base.interest = 0;
      }
    }
    if (paymentMethod === "transferencia") {
      base.transferOperationId = "";
    }
    if (paymentMethod === "mercadopago") {
      base.mpPaymentId = "";
      base.mpStatus = "approved";
    }

    setPaymentData(base);
    setShowPaymentPopup(true);
  };

  useEffect(() => {
  if (!showPaymentPopup) return;

  const handleKey = (e: KeyboardEvent) => {
    // ESC cierra el popup
    if (e.key === "Escape") {
      setShowPaymentPopup(false);
    }

    // ENTER confirma la venta
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmPayment();
    }
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [showPaymentPopup, paymentData]);


  // NUEVO: guardar venta + generar ticket
  const handleConfirmPayment = async () => {
    const saleData: any = {
      products: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod,
      total,
    };

    if (paymentMethod === "efectivo") {
      saleData.receivedAmount = Number(paymentData.receivedAmount || total);
      saleData.change = saleData.receivedAmount - total;
    }

    if (paymentMethod === "debito" || paymentMethod === "credito") {
      saleData.cardBrand = paymentData.cardBrand || "";
      saleData.cardLast4 = paymentData.cardLast4 || "";
      saleData.authCode = paymentData.authCode || "";
      saleData.operationNumber = paymentData.operationNumber || "";
      if (paymentMethod === "credito") {
        saleData.installments = Number(paymentData.installments || 1);
        saleData.interest = Number(paymentData.interest || 0);
      }
    }

    if (paymentMethod === "transferencia") {
      saleData.transferOperationId = paymentData.transferOperationId || "";
    }

    if (paymentMethod === "mercadopago") {
      saleData.mpPaymentId = paymentData.mpPaymentId || "";
      saleData.mpStatus = paymentData.mpStatus || "approved";
    }

    if (paymentMethod === "fiado") {
      saleData.customer = selectedClient;
    }

    const res = await fetch("http://localhost:4000/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });

    const data = await res.json();
    setLastSaleId(data?._id || null);

    const ticket = buildTicketText({
      saleId: data?._id,
      total,
      paymentMethod,
      paymentData: saleData,
      cart,
    });

    setTicketText(ticket);
    setShowPaymentPopup(false);
    setShowTicketPopup(true);

    setCart([]);
    setPaymentMethod("efectivo");
    setSelectedClient("");
  };

  // NUEVO: generador de ticket clásico
  const buildTicketText = ({
    saleId,
    total,
    paymentMethod,
    paymentData,
    cart,
  }: any) => {
    const now = new Date();
    const fecha = now.toLocaleDateString("es-AR");
    const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    let lines: string[] = [];

    lines.push("MAXIKIOSCO FAMILIAR");
    lines.push("Avellaneda - Buenos Aires");
    lines.push("--------------------------------");
    lines.push(`Ticket: ${saleId || "N/A"}`);
    lines.push(`Fecha: ${fecha}  ${hora}`);
    lines.push("--------------------------------");

    cart.forEach((item: any) => {
      const name = item.name;
      const lineTotal = item.price * item.quantity;
      lines.push(`${name} x${item.quantity}   $${lineTotal}`);
    });

    lines.push("--------------------------------");
    lines.push(`TOTAL:              $${total}`);
    lines.push("--------------------------------");
    lines.push(`Medio de pago: ${paymentMethod.toUpperCase()}`);

    if (paymentMethod === "efectivo") {
      lines.push(`Recibido:           $${paymentData.receivedAmount}`);
      lines.push(`Vuelto:             $${paymentData.change}`);
    }

    if (paymentMethod === "debito" || paymentMethod === "credito") {
      if (paymentData.cardBrand) lines.push(`Tarjeta: ${paymentData.cardBrand}`);
      if (paymentData.cardLast4) lines.push(`Últimos 4: ${paymentData.cardLast4}`);
      if (paymentData.authCode) lines.push(`Autorización: ${paymentData.authCode}`);
      if (paymentData.operationNumber) lines.push(`Operación: ${paymentData.operationNumber}`);
      if (paymentMethod === "credito") {
        lines.push(`Cuotas: ${paymentData.installments || 1}`);
        if (paymentData.interest) {
          lines.push(`Interés: ${paymentData.interest}%`);
        }
      }
    }

    if (paymentMethod === "transferencia") {
      if (paymentData.transferOperationId) {
        lines.push(`Operación: ${paymentData.transferOperationId}`);
      }
    }

    if (paymentMethod === "mercadopago") {
      if (paymentData.mpPaymentId) lines.push(`Pago MP: ${paymentData.mpPaymentId}`);
      if (paymentData.mpStatus) lines.push(`Estado: ${paymentData.mpStatus}`);
    }

    if (paymentMethod === "fiado") {
      lines.push(`Cliente: ${clients.find(c => c._id === selectedClient)?.name || ""}`);
    }

    lines.push("--------------------------------");
    lines.push("Gracias por su compra!");

    return lines.join("\n");
  };

  const handlePrintTicket = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              white-space: pre;
              margin: 0;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          ${ticketText.replace(/\n/g, "<br/>")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className={styles.mainLayout}>
      {/* COLUMNA IZQUIERDA */}
      <div className={styles.leftColumn}>
        <h1 style={{ marginBottom: 20 }}>Caja</h1>

        <input
          type="text"
          placeholder="Escaneá o escribí el nombre..."
          value={query}
          onChange={(e) => searchProducts(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
        />

        {query.length > 0 && results.length > 0 && (
          <div className={styles.resultsBox}>
            {results.map((p, i) => (
              <div
                key={p._id}
                onClick={() => addToCart(p)}
                className={`${styles.resultItem} ${
                  selectedIndex === i ? styles.selectedItem : ""
                }`}
              >
                <span>{p.name}</span>
                <strong>${p.price}</strong>
              </div>
            ))}
          </div>
        )}

        {query.length > 0 && results.length === 0 && (
          <div className={styles.noResults}>
            No se encontraron productos
          </div>
        )}

        <div style={{ marginTop: 40, maxWidth: "350px" }}>
          <div className={styles.totalLabel}>TOTAL</div>

          <div className={styles.totalAmount}>
            ${total}
          </div>

          <label className={styles.fieldLabel}>Medio de pago</label>
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

          {paymentMethod === "fiado" && (
            <div style={{ marginTop: "15px" }}>
              <label className={styles.fieldLabel}>Cliente</label>
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

          <button onClick={confirmSale} className={styles.confirmBtn}>
            Confirmar venta
          </button>
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div className={styles.rightColumn}>
        <div className={styles.cartHeader}>
          <h2>Carrito</h2>

          <button
            onClick={() => setShowConfig(true)}
            className={styles.configBtn}
          >
            ⚙️
          </button>
        </div>

        <div className={styles.cartBox}>
          {cart.map((item, i) => (
            <div key={i} className={styles.cartItem}>
              <div>
                <strong>{item.name}</strong>
                <br />
                <span className={styles.itemPrice}>${item.price}</span>
              </div>

              <div className={styles.qtyContainer}>
                <button
                  onClick={() => decreaseQuantity(i)}
                  className={`${styles.qtyBtn} ${styles.qtyMinus}`}
                >
                  -
                </button>

                <span className={styles.qtyNumber}>
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
      </div>

      {/* POPUP CONFIG */}
      {showConfig && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
              Configuración
            </h2>

            <button
              onClick={() => router.push("/deudas")}
              className={styles.popupBtn}
            >
              📘 Clientes deudores
            </button>

            <button
              onClick={() => router.push("/productos")}
              className={styles.popupBtn}
            >
              📦 Productos
            </button>

            <button
              onClick={() => router.push("/proveedores")}
              className={styles.popupBtn}
            >
              🏭 Proveedores
            </button>

            <button
              onClick={() => setShowConfig(false)}
              className={styles.popupClose}
            >
              ❌ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* POPUP DATOS DE PAGO */}
      {showPaymentPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2 className={styles.popupTitle}>
  Datos de pago ({paymentMethod})
</h2>


            {paymentMethod === "efectivo" && (
              <>
                <label className={styles.fieldLabel}>Monto recibido</label>
                <input
                  ref={firstInputRef}
                  type="number"
                  className={styles.searchInput}
                  value={paymentData.receivedAmount ?? total}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      receivedAmount: Number(e.target.value),
                      change: Number(e.target.value) - total,
                    })
                  }
                />
                <div style={{ marginTop: 8, color: "#e8eaf0" }}>
                  Vuelto: ${paymentData.change ?? 0}
                </div>
              </>
            )}

            {(paymentMethod === "debito" || paymentMethod === "credito") && (
              <>
                <label className={styles.fieldLabel}>Marca de tarjeta</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.cardBrand || ""}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cardBrand: e.target.value })
                  }
                />

                <label className={styles.fieldLabel}>Últimos 4 dígitos</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.cardLast4 || ""}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cardLast4: e.target.value })
                  }
                />

                <label className={styles.fieldLabel}>Código de autorización</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.authCode || ""}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, authCode: e.target.value })
                  }
                />

                <label className={styles.fieldLabel}>Número de operación</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.operationNumber || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      operationNumber: e.target.value,
                    })
                  }
                />

                {paymentMethod === "credito" && (
                  <>
                    <label className={styles.fieldLabel}>Cuotas</label>
                    <input
                      ref={firstInputRef}
                      type="number"
                      className={styles.searchInput}
                      value={paymentData.installments || 1}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          installments: Number(e.target.value),
                        })
                      }
                    />

                    <label className={styles.fieldLabel}>Interés (%)</label>
                    <input
                      ref={firstInputRef}
                      type="number"
                      className={styles.searchInput}
                      value={paymentData.interest || 0}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          interest: Number(e.target.value),
                        })
                      }
                    />
                  </>
                )}
              </>
            )}

            {paymentMethod === "transferencia" && (
              <>
                <label className={styles.fieldLabel}>N° de operación</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.transferOperationId || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      transferOperationId: e.target.value,
                    })
                  }
                />
              </>
            )}

            {paymentMethod === "mercadopago" && (
              <>
                <label className={styles.fieldLabel}>ID de pago</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.mpPaymentId || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      mpPaymentId: e.target.value,
                    })
                  }
                />

                <label className={styles.fieldLabel}>Estado</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={paymentData.mpStatus || "approved"}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      mpStatus: e.target.value,
                    })
                  }
                />
              </>
            )}

            {paymentMethod === "fiado" && (
              <div style={{ marginTop: 10, color: "#e8eaf0" }}>
                La venta se registrará como cuenta corriente del cliente.
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              className={styles.confirmBtn}
              style={{ marginTop: 16 }}
            >
              Guardar venta y generar ticket
            </button>

            <button
              onClick={() => setShowPaymentPopup(false)}
              className={styles.popupClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* POPUP TICKET */}
      {showTicketPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2 style={{ marginBottom: 10, textAlign: "center" }}>
              Ticket
            </h2>

            <div
              style={{
                background: "#000",
                color: "#fff",
                padding: "10px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {ticketText}
            </div>

            <button
              onClick={handlePrintTicket}
              className={styles.confirmBtn}
              style={{ marginTop: 12 }}
            >
              Imprimir ticket
            </button>

            <button
              onClick={() => setShowTicketPopup(false)}
              className={styles.popupClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

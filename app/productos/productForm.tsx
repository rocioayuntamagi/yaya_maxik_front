"use client";

import { useState } from "react";
import styles from "./productos.module.css";

type Producto = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
};

// ⭐ Tipado de props del formulario
type ProductFormProps = {
  onClose: () => void;
  onProductCreated: (producto: Producto) => void;
};

export default function ProductForm({ onClose, onProductCreated }: ProductFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  // ⭐ Tipado correcto del evento
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !price || !stock) {
      setError("Todos los campos obligatorios deben completarse");
      return;
    }

    try {
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
          category,
        }),
      });

      const data = await res.json();

      if (data && data.name) {
        onProductCreated(data); // ⭐ Actualiza la grilla
        onClose(); // ⭐ Cierra el modal
      } else {
        setError("Error al crear el producto");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Agregar producto</h2>

      {error && <p className={styles.error}>{error}</p>}

      <input
        className={styles.input}
        placeholder="Nombre"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
      />

      <input
        className={styles.input}
        placeholder="Precio"
        type="number"
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
          setError("");
        }}
      />

      <input
        className={styles.input}
        placeholder="Stock"
        type="number"
        value={stock}
        onChange={(e) => {
          setStock(e.target.value);
          setError("");
        }}
      />

      <input
        className={styles.input}
        placeholder="Categoría"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setError("");
        }}
      />

      <button className={styles.saveBtn} type="submit">
        Guardar
      </button>

      <button className={styles.closeBtn} type="button" onClick={onClose}>
        Cancelar
      </button>
    </form>
  );
}

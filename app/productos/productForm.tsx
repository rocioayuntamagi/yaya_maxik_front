"use client";

import { useState } from "react";
import styles from "./productos.module.css";
import { Producto } from "../types/producto"; // ⭐ Tipo unificado

type ProductFormProps = {
  onClose: () => void;
  onProductCreated: (producto: Producto) => void;
};

export default function ProductForm({ onClose, onProductCreated }: ProductFormProps) {
  const [form, setForm] = useState<Producto>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    barcode: "",
    provider: "",
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    unit: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.stock || !form.category) {
      setError("Los campos obligatorios deben completarse");
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
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data && data.name) {
        onProductCreated(data);
        onClose();
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
        name="name"
        placeholder="Nombre *"
        value={form.name}
        onChange={handleChange}
      />

      <textarea
        className={styles.input}
        name="description"
        placeholder="Descripción"
        value={form.description}
        onChange={handleChange}
      />

      <select
        className={styles.input}
        name="category"
        value={form.category}
        onChange={handleChange}
      >
        <option value="">Categoría *</option>
        <option value="bebidas">Bebidas</option>
        <option value="golosinas">Golosinas</option>
        <option value="almacen">Almacén</option>
        <option value="limpieza">Limpieza</option>
        <option value="lacteos">Lácteos</option>
        <option value="panaderia">Panadería</option>
        <option value="bazar">Bazar</option>
        <option value="cuidado_personal">Cuidado personal</option>
      </select>

      <input
        className={styles.input}
        name="subcategory"
        placeholder="Subcategoría"
        value={form.subcategory}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="brand"
        placeholder="Marca"
        value={form.brand}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="barcode"
        placeholder="Código de barras"
        value={form.barcode}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="provider"
        placeholder="Proveedor"
        value={form.provider}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="price"
        type="number"
        placeholder="Precio de venta *"
        value={form.price}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="cost"
        type="number"
        placeholder="Costo"
        value={form.cost}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="stock"
        type="number"
        placeholder="Stock *"
        value={form.stock}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="minStock"
        type="number"
        placeholder="Stock mínimo"
        value={form.minStock}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="unit"
        placeholder="Unidad (unidad, kg, litro, pack...)"
        value={form.unit}
        onChange={handleChange}
      />

      <textarea
        className={styles.input}
        name="notes"
        placeholder="Notas internas"
        value={form.notes}
        onChange={handleChange}
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

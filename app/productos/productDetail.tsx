"use client";

import styles from "./productos.module.css";
import { Producto } from "../types/producto";
import { useEffect, useState } from "react";

type ProductDetailProps = {
  producto: Producto;
  onClose: () => void;
  onSave?: (updated: Producto) => void;
};


export default function ProductDetail({ producto, onClose, onSave }: ProductDetailProps) {
  const [form, setForm] = useState<Producto>({ ...producto });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave?.(form);
    onClose();
  };

  return (
    <div className={styles.form}>
      <h2>Editar producto</h2>

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
        value={form.description || ""}
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
        value={form.subcategory || ""}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="brand"
        placeholder="Marca"
        value={form.brand || ""}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="barcode"
        placeholder="Código de barras"
        value={form.barcode || ""}
        onChange={handleChange}
      />

      <input
        className={styles.input}
        name="provider"
        placeholder="Proveedor"
        value={form.provider || ""}
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
        value={form.unit || ""}
        onChange={handleChange}
      />

      <textarea
        className={styles.input}
        name="notes"
        placeholder="Notas internas"
        value={form.notes || ""}
        onChange={handleChange}
      />

      <button className={styles.saveBtn} onClick={handleSave}>
        Guardar
      </button>

      <button className={styles.closeBtn} type="button" onClick={onClose}>
        Cancelar
      </button>
    </div>
  );
}


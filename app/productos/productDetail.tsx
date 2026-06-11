"use client";

import styles from "./productos.module.css";
import { Producto } from "../types/producto";

type ProductDetailProps = {
  producto: Producto;
  onClose: () => void;
};

export default function ProductDetail({ producto, onClose }: ProductDetailProps) {
  return (
    <div className={styles.form}>
      <h2>Detalle del producto</h2>

      <p><strong>Nombre:</strong> {producto.name}</p>
      <p><strong>Precio:</strong> ${producto.price}</p>
      <p><strong>Stock:</strong> {producto.stock}</p>

      {producto.category && <p><strong>Categoría:</strong> {producto.category}</p>}
      {producto.description && <p><strong>Descripción:</strong> {producto.description}</p>}
      {producto.brand && <p><strong>Marca:</strong> {producto.brand}</p>}
      {producto.barcode && <p><strong>Código de barras:</strong> {producto.barcode}</p>}
      {producto.provider && <p><strong>Proveedor:</strong> {producto.provider}</p>}
      {producto.unit && <p><strong>Unidad:</strong> {producto.unit}</p>}
      {producto.notes && <p><strong>Notas:</strong> {producto.notes}</p>}

      <button className={styles.closeBtn} onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}

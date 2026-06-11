export type Producto = {
  _id?: string;

  // Datos básicos
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  barcode?: string;
  provider?: string;

  // Datos comerciales
  price: number;      // precio de venta
  cost: number;       // costo del producto
  stock: number;      // stock actual
  minStock?: number;  // stock mínimo recomendado
  unit?: string;      // unidad de medida (unidad, kg, litro, pack...)

  // Datos internos
  notes?: string;
};

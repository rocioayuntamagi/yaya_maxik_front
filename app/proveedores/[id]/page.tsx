import DetalleProveedorClient from "./DetalleProveedorClient";

export default async function Page({ params }: any) {
  const { id } = await params;
  return <DetalleProveedorClient id={id} />;
}

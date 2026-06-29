import EditarCompraClient from "./EditarCompraClient";

export default async function Page({ params }: any) {
  const { id } = await params;
  return <EditarCompraClient id={id} />;
}

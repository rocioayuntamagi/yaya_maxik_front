import RegistrarCompraClient from "./RegistrarCompraClient";

export default async function Page({ params }: any) {
  const { id } = await params;
  return <RegistrarCompraClient id={id} />;
}

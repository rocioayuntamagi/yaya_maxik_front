import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">Maxikiosco YAYA</h1>
        <p className="mt-3 text-slate-600">Menú principal</p>
        <Link href="/caja" className="mt-6 inline-block rounded bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">
          Ir a caja
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:4000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Credenciales incorrectas");
      return;
    }

    // Guardamos token
    localStorage.setItem("token", data.token);

    // Redirigimos a caja
    router.push("/caja");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Iniciar sesión</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <button
        onClick={login}
        style={{
          padding: 10,
          background: "black",
          color: "white",
          cursor: "pointer",
        }}
      >
        Entrar
      </button>
    </div>
  );
}

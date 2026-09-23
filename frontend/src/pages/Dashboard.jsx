import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="p-6 text-center text-xl">
        Caricamento dati utente...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Benvenuto {user.nome}</h1>

      <div className="mt-4 text-lg">
        Ruolo: <strong>{user.ruolo}</strong>
      </div>

      {/* QUI rimane tutto il resto del tuo Dashboard.jsx originale */}
    </div>
  );
}

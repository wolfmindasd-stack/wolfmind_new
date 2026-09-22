import React from "react";

export default function Portale() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Portale Wolf’s Mind A.S.D.
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ORARI */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Orari</h2>
          <p className="text-gray-700">
            Consulta gli orari aggiornati dei corsi e delle attività.
          </p>
          <a
            href="/pdf/orari.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

        {/* CORSI */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Corsi</h2>
          <p className="text-gray-700">
            Informazioni sui corsi attivi e sulle attività disponibili.
          </p>
          <a
            href="/pdf/corsi.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

        {/* REGOLAMENTO */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Regolamento</h2>
          <p className="text-gray-700">
            Regole interne dell’associazione e norme di comportamento.
          </p>
          <a
            href="/pdf/regolamento.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

        {/* CERTIFICATI */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Certificati</h2>
          <p className="text-gray-700">
            Informazioni sui certificati medici richiesti per le attività.
          </p>
          <a
            href="/pdf/certificato_medico.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

        {/* QUOTE */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Quote associative</h2>
          <p className="text-gray-700">
            Quote annuali e informazioni sui pagamenti.
          </p>
          <a
            href="/pdf/quote_2024.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

        {/* DOCUMENTI */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Documenti</h2>
          <p className="text-gray-700">
            Verbali, bilanci, comunicazioni ufficiali e altri documenti.
          </p>
          <a
            href="/pdf/documenti.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Scarica PDF
          </a>
        </div>

      </div>

      <div className="text-center mt-10 text-gray-600">
        © {new Date().getFullYear()} Wolf’s Mind A.S.D. — Tutti i diritti riservati
      </div>
    </div>
  );
}

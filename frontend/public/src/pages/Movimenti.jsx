import React, { useEffect, useState } from "react";
import { api, fmtEur, fmtDate, formatApiErrorDetail, todayIso, API } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, Download, ArrowLeftRight, Wallet, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";

const CATEGORIE = [
  "Ricevuta", "Iscrizione", "Sponsor", "Contributo",
  "Compenso tecnico", "Acquisto materiali", "Affitto", "Utenze",
  "Manutenzione", "Assicurazione", "Federazione", "Altro",
];

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
              "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

export default function Movimenti() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState("dettaglio");
  const [list, setList] = useState([]);
  const [tecnici, setTecnici] = useState([]);
  const [mensile, setMensile] = useState(null);
  const [saldi, setSaldi] = useState(null);
  const [rendiconto, setRendiconto] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [giroOpen, setGiroOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    data: todayIso(), tipo: "uscita", categoria: "Altro",
    descrizione: "", importo: 0, tecnico_id: "", metodo: "cassa",
  });
  const [giroForm, setGiroForm] = useState({
    data: todayIso(), importo: 0,
    direzione: "cassa_a_banca", descrizione: "",
  });

  const load = async () => {
    const [m, u, mm, s, r] = await Promise.all([
      api.get("/movimenti"),
      api.get("/users").catch(() => ({ data: [] })),
      api.get(`/movimenti/riepilogo-mensile?year=${year}`),
      api.get("/movimenti/saldi"),
      api.get(`/movimenti/rendiconto?year=${year}`),
    ]);
    setList(m.data);
    setTecnici(u.data.filter((x) => x.role === "tecnico"));
    setMensile(mm.data);
    setSaldi(s.data);
    setRendiconto(r.data);
  };
  useEffect(() => { load(); }, [year]);

  const openNew = () => {
    setEditing(null);
    setForm({ data: todayIso(), tipo: "uscita", categoria: "Altro",
              descrizione: "", importo: 0, tecnico_id: "", metodo: "cassa" });
    setOpen(true);
  };
  const openEdit = (m) => {
    setEditing(m.id);
    setForm({ data: (m.data || "").slice(0, 10), tipo: m.tipo, categoria: m.categoria,
              descrizione: m.descrizione, importo: m.importo,
              tecnico_id: m.tecnico_id || "", metodo: m.metodo || "cassa" });
    setOpen(true);
  };

  const openGiroconto = () => {
    setGiroForm({ data: todayIso(), importo: 0,
                  direzione: "cassa_a_banca", descrizione: "" });
    setGiroOpen(true);
  };

  const saveGiroconto = async () => {
    if (!giroForm.importo || Number(giroForm.importo) <= 0) {
      toast.error("Importo non valido"); return;
    }
    try {
      await api.post("/movimenti/giroconto",
        { ...giroForm, importo: Number(giroForm.importo) });
      toast.success("Giroconto registrato: nessun impatto sul risultato economico");
      setGiroOpen(false); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const save = async () => {
    try {
      const payload = { ...form, importo: Number(form.importo),
                         tecnico_id: form.tecnico_id || null };
      if (editing) { await api.patch(`/movimenti/${editing}`, payload); toast.success("Movimento aggiornato"); }
      else { await api.post("/movimenti", payload); toast.success("Movimento aggiunto"); }
      setOpen(false); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (m) => {
    if (!window.confirm("Eliminare il movimento?")) return;
    try { await api.delete(`/movimenti/${m.id}`); toast.success("Eliminato"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const downloadReportMensile = async () => {
    // Uses report/bilancio/pdf which now groups by month
    const from = `${year}-01-01`, to = `${year}-12-31`;
    const res = await api.get(`/report/bilancio/pdf?date_from=${from}&date_to=${to}`,
      { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a"); a.href = url;
    a.download = `Bilancio_${year}.pdf`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadRendicontoPdf = async () => {
    try {
      const res = await api.get(`/movimenti/rendiconto/pdf?year=${year}`,
        { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url;
      a.download = `Rendiconto_Gestionale_${year}.pdf`; a.click(); URL.revokeObjectURL(url);
      toast.success(`Rendiconto ${year} scaricato`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Errore generazione PDF");
    }
  };

  const entrateTot = mensile?.totali?.entrate || 0;
  const usciteTot = mensile?.totali?.uscite || 0;
  const saldoTot = mensile?.totali?.saldo || 0;
  const tecName = (tid) => tecnici.find((x) => x.id === tid)?.name || (tid === user?.id ? user.name : "—");

  return (
    <div className="space-y-6" data-testid="movimenti-page">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="wm-label">Contabilità</div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mt-2">Libro Contabile</h1>
          <p className="text-white/50 mt-2 text-sm">Entrate e uscite. Le ricevute generano entrate automatiche attribuite al tecnico.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="wm-label">Anno</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 bg-black/40 border-white/10 h-9" data-testid="year-input" />
          {isAdmin && (
            <>
              <Button onClick={openGiroconto} variant="outline"
                className="border-[#FFCC00]/40 text-[#FFCC00] hover:bg-[#FFCC00]/10"
                data-testid="add-giroconto-btn">
                <ArrowLeftRight size={16} className="mr-1" /> Giroconto
              </Button>
              <Button onClick={openNew} className="bg-[#007AFF] hover:bg-[#005BB5]" data-testid="add-movimento-btn">
                <Plus size={16} className="mr-1" /> Nuovo movimento
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Saldi Cassa & Banca (flusso di cassa) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="wm-card p-5 border-l-4 border-[#34C759]">
          <div className="flex items-center gap-2 wm-label">
            <Wallet size={12} /> Saldo Cassa Contanti
          </div>
          <div className={`mt-2 font-display text-2xl font-bold ${
            (saldi?.cassa ?? 0) >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}
            data-testid="saldo-cassa">
            {fmtEur(saldi?.cassa ?? 0)}
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            +{fmtEur(saldi?.dettaglio?.cassa?.entrate ?? 0)} / -{fmtEur(saldi?.dettaglio?.cassa?.uscite ?? 0)}
          </div>
        </div>
        <div className="wm-card p-5 border-l-4 border-[#007AFF]">
          <div className="flex items-center gap-2 wm-label">
            <Landmark size={12} /> Saldo Banca
          </div>
          <div className={`mt-2 font-display text-2xl font-bold ${
            (saldi?.banca ?? 0) >= 0 ? "text-[#007AFF]" : "text-[#FF3B30]"}`}
            data-testid="saldo-banca">
            {fmtEur(saldi?.banca ?? 0)}
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            +{fmtEur(saldi?.dettaglio?.banca?.entrate ?? 0)} / -{fmtEur(saldi?.dettaglio?.banca?.uscite ?? 0)}
          </div>
        </div>
        <div className="wm-card p-5">
          <div className="wm-label">Liquidità totale</div>
          <div className={`mt-2 font-display text-2xl font-bold ${
            (saldi?.totale ?? 0) >= 0 ? "text-white" : "text-[#FF3B30]"}`}
            data-testid="saldo-totale">
            {fmtEur(saldi?.totale ?? 0)}
          </div>
          <div className="text-[10px] text-white/40 mt-1">Cassa + Banca</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wm-card p-5"><div className="wm-label">Entrate {year}</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#34C759]" data-testid="tot-entrate">
            {fmtEur(entrateTot)}</div></div>
        <div className="wm-card p-5"><div className="wm-label">Uscite {year}</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#FF3B30]" data-testid="tot-uscite">
            {fmtEur(usciteTot)}</div></div>
        <div className="wm-card p-5"><div className="wm-label">Saldo {year}</div>
          <div className={`mt-2 font-display text-2xl font-bold ${saldoTot >= 0 ? "text-white" : "text-[#FF3B30]"}`}
            data-testid="tot-saldo">{fmtEur(saldoTot)}</div></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="bg-[#0F0F13] border border-white/10 flex-wrap h-auto">
            <TabsTrigger value="dettaglio" data-testid="tab-dettaglio">Prima Nota</TabsTrigger>
            <TabsTrigger value="mensile" data-testid="tab-mensile">Totali per mese</TabsTrigger>
            <TabsTrigger value="rendiconto" data-testid="tab-rendiconto">Rendiconto Gestionale</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={downloadReportMensile} className="border-white/20"
            data-testid="download-report-mensile">
            <Download size={14} className="mr-1" /> Report bilancio {year} (PDF)
          </Button>
        </div>

        <TabsContent value="dettaglio" className="mt-4">
          <div className="wm-card overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-white/[0.02] border-b border-white/10">
                <tr className="text-left">
                  <th className="p-3 wm-label">Data</th>
                  <th className="p-3 wm-label">Tipo</th>
                  <th className="p-3 wm-label">Metodo</th>
                  <th className="p-3 wm-label">Categoria</th>
                  <th className="p-3 wm-label">Descrizione</th>
                  <th className="p-3 wm-label">Tecnico</th>
                  <th className="p-3 wm-label text-right">Importo</th>
                  {isAdmin && <th className="p-3 wm-label text-right">Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}
                    className={`border-b border-white/5 ${m.is_giroconto ? "bg-[#FFCC00]/[0.04]" : ""}`}
                    data-testid={`movimento-row-${m.id}`}>
                    <td className="p-3">{fmtDate(m.data)}</td>
                    <td className="p-3">
                      {m.is_giroconto ? (
                        <span className="inline-flex items-center gap-1 text-[#FFCC00]">
                          <ArrowLeftRight size={12} /> {m.tipo === "entrata" ? "Giroc. IN" : "Giroc. OUT"}
                        </span>
                      ) : m.tipo === "entrata" ? (
                        <span className="inline-flex items-center gap-1 text-[#34C759]"><ArrowUp size={12} /> Entrata</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#FF3B30]"><ArrowDown size={12} /> Uscita</span>
                      )}
                    </td>
                    <td className="p-3">
                      {(m.metodo || "cassa") === "cassa" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30">
                          <Wallet size={10} /> Cassa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30">
                          <Landmark size={10} /> Banca
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-white/80">{m.categoria}</td>
                    <td className="p-3 text-white/80">{m.descrizione}</td>
                    <td className="p-3 text-white/60 text-xs">{tecName(m.tecnico_id)}</td>
                    <td className={`p-3 text-right font-semibold ${m.tipo === "entrata" ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                      {m.tipo === "entrata" ? "+" : "-"}{fmtEur(m.importo)}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(m)}
                          data-testid={`edit-movimento-${m.id}`}><Pencil size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => del(m)}
                          className="text-[#FF3B30]" data-testid={`delete-movimento-${m.id}`}>
                          <Trash2 size={14} /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-white/40">Nessun movimento</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mensile" className="mt-4">
          <div className="wm-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-white/10">
                <tr className="text-left">
                  <th className="p-3 wm-label">Mese</th>
                  <th className="p-3 wm-label text-center">N. movimenti</th>
                  <th className="p-3 wm-label text-right">Entrate</th>
                  <th className="p-3 wm-label text-right">Uscite</th>
                  <th className="p-3 wm-label text-right">Saldo mese</th>
                </tr>
              </thead>
              <tbody>
                {mensile?.mesi.map((m, i) => (
                  <tr key={m.mese} className="border-b border-white/5"
                    data-testid={`mensile-row-${m.mese}`}>
                    <td className="p-3 font-medium">{MESI[i]}</td>
                    <td className="p-3 text-center">{m.count}</td>
                    <td className="p-3 text-right text-[#34C759] font-semibold">
                      {m.entrate > 0 ? fmtEur(m.entrate) : "—"}
                    </td>
                    <td className="p-3 text-right text-[#FF3B30] font-semibold">
                      {m.uscite > 0 ? fmtEur(m.uscite) : "—"}
                    </td>
                    <td className={`p-3 text-right font-bold ${m.saldo >= 0 ? "text-white" : "text-[#FF3B30]"}`}>
                      {m.count > 0 ? fmtEur(m.saldo) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-white/20 bg-white/[0.03]">
                <tr>
                  <td className="p-3 font-display font-bold">Totale {year}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right text-[#34C759] font-bold">{fmtEur(entrateTot)}</td>
                  <td className="p-3 text-right text-[#FF3B30] font-bold">{fmtEur(usciteTot)}</td>
                  <td className={`p-3 text-right font-black ${saldoTot >= 0 ? "text-white" : "text-[#FF3B30]"}`}>
                    {fmtEur(saldoTot)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rendiconto" className="mt-4 space-y-4" data-testid="rendiconto-tab">
          {rendiconto && (
            <>
              {isAdmin && (
                <div className="flex items-center justify-between flex-wrap gap-2 wm-card p-4 border border-[#007AFF]/30 bg-[#007AFF]/[0.04]">
                  <div>
                    <div className="wm-label text-[#007AFF]">Report ufficiale</div>
                    <div className="text-white/80 text-sm mt-1">
                      Rendiconto Gestionale <b>{year}</b> — pronto per il Consiglio Direttivo,
                      con 5 sezioni, confronto anno precedente, saldi Cassa/Banca ed elenco dettagliato dei movimenti.
                    </div>
                  </div>
                  <Button onClick={downloadRendicontoPdf}
                    className="bg-[#007AFF] hover:bg-[#005BB5]"
                    data-testid="download-rendiconto-pdf">
                    <Download size={14} className="mr-2" /> Scarica PDF Rendiconto {year}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="wm-card p-5">
                  <div className="wm-label">Totale Entrate</div>
                  <div className="mt-2 font-display text-2xl font-bold text-[#34C759]"
                    data-testid="rend-tot-entrate">
                    {fmtEur(rendiconto.totali.entrate)}
                  </div>
                </div>
                <div className="wm-card p-5">
                  <div className="wm-label">Totale Uscite</div>
                  <div className="mt-2 font-display text-2xl font-bold text-[#FF3B30]"
                    data-testid="rend-tot-uscite">
                    {fmtEur(rendiconto.totali.uscite)}
                  </div>
                </div>
                <div className={`wm-card p-5 border-l-4 ${
                  rendiconto.totali.risultato >= 0
                    ? "border-[#34C759]" : "border-[#FF3B30]"}`}>
                  <div className="wm-label">Risultato Gestionale</div>
                  <div className={`mt-2 font-display text-2xl font-bold ${
                    rendiconto.totali.risultato >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}
                    data-testid="rend-risultato">
                    {fmtEur(rendiconto.totali.risultato)}
                  </div>
                </div>
              </div>

              <RendicontoSezione titolo="🟢 Entrate Istituzionali"
                sub="Quote associative, tesseramenti — Attività non commerciale"
                sezione={rendiconto.sezioni.entrate_istituzionali}
                color="#34C759" />
              <RendicontoSezione titolo="🟢 Entrate Commerciali / Ricavi Gestione"
                sub="Ricevute, sponsor, corsi, merchandising"
                sezione={rendiconto.sezioni.entrate_commerciali}
                color="#34C759" />
              <RendicontoSezione titolo="🔴 Oneri per il Personale / Collaborazioni Sportive"
                sub="Compensi tecnici e sportivi"
                sezione={rendiconto.sezioni.uscite_personale}
                color="#FF3B30" />
              <RendicontoSezione titolo="🔴 Rimborsi Organizzativi / Trasferte"
                sub="Rimborsi spese a collaboratori, volontari, amministratori"
                sezione={rendiconto.sezioni.uscite_rimborsi}
                color="#FF3B30" />
              <RendicontoSezione titolo="🔴 Altre Uscite Gestionali"
                sub="Affitti, utenze, materiali, federazione, assicurazioni…"
                sezione={rendiconto.sezioni.uscite_altre}
                color="#FF3B30" />

              <div className="wm-card p-4 border border-[#FFCC00]/30 bg-[#FFCC00]/[0.05]">
                <div className="flex items-center gap-2 wm-label text-[#FFCC00]">
                  <ArrowLeftRight size={12} /> Giroconti (informativo)
                </div>
                <div className="text-white/70 text-sm mt-1">
                  {rendiconto.sezioni.giroconti.count} operazioni per un totale movimentato di {" "}
                  <b>{fmtEur(rendiconto.sezioni.giroconti.totale)}</b>.
                  Non impattano il risultato economico: sono semplici spostamenti di liquidità tra Cassa e Banca.
                </div>
              </div>
            </>
          )}
        </TabsContent>

      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0F0F13] border-white/10">
          <DialogHeader><DialogTitle className="font-display">
            {editing ? "Modifica movimento" : "Nuovo movimento"}
          </DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="wm-label text-xs">Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="bg-black/40 border-white/10" /></div>
              <div><Label className="wm-label text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                    <SelectItem value="entrata">Entrata</SelectItem>
                    <SelectItem value="uscita">Uscita</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div><Label className="wm-label text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                  {CATEGORIE.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select></div>
            <div><Label className="wm-label text-xs">Descrizione</Label>
              <Input value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                className="bg-black/40 border-white/10" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="wm-label text-xs">Importo (€)</Label>
                <Input type="number" step="0.01" value={form.importo}
                  onChange={(e) => setForm({ ...form, importo: e.target.value })}
                  className="bg-black/40 border-white/10" /></div>
              <div><Label className="wm-label text-xs">Metodo</Label>
                <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v })}>
                  <SelectTrigger className="bg-black/40 border-white/10" data-testid="movimento-metodo-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                    <SelectItem value="cassa">💵 Cassa Contanti</SelectItem>
                    <SelectItem value="banca">🏦 Banca</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div><Label className="wm-label text-xs">Attribuisci al tecnico (opzionale)</Label>
              <Select value={form.tecnico_id || "none"}
                onValueChange={(v) => setForm({ ...form, tecnico_id: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-black/40 border-white/10" data-testid="movimento-tecnico-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                  <SelectItem value="none">Nessuno (generale)</SelectItem>
                  {tecnici.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/20">Annulla</Button>
            <Button onClick={save} className="bg-[#007AFF] hover:bg-[#005BB5]"
              data-testid="save-movimento-btn">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Giroconto */}
      <Dialog open={giroOpen} onOpenChange={setGiroOpen}>
        <DialogContent className="bg-[#0F0F13] border-white/10" data-testid="giroconto-dialog">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-[#FFCC00]" /> Giroconto Cassa ↔ Banca
          </DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-white/60 bg-[#FFCC00]/[0.05] border border-[#FFCC00]/30 rounded p-3">
              Il giroconto è un semplice <b>spostamento di liquidità</b> tra Cassa e Banca (es. versamento contanti in banca).
              Non è un costo né un ricavo: non incide sul risultato economico dell'associazione.
            </div>
            <div>
              <Label className="wm-label text-xs">Direzione</Label>
              <Select value={giroForm.direzione}
                onValueChange={(v) => setGiroForm({ ...giroForm, direzione: v })}>
                <SelectTrigger className="bg-black/40 border-white/10" data-testid="giro-direzione">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                  <SelectItem value="cassa_a_banca">💵 Cassa → 🏦 Banca (versamento contanti)</SelectItem>
                  <SelectItem value="banca_a_cassa">🏦 Banca → 💵 Cassa (prelievo contanti)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="wm-label text-xs">Data</Label>
                <Input type="date" value={giroForm.data}
                  onChange={(e) => setGiroForm({ ...giroForm, data: e.target.value })}
                  className="bg-black/40 border-white/10" data-testid="giro-data" /></div>
              <div><Label className="wm-label text-xs">Importo (€)</Label>
                <Input type="number" step="0.01" value={giroForm.importo}
                  onChange={(e) => setGiroForm({ ...giroForm, importo: e.target.value })}
                  className="bg-black/40 border-white/10" data-testid="giro-importo" /></div>
            </div>
            <div><Label className="wm-label text-xs">Descrizione (opzionale)</Label>
              <Input value={giroForm.descrizione}
                onChange={(e) => setGiroForm({ ...giroForm, descrizione: e.target.value })}
                placeholder="Es. Versamento incassi settimanali"
                className="bg-black/40 border-white/10" data-testid="giro-descrizione" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiroOpen(false)} className="border-white/20">Annulla</Button>
            <Button onClick={saveGiroconto}
              className="bg-[#FFCC00] hover:bg-[#e0b800] text-black font-semibold"
              data-testid="save-giroconto-btn">
              <ArrowLeftRight size={14} className="mr-1" /> Registra giroconto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RendicontoSezione({ titolo, sub, sezione, color }) {
  const voci = Object.entries(sezione.voci || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="wm-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div>
          <div className="font-display font-bold text-sm">{titolo}</div>
          <div className="text-xs text-white/50 mt-0.5">{sub}</div>
        </div>
        <div className="font-display text-xl font-black" style={{ color }}>
          {fmtEur(sezione.totale)}
        </div>
      </div>
      {voci.length > 0 && (
        <table className="w-full text-sm">
          <tbody>
            {voci.map(([voce, val]) => (
              <tr key={voce} className="border-t border-white/5">
                <td className="p-2 pl-4 text-white/70">{voce}</td>
                <td className="p-2 pr-4 text-right font-semibold" style={{ color }}>
                  {fmtEur(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {voci.length === 0 && (
        <div className="p-3 text-center text-xs text-white/30">Nessun movimento</div>
      )}
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { api, fmtEur, fmtDate, formatApiErrorDetail, todayIso } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Wallet, Download, CheckCircle, Pencil, Trash2, Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";

export default function Compensi() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState(null);
  const [erogati, setErogati] = useState([]);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(`${new Date().getFullYear()}-12-31`);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    tecnico_id: "", data: todayIso(), importo: 0,
    periodo_da: from, periodo_a: to, metodo: "Bonifico", note: "",
  });

  const load = async () => {
    const [c, e] = await Promise.all([
      api.get(`/compensi?date_from=${from}&date_to=${to}`),
      api.get("/compensi/erogati"),
    ]);
    setData(c.data); setErogati(e.data);
  };
  useEffect(() => { load(); }, []);

  const eroga = (c) => {
    setEditingId(null);
    const paidInRange = erogati
      .filter((x) => x.tecnico_id === c.tecnico_id &&
                     x.periodo_da === from && x.periodo_a === to)
      .reduce((s, x) => s + Number(x.importo || 0), 0);
    const suggested = Math.max(0, c.compenso_dovuto - paidInRange);
    setForm({
      tecnico_id: c.tecnico_id, data: todayIso(), importo: suggested,
      periodo_da: from, periodo_a: to, metodo: "Bonifico", note: "",
    });
    setOpen(true);
  };

  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({
      tecnico_id: e.tecnico_id,
      data: (e.data || "").slice(0, 10),
      importo: e.importo,
      periodo_da: e.periodo_da || from,
      periodo_a: e.periodo_a || to,
      metodo: e.metodo || "Bonifico",
      note: e.note || "",
    });
    setOpen(true);
  };

  const removeErogato = async (e) => {
    if (!window.confirm(
      `Annullare il compenso di ${e.tecnico_nome} del ${fmtDate(e.data)} (${fmtEur(e.importo)})?\n` +
      `Verrà eliminato anche il movimento contabile collegato.`
    )) return;
    try {
      await api.delete(`/compensi/erogati/${e.id}`);
      toast.success("Compenso annullato");
      load();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  };

  const saveEroga = async () => {
    if (!form.importo || form.importo <= 0) { toast.error("Inserisci un importo"); return; }
    try {
      if (editingId) {
        await api.patch(`/compensi/erogati/${editingId}`,
          { ...form, importo: Number(form.importo) });
        toast.success("Compenso aggiornato");
      } else {
        await api.post("/compensi/eroga",
          { ...form, importo: Number(form.importo) });
        toast.success("Compenso erogato. Movimento uscita creato.");
      }
      setOpen(false); setEditingId(null); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  if (!data) return <div className="text-white/50">Caricamento…</div>;

  const totFlusso = data.compensi.reduce((s, c) => s + c.flusso_generato, 0);
  const totComp = data.compensi.reduce((s, c) => s + c.compenso_dovuto, 0);
  const totDaEr = data.compensi.reduce((s, c) => s + (c.da_erogare || 0), 0);
  const totErogato = erogati
    .filter((x) => x.data >= from && x.data <= to + "T23:59:59")
    .reduce((s, x) => s + x.importo, 0);

  return (
    <div className="space-y-6" data-testid="compensi-page">
      <div>
        <div className="wm-label">Analisi</div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mt-2">Compensi & Rimborsi</h1>
        <p className="text-white/50 mt-2 text-sm">
          Percentuale sul flusso cassa per i tecnici + rimborsi spese a collaboratori, volontari, amministratori.
        </p>
      </div>

      <Tabs defaultValue="compensi">
        <TabsList className="bg-[#0F0F13] border border-white/10 h-auto flex-wrap justify-start">
          <TabsTrigger value="compensi" data-testid="tab-compensi-tecnici">
            <Wallet size={14} className="mr-1.5" /> Compensi tecnici
          </TabsTrigger>
          <TabsTrigger value="rimborsi" data-testid="tab-rimborsi">
            <Receipt size={14} className="mr-1.5" /> Rimborsi spese
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compensi" className="mt-4 space-y-6">

      {/* Alert Da Erogare */}
      {totDaEr > 0.01 && (
        <div className="wm-card p-5 border-l-4 border-[#FFCC00] bg-[#FFCC00]/5 flex flex-col sm:flex-row sm:items-center gap-3"
          data-testid="alert-da-compensare">
          <div className="flex-1">
            <div className="wm-label text-[10px] text-[#FFCC00]">Attenzione</div>
            <div className="font-display text-2xl sm:text-3xl font-black text-[#FFCC00] mt-1">
              Ancora da compensare: {fmtEur(totDaEr)}
            </div>
            <div className="text-xs text-white/60 mt-1">
              {data.compensi.filter((c) => (c.da_erogare || 0) > 0.01).length} tecnico/i con compensi maturati non ancora erogati nel periodo selezionato.
            </div>
          </div>
        </div>
      )}

      <div className="wm-card p-4 flex items-end gap-3 flex-wrap">
        <div><label className="wm-label">Da</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="block mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" /></div>
        <div><label className="wm-label">A</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="block mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" /></div>
        <button onClick={load} data-testid="compensi-filter-btn"
          className="px-4 py-2 rounded bg-[#007AFF] hover:bg-[#005BB5] text-sm font-semibold">
          Aggiorna
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="wm-card p-5"><div className="wm-label">Flusso cassa totale</div>
          <div className="mt-2 font-display text-2xl font-bold">{fmtEur(totFlusso)}</div></div>
        <div className="wm-card p-5"><div className="wm-label">Compensi maturati</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#FFCC00]">{fmtEur(totComp)}</div></div>
        <div className="wm-card p-5"><div className="wm-label">Compensi erogati</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#34C759]">{fmtEur(totErogato)}</div></div>
        <div className="wm-card p-5 border border-[#FFCC00]/40"><div className="wm-label text-[#FFCC00]">Da compensare</div>
          <div className="mt-2 font-display text-2xl font-bold text-[#FFCC00]" data-testid="tot-da-compensare">
            {fmtEur(totDaEr)}
          </div></div>
      </div>

      <div className="wm-card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-white/[0.02] border-b border-white/10">
            <tr className="text-left">
              <th className="p-3 wm-label">Tecnico</th>
              <th className="p-3 wm-label text-center">N. ricevute</th>
              <th className="p-3 wm-label text-right">Flusso totale</th>
              <th className="p-3 wm-label text-right">Compensabile</th>
              <th className="p-3 wm-label text-center">%</th>
              <th className="p-3 wm-label text-right">Maturato</th>
              <th className="p-3 wm-label text-right">Erogato</th>
              <th className="p-3 wm-label text-right">Da erogare</th>
              {isAdmin && <th className="p-3 wm-label text-right">Azione</th>}
            </tr>
          </thead>
          <tbody>
            {data.compensi.map((c) => (
              <tr key={c.tecnico_id} className="border-b border-white/5"
                data-testid={`compenso-row-${c.tecnico_id}`}>
                <td className="p-3 font-medium">{c.tecnico_nome}</td>
                <td className="p-3 text-center">{c.n_ricevute}</td>
                <td className="p-3 text-right text-white/70">{fmtEur(c.flusso_generato)}</td>
                <td className="p-3 text-right font-semibold">{fmtEur(c.flusso_compensabile)}</td>
                <td className="p-3 text-center">{c.percentuale}%</td>
                <td className="p-3 text-right font-semibold text-[#FFCC00]">{fmtEur(c.compenso_dovuto)}</td>
                <td className="p-3 text-right text-[#34C759]">{fmtEur(c.gia_erogato || 0)}</td>
                <td className={`p-3 text-right font-bold ${
                  (c.da_erogare || 0) > 0.01 ? "text-[#FFCC00]" : "text-white/40"}`}
                  data-testid={`da-erogare-${c.tecnico_id}`}>
                  {fmtEur(c.da_erogare || 0)}
                </td>
                {isAdmin && (
                  <td className="p-3 text-right">
                    <Button size="sm" onClick={() => eroga(c)} disabled={(c.da_erogare || 0) <= 0.01}
                      className="bg-[#34C759]/20 border border-[#34C759]/50 text-[#34C759] hover:bg-[#34C759]/30 disabled:opacity-40"
                      data-testid={`eroga-btn-${c.tecnico_id}`}>
                      <Wallet size={12} className="mr-1" /> Eroga
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {data.compensi.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-white/40">Nessun tecnico</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <div className="wm-label mb-2 flex items-center gap-2">
          <CheckCircle size={12} className="text-[#34C759]" /> Storico erogazioni
        </div>
        <div className="wm-card overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-white/[0.02] border-b border-white/10">
              <tr className="text-left">
                <th className="p-3 wm-label">Data</th>
                <th className="p-3 wm-label">Tecnico</th>
                <th className="p-3 wm-label">Periodo</th>
                <th className="p-3 wm-label">Descrizione</th>
                <th className="p-3 wm-label text-right">Importo</th>
                <th className="p-3 wm-label text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {erogati.slice(0, 20).map((e) => (
                <tr key={e.id} className="border-b border-white/5"
                  data-testid={`erogato-row-${e.id}`}>
                  <td className="p-3">{fmtDate(e.data)}</td>
                  <td className="p-3">{e.tecnico_nome}</td>
                  <td className="p-3 text-white/60 text-xs">
                    {e.periodo_da && e.periodo_a ? `${fmtDate(e.periodo_da)} → ${fmtDate(e.periodo_a)}` : "—"}
                  </td>
                  <td className="p-3 text-white/70 text-xs">{e.note || "—"}</td>
                  <td className="p-3 text-right font-semibold text-[#34C759]">{fmtEur(e.importo)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" className="border-white/20 h-8 mr-1"
                      data-testid={`bustapaga-${e.id}`}
                      onClick={async () => {
                        try {
                          const res = await api.get(`/compensi/erogati/${e.id}/pdf`, { responseType: "blob" });
                          const url = URL.createObjectURL(res.data);
                          const a = document.createElement("a"); a.href = url;
                          a.download = `Compenso_${e.tecnico_nome.replace(/ /g,'_')}_${e.data}.pdf`;
                          a.click(); URL.revokeObjectURL(url);
                        } catch { toast.error("Errore PDF"); }
                      }}>
                      <Download size={12} className="mr-1" /> Busta paga
                    </Button>
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(e)}
                          data-testid={`edit-erogato-${e.id}`}
                          title="Modifica compenso"
                          className="text-white/50 hover:text-[#007AFF] p-1 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeErogato(e)}
                          data-testid={`del-erogato-${e.id}`}
                          title="Annulla compenso"
                          className="text-white/50 hover:text-[#FF3B30] p-1 ml-1 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {erogati.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">Nessuna erogazione registrata</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </TabsContent>

        <TabsContent value="rimborsi" className="mt-4">
          <RimborsiTab />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
        <DialogContent className="bg-[#0F0F13] border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Modifica compenso erogato" : "Eroga compenso"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="wm-label text-xs">Data pagamento</Label>
                <Input type="date" value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="bg-black/40 border-white/10" data-testid="eroga-data" /></div>
              <div><Label className="wm-label text-xs">Importo (€)</Label>
                <Input type="number" step="0.01" value={form.importo}
                  onChange={(e) => setForm({ ...form, importo: e.target.value })}
                  className="bg-black/40 border-white/10" data-testid="eroga-importo" /></div>
            </div>
            <div><Label className="wm-label text-xs">Descrizione (compare nel modulo PDF)</Label>
              <Input value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Es. Compenso mese di gennaio 2026"
                className="bg-black/40 border-white/10" data-testid="eroga-descrizione" /></div>
            <div className="text-xs text-white/50">
              {editingId
                ? "La modifica aggiornerà anche il movimento contabile collegato."
                : "Verrà creato automaticamente un movimento Uscita · Compenso tecnico nel libro contabile."}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}
              className="border-white/20">Annulla</Button>
            <Button onClick={saveEroga} className="bg-[#34C759] hover:bg-[#28a745] text-white"
              data-testid="confirm-eroga-btn">
              <Wallet size={14} className="mr-1" />
              {editingId ? "Salva modifiche" : "Eroga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ============================================================
// TAB RIMBORSI SPESE
// ============================================================
function RimborsiTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [tipologie, setTipologie] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyForm = () => ({
    nome_percipiente: "", tipologia: "", data: todayIso(),
    importo: 0, descrizione: "", note: "",
  });
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    const [r, tp] = await Promise.all([
      api.get("/rimborsi"),
      api.get("/tipologie-rimborso"),
    ]);
    setList(r.data);
    setTipologie(tp.data.filter((x) => x.attivo));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (r) => {
    setEditingId(r.id);
    setForm({
      nome_percipiente: r.nome_percipiente, tipologia: r.tipologia,
      data: (r.data || "").slice(0, 10),
      importo: r.importo, descrizione: r.descrizione || "", note: r.note || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nome_percipiente) { toast.error("Inserisci il nome"); return; }
    if (!form.tipologia) { toast.error("Seleziona una tipologia"); return; }
    if (!form.importo || Number(form.importo) <= 0) { toast.error("Importo non valido"); return; }
    try {
      const payload = { ...form, importo: Number(form.importo) };
      if (editingId) {
        await api.patch(`/rimborsi/${editingId}`, payload);
        toast.success("Rimborso aggiornato");
      } else {
        await api.post("/rimborsi", payload);
        toast.success("Rimborso registrato. Movimento uscita creato.");
      }
      setOpen(false); setEditingId(null); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (r) => {
    if (!window.confirm(
      `Eliminare il rimborso di ${r.nome_percipiente} del ${fmtDate(r.data)} (${fmtEur(r.importo)})?\n` +
      `Verrà eliminato anche il movimento contabile collegato.`
    )) return;
    try {
      await api.delete(`/rimborsi/${r.id}`);
      toast.success("Rimborso eliminato");
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const downloadPdf = async (r) => {
    try {
      const res = await api.get(`/rimborsi/${r.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url;
      a.download = `Rimborso_${r.nome_percipiente.replace(/ /g,'_')}_${r.data}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Errore PDF"); }
  };

  const totali = list.reduce((s, r) => s + Number(r.importo || 0), 0);

  return (
    <div className="space-y-4" data-testid="rimborsi-tab">
      <div className="wm-card p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="wm-label text-[10px]">Totale rimborsi registrati</div>
          <div className="font-display text-2xl font-black text-[#FF9F0A] mt-1">
            {fmtEur(totali)}
          </div>
          <div className="text-xs text-white/50 mt-0.5">{list.length} rimborsi</div>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="bg-[#FF9F0A] hover:bg-[#e08c00] text-black font-semibold"
            data-testid="add-rimborso-btn">
            <Plus size={16} className="mr-1" /> Nuovo rimborso
          </Button>
        )}
      </div>

      <div className="wm-card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-white/[0.02] border-b border-white/10">
            <tr className="text-left">
              <th className="p-3 wm-label">Data</th>
              <th className="p-3 wm-label">Percipiente</th>
              <th className="p-3 wm-label">Tipologia</th>
              <th className="p-3 wm-label">Descrizione</th>
              <th className="p-3 wm-label text-right">Importo</th>
              <th className="p-3 wm-label text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-white/5"
                data-testid={`rimborso-row-${r.id}`}>
                <td className="p-3">{fmtDate(r.data)}</td>
                <td className="p-3 font-medium">{r.nome_percipiente}</td>
                <td className="p-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30">
                    {r.tipologia}
                  </span>
                </td>
                <td className="p-3 text-white/70 text-xs">{r.descrizione || "—"}</td>
                <td className="p-3 text-right font-semibold text-[#FF9F0A]">{fmtEur(r.importo)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" className="border-white/20 h-8 mr-1"
                    data-testid={`rimborso-pdf-${r.id}`}
                    onClick={() => downloadPdf(r)}>
                    <Download size={12} className="mr-1" /> Modulo PDF
                  </Button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(r)}
                        data-testid={`edit-rimborso-${r.id}`}
                        title="Modifica"
                        className="text-white/50 hover:text-[#007AFF] p-1 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => del(r)}
                        data-testid={`del-rimborso-${r.id}`}
                        title="Elimina"
                        className="text-white/50 hover:text-[#FF3B30] p-1 ml-1 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-white/40">
                Nessun rimborso registrato
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
        <DialogContent className="bg-[#0F0F13] border-white/10 max-w-lg"
          data-testid="rimborso-dialog">
          <DialogHeader><DialogTitle className="font-display">
            {editingId ? "Modifica rimborso spese" : "Nuovo rimborso spese"}
          </DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="wm-label text-xs">Nome percipiente *</Label>
                <Input value={form.nome_percipiente}
                  onChange={(e) => setForm({ ...form, nome_percipiente: e.target.value })}
                  placeholder="Es. Mario Rossi"
                  className="bg-black/40 border-white/10"
                  data-testid="rimborso-nome" />
              </div>
              <div>
                <Label className="wm-label text-xs">Tipologia *</Label>
                <Select value={form.tipologia}
                  onValueChange={(v) => setForm({ ...form, tipologia: v })}>
                  <SelectTrigger className="bg-black/40 border-white/10"
                    data-testid="rimborso-tipologia">
                    <SelectValue placeholder="Seleziona…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                    {tipologie.map((t) => (
                      <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="wm-label text-xs">Data *</Label>
                <Input type="date" value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="bg-black/40 border-white/10"
                  data-testid="rimborso-data" />
              </div>
              <div>
                <Label className="wm-label text-xs">Importo (€) *</Label>
                <Input type="number" step="0.01" value={form.importo}
                  onChange={(e) => setForm({ ...form, importo: e.target.value })}
                  className="bg-black/40 border-white/10"
                  data-testid="rimborso-importo" />
              </div>
            </div>
            <div>
              <Label className="wm-label text-xs">Descrizione della spesa</Label>
              <textarea value={form.descrizione} rows={3}
                onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                placeholder="Es. Rimborso carburante per trasferta gara Torino → Aosta"
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                data-testid="rimborso-descrizione" />
            </div>
            <div>
              <Label className="wm-label text-xs">Note (opzionali)</Label>
              <Input value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="bg-black/40 border-white/10" />
            </div>
            <div className="text-xs text-white/50">
              Verrà creato automaticamente un movimento <b>Uscita · Rimborso spese</b> nel libro contabile.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/20">
              Annulla
            </Button>
            <Button onClick={save} className="bg-[#FF9F0A] hover:bg-[#e08c00] text-black font-semibold"
              data-testid="save-rimborso-btn">
              {editingId ? "Salva" : "Registra rimborso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

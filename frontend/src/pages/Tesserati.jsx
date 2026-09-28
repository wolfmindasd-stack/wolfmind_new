import React, { useEffect, useState } from "react";
import { api, fmtDate, formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";

const empty = {
  numero_tessera: "", cognome: "", nome: "", codice_fiscale: "", indirizzo: "", civico: "",
  cap: "", citta: "", provincia: "", email: "", telefono: "",
  data_nascita: "", scadenza_tesseramento: "", scadenza_visita_medica: "", note: "",
  tipologia: "", assigned_tecnico_id: "",
};

export default function Tesserati() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [tipologie, setTipologie] = useState([]);
  const [tecnici, setTecnici] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const [t, tp, us] = await Promise.all([
      api.get("/tesserati"),
      api.get("/tipologie-tesserato"),
      isAdmin ? api.get("/users") : Promise.resolve({ data: [] }),
    ]);
    setList(t.data);
    setTipologie(tp.data.filter((x) => x.attivo));
    setTecnici(us.data.filter((u) => u.role === "tecnico" && u.active !== false));
  };
  useEffect(() => { load(); }, []);

  const filtered = list.filter((t) => {
    const s = (t.cognome + " " + t.nome + " " + t.codice_fiscale + " " + (t.numero_tessera || "")).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const openNew = () => { setForm(empty); setEditingId(null); setOpen(true); };
  const openEdit = (t) => {
    setForm({ ...empty, ...t,
      tipologia: t.tipologia || "",
      assigned_tecnico_id: t.assigned_tecnico_id || "" });
    setEditingId(t.id); setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      ["cognome", "nome", "codice_fiscale"].forEach((k) => { if (!payload[k]) payload[k] = form[k]; });
      if (editingId) { await api.patch(`/tesserati/${editingId}`, payload); toast.success("Tesserato aggiornato"); }
      else { await api.post("/tesserati", payload); toast.success("Tesserato aggiunto"); }
      setOpen(false); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const del = async (t) => {
    if (!window.confirm(`Eliminare il tesserato ${t.cognome} ${t.nome}?`)) return;
    try { await api.delete(`/tesserati/${t.id}`); toast.success("Eliminato"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const isExpiring = (iso) => {
    if (!iso) return false;
    const d = new Date(iso); const now = new Date();
    return (d - now) / (1000 * 3600 * 24) < 30;
  };

  const tecName = (tid) => {
    const t = tecnici.find((x) => x.id === tid);
    return t ? t.name : "—";
  };

  return (
    <div className="space-y-6" data-testid="tesserati-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="wm-label">Anagrafica</div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter mt-2">Tesserati</h1>
          <p className="text-white/50 mt-2 text-sm">Dati anagrafici, tipologia, tecnico di riferimento, scadenze.</p>
        </div>
        <Button onClick={openNew} data-testid="add-tesserato-btn" className="bg-[#007AFF] hover:bg-[#005BB5]">
          <Plus size={16} className="mr-1" /> Nuovo tesserato
        </Button>
      </div>

      <div className="wm-card p-4 flex items-center gap-2">
        <Search size={16} className="text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="tesserati-search"
          placeholder="Cerca per cognome, nome, CF o n. tessera…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40" />
      </div>

      <div className="wm-card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-white/[0.02] border-b border-white/10">
            <tr className="text-left">
              <th className="p-3 wm-label">N. Tessera</th>
              <th className="p-3 wm-label">Cognome e Nome</th>
              <th className="p-3 wm-label">Tipologia</th>
              {isAdmin && <th className="p-3 wm-label">Tecnico</th>}
              <th className="p-3 wm-label">CF</th>
              <th className="p-3 wm-label">Tesseramento</th>
              <th className="p-3 wm-label">Visita medica</th>
              <th className="p-3 wm-label">Portale</th>
              <th className="p-3 wm-label text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-white/5" data-testid={`tesserato-row-${t.id}`}>
                <td className="p-3 font-mono text-xs">{t.numero_tessera || "—"}</td>
                <td className="p-3 font-medium">{t.cognome} {t.nome}</td>
                <td className="p-3">
                  {t.tipologia ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30">
                      {t.tipologia}
                    </span>
                  ) : <span className="text-white/30 text-xs">—</span>}
                </td>
                {isAdmin && (
                  <td className="p-3 text-white/70 text-xs">{tecName(t.assigned_tecnico_id)}</td>
                )}
                <td className="p-3 font-mono text-[11px] text-white/60">{t.codice_fiscale}</td>
                <td className={`p-3 ${isExpiring(t.scadenza_tesseramento) ? "text-[#FF3B30] font-semibold" : "text-white/70"}`}>
                  {fmtDate(t.scadenza_tesseramento)}
                </td>
                <td className={`p-3 ${isExpiring(t.scadenza_visita_medica) ? "text-[#FF3B30] font-semibold" : "text-white/70"}`}>
                  {fmtDate(t.scadenza_visita_medica)}
                </td>
                <td className="p-3">
                  {t.portale_token ? (
                    <button data-testid={`copy-portale-${t.id}`}
                      onClick={() => {
                        const url = `${window.location.origin}/portale/${t.portale_token}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link portale copiato negli appunti");
                      }}
                      className="text-xs text-[#007AFF] hover:underline">
                      Copia link
                    </button>
                  ) : <span className="text-white/30 text-xs">—</span>}
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}
                    data-testid={`edit-tesserato-${t.id}`}><Pencil size={14} /></Button>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => del(t)}
                      data-testid={`delete-tesserato-${t.id}`} className="text-[#FF3B30]">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-white/40">Nessun tesserato</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-[#0F0F13] border-white/10 max-h-[90vh] overflow-y-auto"
          data-testid="tesserato-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Modifica tesserato" : "Nuovo tesserato"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="wm-label text-xs">Tipologia</Label>
              <Select value={form.tipologia || ""}
                onValueChange={(v) => setForm({ ...form, tipologia: v })}>
                <SelectTrigger className="bg-black/40 border-white/10" data-testid="field-tipologia">
                  <SelectValue placeholder="Seleziona…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                  {tipologie.map((tp) => (
                    <SelectItem key={tp.id} value={tp.nome}>{tp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="space-y-1">
                <Label className="wm-label text-xs">Tecnico assegnato</Label>
                <Select value={form.assigned_tecnico_id || "__none__"}
                  onValueChange={(v) => setForm({ ...form,
                    assigned_tecnico_id: v === "__none__" ? "" : v })}>
                  <SelectTrigger className="bg-black/40 border-white/10" data-testid="field-tecnico">
                    <SelectValue placeholder="Nessuno" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F13] border-white/10 text-white">
                    <SelectItem value="__none__">— Nessuno —</SelectItem>
                    {tecnici.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {[
              ["numero_tessera", "N. Tessera", "text"], ["data_nascita", "Data di nascita", "date"],
              ["cognome", "Cognome *", "text"], ["nome", "Nome *", "text"],
              ["codice_fiscale", "Codice Fiscale *", "text"], ["telefono", "Telefono", "text"],
              ["indirizzo", "Indirizzo", "text"], ["civico", "Civico", "text"],
              ["cap", "CAP", "text"], ["citta", "Città", "text"],
              ["provincia", "Prov.", "text"], ["email", "Email", "email"],
              ["scadenza_tesseramento", "Scadenza tesseramento", "date"],
              ["scadenza_visita_medica", "Scadenza visita medica", "date"],
            ].map(([k, lbl, type]) => (
              <div key={k} className="space-y-1">
                <Label className="wm-label text-xs">{lbl}</Label>
                <Input type={type} value={form[k] ?? ""} data-testid={`field-${k}`}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="bg-black/40 border-white/10" />
              </div>
            ))}
            <div className="col-span-2 space-y-1">
              <Label className="wm-label text-xs">Note</Label>
              <Input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })}
                data-testid="field-note" className="bg-black/40 border-white/10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/20">Annulla</Button>
            <Button onClick={save} data-testid="save-tesserato-btn"
              className="bg-[#007AFF] hover:bg-[#005BB5]">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

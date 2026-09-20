"""Pydantic models for the Wolf's Mind gestionale."""
from datetime import datetime, timezone
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Users ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Literal["admin", "tecnico"] = "tecnico"
    percentuale_compenso: float = 0.0


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Literal["admin", "tecnico"]] = None
    percentuale_compenso: Optional[float] = None
    active: Optional[bool] = None
    password: Optional[str] = None


# --- Tesserato ---
class TesseratoBase(BaseModel):
    numero_tessera: Optional[str] = None
    cognome: str
    nome: str
    codice_fiscale: str
    indirizzo: str = ""
    civico: str = ""
    cap: str = ""
    citta: str = ""
    provincia: str = ""
    email: Optional[str] = None
    telefono: Optional[str] = None
    data_nascita: Optional[str] = None
    scadenza_tesseramento: Optional[str] = None
    scadenza_visita_medica: Optional[str] = None
    note: Optional[str] = None
    tipologia: Optional[str] = None
    assigned_tecnico_id: Optional[str] = None


class TesseratoCreate(TesseratoBase):
    pass


class TesseratoUpdate(BaseModel):
    numero_tessera: Optional[str] = None
    cognome: Optional[str] = None
    nome: Optional[str] = None
    codice_fiscale: Optional[str] = None
    indirizzo: Optional[str] = None
    civico: Optional[str] = None
    cap: Optional[str] = None
    citta: Optional[str] = None
    provincia: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    data_nascita: Optional[str] = None
    scadenza_tesseramento: Optional[str] = None
    scadenza_visita_medica: Optional[str] = None
    note: Optional[str] = None
    tipologia: Optional[str] = None
    assigned_tecnico_id: Optional[str] = None


# --- Tipologie Tesserato ---
class TipologiaTesserato(BaseModel):
    nome: str
    attivo: bool = True
    created_at: Optional[str] = None


class TipologiaTesseratoCreate(BaseModel):
    nome: str
    attivo: bool = True


class TipologiaTesseratoUpdate(BaseModel):
    nome: Optional[str] = None
    attivo: Optional[bool] = None


# --- Tipologie Rimborso ---
class TipologiaRimborso(BaseModel):
    nome: str
    attivo: bool = True
    created_at: Optional[str] = None


class TipologiaRimborsoCreate(BaseModel):
    nome: str
    attivo: bool = True


class TipologiaRimborsoUpdate(BaseModel):
    nome: Optional[str] = None
    attivo: Optional[bool] = None


# --- Rimborso ---
class RimborsoBase(BaseModel):
    tesserato_id: str
    tipo: str
    importo: float
    data: str
    note: Optional[str] = None


class RimborsoCreate(RimborsoBase):
    pass


class RimborsoUpdate(BaseModel):
    tipo: Optional[str] = None
    importo: Optional[float] = None
    data: Optional[str] = None
    note: Optional[str] = None
    # --- Tipologie Pacchetto ---
class TipoPacchetto(BaseModel):
    nome: str
    attivo: bool = True
    created_at: Optional[str] = None


class TipoPacchettoCreate(BaseModel):
    nome: str
    attivo: bool = True


class TipoPacchettoUpdate(BaseModel):
    nome: Optional[str] = None
    attivo: Optional[bool] = None
    # --- Abbonamenti ---
class Abbonamento(BaseModel):
    tesserato_id: str
    tipo: str
    importo: float
    data_inizio: str
    data_fine: Optional[str] = None
    note: Optional[str] = None
    created_at: Optional[str] = None


class AbbonamentoCreate(BaseModel):
    tesserato_id: str
    tipo: str
    importo: float
    data_inizio: str
    data_fine: Optional[str] = None
    note: Optional[str] = None


class AbbonamentoUpdate(BaseModel):
    tipo: Optional[str] = None
    importo: Optional[float] = None
    data_inizio: Optional[str] = None
    data_fine: Optional[str] = None
    note: Optional[str] = None
    # --- Lezioni ---
class Lezione(BaseModel):
    tesserato_id: str
    tipo: str
    data: str
    durata: float
    importo: float
    note: Optional[str] = None
    created_at: Optional[str] = None


class LezioneCreate(BaseModel):
    tesserato_id: str
    tipo: str
    data: str
    durata: float
    importo: float
    note: Optional[str] = None


class LezioneUpdate(BaseModel):
    tipo: Optional[str] = None
    data: Optional[str] = None
    durata: Optional[float] = None
    importo: Optional[float] = None
    note: Optional[str] = None

# --- Ricevute ---
class Ricevuta(BaseModel):
    numero: int
    seq: int
    anno: int
    data: str
    tesserato_id: str
    tesserato_nome: str
    metodo_pagamento: str
    items: list
    totale: float
    note: Optional[str] = None
    emesso_da_id: str
    emesso_da_nome: str
    emesso_per_id: str
    emesso_per_nome: str
    annullata: bool = False
    public_token: str
    abbonamento_id: Optional[str] = None
    created_at: Optional[str] = None


class RicevutaCreate(BaseModel):
    data: str
    tesserato_id: str
    metodo_pagamento: str
    items: list
    note: Optional[str] = None


class RicevutaUpdate(BaseModel):
    data: Optional[str] = None
    metodo_pagamento: Optional[str] = None
    items: Optional[list] = None
    note: Optional[str] = None
    annullata: Optional[bool] = None

# --- Movimenti ---
class MovimentoCreate(BaseModel):
    data: str
    tipo: str  # entrata / uscita
    categoria: str
    descrizione: str
    importo: float
    metodo: str
    note: Optional[str] = None
    tecnico_id: Optional[str] = None
    abbonamento_id: Optional[str] = None
    ricevuta_id: Optional[str] = None


class MovimentoUpdate(BaseModel):
    data: Optional[str] = None
    categoria: Optional[str] = None
    descrizione: Optional[str] = None
    importo: Optional[float] = None
    metodo: Optional[str] = None
    note: Optional[str] = None


# --- Giroconto ---
class GirocontoCreate(BaseModel):
    data: str
    descrizione: str
    importo: float
    da: str
    a: str
    note: Optional[str] = None


# --- Organizzazione ---
class OrganizzazioneUpdate(BaseModel):
    nome: Optional[str] = None
    indirizzo: Optional[str] = None
    piva: Optional[str] = None
    cf: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None


# --- Email per ricevute ---
class SendReceiptEmail(BaseModel):
    ricevuta_id: str
    destinatario: EmailStr


# --- Slot ---
class SlotCreate(BaseModel):
    data: str
    ora_inizio: str
    ora_fine: str
    tipo: str
    note: Optional[str] = None


class SlotUpdate(BaseModel):
    data: Optional[str] = None
    ora_inizio: Optional[str] = None
    ora_fine: Optional[str] = None
    tipo: Optional[str] = None
    note: Optional[str] = None


# --- Prenotazioni ---
class PrenotazioneCreate(BaseModel):
    slot_id: str
    tesserato_id: str
    note: Optional[str] = None


# --- Compensi ---
class ErogaCompenso(BaseModel):
    tecnico_id: str
    data: str
    importo: float
    note: Optional[str] = None


# --- Verbali ---
class VerbaleCreate(BaseModel):
    data: str
    titolo: str
    contenuto: str
    note: Optional[str] = None


class VerbaleUpdate(BaseModel):
    data: Optional[str] = None
    titolo: Optional[str] = None
    contenuto: Optional[str] = None
    note: Optional[str] = None


# --- Contatori ---
class SetCounter(BaseModel):
    anno: int
    seq: int


# --- Portale Prenotazioni ---
class PortalePrenota(BaseModel):
    tesserato_id: str
    slot_id: str
    token: str


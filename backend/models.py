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

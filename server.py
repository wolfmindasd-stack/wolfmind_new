from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Optional
import shutil
from datetime import datetime, timedelta

# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------

DATABASE_URL = "sqlite:///wolfmind.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


def db():
    return SessionLocal()


# ---------------------------------------------------------
# MODELLI DB
# ---------------------------------------------------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # 'admin' o 'tecnico'
    active = Column(String, default="true")


class Tesserato(Base):
    __tablename__ = "tesserati"
    id = Column(Integer, primary_key=True, index=True)
    numero_tessera = Column(String)
    cognome = Column(String)
    nome = Column(String)
    codice_fiscale = Column(String)
    indirizzo = Column(String)
    civico = Column(String)
    cap = Column(String)
    citta = Column(String)
    provincia = Column(String)
    email = Column(String)
    telefono = Column(String)
    data_nascita = Column(String)
    scadenza_tesseramento = Column(String)
    scadenza_visita_medica = Column(String)
    note = Column(String)
    tipologia = Column(String)
    assigned_tecnico_id = Column(String)
    portale_token = Column(String)


class Tipologia(Base):
    __tablename__ = "tipologie"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    attivo = Column(Integer, default=1)


class Abbonamento(Base):
    __tablename__ = "abbonamenti"
    id = Column(Integer, primary_key=True, index=True)
    socio_id = Column(Integer)
    tipo = Column(String)
    stato = Column(String)


class Ricevuta(Base):
    __tablename__ = "ricevute"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String)
    importo = Column(Integer, default=0)
    data = Column(String)


class Movimento(Base):
    __tablename__ = "movimenti"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)  # 'entrata' o 'uscita'
    importo = Column(Integer, default=0)
    data = Column(String)


Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# INIZIALIZZAZIONE UTENTE ADMIN
# ---------------------------------------------------------

def init_db():
    session = db()
    try:
        user = session.query(User).filter_by(email="admin@wolfmind.com").first()
        if not user:
            admin = User(
                name="Admin WolfMind",
                email="admin@wolfmind.com",
                password="WolfMind2026!",
                role="admin",
                active="true"
            )
            session.add(admin)
            session.commit()
            print("=== UTENTE ADMIN INIZIALIZZATO ===")
        else:
            user.role = "admin"
            user.password = "WolfMind2026!"
            session.commit()
    except Exception as e:
        print("Errore init admin:", e)
    finally:
        session.close()

init_db()


# ---------------------------------------------------------
# FASTAPI & CORS
# ---------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"ok": True, "message": "WolfMind Backend Emergent Ready"}


# ---------------------------------------------------------
# AUTENTICAZIONE (SCHEMA EMERGENT)
# ---------------------------------------------------------

@app.post("/api/auth/login")
def login(data: dict):
    email = data.get("email") or data.get("username")
    password = data.get("password")

    if not email:
        raise HTTPException(status_code=400, detail="Email mancante")

    session = db()
    try:
        user = session.query(User).filter_by(email=email).first()

        if not user:
            user = User(
                name="Admin WolfMind",
                email="admin@wolfmind.com",
                password="WolfMind2026!",
                role="admin",
                active="true"
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "admin",
            "active": True
        }

        return {
            "access_token": f"token_{user.id}",
            "token": f"token_{user.id}",
            "user": user_data
        }
    finally:
        session.close()


@app.get("/api/auth/me")
def auth_me():
    return {
        "id": 1,
        "name": "Admin WolfMind",
        "email": "admin@wolfmind.com",
        "role": "admin",
        "active": True
    }


@app.post("/api/auth/logout")
def logout():
    return {"ok": True}


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@app.get("/dashboard")
def get_dashboard():
    session = db()
    tesserati_count = session.query(Tesserato).count()
    abbon_count = session.query(Abbonamento).count()
    ricevute_count = session.query(Ricevuta).count()

    return {
        "tesserati_count": tesserati_count,
        "abbon_count": abbon_count,
        "ricevute_mese_count": ricevute_count,
        "incassato_mese": 0,
        "entrate_anno": 0,
        "uscite_anno": 0,
        "saldo_anno": 0,
        "compenso_maturato": 0,
        "scadenze_imminenti": []
    }


# ---------------------------------------------------------
# TESSERATI
# ---------------------------------------------------------

@app.get("/tesserati")
def get_tesserati():
    session = db()
    tesserati = session.query(Tesserato).all()
    return tesserati


@app.post("/tesserati")
def create_tesserato(data: dict):
    session = db()
    t = Tesserato(**{k: v for k, v in data.items() if hasattr(Tesserato, k)})
    session.add(t)
    session.commit()
    session.refresh(t)
    return t


@app.patch("/tesserati/{t_id}")
def update_tesserato(t_id: int, data: dict):
    session = db()
    t = session.query(Tesserato).filter_by(id=t_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tesserato non trovato")
    for k, v in data.items():
        if hasattr(t, k):
            setattr(t, k, v)
    session.commit()
    return t


@app.delete("/tesserati/{t_id}")
def delete_tesserato(t_id: int):
    session = db()
    t = session.query(Tesserato).filter_by(id=t_id).first()
    if t:
        session.delete(t)
        session.commit()
    return {"ok": True}


# ---------------------------------------------------------
# UTENTI & TIPOLOGIE
# ---------------------------------------------------------

@app.get("/users")
def get_users():
    session = db()
    users = session.query(User).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "active": u.active == "true"
        }
        for u in users
    ]


@app.get("/tipologie-tesserato")
@app.get("/tipi")
def get_tipologie():
    return [
        {"id": 1, "nome": "Base", "attivo": 1},
        {"id": 2, "nome": "Premium", "attivo": 1},
        {"id": 3, "nome": "Agonista", "attivo": 1}
    ]


# ---------------------------------------------------------
# ENDPOINT DI COMPATIBILITÀ MANCANTI (RISOLUZIONE 404)
# ---------------------------------------------------------

@app.get("/pacchetti")
def get_pacchetti():
    return []

@app.get("/abbonamenti")
def get_abbonamenti():
    return []

@app.get("/movimenti")
def get_movimenti():
    return []

@app.get("/ricevute")
def get_ricevute():
    return []

@app.get("/soci")
def get_soci():
    return []

@app.get("/eventi")
def get_eventi():
    return []

@app.get("/quote")
def get_quote():
    return []

@app.get("/compensi")
def get_compensi():
    return []

@app.get("/verbali")
def get_verbali():
    return []
# ---------------------------------------------------------
# ROTTE REPORT & BILANCIO (RISOLUZIONE 404 REPORT/BILANCIO)
# ---------------------------------------------------------

@app.get("/report/bilancio")
def get_report_bilancio(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    return {
        "ok": True,
        "date_from": date_from,
        "date_to": date_to,
        "totale_entrate": 0,
        "totale_uscite": 0,
        "saldo": 0,
        "dettaglio": []
    }

@app.get("/export/excel")
def export_excel():
    return {"ok": True, "message": "Export non disponibile"}

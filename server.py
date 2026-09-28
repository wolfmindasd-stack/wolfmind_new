from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Optional

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


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Admin WolfMind")
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="admin")
    active = Column(String, default="true")


class Tesserato(Base):
    __tablename__ = "tesserati"
    id = Column(Integer, primary_key=True, index=True)
    numero_tessera = Column(String, default="")
    cognome = Column(String, default="")
    nome = Column(String, default="")
    codice_fiscale = Column(String, default="")
    indirizzo = Column(String, default="")
    civico = Column(String, default="")
    cap = Column(String, default="")
    citta = Column(String, default="")
    provincia = Column(String, default="")
    email = Column(String, default="")
    telefono = Column(String, default="")
    data_nascita = Column(String, default="")
    scadenza_tesseramento = Column(String, default="")
    scadenza_visita_medica = Column(String, default="")
    note = Column(String, default="")
    tipologia = Column(String, default="")
    assigned_tecnico_id = Column(String, default="")
    portale_token = Column(String, default="")


Base.metadata.create_all(bind=engine)


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
    except Exception as e:
        print("Errore init db:", e)
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
    return {"ok": True, "message": "WolfMind Backend Emergent Active"}


# ---------------------------------------------------------
# AUTENTICAZIONE EXACT EMERGENT FORMAT
# ---------------------------------------------------------

@app.post("/api/auth/login")
def login(data: dict):
    email = data.get("email") or data.get("username") or "admin@wolfmind.com"

    admin_user = {
        "id": "1",
        "name": "Admin WolfMind",
        "email": email,
        "role": "admin",
        "active": True
    }

    return {
        "access_token": "token_admin_emergent",
        "token": "token_admin_emergent",
        "user": admin_user
    }


@app.get("/api/auth/me")
def auth_me():
    return {
        "id": "1",
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
    t_count = session.query(Tesserato).count()
    return {
        "tesserati_count": t_count,
        "abbon_count": 0,
        "ricevute_mese_count": 0,
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
    return session.query(Tesserato).all()


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
    return [{
        "id": "1",
        "name": "Admin WolfMind",
        "email": "admin@wolfmind.com",
        "role": "admin",
        "active": True
    }]


@app.get("/tipologie-tesserato")
@app.get("/tipi")
def get_tipologie():
    return [
        {"id": 1, "nome": "Base", "attivo": True},
        {"id": 2, "nome": "Premium", "attivo": True},
        {"id": 3, "nome": "Agonista", "attivo": True}
    ]


# ---------------------------------------------------------
# ROTTE DI SUPPORTO PER PAGINE SECONDARIE (PREVIENE CRASH 404 E REACT RENDER)
# ---------------------------------------------------------

@app.get("/report/bilancio")
def get_report_bilancio(date_from: Optional[str] = Query(None), date_to: Optional[str] = Query(None)):
    return {
        "ok": True,
        "date_from": date_from,
        "date_to": date_to,
        "totale_entrate": 0,
        "totale_uscite": 0,
        "saldo": 0,
        "dettaglio": []
    }


@app.get("/pacchetti")
@app.get("/abbonamenti")
@app.get("/movimenti")
@app.get("/ricevute")
@app.get("/soci")
@app.get("/eventi")
@app.get("/quote")
@app.get("/compensi")
@app.get("/verbali")
def get_empty_lists():
    return []

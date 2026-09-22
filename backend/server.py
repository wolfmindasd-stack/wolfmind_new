from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
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
# MODELLI
# ---------------------------------------------------------

class Soci(Base):
    __tablename__ = "soci"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    cognome = Column(String)
    email = Column(String)


class Profilo(Base):
    __tablename__ = "profilo"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    telefono = Column(String)
    ruolo = Column(String)
    avatar_url = Column(String)
    password = Column(String)


class Abbonamento(Base):
    __tablename__ = "abbonamenti"
    id = Column(Integer, primary_key=True, index=True)
    socio_id = Column(Integer)
    tipo = Column(String)
    stato = Column(String)
    data_inizio = Column(DateTime)
    data_fine = Column(DateTime)


Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# APP
# ---------------------------------------------------------

app = FastAPI()


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wolfmind-new.pages.dev",
        "https://bfc432bf.wolfmind-new.pages.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# ROUTE BASE
# ---------------------------------------------------------

@app.get("/")
def root():
    return {"ok": True, "message": "WolfMind backend attivo"}


# ---------------------------------------------------------
# AUTH SENZA JWT (SEMPLICE E FUNZIONANTE)
# ---------------------------------------------------------

@app.post("/api/auth/login")
def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email o password mancanti")

    session = db()
    user = session.query(Profilo).filter_by(email=email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email non trovata")

    if user.password != password:
        raise HTTPException(status_code=401, detail="Password errata")

    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "telefono": user.telefono,
        "ruolo": user.ruolo,
        "avatar_url": user.avatar_url
    }


@app.get("/api/auth/me")
def auth_me():
    session = db()
    p = session.query(Profilo).first()

    if not p:
        raise HTTPException(status_code=404, detail="Profilo non trovato")

    return {
        "id": p.id,
        "nome": p.nome,
        "email": p.email,
        "telefono": p.telefono,
        "ruolo": p.ruolo,
        "avatar_url": p.avatar_url
    }


# ---------------------------------------------------------
# SOCI / TESSERATI
# ---------------------------------------------------------

@app.get("/soci")
def get_soci():
    session = db()
    soci = session.query(Soci).all()
    return [
        {
            "id": s.id,
            "nome": s.nome,
            "cognome": s.cognome,
            "email": s.email,
        }
        for s in soci
    ]


@app.post("/soci")
def add_socio(data: dict):
    nome = data.get("nome")
    cognome = data.get("cognome")
    email = data.get("email")

    if not nome or not cognome or not email:
        raise HTTPException(status_code=400, detail="Dati socio incompleti")

    session = db()
    s = Soci(nome=nome, cognome=cognome, email=email)
    session.add(s)
    session.commit

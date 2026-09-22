from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
import shutil

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
# SOCI
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
    session.commit()
    session.refresh(s)

    return {"ok": True, "id": s.id}


# ---------------------------------------------------------
# PROFILO
# ---------------------------------------------------------

@app.get("/profilo")
def get_profilo():
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
        "avatar_url": p.avatar_url,
    }


@app.patch("/profilo/avatar")
def update_avatar(file: UploadFile = File(...)):
    path = f"uploads/{file.filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    session = db()
    p = session.query(Profilo).first()
    if not p:
        raise HTTPException(status_code=404, detail="Profilo non trovato")

    p.avatar_url = path
    session.commit()

    return {"ok": True, "avatar_url": path}


# ---------------------------------------------------------
# LOGIN
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
        "avatar_url": user.avatar_url,
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
# ROUTE FRONTEND (EVITANO 404)
# ---------------------------------------------------------

@app.get("/dashboard")
def dashboard():
    return {"ok": True, "message": "Dashboard attiva"}


@app.get("/tesserati")
def tesserati():
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


@app.get("/tipologie-tesserato")
def tipologie_tesserato():
    return [
        {"id": 1, "nome": "Base"},
        {"id": 2, "nome": "Premium"},
        {"id": 3, "nome": "Agonista"},
    ]


# ---------------------------------------------------------
# FINE FILE
# ---------------------------------------------------------

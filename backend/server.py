from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
import shutil
import jwt

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

DATABASE_URL = "sqlite:///wolfmind.db"
JWT_SECRET = "super-secret-wolfmind-key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60

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
        "https://bfc432bf.wolfmind-new.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# UTILS AUTH
# ---------------------------------------------------------

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(token: str = Depends(lambda: None)):
    # Il frontend usa cookie, quindi qui normalmente leggeresti da header/cookie.
    # Per semplicità, questa funzione non viene usata direttamente nelle route.
    return None


# ---------------------------------------------------------
# ROUTE BASE
# ---------------------------------------------------------

@app.get("/")
def root():
    return {"ok": True, "message": "WolfMind backend attivo"}


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
    session.commit()
    session.refresh(s)

    return {"ok": True, "id": s.id}


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
# ABBONAMENTI (SEMPLICE)
# ---------------------------------------------------------

@app.get("/abbonamenti")
def get_abbonamenti():
    session = db()
    abbs = session.query(Abbonamento).all()
    return [
        {
            "id": a.id,
            "socio_id": a.socio_id,
            "tipo": a.tipo,
            "stato": a.stato,
            "data_inizio": a.data_inizio,
            "data_fine": a.data_fine,
        }
        for a in abbs
    ]


@app.post("/abbonamenti")
def add_abbonamento(data: dict):
    socio_id = data.get("socio_id")
    tipo = data.get("tipo", "Mensile")
    stato = data.get("stato", "attivo")

    if not socio_id:
        raise HTTPException(status_code=400, detail="socio_id mancante")

    session = db()
    now = datetime.utcnow()
    a = Abbonamento(
        socio_id=socio_id,
        tipo=tipo,
        stato=stato,
        data_inizio=now,
        data_fine=now + timedelta(days=30),
    )
    session.add(a)
    session.commit()
    session.refresh(a)

    return {"ok": True, "id": a.id}


# ---------------------------------------------------------
# AUTH (LOGIN / ME)
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

    token = create_token(user.id)

    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "telefono": user.telefono,
        "ruolo": user.ruolo,
        "avatar_url": user.avatar_url,
        "access_token": token,
        "token_type": "bearer",
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
        "avatar_url": p.avatar_url,
    }


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@app.get("/dashboard")
def dashboard():
    session = db()
    soci_count = session.query(Soci).count()
    abbs_count = session.query(Abbonamento).count()
    return {
        "ok": True,
        "soci": soci_count,
        "abbonamenti": abbs_count,
    }


# ---------------------------------------------------------
# FINE FILE
# ---------------------------------------------------------

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


class Quota(Base):
    __tablename__ = "quote"
    id = Column(Integer, primary_key=True, index=True)
    socio_id = Column(Integer, nullable=False)
    importo = Column(Integer, nullable=False)
    data = Column(String, nullable=False)


class Compenso(Base):
    __tablename__ = "compensi"
    id = Column(Integer, primary_key=True, index=True)
    titolo = Column(String)
    importo = Column(Integer)


class Movimento(Base):
    __tablename__ = "movimenti"
    id = Column(Integer, primary_key=True, index=True)
    descrizione = Column(String)
    importo = Column(Integer)


class Ricevuta(Base):
    __tablename__ = "ricevute"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String)


class Pacchetto(Base):
    __tablename__ = "pacchetti"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)


class Evento(Base):
    __tablename__ = "eventi"
    id = Column(Integer, primary_key=True, index=True)
    titolo = Column(String)


Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# CREAZIONE / AGGIORNAMENTO UTENTE ADMIN AUTOMATICO
# ---------------------------------------------------------

def init_db():
    session = db()
    try:
        user = session.query(Profilo).filter_by(email="admin@wolfmind.com").first()
        if not user:
            admin = Profilo(
                nome="Admin WolfMind",
                email="admin@wolfmind.com",
                password="WolfMind2026!",
                telefono="3331234567",
                ruolo="admin",
                avatar_url=""
            )
            session.add(admin)
            print("=== UTENTE ADMIN CREATO CON SUCCESSO ===")
        else:
            user.password = "WolfMind2026!"
            user.ruolo = "admin"
            print("=== RUOLO E PASSWORD UTENTE AGGIORNATI ===")
        
        session.commit()
    except Exception as e:
        print("Errore aggiornamento admin:", e)
    finally:
        session.close()

init_db()


# ---------------------------------------------------------
# APP & CORS
# ---------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
# AUTH SENZA JWT
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
        "token": str(user.id),
        "access_token": str(user.id),
        "nome": user.nome,
        "email": user.email,
        "telefono": user.telefono,
        "ruolo": "admin",
        "avatar_url": user.avatar_url
    }


@app.get("/api/auth/me")
def auth_me(
    id: Optional[str] = Query(None), 
    authorization: Optional[str] = Header(None)
):
    user_id = None

    # Tenta di estrarre l'ID dal parametro Query
    if id and str(id).isdigit():
        user_id = int(id)

    # Tenta di estrarre l'ID dall'Header Authorization
    if not user_id and authorization:
        try:
            token_str = authorization.replace("Bearer ", "").strip()
            if token_str.isdigit():
                user_id = int(token_str)
        except Exception:
            pass

    # Se non c'è un ID valido, restituisce 401 pulito anziché crashare con 500
    if not user_id:
        raise HTTPException(status_code=401, detail="Sessione non valida o ID mancante")

    session = db()
    try:
        p = session.query(Profilo).filter_by(id=user_id).first()

        if not p:
            raise HTTPException(status_code=404, detail="Profilo non trovato")

        return {
            "id": p.id,
            "token": str(p.id),
            "nome": p.nome,
            "email": p.email,
            "telefono": p.telefono,
            "ruolo": "admin",
            "avatar_url": p.avatar_url
        }
    finally:
        session.close()

@app.post("/api/auth/logout")
def logout():
    return {"ok": True}


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
        "ruolo": "admin",
        "avatar_url": p.avatar_url,
    }


@app.post("/profilo")
def create_profilo(data: dict):
    session = db()
    p = Profilo(
        nome=data.get("nome"),
        email=data.get("email"),
        telefono=data.get("telefono"),
        ruolo="admin",
        avatar_url=data.get("avatar_url"),
        password=data.get("password")
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return {"ok": True, "id": p.id}


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
# ABBONAMENTI
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
# QUOTE ASSOCIATIVE
# ---------------------------------------------------------

@app.get("/quote")
def get_quote():
    session = db()
    quote = session.query(Quota).all()

    return [
        {
            "id": q.id,
            "socio_id": q.socio_id,
            "importo": q.importo,
            "data": q.data,
        }
        for q in quote
    ]


@app.post("/quote")
def add_quota(data: dict):
    socio_id = data.get("socio_id")
    importo = data.get("importo")
    data_quota = data.get("data")

    if not socio_id or not importo or not data_quota:
        raise HTTPException(status_code=400, detail="Dati quota incompleti")

    session = db()
    quota = Quota(
        socio_id=socio_id,
        importo=importo,
        data=data_quota
    )
    session.add(quota)
    session.commit()
    session.refresh(quota)

    return {"ok": True, "id": quota.id}


# ---------------------------------------------------------
# COMPENSI, MOVIMENTI, RICEVUTE, PACCHETTI, EVENTI
# ---------------------------------------------------------

@app.get("/compensi")
def get_compensi():
    session = db()
    return session.query(Compenso).all()


@app.get("/movimenti")
def get_movimenti():
    session = db()
    return session.query(Movimento).all()


@app.get("/ricevute")
def get_ricevute():
    session = db()
    return session.query(Ricevuta).all()


@app.get("/pacchetti")
def get_pacchetti():
    session = db()
    return session.query(Pacchetto).all()


@app.get("/eventi")
def get_eventi():
    session = db()
    return session.query(Evento).all()


# ---------------------------------------------------------
# REPORT & BILANCIO
# ---------------------------------------------------------

@app.get("/report/bilancio")
def get_report_bilancio(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    session = db()
    
    quote_list = session.query(Quota).all()
    totale_entrate = sum(q.importo for q in quote_list if q.importo)
    
    compensi_list = session.query(Compenso).all()
    totale_uscite = sum(c.importo for c in compensi_list if c.importo)
    
    return {
        "ok": True,
        "date_from": date_from,
        "date_to": date_to,
        "totale_entrate": totale_entrate,
        "totale_uscite": totale_uscite,
        "saldo": totale_entrate - totale_uscite,
        "dettaglio": []
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

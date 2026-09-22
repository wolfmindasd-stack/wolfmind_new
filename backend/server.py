from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import shutil

# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------

engine = create_engine("sqlite:///wolfmind.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def db():
    return SessionLocal()

# ---------------------------------------------------------
# MODELLI (MINIMI PER EVITARE ERRORI)
# ---------------------------------------------------------

from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String

Base = declarative_base()

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
    allow_origin_regex=r"https://.*\.wolfmind-new\.pages\.dev",
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

@app.get("/soci")
def get_soci():
    session = db()
    soci = session.query(Soci).all()
    return [{"id": s.id, "nome": s.nome, "cognome": s.cognome, "email": s.email} for s in soci]

@app.post

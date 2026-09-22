from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime

Base = declarative_base()

# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------
engine = create_engine("sqlite:///database.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# ---------------------------------------------------------
# SOCI
# ---------------------------------------------------------
class Soci(Base):
    __tablename__ = "soci"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    cognome = Column(String)
    email = Column(String)
    telefono = Column(String)
    indirizzo = Column(String)
    data_iscrizione = Column(DateTime, default=datetime.utcnow)

# ---------------------------------------------------------
# RICEVUTE
# ---------------------------------------------------------
class Ricevute(Base):
    __tablename__ = "ricevute"

    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer)
    tipo = Column(String)  # quota sociale / tesseramento / altro
    importo = Column(Float)
    data = Column(DateTime, default=datetime.utcnow)
    descrizione = Column(Text)

# ---------------------------------------------------------
# QUOTE
# ---------------------------------------------------------
class Quote(Base):
    __tablename__ = "quote"

    id = Column(Integer, primary_key=True, index=True)
    socio_id = Column(Integer)
    anno = Column(Integer)
    importo = Column(Float)
    pagata = Column(Boolean, default=False)

# ---------------------------------------------------------
# MOVIMENTI
# ---------------------------------------------------------
class Movimenti(Base):
    __tablename__ = "movimenti"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)  # entrata / uscita
    importo = Column(Float)
    descrizione = Column(Text)
    data = Column(DateTime, default=datetime.utcnow)

# ---------------------------------------------------------
# DOCUMENTI
# ---------------------------------------------------------
class Documenti(Base):
    __tablename__ = "documenti"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    categoria = Column(String)
    file_path = Column(String)
    data_caricamento = Column(DateTime, default=datetime.utcnow)

# ---------------------------------------------------------
# CALENDARIO
# ---------------------------------------------------------
class Calendario(Base):
    __tablename__ = "calendario"

    id = Column(Integer, primary_key=True, index=True)
    titolo = Column(String)
    descrizione = Column(Text)
    data = Column(DateTime)

# ---------------------------------------------------------
# NOTIFICHE
# ---------------------------------------------------------
class Notifiche(Base):
    __tablename__ = "notifiche"

    id = Column(Integer, primary_key=True, index=True)
    titolo = Column(String)
    messaggio = Column(Text)
    categoria = Column(String)
    data = Column(DateTime, default=datetime.utcnow)
    letta = Column(Boolean, default=False)

# ---------------------------------------------------------
# IMPOSTAZIONI
# ---------------------------------------------------------
class Impostazioni(Base):
    __tablename__ = "impostazioni"

    id = Column(Integer, primary_key=True, index=True)
    nome_associazione = Column(String)
    email = Column(String)
    telefono = Column(String)
    indirizzo = Column(String)
    sede_legale = Column(String)
    sede_operativa = Column(String)
    iban = Column(String)
    logo_url = Column(String)

# ---------------------------------------------------------
# PROFILO (utente loggato)
# ---------------------------------------------------------
class Profilo(Base):
    __tablename__ = "profilo"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    telefono = Column(String)
    ruolo = Column(String, default="admin")
    password = Column(String)
    avatar_url = Column(String)

# ---------------------------------------------------------
# CREA TABELLE
# ---------------------------------------------------------
Base.metadata.create_all(bind=engine)

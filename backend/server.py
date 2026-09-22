from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from models import SessionLocal, Soci, Ricevute, Quote, Movimenti, Documenti, Calendario, Notifiche, Impostazioni, Profilo
import shutil
import os

app = FastAPI()

# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# DB SESSION
# ---------------------------------------------------------
def db():
    return SessionLocal()

# ---------------------------------------------------------
# SOCI — SOLO SOCI IN REGOLA
# ---------------------------------------------------------
@app.get("/soci")
def get_soci():
    session = db()
    soci = session.query(Soci).all()
    ricevute = session.query(Ricevute).all()

    soci_in_regola = [
        s for s in soci
        if any(
            r.persona_id == s.id and (
                r.tipo in ["quota sociale", "tesseramento"] or r.importo > 0
            )
            for r in ricevute
        )
    ]

    return soci_in_regola

# ---------------------------------------------------------
# QUOTE
# ---------------------------------------------------------
@app.get("/quote")
def get_quote():
    session = db()
    return session.query(Quote).all()

@app.post("/quote")
def new_quota(
    socio_id: int = Form(...),
    anno: int = Form(...),
    importo: float = Form(...)
):
    session = db()
    q = Quote(socio_id=socio_id, anno=anno, importo=importo, pagata=False)
    session.add(q)
    session.commit()
    return {"ok": True}

@app.patch("/quote/{id}")
def update_quota(id: int, pagata: bool = Form(...)):
    session = db()
    q = session.query(Quote).get(id)
    q.pagata = pagata
    session.commit()
    return {"ok": True}

@app.delete("/quote/{id}")
def delete_quota(id: int):
    session = db()
    q = session.query(Quote).get(id)
    session.delete(q)
    session.commit()
    return {"ok": True}

# ---------------------------------------------------------
# RICEVUTE
# ---------------------------------------------------------
@app.get("/ricevute")
def get_ricevute():
    session = db()
    return session.query(Ricevute).all()

# ---------------------------------------------------------
# MOVIMENTI
# ---------------------------------------------------------
@app.get("/movimenti")
def get_movimenti():
    session = db()
    return session.query(Movimenti).all()

# ---------------------------------------------------------
# DOCUMENTI
# ---------------------------------------------------------
@app.get("/documenti")
def get_documenti():
    session = db()
    return session.query(Documenti).all()

@app.post("/documenti")
def upload_documento(
    nome: str = Form(...),
    categoria: str = Form(...),
    file: UploadFile = File(...)
):
    path = f"uploads/{file.filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    session = db()
    d = Documenti(nome=nome, categoria=categoria, file_path=path)
    session.add(d)
    session.commit()

    return {"ok": True}

@app.get("/documenti/{id}/download")
def download_documento(id: int):
    session = db()
    d = session.query(Documenti).get(id)
    return FileResponse(d.file_path)

@app.delete("/documenti/{id}")
def delete_documento(id: int):
    session = db()
    d = session.query(Documenti).get(id)
    if os.path.exists(d.file_path):
        os.remove(d.file_path)
    session.delete(d)
    session.commit()
    return {"ok": True}

# ---------------------------------------------------------
# CALENDARIO
# ---------------------------------------------------------
@app.get("/calendario")
def get_calendario():
    session = db()
    return session.query(Calendario).all()

# ---------------------------------------------------------
# NOTIFICHE
# ---------------------------------------------------------
@app.get("/notifiche")
def get_notifiche():
    session = db()
    return session.query(Notifiche).all()

@app.patch("/notifiche/{id}/letto")
def segna_letta(id: int):
    session = db()
    n = session.query(Notifiche).get(id)
    n.letta = True
    session.commit()
    return {"ok": True}

@app.delete("/notifiche/{id}")
def delete_notifica(id: int):
    session = db()
    n = session.query(Notifiche).get(id)
    session.delete(n)
    session.commit()
    return {"ok": True}

# ---------------------------------------------------------
# PROFILO
# ---------------------------------------------------------
@app.get("/profilo")
def get_profilo():
    session = db()
    return session.query(Profilo).first()

@app.patch("/profilo")
def update_profilo(
    nome: str = Form(...),
    email: str = Form(...),
    telefono: str = Form(...)
):
    session = db()
    p = session.query(Profilo).first()
    p.nome = nome
    p.email = email
    p.telefono = telefono
    session.commit()
    return {"ok": True}

@app.patch("/profilo/password")
def update_password(
    attuale: str = Form(...),
    nuova: str = Form(...)
):
    session = db()
    p = session.query(Profilo).first()

    if p.password != attuale:
        return {"error": "Password errata"}

    p.password = nuova
    session.commit()
    return {"ok": True}

@app.patch("/profilo/avatar")
def update_avatar(file: UploadFile = File(...)):

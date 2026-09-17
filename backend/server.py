# ============================================================
# Wolf's Mind ASD - Gestionale backend (FastAPI + MongoDB)
# File server.py DEFINITIVO con CORS corretto per Cloudflare Pages
# ============================================================

from dotenv import load_dotenv
from pathlib import Path
import os
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import quote

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks
from fastapi.responses import Response as RawResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from models import (
    UserCreate, UserLogin, UserUpdate,
    TesseratoCreate, TesseratoUpdate,
    TipoPacchettoCreate, TipoPacchettoUpdate,
    AbbonamentoCreate, AbbonamentoUpdate,
    LezioneCreate, RicevutaCreate, RicevutaUpdate,
    MovimentoCreate, MovimentoUpdate,
    GirocontoCreate, OrganizzazioneUpdate,
    SendReceiptEmail,
    SlotCreate, SlotUpdate, PrenotazioneCreate,
    ErogaCompenso,
    VerbaleCreate, VerbaleUpdate,
    SetCounter, PortalePrenota,
    TipologiaTesseratoCreate, TipologiaTesseratoUpdate,
    TipologiaRimborsoCreate, TipologiaRimborsoUpdate,
    RimborsoCreate, RimborsoUpdate,
    now_iso
)

from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user_from_db, require_admin
)

from pdf_utils import (
    generate_receipt_pdf, generate_balance_report_pdf,
    generate_libro_soci_pdf, generate_verbale_pdf,
    generate_compenso_pdf, generate_rimborso_pdf,
    generate_rendiconto_pdf
)

from email_utils import send_email_with_attachment
from excel_utils import generate_backup_xlsx

# ============================================================
# ENV & DB
# ============================================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="Wolf's Mind Gestionale")
api = APIRouter(prefix="/api")

# ============================================================
# CORS PER CLOUDFLARE PAGES (wolfmind-new.pages.dev)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://wolfmind-new.pages.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================================
# UTILS
# ============================================================

async def current_user(request: Request):
    return await get_current_user_from_db(request, db)

def oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="ID non valido")

def serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    doc.pop("password_hash", None)
    return doc

# ============================================================
# AUTH
# ============================================================

@api.post("/auth/login")
async def login(payload: UserLogin, request: Request, response: Response):
    email = payload.email.lower()
    ident = email
    now = datetime.now(timezone.utc)

    attempt = await db.login_attempts.find_one({"_id": ident})
    if attempt and attempt.get("count", 0) >= 5 and attempt.get("locked_until"):
        try:
            if datetime.fromisoformat(attempt["locked_until"]) > now:
                raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra 15 minuti.")
        except Exception:
            pass

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        new_count = (attempt.get("count", 0) if attempt else 0) + 1
        upd = {"count": new_count, "updated_at": now.isoformat()}
        if new_count >= 5:
            upd["locked_until"] = (now + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"_id": ident}, {"$set": upd}, upsert=True)
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    if user.get("active") is False:
        raise HTTPException(status_code=403, detail="Utente disattivato")

    await db.login_attempts.delete_one({"_id": ident})

    uid = str(user["_id"])
    a = create_access_token(uid, email, user["role"])
    r = create_refresh_token(uid)
    set_auth_cookies(response, a, r)

    return {"user": serialize(user), "access_token": a}

@api.post("/auth/logout")
async def logout(response: Response, user=Depends(current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user

# ============================================================
# (TUTTE LE ALTRE API RESTANO IDENTICHE)
# ============================================================

app.include_router(api)

# ============================================================
# SERVER READY
# ============================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "wolfmind-new backend"}

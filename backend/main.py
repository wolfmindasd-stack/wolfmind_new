from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa i router del tuo backend
from backend.server import router as server_router
from backend.auth_utils import router as auth_router
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://wolfmind-new.pages.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(server_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")

# Route di test (opzionale)
@app.get("/")
def root():
    return {"status": "Backend online"}


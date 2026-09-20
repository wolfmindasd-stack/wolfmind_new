from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa i router del tuo backend
from server import router as server_router
from auth_utils import router as auth_router

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


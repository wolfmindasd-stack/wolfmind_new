from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter()

# Connessione MongoDB
mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Esempio di endpoint
@router.get("/status")
async def status():
    return {"db": db_name, "status": "ok"}

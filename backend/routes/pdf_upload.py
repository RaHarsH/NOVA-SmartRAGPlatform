from fastapi import APIRouter, UploadFile, File, HTTPException
from supabase_client import supabase
import uuid, os

from config import SUPABASE_STORAGE_BUCKET_NAME

router = APIRouter()
BUCKET = SUPABASE_STORAGE_BUCKET_NAME

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    contents = await file.read()
    filename = f"{uuid.uuid4()}.pdf"

    try:
        supabase.storage.from_(BUCKET).upload(filename, contents, {
            "content-type": "application/pdf"
        })
        url = supabase.storage.from_(BUCKET).get_public_url(filename)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
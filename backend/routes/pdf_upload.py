from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth.clerk_auth import get_current_user
from supabase_client import supabase
from config import SUPABASE_STORAGE_BUCKET_NAME
import uuid

router = APIRouter()
BUCKET = SUPABASE_STORAGE_BUCKET_NAME

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload PDF file to Supabase storage and log it to Supabase DB.
    Generates a signed URL for secure access.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 200MB")

    try:
        # Generate unique filename and path
        filename = f"{uuid.uuid4()}.pdf"
        supabase_path = f"pdfs/{current_user['id']}/{filename}"

        # Upload to Supabase storage
        supabase.storage.from_(BUCKET).upload(
            supabase_path,
            contents,
            {
                "content-type": "application/pdf",
                "x-upsert": "false",
            }
        )

        # Get the signed URL, this is for private file access
        signed_url_response = supabase.storage.from_(BUCKET).create_signed_url(
            supabase_path, 604800  # 7 days
        )

        signed_url = signed_url_response.get("signedURL")
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to generate signed URL")

        insert_result = supabase.table("pdf_files").insert({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "filename": file.filename,
            "supabase_path": supabase_path,
            "embedding_status": "pending",
            "public_url": signed_url,
        }).execute()

        return {
            "success": True,
            "message": "PDF uploaded successfully",
            "data": {
                "filename": file.filename,
                "path": supabase_path,
                "url": signed_url,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

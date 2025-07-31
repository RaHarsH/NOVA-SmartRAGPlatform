from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from auth.clerk_auth import get_current_user
from supabase_client import supabase
from config import SUPABASE_STORAGE_BUCKET_NAME
import uuid

from utils.embedding_processor import process_pdf_embeddings

router = APIRouter()
BUCKET = SUPABASE_STORAGE_BUCKET_NAME


# Helper function to generate a fresh signed URL for a pdf
def generate_pdf_signed_url(file_path: str, expires_in: int = 3600):
    """Generate a fresh signed URL for the PDF file"""
    try:
        response = supabase.storage.from_(BUCKET).create_signed_url(file_path, expires_in)
        signed_url = response.get('signedURL')
        if signed_url:
            print(f"Debug: Generated signed URL for {file_path}")
            return signed_url
        else:
            print(f"Debug: No signedURL in response for {file_path}: {response}")
            return None
    except Exception as e:
        print(f"Error generating signed URL for path {file_path}: {e}")
        return None


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 200MB")

    try:
        filename = f"{uuid.uuid4()}.pdf"
        supabase_path = f"pdfs/{current_user['id']}/{filename}"

        supabase.storage.from_(BUCKET).upload(
            supabase_path,
            contents,
            {
                "content-type": "application/pdf",
                "x-upsert": "false",
            }
        )

        signed_url_response = supabase.storage.from_(BUCKET).create_signed_url(
            supabase_path, 604800  # 7 days
        )
        signed_url = signed_url_response.get("signedURL")
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to generate signed URL")

        pdf_id = str(uuid.uuid4())
        insert_result = supabase.table("pdf_files").insert({
            "id": pdf_id,
            "user_id": current_user["id"],
            "filename": file.filename,
            "supabase_path": supabase_path,
            "embedding_status": "pending",
            "public_url": signed_url,
        }).execute()

        # Convert the pdf into embeddings and store it in supabase
        await process_pdf_embeddings(
            pdf_id=pdf_id,
            user_id=current_user["id"],
            signed_url=signed_url,
            filename=file.filename
        )

        return {
            "success": True,
            "message": "PDF uploaded and embeddings processed successfully.",
            "data": {
                "id": insert_result.data[0]["id"],
                "filename": file.filename,
                "path": supabase_path,
                "url": signed_url,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{pdf_id}")
async def get_pdf(pdf_id: str, user_id: str = Header(None, alias="user-id")):
    try:
        if not pdf_id:
            raise HTTPException(status_code=400, detail="PDF ID is required")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID header is required")
        
        current_user = await get_current_user(user_id)
        
        response = supabase.table("pdf_files").select("*").eq("id", pdf_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="PDF not found or you don't have permission to access it")
        
        pdf_data = response.data[0]
        
        # Always generate fresh signed URL - try multiple approaches
        file_path = None
        
        # Method 1: Try to get file path from supabase_path (new schema)
        if pdf_data.get("supabase_path"):
            file_path = pdf_data["supabase_path"]
            print(f"Debug: Using supabase_path: {file_path}")
            
        # Method 2: If supabase_path is not available, try to extract from public_url (old schema)
        elif pdf_data.get("public_url"):
            print(f"Debug: Extracting path from public_url: {pdf_data['public_url']}")
            try:
                import urllib.parse
                
                # For Supabase signed URLs, extract the path
                if '/object/sign/' in pdf_data["public_url"]:
                    # Split by /object/sign/ and get the path part
                    url_parts = pdf_data["public_url"].split('/object/sign/')
                    if len(url_parts) > 1:
                        # Get the path part (before query parameters)
                        path_with_params = url_parts[1]
                        file_path = path_with_params.split('?')[0]
                        # URL decode the path
                        file_path = urllib.parse.unquote(file_path)
                        print(f"Debug: Extracted file path from signed URL: {file_path}")
                        
                elif '/storage/v1/object/public/' in pdf_data["public_url"]:
                    # Handle public URLs
                    url_parts = pdf_data["public_url"].split('/storage/v1/object/public/')
                    if len(url_parts) > 1:
                        path_parts = url_parts[1].split('/')
                        if len(path_parts) > 1:
                            # Skip bucket name and get the rest
                            file_path = '/'.join(path_parts[1:])
                            file_path = urllib.parse.unquote(file_path)
                            print(f"Debug: Extracted file path from public URL: {file_path}")
                            
            except Exception as e:
                print(f"Debug: Could not extract file path from public_url: {str(e)}")
        
        # Method 3: Fallback - try to construct path from known patterns
        if not file_path and pdf_data.get("filename"):
            # Try common path patterns
            potential_paths = [
                f"pdfs/{current_user['id']}/{pdf_data['filename']}",
                f"pdfs/{pdf_data['filename']}",
                f"{current_user['id']}/{pdf_data['filename']}"
            ]
            
            for potential_path in potential_paths:
                print(f"Debug: Trying potential path: {potential_path}")
                test_url = generate_pdf_signed_url(potential_path, expires_in=60)  # Short test
                if test_url:
                    file_path = potential_path
                    print(f"Debug: Found working path: {file_path}")
                    break
        
        if file_path:
            print(f"Debug: Generating signed URL for path: {file_path}")
            fresh_signed_url = generate_pdf_signed_url(file_path, expires_in=3600)  # 1 hour
            
            if fresh_signed_url:
                print(f"Debug: Successfully generated fresh signed URL")
                
                # Updating response data with fresh URLs
                pdf_data["public_url"] = fresh_signed_url
                
                # Update database with fresh URL and ensure supabase_path is stored
                try:
                    update_data = {"public_url": fresh_signed_url}
                    
                    if not pdf_data.get("supabase_path"):
                        update_data["supabase_path"] = file_path
                        pdf_data["supabase_path"] = file_path 
                    
                    supabase.table("pdf_files").update(update_data).eq("id", pdf_id).execute()
                    print(f"Debug: Updated database with fresh URL for PDF {pdf_id}")
                    
                except Exception as update_error:
                    print(f"Debug: Failed to update database: {update_error}")
                    
            else:
                print(f"Debug: Failed to generate signed URL for path: {file_path}")
                pdf_data["public_url"] = None  
        else:
            print(f"Debug: No file path found for PDF {pdf_id}")
            print(f"Debug: Available data - supabase_path: {pdf_data.get('supabase_path')}, public_url: {pdf_data.get('public_url')}, filename: {pdf_data.get('filename')}")
            pdf_data["public_url"] = None  
        
        return pdf_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug: Exception occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
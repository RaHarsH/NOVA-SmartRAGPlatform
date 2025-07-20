from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from auth.clerk_auth import get_current_user
from supabase_client import supabase
from typing import Optional
import uuid

router = APIRouter()

class CreateChatSessionRequest(BaseModel):
    title: str
    feature_type: str 
    source_id: str     # PDF ID or other source ID

class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    feature_type: str
    source_id: Optional[str]
    created_at: str

@router.post("/create-session")
async def create_chat_session(
    request: CreateChatSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Validate that the source (PDF / CSV etc) belongs to the current user if source_id is provided
        if request.source_id:
            pdf_response = supabase.table("pdf_files").select("id").eq("id", request.source_id).eq("user_id", current_user["id"]).execute()
            if not pdf_response.data:
                raise HTTPException(status_code=404, detail="PDF not found or you don't have permission to access it")

        # Create new chat session
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "user_id": current_user["id"],
            "title": request.title,
            "feature_type": request.feature_type,
            "source_id": request.source_id if request.source_id else None,
        }

        insert_result = supabase.table("chat_sessions").insert(session_data).execute()
        
        if not insert_result.data:
            raise HTTPException(status_code=500, detail="Failed to create chat session")

        return {
            "success": True,
            "message": "Chat session created successfully",
            "data": {
                "id": insert_result.data[0]["id"],
                "user_id": insert_result.data[0]["user_id"],
                "title": insert_result.data[0]["title"],
                "feature_type": insert_result.data[0]["feature_type"],
                "source_id": insert_result.data[0]["source_id"],
                "created_at": insert_result.data[0]["created_at"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug: Exception occurred while creating chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

@router.get("/{session_id}")
async def get_chat_session(
    session_id: str, 
    current_user: dict = Depends(get_current_user)
):
    try:
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        # Fetch chat session details of the current user only
        response = supabase.table("chat_sessions").select("*").eq("id", session_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Chat session not found or you don't have permission to access it")
        
        session_data = response.data[0]
        return {
            "success": True,
            "data": session_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug: Exception occurred while fetching chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_user_chat_sessions(
    current_user: dict = Depends(get_current_user),
    feature_type: Optional[str] = None,
    limit: Optional[int] = 50
):
    """Get all chat sessions for the current user"""
    try:
        query = supabase.table("chat_sessions").select("*").eq("user_id", current_user["id"])
        
        # Filter by feature type if provided
        if feature_type:
            query = query.eq("feature_type", feature_type)
        
        # Apply limit
        query = query.limit(limit).order("created_at", desc=True)
        
        response = query.execute()
        
        return {
            "success": True,
            "data": response.data,
            "count": len(response.data)
        }
        
    except Exception as e:
        print(f"Debug: Exception occurred while fetching user chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session and all its messages"""
    try:
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        # First, verify the session belongs to the current user
        session_response = supabase.table("chat_sessions").select("id").eq("id", session_id).eq("user_id", current_user["id"]).execute()
        
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Chat session not found or you don't have permission to delete it")
        
        # Delete all messages in the session first (due to foreign key constraint)
        supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
        
        # Then delete the session
        delete_result = supabase.table("chat_sessions").delete().eq("id", session_id).eq("user_id", current_user["id"]).execute()
        
        return {
            "success": True,
            "message": "Chat session and all messages deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug: Exception occurred while deleting chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Route to get messages for a specific chat session
@router.get("/{session_id}/messages")
async def get_chat_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    limit: Optional[int] = 100
):
    """Get all messages for a specific chat session"""
    try:
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        # First verify the session belongs to the current user
        session_response = supabase.table("chat_sessions").select("id").eq("id", session_id).eq("user_id", current_user["id"]).execute()
        
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Chat session not found or you don't have permission to access it")
        
        # Get messages for the session
        messages_response = supabase.table("chat_messages").select("*").eq("session_id", session_id).limit(limit).order("timestamp", desc=False).execute()
        
        return {
            "success": True,
            "data": messages_response.data,
            "count": len(messages_response.data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug: Exception occurred while fetching chat messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
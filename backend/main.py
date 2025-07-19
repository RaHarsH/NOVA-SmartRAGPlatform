from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routes import pdf_upload  # import more routes as you add them

from auth.clerk_auth import get_current_user

app = FastAPI(
    title="RAG AI Agent Backend",
    version="1.0.0",
    docs_url="/docs",
)

# Optional: Add allowed origins for CORS (adjust as needed)
origins = [
    "http://localhost:3000",  # Next.js dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] for all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routes (you can keep adding more here)
app.include_router(pdf_upload.router, prefix="/api/pdf", tags=["PDF Upload"])
# app.include_router(user.router, prefix="/api/user", tags=["User"])
# app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.get("/")
def read_root():
    return {"message": "Backend is running 🚀"}

@app.get("/api/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

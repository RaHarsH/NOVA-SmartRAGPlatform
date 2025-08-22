from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from routes import pdf_routes, chat_routes, csv_routes, web_routes, multi_chat_routes

from auth.clerk_auth import get_current_user

import os

app = FastAPI(
    title="NOVA-SMART-RAG AI Agent Backend",
    version="1.0.0",
    docs_url="/docs",
)
FRONTEND_URL = os.getenv("FRONTEND_URL")

origins = [
    "http://localhost:3000", 
]

if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_routes.router, prefix="/api/pdf", tags=["PDF Upload"])
app.include_router(csv_routes.router, prefix="/api/csv", tags=["CSV Upload"])
app.include_router(web_routes.router, prefix="/api/web", tags=["Web Scraping"])
app.include_router(multi_chat_routes.router, prefix="/api/multi", tags=["Multi Chat"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat Sessions"])

@app.get("/")
def read_root():
    return {"message": "Backend is running 🚀"}


# TESTING: this is just a test route
@app.get("/api/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

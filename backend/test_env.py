from dotenv import load_dotenv
import os

print("Loading test env...")

print(f"SUPABASE_DB_URL: {os.getenv('SUPABASE_DB_URL')}")
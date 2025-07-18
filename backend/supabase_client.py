from supabase import create_client, Client
from config import SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY

supabase: Client = create_client(SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY)
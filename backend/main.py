from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from supabase import create_client, Client  # NEW
from dotenv import load_dotenv

# load env variables
load_dotenv()

# Initialize app
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print(supabase)

# Model
class TokenData(BaseModel):
    token: str

@app.post("/api/auth/google/")
async def google_auth(token_data: TokenData):
    token = token_data.token

    try:
        # Step 1: Verify token
        verify_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}",
            timeout=5
        )
        verify_response.raise_for_status()
        user_info = verify_response.json()

        if user_info.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=400,
                detail="Token audience mismatch."
            )

        # Step 2: Prepare user data
        user_data = {
            "google_id": user_info.get("sub"),
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture_url": user_info.get("picture"),
            "email_verified": user_info.get("email_verified"),
        }
        
        # Only allow verified email
        #if not user_info.get("email_verified"):
        #   raise HTTPException(
        #        status_code=400,
        #        detail="Google account email not verified."
        #    )

        # Step 3: Save to Supabase
        existing_user = supabase.from_("users").select("*").eq("google_id", user_data["google_id"]).maybe_single().execute()

        if existing_user is None or existing_user.data is None:
            # Insert user if not exists
            supabase.from_("users").insert(user_data).execute()
            print(f"User {user_data['email']} inserted.")
        else:
            print(f"User {user_data['email']} already exists.")

        return {
            "status": "success",
            "user": user_data,
            "token": "your_generated_jwt_here"  # TODO: JWT generation
        }

    except requests.RequestException as e:
        print(f"[Error] Token verification failed: {e}")
        raise HTTPException(status_code=400, detail="Google token verification failed.")

    except Exception as e:
        print(f"[Error] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

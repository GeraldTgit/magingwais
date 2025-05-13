from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from supabase import create_client, Client
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI()

# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://magingwais.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Environment variables (these will throw an error if missing)
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Model
class TokenData(BaseModel):
    token: str

@app.post("/api/auth/google/")
async def google_auth(token_data: TokenData):
    token = token_data.token

    try:
        # Step 1: Verify token
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        
        try:
            verify_response = requests.get(
                verify_url,
                timeout=5
            )
            
            if verify_response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Token verification failed: {verify_response.text}"
                )
                
            user_info = verify_response.json()

            if not user_info.get("aud"):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid token: no audience"
                )

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

            # Step 3: Save to Supabase
            try:
                existing_user = supabase.from_("users").select("*").eq("google_id", user_data["google_id"]).maybe_single().execute()

                if existing_user is None or existing_user.data is None:
                    supabase.from_("users").insert(user_data).execute()
                else:
                    logger.info(f"User {user_data['email']} already exists.")

                return {
                    "status": "success",
                    "user": user_data,
                    "token": "your_generated_jwt_here"
                }

            except Exception as supabase_error:
                logger.error(f"Supabase operation failed: {str(supabase_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Database operation failed: {str(supabase_error)}"
                )

        except requests.RequestException as e:
            raise HTTPException(
                status_code=400,
                detail=f"Google token verification failed: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

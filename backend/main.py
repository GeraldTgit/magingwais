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
    level=logging.DEBUG,
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
    "https://magingwais.vercel.app",  # Add your Vercel domain
]

logger.info(f"Configuring CORS with origins: {origins}")

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

logger.info(f"Google Client ID configured: {GOOGLE_CLIENT_ID[:10]}...")
logger.info(f"Supabase URL configured: {SUPABASE_URL}")
logger.info(f"Supabase Key configured: {SUPABASE_KEY[:10]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
logger.info("Supabase client initialized")

# Model
class TokenData(BaseModel):
    token: str

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"=== Incoming Request ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"URL: {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Log request body for POST requests
    if request.method == "POST":
        try:
            body = await request.body()
            logger.info(f"Request body: {body.decode()}")
        except Exception as e:
            logger.error(f"Error reading request body: {str(e)}")
    
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"=== End Request ===\n")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise

@app.post("/api/auth/google/")
async def google_auth(token_data: TokenData):
    logger.info("=== Starting Google Authentication ===")
    token = token_data.token
    logger.debug(f"Token received (first 20 chars): {token[:20]}...")

    try:
        # Step 1: Verify token
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        logger.info(f"Verifying token with URL: {verify_url}")
        
        try:
            verify_response = requests.get(
                verify_url,
                timeout=5
            )
            
            logger.info(f"Token verification response status: {verify_response.status_code}")
            logger.debug(f"Token verification response headers: {verify_response.headers}")
            logger.debug(f"Token verification response content: {verify_response.text}")
            
            if verify_response.status_code != 200:
                logger.error(f"Token verification failed with status {verify_response.status_code}")
                logger.error(f"Response content: {verify_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Token verification failed: {verify_response.text}"
                )
                
            user_info = verify_response.json()
            logger.info(f"User info received: {user_info}")

            if not user_info.get("aud"):
                logger.error("No audience in token")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid token: no audience"
                )

            if user_info.get("aud") != GOOGLE_CLIENT_ID:
                logger.error(f"Token audience mismatch. Expected: {GOOGLE_CLIENT_ID}, Got: {user_info.get('aud')}")
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
            
            logger.info(f"Prepared user data: {user_data}")

            # Step 3: Save to Supabase
            try:
                logger.info("Querying Supabase for existing user")
                existing_user = supabase.from_("users").select("*").eq("google_id", user_data["google_id"]).maybe_single().execute()
                logger.debug(f"Existing user query result: {existing_user}")

                if existing_user is None or existing_user.data is None:
                    logger.info("User not found, inserting new user")
                    insert_result = supabase.from_("users").insert(user_data).execute()
                    logger.debug(f"Insert result: {insert_result}")
                    logger.info(f"User {user_data['email']} inserted.")
                else:
                    logger.info(f"User {user_data['email']} already exists.")

                logger.info("=== Google Authentication Successful ===")
                return {
                    "status": "success",
                    "user": user_data,
                    "token": "your_generated_jwt_here"  # TODO: JWT generation
                }

            except Exception as supabase_error:
                logger.error(f"Supabase operation failed: {str(supabase_error)}")
                logger.error(f"Supabase error details: {type(supabase_error).__name__}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Database operation failed: {str(supabase_error)}"
                )

        except requests.RequestException as e:
            logger.error(f"Token verification request failed: {str(e)}")
            logger.error(f"Request error details: {type(e).__name__}")
            raise HTTPException(
                status_code=400,
                detail=f"Google token verification failed: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    finally:
        logger.info("=== End Google Authentication ===\n")

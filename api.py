from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from utils.db_manager import DatabaseManager
from auth import Token, User, authenticate_user, create_access_token, get_current_active_user
from config import settings
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DatabaseManager()

@app.lifespan()
async def lifespan(app: FastAPI):
    redis_client = redis.from_url("redis://localhost", encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_client)
    yield  # This will keep the lifespan open
    # Cleanup code can be added here if needed

@app.post("/token", response_model=Token)
@RateLimiter(times=5, seconds=60)  # 5 requests per minute
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
@RateLimiter(times=10, seconds=60)  # 10 requests per minute
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/top_users")
@RateLimiter(times=20, seconds=60)  # 20 requests per minute
async def get_top_users(current_user: User = Depends(get_current_active_user)):
    return db.get_top_users(10)

@app.get("/user/{username}")
@RateLimiter(times=20, seconds=60)  # 20 requests per minute
async def get_user_stats(username: str, current_user: User = Depends(get_current_active_user)):
    return db.get_user_stats(username)

@app.get("/total_plus_twos")
@RateLimiter(times=20, seconds=60)  # 20 requests per minute
async def get_total_plus_twos(current_user: User = Depends(get_current_active_user)):
    return {"total": db.get_total_plus_twos()}

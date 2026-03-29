from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Optional
import socketio
import os
from dotenv import load_dotenv
import uuid
import aiofiles
from pathlib import Path

from models import (
    UserRegister, UserLogin, UserResponse, UserUpdate, Token,
    FriendRequest, MessageSend, MessageResponse, FriendshipResponse,
    CallLog, FriendshipStatus, MessageType
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user_id, ACCESS_TOKEN_EXPIRE_MINUTES
)
from socket_handlers import SocketManager

# Load environment variables
load_dotenv()

# FastAPI app
app = FastAPI(title="Video Call & Chat API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)
socket_app = socketio.ASGIApp(sio, app)

# MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "videocall_app")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Initialize Socket Manager
socket_manager = SocketManager(sio, db)

# Media upload directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Helper functions
def user_dict_to_response(user_dict: dict) -> UserResponse:
    """Convert user dict to UserResponse"""
    return UserResponse(
        id=user_dict["_id"],
        username=user_dict["username"],
        email=user_dict["email"],
        avatar=user_dict.get("avatar"),
        online=user_dict.get("online", False),
        created_at=user_dict["created_at"]
    )

async def get_user_by_id(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============= AUTHENTICATION ENDPOINTS =============

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "_id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "avatar": None,
        "online": False,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user"""
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["_id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user_id)):
    """Get current user info"""
    user = await get_user_by_id(user_id)
    return user_dict_to_response(user)

@app.put("/api/auth/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user profile"""
    update_data = {}
    if profile_data.username:
        # Check if username is taken
        existing = await db.users.find_one({
            "username": profile_data.username,
            "_id": {"$ne": user_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update_data["username"] = profile_data.username
    
    if profile_data.avatar:
        update_data["avatar"] = profile_data.avatar
    
    if update_data:
        await db.users.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
    
    user = await get_user_by_id(user_id)
    return user_dict_to_response(user)

# ============= FRIEND MANAGEMENT ENDPOINTS =============

@app.post("/api/friends/request")
async def send_friend_request(
    request_data: FriendRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Send friend request"""
    # Find friend by email
    friend = await db.users.find_one({"email": request_data.friend_email})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend["_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if friendship already exists
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id": user_id, "friend_id": friend["_id"]},
            {"user_id": friend["_id"], "friend_id": user_id}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Friendship request already exists")
    
    # Create friendship request
    friendship_id = str(uuid.uuid4())
    friendship = {
        "_id": friendship_id,
        "user_id": user_id,
        "friend_id": friend["_id"],
        "status": FriendshipStatus.PENDING,
        "created_at": datetime.utcnow()
    }
    
    await db.friendships.insert_one(friendship)
    
    return {"message": "Friend request sent", "friendship_id": friendship_id}

@app.post("/api/friends/accept/{friendship_id}")
async def accept_friend_request(
    friendship_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Accept friend request"""
    friendship = await db.friendships.find_one({"_id": friendship_id})
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if friendship["friend_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.friendships.update_one(
        {"_id": friendship_id},
        {"$set": {"status": FriendshipStatus.ACCEPTED}}
    )
    
    return {"message": "Friend request accepted"}

@app.post("/api/friends/reject/{friendship_id}")
async def reject_friend_request(
    friendship_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Reject friend request"""
    friendship = await db.friendships.find_one({"_id": friendship_id})
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if friendship["friend_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.friendships.delete_one({"_id": friendship_id})
    
    return {"message": "Friend request rejected"}

@app.get("/api/friends", response_model=List[FriendshipResponse])
async def get_friends(user_id: str = Depends(get_current_user_id)):
    """Get all friends and pending requests"""
    friendships = await db.friendships.find({
        "$or": [
            {"user_id": user_id},
            {"friend_id": user_id}
        ]
    }).to_list(length=None)
    
    result = []
    for friendship in friendships:
        # Determine the friend ID
        friend_id = friendship["friend_id"] if friendship["user_id"] == user_id else friendship["user_id"]
        friend = await db.users.find_one({"_id": friend_id})
        
        if friend:
            result.append(FriendshipResponse(
                id=friendship["_id"],
                user_id=friendship["user_id"],
                friend_id=friend_id,
                friend=user_dict_to_response(friend),
                status=friendship["status"],
                created_at=friendship["created_at"]
            ))
    
    return result

@app.delete("/api/friends/{friend_id}")
async def remove_friend(
    friend_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Remove friend"""
    result = await db.friendships.delete_one({
        "$or": [
            {"user_id": user_id, "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": user_id}
        ],
        "status": FriendshipStatus.ACCEPTED
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}

@app.get("/api/friends/search")
async def search_users(
    query: str,
    user_id: str = Depends(get_current_user_id)
):
    """Search users by username or email"""
    users = await db.users.find({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}}
        ],
        "_id": {"$ne": user_id}
    }).limit(20).to_list(length=20)
    
    return [user_dict_to_response(user) for user in users]

# ============= MESSAGING ENDPOINTS =============

@app.get("/api/messages/{friend_id}", response_model=List[MessageResponse])
async def get_messages(
    friend_id: str,
    user_id: str = Depends(get_current_user_id),
    limit: int = 50
):
    """Get message history with a friend"""
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": friend_id},
            {"sender_id": friend_id, "receiver_id": user_id}
        ]
    }).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return [
        MessageResponse(
            id=msg["_id"],
            sender_id=msg["sender_id"],
            receiver_id=msg["receiver_id"],
            content=msg.get("content"),
            message_type=msg["message_type"],
            media_url=msg.get("media_url"),
            timestamp=msg["timestamp"],
            read=msg.get("read", False)
        )
        for msg in messages
    ]

@app.post("/api/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageSend,
    user_id: str = Depends(get_current_user_id)
):
    """Send a message"""
    message_id = str(uuid.uuid4())
    message = {
        "_id": message_id,
        "sender_id": user_id,
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "message_type": message_data.message_type,
        "media_url": message_data.media_url,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    await db.messages.insert_one(message)
    
    return MessageResponse(
        id=message_id,
        sender_id=user_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        message_type=message_data.message_type,
        media_url=message_data.media_url,
        timestamp=message["timestamp"],
        read=False
    )

@app.post("/api/messages/upload")
async def upload_media(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload media file"""
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {"media_url": f"/api/media/{filename}"}

@app.put("/api/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Mark message as read"""
    await db.messages.update_one(
        {"_id": message_id, "receiver_id": user_id},
        {"$set": {"read": True}}
    )
    return {"message": "Message marked as read"}

# ============= CALL ENDPOINTS =============

@app.post("/api/calls/log")
async def log_call(
    call_data: CallLog,
    user_id: str = Depends(get_current_user_id)
):
    """Log a call"""
    call_id = str(uuid.uuid4())
    call = {
        "_id": call_id,
        "caller_id": call_data.caller_id,
        "callee_id": call_data.callee_id,
        "duration": call_data.duration,
        "call_type": call_data.call_type,
        "timestamp": call_data.timestamp
    }
    
    await db.call_logs.insert_one(call)
    return {"message": "Call logged", "call_id": call_id}

@app.get("/api/calls/history")
async def get_call_history(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50
):
    """Get call history"""
    calls = await db.call_logs.find({
        "$or": [
            {"caller_id": user_id},
            {"callee_id": user_id}
        ]
    }).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return calls

# ============= HEALTH CHECK =============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Video Call & Chat API is running"}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Create indexes on startup"""
    # User indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    
    # Friendship indexes
    await db.friendships.create_index([("user_id", 1), ("friend_id", 1)])
    
    # Message indexes
    await db.messages.create_index([("sender_id", 1), ("receiver_id", 1)])
    await db.messages.create_index("timestamp")
    
    # Call log indexes
    await db.call_logs.create_index([("caller_id", 1), ("callee_id", 1)])
    await db.call_logs.create_index("timestamp")
    
    print("✅ Database indexes created")
    print("🚀 Server started successfully")

# For ASGI server
app_asgi = socket_app

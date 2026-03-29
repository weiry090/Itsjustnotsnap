from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"

class CallType(str, Enum):
    VIDEO = "video"
    VOICE = "voice"

# Request/Response Models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar: Optional[str] = None
    online: bool = False
    created_at: datetime

class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class FriendRequest(BaseModel):
    friend_email: str

class MessageSend(BaseModel):
    receiver_id: str
    content: Optional[str] = None
    message_type: MessageType = MessageType.TEXT
    media_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: Optional[str]
    message_type: str
    media_url: Optional[str]
    timestamp: datetime
    read: bool

class FriendshipResponse(BaseModel):
    id: str
    user_id: str
    friend_id: str
    friend: UserResponse
    status: str
    created_at: datetime

class CallLog(BaseModel):
    caller_id: str
    callee_id: str
    duration: int  # in seconds
    call_type: CallType
    timestamp: datetime

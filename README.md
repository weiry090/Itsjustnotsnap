# Video Call & Chat App - React Native Android

A feature-rich Android mobile app with video calling, text chat, media sharing, and camera filters.

## Features

### Phase 1 (✅ Complete)
- ✅ User authentication (Register/Login)
- ✅ JWT token-based security
- ✅ Backend API (FastAPI + MongoDB)
- ✅ Socket.IO real-time server
- ✅ React Native app structure

### Upcoming Phases
- 📱 **Phase 2**: Friend system & Text chat with media sharing
- 📸 **Phase 3**: Camera integration with basic & face filters
- 📹 **Phase 4**: WebRTC video calling
- 🎨 **Phase 5**: UI polish & optimization

## Tech Stack

**Mobile App:**
- React Native 0.73
- React Navigation
- React Native Paper (UI)
- Socket.IO Client
- Axios (API calls)

**Backend:**
- FastAPI (Python)
- MongoDB (Database)
- Socket.IO (Real-time)
- JWT Authentication
- WebRTC Signaling

**Planned Integrations:**
- react-native-vision-camera (Camera)
- react-native-webrtc (Video calls)
- TensorFlow.js (Face filters)

## Project Structure

```
/app/
├── backend/                 # FastAPI Backend
│   ├── server.py           # Main server
│   ├── models.py           # Data models
│   ├── auth.py             # Authentication
│   ├── socket_handlers.py  # Socket.IO handlers
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
│
└── mobile/                 # React Native App
    ├── android/           # Android native code
    ├── src/
    │   ├── screens/       # App screens
    │   ├── navigation/    # Navigation setup
    │   ├── contexts/      # React contexts
    │   ├── services/      # API & Socket services
    │   └── config/        # Configuration
    ├── App.js
    ├── index.js
    └── package.json
```

## Setup Instructions

### Backend Setup

1. **Start MongoDB:**
```bash
sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
```

2. **Install dependencies:**
```bash
cd /app/backend
pip install -r requirements.txt
```

3. **Start backend server:**
```bash
cd /app/backend
uvicorn server:app_asgi --host 0.0.0.0 --port 8001
```

### Mobile App Setup

1. **Install dependencies:**
```bash
cd /app/mobile
yarn install
```

2. **Update API URL:**
Edit `/app/mobile/src/config/constants.js`:
- For Android Emulator: `http://10.0.2.2:8001/api`
- For Physical Device: `http://YOUR_COMPUTER_IP:8001/api`

3. **Run on Android:**
```bash
cd /app/mobile
npx react-native run-android
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Friends (Coming in Phase 2)
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/{id}` - Accept request
- `GET /api/friends` - Get friends list
- `DELETE /api/friends/{id}` - Remove friend
- `GET /api/friends/search` - Search users

### Messages (Coming in Phase 2)
- `GET /api/messages/{friend_id}` - Get chat history
- `POST /api/messages` - Send message
- `POST /api/messages/upload` - Upload media
- `PUT /api/messages/{id}/read` - Mark as read

### Calls (Coming in Phase 4)
- `POST /api/calls/log` - Log call
- `GET /api/calls/history` - Get call history

## Socket.IO Events

### Chat Events
- `send_message` - Send text message
- `receive_message` - Receive message
- `typing` - Typing indicator
- `message_read` - Read receipt
- `user_status` - Online/offline status

### WebRTC Signaling Events
- `call_user` - Initiate call
- `incoming_call` - Receive call
- `call_accepted` - Call accepted
- `call_rejected` - Call rejected
- `ice_candidate` - ICE candidate exchange
- `end_call` - End call

## Testing Phase 1

Test authentication with curl:

```bash
# Register
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get user info (replace TOKEN)
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Development Status

✅ **Phase 1 Complete:**
- Backend API fully functional
- User authentication working
- Socket.IO server ready
- React Native app structure created
- Login/Register screens implemented
- API integration layer setup

**Next Steps:**
- Phase 2: Friend management & Chat features
- Phase 3: Camera & Filters
- Phase 4: Video calling
- Phase 5: Polish & optimization

## Notes

- Backend running on port 8001
- MongoDB on default port 27017
- Socket.IO integrated with FastAPI
- JWT tokens valid for 7 days (10080 minutes)
- All API calls require Bearer token (except login/register)

## License

MIT

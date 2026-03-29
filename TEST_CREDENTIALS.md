# Test Credentials

## Test Users

### User 1 - Demo User
- **Email:** demo@example.com
- **Password:** demo123
- **Username:** demouser
- **User ID:** 1f3a441d-4a7d-4fcc-9132-e8dbbc161d5b

### User 2 - Alice
- **Email:** alice@example.com
- **Password:** alice123
- **Username:** alice
- **User ID:** 7a73cb62-070f-4097-9e68-09ea3f10358b

## Friendship Status
- Demo and Alice are friends (request accepted)
- Test message sent from Demo to Alice

## Quick Login Commands

### Login as Demo:
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

### Login as Alice:
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}'
```

## Testing Workflow

1. **Test Authentication:**
   - Login with both users in mobile app
   - Verify tokens are stored
   - Check auto-login works

2. **Test Friend System:**
   - Create a third user
   - Send friend request
   - Accept from other account
   - Check friends list updates

3. **Test Chat:**
   - Login as Demo
   - Go to Chats tab
   - Open conversation with Alice
   - Send text messages
   - Try media sharing
   - Check typing indicator

4. **Test Real-time Features:**
   - Have both users online (2 devices or emulators)
   - Send message from one
   - Should appear instantly on other
   - Check online status updates
   - Test typing indicator

## Backend Access

### MongoDB:
```bash
mongosh
use videocall_app

# View users
db.users.find().pretty()

# View friendships
db.friendships.find().pretty()

# View messages
db.messages.find().pretty()

# Count documents
db.users.countDocuments()
db.friendships.countDocuments()
db.messages.countDocuments()
```

### Clear Test Data:
```bash
mongosh
use videocall_app

# Clear all data (use with caution!)
db.users.deleteMany({})
db.friendships.deleteMany({})
db.messages.deleteMany({})
db.call_logs.deleteMany({})
```

## API Testing

### Get Friends (as Demo):
```bash
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' -s | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -X GET http://localhost:8001/api/friends \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

### Send Message (Demo to Alice):
```bash
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' -s | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -X POST http://localhost:8001/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"receiver_id":"7a73cb62-070f-4097-9e68-09ea3f10358b","content":"Test message from API","message_type":"text"}' | python -m json.tool
```

### Get Messages:
```bash
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}' -s | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -X GET "http://localhost:8001/api/messages/1f3a441d-4a7d-4fcc-9132-e8dbbc161d5b" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

## Mobile App Testing

### Update API URL:
Edit `/app/mobile/src/config/constants.js`:
```javascript
// For Android Emulator
export const API_BASE_URL = 'http://10.0.2.2:8001/api';
export const SOCKET_URL = 'http://10.0.2.2:8001';

// For Physical Device (replace with your computer's IP)
export const API_BASE_URL = 'http://192.168.x.x:8001/api';
export const SOCKET_URL = 'http://192.168.x.x:8001';
```

### Run App:
```bash
cd /app/mobile
npx react-native run-android
```

### Test Checklist:
- [ ] Login works
- [ ] Friends list shows online status
- [ ] Can add new friend
- [ ] Can accept friend request
- [ ] Chat list shows conversations
- [ ] Can send text messages
- [ ] Messages appear in real-time
- [ ] Typing indicator works
- [ ] Can share images
- [ ] Online status updates in real-time

## Notes

- All passwords are simple for testing (would use stronger in production)
- MongoDB is not secured (would add authentication in production)
- Media uploads go to `/app/backend/uploads/`
- Socket.IO connects automatically on login
- Tokens expire after 7 days

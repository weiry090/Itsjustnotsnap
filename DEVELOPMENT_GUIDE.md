# Development Guide & Troubleshooting

## Quick Start Commands

### Backend
```bash
# Start MongoDB
sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db

# Check MongoDB is running
pgrep -f mongod

# Start backend server
cd /app/backend
uvicorn server:app_asgi --host 0.0.0.0 --port 8001 --reload

# Or run in background
cd /app/backend
nohup uvicorn server:app_asgi --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &

# Check backend health
curl http://localhost:8001/api/health
```

### Mobile App
```bash
# Install dependencies (first time only)
cd /app/mobile
yarn install

# Start Metro bundler
cd /app/mobile
npx react-native start

# Run on Android (in another terminal)
cd /app/mobile
npx react-native run-android

# Or use adb
adb devices
adb reverse tcp:8001 tcp:8001
```

## Configuration

### Backend URL Configuration

**For Android Emulator:**
```javascript
// /app/mobile/src/config/constants.js
export const API_BASE_URL = 'http://10.0.2.2:8001/api';
export const SOCKET_URL = 'http://10.0.2.2:8001';
```

**For Physical Android Device:**
1. Find your computer's IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Update constants.js:
   ```javascript
   export const API_BASE_URL = 'http://192.168.x.x:8001/api';
   export const SOCKET_URL = 'http://192.168.x.x:8001';
   ```
3. Make sure device is on same WiFi network

### Environment Variables

**Backend (.env):**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=videocall_app
JWT_SECRET=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

## Common Issues & Solutions

### Backend Issues

**1. MongoDB Connection Error**
```
Error: pymongo.errors.ServerSelectionTimeoutError
```
**Solution:**
```bash
# Start MongoDB
sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db

# If data directory doesn't exist
sudo mkdir -p /data/db
sudo chown -R $USER:$USER /data/db
```

**2. Port Already in Use**
```
Error: Address already in use
```
**Solution:**
```bash
# Find process using port 8001
lsof -i :8001
# Kill the process
kill -9 <PID>
```

**3. Import Errors**
```
Error: No module named 'fastapi'
```
**Solution:**
```bash
cd /app/backend
pip install -r requirements.txt
```

### Mobile App Issues

**1. Cannot Connect to Backend**
```
Error: Network request failed
```
**Solution:**
- Check backend is running: `curl http://localhost:8001/api/health`
- Verify API_BASE_URL in constants.js
- For emulator: Use `http://10.0.2.2:8001/api`
- For device: Use your computer's IP
- Check firewall settings

**2. Metro Bundler Issues**
```
Error: Unable to resolve module
```
**Solution:**
```bash
# Clear cache and reinstall
cd /app/mobile
rm -rf node_modules
yarn install
npx react-native start --reset-cache
```

**3. Android Build Failed**
```
Error: Could not find tools.jar
```
**Solution:**
```bash
# Make sure Android SDK is installed
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Clean and rebuild
cd /app/mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

**4. Socket.IO Not Connecting**
```
Error: WebSocket connection failed
```
**Solution:**
- Ensure backend Socket.IO is running
- Check SOCKET_URL in constants.js
- Verify CORS settings in backend
- Check network connectivity

### Permission Issues

**Android Camera/Microphone Permissions:**
```bash
# Grant permissions via adb
adb shell pm grant com.videocallapp android.permission.CAMERA
adb shell pm grant com.videocallapp android.permission.RECORD_AUDIO
```

## Development Tips

### Hot Reload
- Backend: Use `--reload` flag with uvicorn
- Frontend: React Native has fast refresh enabled by default
- Press `r` in Metro bundler to reload
- Shake device or `Cmd+M` (Android) for dev menu

### Debugging

**Backend Logs:**
```bash
# Check server logs
tail -f /tmp/backend.log

# Check MongoDB logs
tail -f /var/log/mongodb.log
```

**React Native Debugging:**
```bash
# View device logs
adb logcat | grep -i "ReactNative"

# Open Chrome DevTools
# In app dev menu: "Debug"
# Open chrome://inspect in Chrome
```

**API Testing:**
```bash
# Register user
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get user (replace TOKEN)
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Database Management

**View MongoDB Data:**
```bash
# Connect to MongoDB
mongosh

# Switch to database
use videocall_app

# View users
db.users.find()

# View friendships
db.friendships.find()

# Count documents
db.users.countDocuments()

# Clear collections (use with caution!)
db.users.deleteMany({})
db.messages.deleteMany({})
```

## Performance Optimization

### Backend
- Use indexes on frequently queried fields
- Enable gzip compression
- Use connection pooling for MongoDB
- Cache frequently accessed data

### Mobile
- Use FlatList for long lists (not ScrollView)
- Implement pagination for messages
- Optimize images with proper compression
- Use FastImage for image caching
- Debounce search inputs

## Code Structure Best Practices

### Backend
```
/app/backend/
├── server.py          # Main app, routes
├── models.py          # Pydantic models
├── auth.py            # Auth utilities
├── socket_handlers.py # Socket.IO events
└── .env              # Never commit this!
```

### Mobile
```
/app/mobile/src/
├── screens/          # UI screens
├── components/       # Reusable components
├── navigation/       # Navigation setup
├── contexts/         # React contexts
├── services/         # API, Socket services
├── utils/           # Helper functions
└── config/          # Constants, config
```

## Testing Checklist

Before each phase completion:

**Backend:**
- [ ] All API endpoints respond correctly
- [ ] Authentication works (register, login, logout)
- [ ] Database connections are stable
- [ ] Socket.IO events emit/receive properly
- [ ] Error handling works
- [ ] CORS is configured

**Mobile:**
- [ ] App builds successfully
- [ ] Login/register flows work
- [ ] API calls succeed
- [ ] Loading states display
- [ ] Error messages show
- [ ] Navigation works
- [ ] State persists on app restart

## Next Phase Preparation

Before starting Phase 2:
1. Test all Phase 1 features
2. Ensure backend is running stable
3. Verify mobile app connects to backend
4. Check MongoDB has test data
5. Review friend system requirements
6. Plan chat UI/UX

---

**Need Help?**
- Backend not starting? Check MongoDB is running
- Mobile can't connect? Verify IP address in constants.js
- Build failing? Clear caches and reinstall dependencies
- Socket.IO issues? Check firewall and CORS settings

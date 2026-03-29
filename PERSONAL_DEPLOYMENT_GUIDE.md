# Quick Deployment Guide for Personal Use

## Option 1: Deploy Backend to Render.com (FREE)

### Step 1: Prepare Backend for Deployment

1. **Add Procfile** (Render.com needs this):
```bash
# In /app/backend/ create file named "Procfile" (no extension)
web: uvicorn server:app_asgi --host 0.0.0.0 --port $PORT
```

2. **Update requirements.txt** to freeze versions:
```bash
cd /app/backend
pip freeze > requirements.txt
```

3. **Sign up for MongoDB Atlas** (FREE):
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free account
   - Create free cluster (M0 Sandbox - FREE forever)
   - Get connection string (looks like: mongodb+srv://user:pass@cluster.mongodb.net/dbname)

4. **Update backend/.env**:
```
MONGO_URL=mongodb+srv://your-connection-string-here
DB_NAME=videocall_app
JWT_SECRET=your-super-secret-key-change-this-123456789
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Step 2: Deploy to Render

1. **Go to https://render.com** and sign up (FREE)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub or choose "Deploy from Git URL"
   - Select your repo or paste URL

3. **Configure Service**:
   - **Name**: videocall-app-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app_asgi --host 0.0.0.0 --port $PORT`
   - **Plan**: FREE

4. **Add Environment Variables** (in Render dashboard):
   ```
   MONGO_URL = mongodb+srv://your-mongodb-atlas-url
   DB_NAME = videocall_app
   JWT_SECRET = your-secret-key-here
   JWT_ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 10080
   ```

5. **Deploy**: Click "Create Web Service"

6. **Get Your URL**: After deployment, you'll get a URL like:
   ```
   https://videocall-app-backend.onrender.com
   ```

### Step 3: Update Mobile App

Edit `/app/mobile/src/config/constants.js`:

```javascript
// Replace with your Render URL
export const API_BASE_URL = 'https://videocall-app-backend.onrender.com/api';
export const SOCKET_URL = 'https://videocall-app-backend.onrender.com';
```

---

## Option 2: Use Your Computer as Server (Quick Test)

If you just want to test quickly:

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   brew install ngrok  # Mac
   choco install ngrok # Windows
   ```

2. **Start your backend**:
   ```bash
   cd /app/backend
   uvicorn server:app_asgi --host 0.0.0.0 --port 8001
   ```

3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 8001
   ```

4. **Copy the HTTPS URL** (looks like: https://abc123.ngrok.io)

5. **Update mobile app** constants.js with this URL:
   ```javascript
   export const API_BASE_URL = 'https://abc123.ngrok.io/api';
   export const SOCKET_URL = 'https://abc123.ngrok.io';
   ```

**Note**: Your computer must stay on and ngrok running while using the app. URL changes each time you restart ngrok (free tier).

---

## Step 4: Build Android APK

### Prerequisites:
- Android Studio installed
- Android SDK installed
- Java JDK installed

### Build Commands:

1. **Navigate to mobile folder**:
   ```bash
   cd /app/mobile
   ```

2. **Install dependencies** (if not already):
   ```bash
   yarn install
   ```

3. **Generate Android build**:
   ```bash
   cd android
   ./gradlew assembleRelease
   # On Windows: gradlew.bat assembleRelease
   ```

4. **Find your APK**:
   ```
   Location: /app/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

5. **Copy APK to a shareable location**:
   ```bash
   cp android/app/build/outputs/apk/release/app-release.apk ~/Desktop/VideoCallApp.apk
   ```

---

## Step 5: Install on Your Phones

### On Your Phone:

1. **Copy APK to phone**:
   - Email it to yourself
   - Upload to Google Drive and download on phone
   - Use USB cable and copy directly
   - Use ADB: `adb install app-release.apk`

2. **Enable "Install from Unknown Sources"**:
   - Go to Settings → Security
   - Enable "Unknown Sources" or "Install Unknown Apps"
   - (Varies by Android version)

3. **Install APK**:
   - Open file manager
   - Find the APK file
   - Tap to install
   - Confirm permissions

4. **Open the app** and register!

### On Your Friend's Phone:

1. **Share the APK**:
   - Upload to Google Drive
   - Send via Telegram/WhatsApp (compress if needed)
   - Use any file sharing method

2. **Friend installs the same way** (enable unknown sources, install APK)

3. **Friend registers** with different credentials

4. **Add each other as friends** and start calling!

---

## 🎉 You're Done!

Both of you now have:
- ✅ The app installed on your phones
- ✅ Connected to your backend server
- ✅ Full functionality:
  - Chat with each other
  - Share images/videos
  - Video call each other
  - Use camera filters
  - View call history

---

## 💡 Cost Breakdown (FREE!)

- **Render.com Web Service**: FREE (500 hours/month)
- **MongoDB Atlas**: FREE (512MB storage)
- **App Distribution**: FREE (sideloading)
- **Total**: $0.00/month for personal use! 🎊

---

## 🔧 Troubleshooting

**APK won't install?**
- Make sure "Unknown Sources" is enabled
- Try different file transfer method
- Check Android version compatibility (Android 7.0+)

**App crashes on open?**
- Check if backend URL is correct and accessible
- Make sure backend is running
- Check phone has internet connection

**Can't connect to backend?**
- Test backend URL in browser: https://your-url.onrender.com/api/health
- Should return: `{"status":"ok","message":"..."}`
- Make sure HTTPS (not HTTP) if using Render

**Video calls not working?**
- Both phones need internet connection
- Allow camera and microphone permissions
- Make sure you're friends on the app first

---

## 📱 Updating the App Later

When you make changes:

1. Update the code
2. Rebuild APK: `cd android && ./gradlew assembleRelease`
3. Uninstall old version on phones
4. Install new APK

Or simply install over the old version (no uninstall needed).

---

## 🚀 Next Level (Optional)

**Want to distribute to more friends?**
- Build signed APK (more secure)
- Use App Center or Firebase App Distribution (free)
- Or just keep sharing APK file!

**Want custom app icon?**
- Replace icons in `android/app/src/main/res/mipmap-*/`
- Rebuild APK

---

You're all set! Just you and your friend can use this fully functional video calling app! 🎉📱

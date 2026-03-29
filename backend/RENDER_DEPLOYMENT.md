# Deployment Configuration for Render.com

## Environment Variables to Set:

MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/videocall_app?retryWrites=true&w=majority
DB_NAME=videocall_app
JWT_SECRET=CHANGE-THIS-TO-A-VERY-LONG-RANDOM-STRING-123456789
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

## Build Command:
pip install -r requirements.txt

## Start Command:
uvicorn server:app_asgi --host 0.0.0.0 --port $PORT

## Notes:
- Port is automatically provided by Render ($PORT variable)
- Make sure to use HTTPS in mobile app (Render provides SSL)
- Free tier sleeps after 15 min of inactivity (wakes up in <1 min)

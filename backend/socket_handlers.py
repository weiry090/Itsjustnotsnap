import socketio
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# Store connected users {user_id: sid}
connected_users: Dict[str, str] = {}

class SocketManager:
    def __init__(self, sio: socketio.AsyncServer, db):
        self.sio = sio
        self.db = db
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            logger.info(f"Client connected: {sid}")
            
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            # Remove user from connected users
            user_id = None
            for uid, user_sid in list(connected_users.items()):
                if user_sid == sid:
                    user_id = uid
                    del connected_users[uid]
                    break
            
            if user_id:
                # Update user status to offline
                await self.db.users.update_one(
                    {"_id": user_id},
                    {"$set": {"online": False}}
                )
                # Notify friends about offline status
                await self.sio.emit('user_status', {
                    'user_id': user_id,
                    'online': False
                }, skip_sid=sid)
            
            logger.info(f"Client disconnected: {sid}")
        
        @self.sio.event
        async def authenticate(sid, data):
            """Authenticate socket connection"""
            try:
                user_id = data.get('user_id')
                if user_id:
                    connected_users[user_id] = sid
                    
                    # Update user status to online
                    await self.db.users.update_one(
                        {"_id": user_id},
                        {"$set": {"online": True}}
                    )
                    
                    # Notify friends about online status
                    await self.sio.emit('user_status', {
                        'user_id': user_id,
                        'online': True
                    }, skip_sid=sid)
                    
                    logger.info(f"User authenticated: {user_id}")
                    await self.sio.emit('authenticated', {'success': True}, room=sid)
            except Exception as e:
                logger.error(f"Authentication error: {e}")
                await self.sio.emit('error', {'message': 'Authentication failed'}, room=sid)
        
        @self.sio.event
        async def send_message(sid, data):
            """Handle chat message"""
            try:
                receiver_id = data.get('receiver_id')
                message = data.get('message')
                
                # Get receiver's socket ID
                receiver_sid = connected_users.get(receiver_id)
                
                if receiver_sid:
                    # Send message to receiver
                    await self.sio.emit('receive_message', message, room=receiver_sid)
                
                # Acknowledge to sender
                await self.sio.emit('message_sent', {'success': True, 'message_id': message.get('id')}, room=sid)
                
            except Exception as e:
                logger.error(f"Send message error: {e}")
                await self.sio.emit('error', {'message': 'Failed to send message'}, room=sid)
        
        @self.sio.event
        async def typing(sid, data):
            """Handle typing indicator"""
            try:
                receiver_id = data.get('receiver_id')
                sender_id = data.get('sender_id')
                is_typing = data.get('is_typing', False)
                
                receiver_sid = connected_users.get(receiver_id)
                if receiver_sid:
                    await self.sio.emit('user_typing', {
                        'sender_id': sender_id,
                        'is_typing': is_typing
                    }, room=receiver_sid)
            except Exception as e:
                logger.error(f"Typing indicator error: {e}")
        
        @self.sio.event
        async def message_read(sid, data):
            """Handle message read receipt"""
            try:
                sender_id = data.get('sender_id')
                message_id = data.get('message_id')
                
                sender_sid = connected_users.get(sender_id)
                if sender_sid:
                    await self.sio.emit('message_read_receipt', {
                        'message_id': message_id
                    }, room=sender_sid)
            except Exception as e:
                logger.error(f"Read receipt error: {e}")
        
        # WebRTC Signaling Events
        @self.sio.event
        async def call_user(sid, data):
            """Initiate a call to another user"""
            try:
                callee_id = data.get('callee_id')
                caller_id = data.get('caller_id')
                caller_name = data.get('caller_name')
                offer = data.get('offer')
                call_type = data.get('call_type', 'video')
                
                callee_sid = connected_users.get(callee_id)
                if callee_sid:
                    await self.sio.emit('incoming_call', {
                        'caller_id': caller_id,
                        'caller_name': caller_name,
                        'offer': offer,
                        'call_type': call_type
                    }, room=callee_sid)
                else:
                    await self.sio.emit('call_failed', {
                        'reason': 'User is offline'
                    }, room=sid)
            except Exception as e:
                logger.error(f"Call user error: {e}")
        
        @self.sio.event
        async def call_accepted(sid, data):
            """Handle call acceptance"""
            try:
                caller_id = data.get('caller_id')
                answer = data.get('answer')
                
                caller_sid = connected_users.get(caller_id)
                if caller_sid:
                    await self.sio.emit('call_accepted', {
                        'answer': answer
                    }, room=caller_sid)
            except Exception as e:
                logger.error(f"Call accepted error: {e}")
        
        @self.sio.event
        async def call_rejected(sid, data):
            """Handle call rejection"""
            try:
                caller_id = data.get('caller_id')
                
                caller_sid = connected_users.get(caller_id)
                if caller_sid:
                    await self.sio.emit('call_rejected', {}, room=caller_sid)
            except Exception as e:
                logger.error(f"Call rejected error: {e}")
        
        @self.sio.event
        async def ice_candidate(sid, data):
            """Handle ICE candidate exchange"""
            try:
                target_id = data.get('target_id')
                candidate = data.get('candidate')
                
                target_sid = connected_users.get(target_id)
                if target_sid:
                    await self.sio.emit('ice_candidate', {
                        'candidate': candidate
                    }, room=target_sid)
            except Exception as e:
                logger.error(f"ICE candidate error: {e}")
        
        @self.sio.event
        async def end_call(sid, data):
            """Handle call termination"""
            try:
                target_id = data.get('target_id')
                
                target_sid = connected_users.get(target_id)
                if target_sid:
                    await self.sio.emit('call_ended', {}, room=target_sid)
            except Exception as e:
                logger.error(f"End call error: {e}")

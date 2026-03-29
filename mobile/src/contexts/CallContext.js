import React, { createContext, useState, useContext, useEffect } from 'react';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const CallProvider = ({ children, navigation }) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (user) {
      // Listen for incoming calls
      socketService.on('incoming_call', handleIncomingCall);

      return () => {
        socketService.off('incoming_call', handleIncomingCall);
      };
    }
  }, [user]);

  const handleIncomingCall = (data) => {
    const { caller_id, caller_name, offer, call_type } = data;
    
    setIncomingCall({
      id: caller_id,
      username: caller_name,
      offer,
      callType: call_type,
    });

    // Navigate to incoming call screen
    if (navigation) {
      navigation.navigate('IncomingCall', {
        caller: {
          id: caller_id,
          username: caller_name,
        },
        offer,
      });
    }
  };

  const initiateCall = (friend, navigation) => {
    // Navigate to outgoing call screen
    navigation.navigate('OutgoingCall', { friend });
  };

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        initiateCall,
        clearIncomingCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

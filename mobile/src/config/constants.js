// API Base URL - Update this with your actual backend URL
export const API_BASE_URL = 'http://10.0.2.2:8001/api'; // Android emulator
// For physical device, use your computer's IP: http://192.168.x.x:8001/api

export const SOCKET_URL = 'http://10.0.2.2:8001'; // Android emulator

// WebRTC Configuration
export const ICE_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302'
  },
  {
    urls: 'stun:stun1.l.google.com:19302'
  }
];

// Filter presets
export const BASIC_FILTERS = [
  { id: 'none', name: 'None' },
  { id: 'brightness', name: 'Bright' },
  { id: 'contrast', name: 'Contrast' },
  { id: 'saturate', name: 'Vivid' },
  { id: 'grayscale', name: 'B&W' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'cool', name: 'Cool' },
  { id: 'warm', name: 'Warm' }
];

export const FACE_FILTERS = [
  { id: 'none', name: 'None' },
  { id: 'dog', name: 'Dog' },
  { id: 'cat', name: 'Cat' },
  { id: 'glasses', name: 'Glasses' },
  { id: 'beauty', name: 'Beauty' }
];

// Filter utilities for basic image processing

export const BASIC_FILTERS = [
  { id: 'none', name: 'Original', icon: 'image-outline' },
  { id: 'brightness', name: 'Bright', icon: 'brightness-6' },
  { id: 'contrast', name: 'Contrast', icon: 'contrast-box' },
  { id: 'saturate', name: 'Vivid', icon: 'palette' },
  { id: 'grayscale', name: 'B&W', icon: 'invert-colors-off' },
  { id: 'sepia', name: 'Sepia', icon: 'image-filter-vintage' },
  { id: 'vintage', name: 'Vintage', icon: 'image-filter' },
  { id: 'cool', name: 'Cool', icon: 'weather-snowy' },
  { id: 'warm', name: 'Warm', icon: 'white-balance-sunny' },
];

export const FACE_FILTERS = [
  { id: 'none', name: 'None', icon: 'face-outline' },
  { id: 'dog', name: 'Dog', icon: 'dog' },
  { id: 'cat', name: 'Cat', icon: 'cat' },
  { id: 'glasses', name: 'Glasses', icon: 'glasses' },
  { id: 'beauty', name: 'Beauty', icon: 'face-shimmer' },
];

// CSS filter string generator for basic filters
export const getFilterStyle = (filterId) => {
  switch (filterId) {
    case 'brightness':
      return 'brightness(1.3)';
    case 'contrast':
      return 'contrast(1.3)';
    case 'saturate':
      return 'saturate(1.5)';
    case 'grayscale':
      return 'grayscale(1)';
    case 'sepia':
      return 'sepia(1)';
    case 'vintage':
      return 'sepia(0.5) contrast(1.2) brightness(0.9)';
    case 'cool':
      return 'hue-rotate(180deg) saturate(1.2)';
    case 'warm':
      return 'sepia(0.3) saturate(1.3) brightness(1.1)';
    default:
      return 'none';
  }
};

// Matrix values for image processing (for native implementation if needed)
export const getFilterMatrix = (filterId) => {
  switch (filterId) {
    case 'brightness':
      return [1.3, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1, 0];
    case 'contrast':
      return [1.3, 0, 0, 0, -0.15, 0, 1.3, 0, 0, -0.15, 0, 0, 1.3, 0, -0.15, 0, 0, 0, 1, 0];
    case 'saturate':
      return [1.5, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 1, 0];
    case 'grayscale':
      return [0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0];
    case 'sepia':
      return [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0];
    default:
      return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  }
};

// Apply filter to image data (for processing captured images)
export const applyFilterToImage = async (imageUri, filterId) => {
  // This would use react-native-image-filter-kit or similar
  // For now, return the original URI as filters will be applied via CSS
  // In production, you'd process the actual image data here
  return imageUri;
};

// Face filter overlay positions (simplified - would use face detection in production)
export const getFaceFilterOverlay = (filterId) => {
  switch (filterId) {
    case 'dog':
      return {
        type: 'emoji',
        emoji: '🐶',
        position: { top: '30%', left: '35%' },
        size: 100,
      };
    case 'cat':
      return {
        type: 'emoji',
        emoji: '🐱',
        position: { top: '30%', left: '35%' },
        size: 100,
      };
    case 'glasses':
      return {
        type: 'emoji',
        emoji: '🕶️',
        position: { top: '35%', left: '35%' },
        size: 80,
      };
    case 'beauty':
      return {
        type: 'blur',
        intensity: 0.3,
      };
    default:
      return null;
  }
};

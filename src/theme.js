export const COLORS = {
  yellow: '#FFD700',
  black: '#000000',
  dark: '#111111',
  surface: '#1C1C1C',
  border: '#2C2C2C',
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#CCCCCC',
  error: '#FF4444',
  success: '#4CAF50',
};

export const formatPrice = (price) =>
  '$' + Number(price).toLocaleString('es-CO');

import { useState, useEffect } from 'react';

const DEVICE_TOKEN_KEY = 'morph_device_token';

/**
 * Generates or retrieves a persistent anonymous device token
 * Used for tracking guest sessions without PII
 */
export function useDeviceToken(): string {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    let storedToken = localStorage.getItem(DEVICE_TOKEN_KEY);
    
    if (!storedToken) {
      // Generate a new anonymous token
      storedToken = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
      localStorage.setItem(DEVICE_TOKEN_KEY, storedToken);
    }
    
    setToken(storedToken);
  }, []);

  return token;
}

/**
 * Get device token synchronously (for non-hook contexts)
 */
export function getDeviceToken(): string {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  
  if (!token) {
    token = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  
  return token;
}

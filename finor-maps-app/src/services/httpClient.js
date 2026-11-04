import { Capacitor } from '@capacitor/core';

// Una versión nueva evita reutilizar datos guardados por APK anteriores.
const CACHE_PREFIX = 'finor-api-v4:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const withoutTrailingSlash = (value = '') => value.trim().replace(/\/$/, '');
const configuredApiUrl = withoutTrailingSlash(import.meta.env.VITE_API_URL);

// En producción móvil se compila con VITE_API_URL=https://api.tu-dominio.bo/api.
// Nunca se incluye la IP privada de una computadora en el APK.
export const API_URL = configuredApiUrl || (
  Capacitor.isNativePlatform() ? '' : import.meta.env.DEV ? '/api' : 'http://localhost:8000/api'
);
export const hasApiConfiguration = Boolean(API_URL);

const cacheKey = (path) => `${CACHE_PREFIX}${path}`;

const readCache = (path, allowExpired = false) => {
  try {
    const stored = JSON.parse(localStorage.getItem(cacheKey(path)) || 'null');
    if (!stored?.data) return null;
    if (!allowExpired && Date.now() - stored.savedAt > CACHE_TTL_MS) return null;
    return stored.data;
  } catch {
    return null;
  }
};

const saveCache = (path, data) => {
  try {
    localStorage.setItem(cacheKey(path), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // La app sigue funcionando aunque el dispositivo no permita almacenamiento local.
  }
  return data;
};

export const clearApiCache = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // La app puede continuar aunque el dispositivo no permita almacenamiento local.
  }
};

export const request = async (path, { cache = true } = {}) => {
  const useCache = cache && !import.meta.env.DEV;
  const freshCache = useCache ? readCache(path) : null;
  if (freshCache) return freshCache;

  if (!API_URL) {
    const offlineData = useCache ? readCache(path, true) : null;
    if (offlineData) return offlineData;
    throw new Error('La aplicación no tiene una URL de API configurada.');
  }

  try {
    const response = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`La API respondió ${response.status}`);
    const data = await response.json();
    return useCache ? saveCache(path, data) : data;
  } catch (error) {
    const offlineData = useCache ? readCache(path, true) : null;
    if (offlineData) return offlineData;
    throw error;
  }
};

export const getApiHelpMessage = () => (
  hasApiConfiguration
    ? 'No se pudo actualizar el mapa. Revisa tu conexión; se mostrarán los datos guardados si existen.'
    : 'Esta compilación no tiene un servidor configurado. Define VITE_API_URL con el dominio HTTPS de la API y vuelve a generar el APK.'
);

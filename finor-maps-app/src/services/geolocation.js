import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

function locationFromPosition(position) {
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Ubicación inválida');
  return { lat: latitude, lng: longitude, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null };
}

export function locationErrorMessage(error) {
  if (error?.message === 'INSECURE_CONTEXT') return 'Para usar la ubicación, abre la app con HTTPS o desde localhost.';
  if (error?.code === 1 || error?.message === 'PERMISSION_DENIED') return 'Permite el acceso a la ubicación en tu dispositivo e inténtalo de nuevo.';
  if (error?.code === 3) return 'No se pudo obtener la ubicación a tiempo. Activa el GPS e inténtalo de nuevo.';
  return 'No se pudo obtener tu ubicación. Revisa el GPS y los permisos del dispositivo.';
}

export async function getUserPosition() {
  const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 };
  if (Capacitor.isNativePlatform()) {
    let permission = await Geolocation.checkPermissions();
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      permission = await Geolocation.requestPermissions();
    }
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') throw new Error('PERMISSION_DENIED');
    return locationFromPosition(await Geolocation.getCurrentPosition(options));
  }

  if (typeof window !== 'undefined' && window.isSecureContext === false) throw new Error('INSECURE_CONTEXT');
  if (!navigator.geolocation) throw new Error('Geolocalización no disponible');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((position) => {
      try { resolve(locationFromPosition(position)); } catch (error) { reject(error); }
    }, reject, options);
  });
}

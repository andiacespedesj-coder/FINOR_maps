import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

export const REPORT_EMAIL = 'andiacespedesj@gmail.com';

export const REPORT_TYPES = [
  'Falta un lugar o aula',
  'Información incorrecta',
  'Error de ubicación en el mapa',
  'Problema con una ruta',
  'Otro problema',
];

export function buildReport({ type, place, description }) {
  const subject = `FINOR Maps · ${type}`;
  const body = [
    `Tipo de problema: ${type}`,
    `Lugar o referencia: ${place.trim() || 'No indicado'}`,
    '',
    'Descripción:',
    description.trim(),
    '',
    'Reporte preparado desde FINOR Maps.',
  ].join('\n');
  const mailto = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto };
}

export async function openReportEmail(mailto) {
  if (Capacitor.isNativePlatform()) {
    const { value } = await AppLauncher.canOpenUrl({ url: 'mailto:' });
    if (!value) return false;
    const { completed } = await AppLauncher.openUrl({ url: mailto });
    return completed;
  }
  window.location.href = mailto;
  return true;
}

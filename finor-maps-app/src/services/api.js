import { Capacitor } from '@capacitor/core';

// IP local de la computadora para que el celular se comunique con Django por Wi-Fi
const DEV_PC_IP = '192.168.100.191';

export const API_URL = Capacitor.isNativePlatform()
  ? `http://${DEV_PC_IP}:8000/api`
  : 'http://localhost:8000/api';

export const fetchAmbientes = async () => {
  try {
    const response = await fetch(`${API_URL}/ambientes/`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching ambientes:", error);
    return { features: [] };
  }
};

export const fetchModulos = async () => {
  try {
    const response = await fetch(`${API_URL}/modulos/`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching modulos:", error);
    return { features: [] };
  }
};

export const fetchModuloById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/modulos/${id}/`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching modulo ${id}:`, error);
    return null;
  }
};

export const fetchCategorias = async () => {
  try {
    const response = await fetch(`${API_URL}/categorias/`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching categorias:", error);
    return [];
  }
};


import { request } from './httpClient';

export const fetchCampusMap = () => request('/edificios/mapa/');
export const fetchBuildings = () => request('/edificios/');
export const fetchBuildingById = (id) => request(`/edificios/${id}/`);
export const fetchPlaces = () => request('/lugares/');
export const fetchPlaceAliases = (page = 1) => request(`/aliases-lugares/?page=${page}`);
export const fetchCareerUnits = (page = 1) => request(`/unidades-carrera/?page=${page}`);
export const fetchCategorias = () => request('/categorias/');
export const fetchCarreras = () => request('/carreras/');
export const fetchFacultyAuthorities = () => request('/autoridades-facultad/');

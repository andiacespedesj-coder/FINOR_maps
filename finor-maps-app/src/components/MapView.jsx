import { MapContainer, TileLayer, GeoJSON, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchCampusMap } from '../services/catalogApi';
import { getApiHelpMessage } from '../services/httpClient';
import { getUserPosition, locationErrorMessage } from '../services/geolocation';
import { FINOR_BOUNDS, FINOR_CENTER } from '../services/mapCoordinates';
import { Navigation, Loader2, WifiOff } from 'lucide-react';

// Ícono personalizado del usuario con efecto radar pulsante
const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div class="user-gps-container">
      <div class="user-gps-pulse"></div>
      <div class="user-gps-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Helper interno para interactuar con la instancia del mapa de Leaflet
const MapController = ({ userLocation, shouldFlyToUser, onFlyComplete, selectedBuilding, selectedPlace, bottomOverlayFraction }) => {
  const map = useMap();

  // Recalibrar tamaño inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bottomOverlayFraction && !selectedBuilding && !selectedPlace) {
        map.panBy([0, map.getSize().y * bottomOverlayFraction / 2], { animate: false });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [map, bottomOverlayFraction, selectedBuilding, selectedPlace]);

  const flyToFeature = useCallback((feature) => {
    if (!feature?.geometry) return;
    const bounds = L.geoJSON(feature).getBounds();
    if (!bounds.isValid()) return;
    if (bottomOverlayFraction) {
      const zoom = 19;
      const center = map.unproject(
        map.project(bounds.getCenter(), zoom).add(L.point(0, map.getSize().y * bottomOverlayFraction / 2)),
        zoom,
      );
      map.flyTo(center, zoom, { duration: 0.8 });
      return;
    }
    map.flyToBounds(bounds, {
      paddingTopLeft: [35, 35],
      paddingBottomRight: [35, Math.min(200, map.getSize().y * 0.44)],
      maxZoom: 19,
      duration: 0.8,
    });
  }, [map, bottomOverlayFraction]);

  // Centrar suavemente en el usuario cuando se solicita
  useEffect(() => {
    if (shouldFlyToUser && userLocation) {
      const zoom = userLocation.accuracy == null || userLocation.accuracy > 35 ? 17 : 19;
      const point = [userLocation.lat, userLocation.lng];
      map.setMaxBounds(L.latLngBounds(FINOR_BOUNDS).extend(point).pad(0.15));
      const center = bottomOverlayFraction
        ? map.unproject(map.project(point, zoom).add(L.point(0, map.getSize().y * bottomOverlayFraction / 2)), zoom)
        : point;
      map.flyTo(center, zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
      if (onFlyComplete) onFlyComplete();
    }
  }, [shouldFlyToUser, userLocation, map, onFlyComplete, bottomOverlayFraction]);

  useEffect(() => {
    if (!selectedPlace?.geometry) flyToFeature(selectedBuilding);
  }, [selectedBuilding, selectedPlace, flyToFeature]);

  useEffect(() => {
    flyToFeature(selectedPlace);
  }, [selectedPlace, flyToFeature]);

  return null;
};

const MapView = ({ onBuildingSelect, onPlaceSelect, selectedBuildingId, selectedPlaceId, activeCategoryId, bottomOverlayFraction = 0 }) => {
  const [buildings, setBuildings] = useState([]);
  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [shouldFly, setShouldFly] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [locationError, setLocationError] = useState('');
  const mapBounds = useMemo(() => {
    const bounds = L.latLngBounds(FINOR_BOUNDS);
    if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
    return bounds.pad(0.15);
  }, [userLocation]);
  const selectedBuilding = buildings.find((building) => building.id === selectedBuildingId);
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);

  // Cargar las geometrías publicadas del campus.
  useEffect(() => {
    let active = true;
    fetchCampusMap()
      .then((data) => {
        if (!active) return;
        setBuildings(data.edificios?.features || data.modulos || []);
        setPlaces(data.lugares?.features || data.ambientes || []);
      })
      .catch(() => active && setLoadError(getApiHelpMessage()));
    return () => { active = false; };
  }, []);

  // Función para obtener ubicación GPS
  const handleLocateMe = useCallback(async (fly = true) => {
    setIsLocating(true);
    setLocationError('');
    try {
      const pos = await getUserPosition();
      setUserLocation(pos);
      if (fly) setShouldFly(true);

    } catch (err) {
      console.warn("No se pudo obtener ubicación GPS:", err.message);
      setLocationError(locationErrorMessage(err));
    } finally {
      setIsLocating(false);
    }
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={FINOR_CENTER}
        zoom={18}
        minZoom={16}
        maxZoom={22}
        maxBounds={mapBounds}
        maxBoundsViscosity={0.9}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapController
          userLocation={userLocation}
          shouldFlyToUser={shouldFly}
          onFlyComplete={() => setShouldFly(false)}
          selectedBuilding={selectedBuilding}
          selectedPlace={selectedPlace}
          bottomOverlayFraction={bottomOverlayFraction}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* Polígonos de los Módulos del Campus */}
        {buildings.map(building => {
          const isSelected = selectedBuildingId === building.id;
          // Los edificios publicados resaltan sobre el plano del campus.
          const polygonStyle = {
            color: isSelected ? '#073b76' : '#1263a5',
            weight: isSelected ? 3 : 2,
            fillColor: isSelected ? '#1c6db2' : '#609bc7',
            fillOpacity: isSelected ? 0.8 : 0.57
          };

          return (
            <GeoJSON
              key={`building-${building.id}-${isSelected}`}
              data={building}
              style={polygonStyle}
              eventHandlers={{
                click: () => {
                  if (onBuildingSelect) onBuildingSelect(building);
                }
              }}
            >
              <Tooltip permanent direction="center" className="modulo-label">
                {building.properties.nombre}
              </Tooltip>
            </GeoJSON>
          );
        })}

        {/* Solo mostrar marcadores de Ambientes cuando hay un filtro activo por categoría */}
        {activeCategoryId &&
          places
            .filter(place => String(place.properties.categoria) === String(activeCategoryId) && place.geometry)
            .map(place => (
              <GeoJSON
                key={`place-${place.id}-${selectedPlaceId === place.id}`}
                data={place}
                pointToLayer={(_feature, latlng) => L.circleMarker(latlng, { radius: selectedPlaceId === place.id ? 10 : 7, color: '#fff', weight: 2, fillColor: selectedPlaceId === place.id ? '#073b76' : '#1263a5', fillOpacity: 1 })}
                eventHandlers={{ click: () => onPlaceSelect?.(place) }}
              />
            ))}

        {/* Posición GPS obtenida al pulsar el botón. */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userGpsIcon} />
          </>
        )}
      </MapContainer>

      {(loadError || locationError) && (
        <div className="map-network-notice" role="status">
          <WifiOff size={16} />
          <span>{loadError || locationError}</span>
        </div>
      )}

      {/* Botón Flotante para Centrar en "Mi Ubicación" */}
      <button
        className={`floating-gps-btn ${userLocation ? 'active' : ''}`}
        onClick={() => handleLocateMe(true)}
        title="Mi ubicación actual"
        aria-label="Centrar mapa en mi ubicación"
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 size={24} className="spinning" />
        ) : (
          <Navigation size={22} style={{ transform: 'rotate(-45deg)' }} />
        )}
      </button>
    </div>
  );
};

export default MapView;

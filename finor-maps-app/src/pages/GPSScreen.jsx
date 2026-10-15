import { useState, useEffect } from 'react';
import { Navigation, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import './GPSScreen.css';

const FINOR_COORDS = { lat: -17.33848, lng: -63.26879 };
// Distancia en metros para considerar que está "dentro" del campus (aprox 500m)
const CAMPUS_RADIUS_METERS = 500; 

// Fórmula de Haversine para calcular distancia entre 2 coordenadas
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radio de la tierra en metros
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
};

const GPSScreen = () => {
  const [locationState, setLocationState] = useState('loading'); // loading, inside, outside, error
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, FINOR_COORDS.lat, FINOR_COORDS.lng);
        setDistance(Math.round(dist));

        if (dist <= CAMPUS_RADIUS_METERS) {
          setLocationState('inside');
        } else {
          setLocationState('outside');
        }
      },
      (error) => {
        console.error("Error obteniendo ubicación", error);
        setLocationState('error');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${FINOR_COORDS.lat},${FINOR_COORDS.lng}`, '_blank');
  };

  return (
    <div className="gps-screen">
      <header className="gps-header">
        <h2>Mi Ubicación</h2>
      </header>

      <div className="gps-content">
        {locationState === 'loading' && (
          <div className="status-card loading">
            <div className="spinner"></div>
            <h3>Buscando señal GPS...</h3>
            <p>Calculando tu distancia a la universidad</p>
          </div>
        )}

        {locationState === 'error' && (
          <div className="status-card error">
            <AlertTriangle size={50} color="#d0021b" />
            <h3>GPS no disponible</h3>
            <p>Por favor, activa tu ubicación para usar esta función.</p>
          </div>
        )}

        {locationState === 'inside' && (
          <div className="status-card success">
            <div className="pulse-circle">
              <Navigation size={40} color="white" />
            </div>
            <h3>¡Estás en la FINOR!</h3>
            <p>Abre el mapa principal y verás un punto azul indicando tu ubicación exacta en el campus.</p>
          </div>
        )}

        {locationState === 'outside' && (
          <div className="status-card warning">
            <MapPin size={50} color="#f5a623" />
            <h3>Estás fuera del campus</h3>
            <p>Te encuentras a <strong>{(distance / 1000).toFixed(1)} km</strong> de la universidad.</p>
            
            <button className="route-btn" onClick={openGoogleMaps}>
              <ExternalLink size={20} />
              Cómo llegar (Google Maps)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSScreen;

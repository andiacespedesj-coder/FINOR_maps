import { useState, useEffect } from 'react';
import { Navigation, MapPin, ExternalLink, AlertTriangle, Building2, ChevronRight, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserPosition } from '../services/geolocation';
import { fetchBuildings } from '../services/api';
import { calculateDistance, detectCurrentModulo, FINOR_CENTER, CAMPUS_RADIUS_METERS } from './geoUtils';
import './GPSScreen.css';

const GPSScreen = () => {
  const navigate = useNavigate();
  const [locationState, setLocationState] = useState('loading'); // loading, inside, outside, error
  const [distance, setDistance] = useState(0);
  const [currentModuloInfo, setCurrentModuloInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const locate = async () => {
      try {
        const [pos, modulosData] = await Promise.all([
          getUserPosition(),
          fetchBuildings()
        ]);

        if (!isMounted) return;

        const dist = calculateDistance(pos.lat, pos.lng, FINOR_CENTER[0], FINOR_CENTER[1]);
        setDistance(Math.round(dist));

        const modulosList = modulosData?.features || [];
        const detected = detectCurrentModulo(pos.lat, pos.lng, modulosList);
        setCurrentModuloInfo(detected);

        if (dist <= CAMPUS_RADIUS_METERS || detected) {
          setLocationState('inside');
        } else {
          setLocationState('outside');
        }
      } catch (err) {
        console.error('Error obteniendo ubicación en GPSScreen:', err);
        if (isMounted) setLocationState('error');
      }
    };

    locate();

    return () => {
      isMounted = false;
    };
  }, []);

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${FINOR_CENTER[0]},${FINOR_CENTER[1]}`,
      '_blank'
    );
  };

  const handleIrAlModulo = () => {
    if (currentModuloInfo?.modulo) {
      navigate('/', { state: { selectedModulo: currentModuloInfo.modulo } });
    } else {
      navigate('/');
    }
  };

  const handleVerDetalles = () => {
    if (currentModuloInfo?.modulo) {
      navigate(`/detail/${currentModuloInfo.modulo.id}`);
    }
  };

  return (
    <div className="gps-screen">
      <header className="gps-header">
        <h2>Mi Ubicación GPS</h2>
      </header>

      <div className="gps-content">
        {locationState === 'loading' && (
          <div className="status-card loading">
            <div className="spinner"></div>
            <h3>Buscando señal GPS...</h3>
            <p>Calculando tu posición en la universidad</p>
          </div>
        )}

        {locationState === 'error' && (
          <div className="status-card error">
            <AlertTriangle size={50} color="#d0021b" />
            <h3>GPS no disponible</h3>
            <p>Por favor, asegúrate de activar la ubicación / GPS de tu teléfono para saber en qué módulo estás.</p>
            <button className="route-btn" onClick={() => window.location.reload()} style={{ background: '#0033a0' }}>
              Reintentar
            </button>
          </div>
        )}

        {locationState === 'inside' && (
          <div className="status-card success" style={{ maxWidth: '380px' }}>
            <div className="pulse-circle">
              <Navigation size={38} color="white" />
            </div>

            {currentModuloInfo ? (
              <>
                <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  {currentModuloInfo.status === 'inside' ? 'Dentro del edificio' : `Cerca (${currentModuloInfo.distance}m)`}
                </div>

                <h3 style={{ margin: '14px 0 6px 0', fontSize: '1.45rem', color: '#0033a0', fontWeight: '800' }}>
                  {currentModuloInfo.modulo.properties.nombre}
                </h3>

                {currentModuloInfo.modulo.properties.carreras_nombres && currentModuloInfo.modulo.properties.carreras_nombres.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', margin: '8px 0 16px 0' }}>
                    {currentModuloInfo.modulo.properties.carreras_nombres.map((c, i) => (
                      <span key={i} style={{ background: '#eaf2fc', color: '#004aad', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {currentModuloInfo.modulo.properties.descripcion || 'Edificio de aulas y laboratorios universitarios.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <button
                    onClick={handleVerDetalles}
                    style={{
                      background: '#0033a0',
                      color: 'white',
                      border: 'none',
                      padding: '13px',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Building2 size={18} />
                    Ver aulas y pisos de este módulo <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={handleIrAlModulo}
                    style={{
                      background: '#f8fafc',
                      color: '#0033a0',
                      border: '1.5px solid #cbd5e1',
                      padding: '12px',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Compass size={18} />
                    Ver en el mapa del campus
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: '16px 0 8px 0', fontSize: '1.4rem', color: '#0033a0', fontWeight: '800' }}>
                  ¡Estás en la FINOR!
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 24px 0' }}>
                  Te encuentras en las áreas comunes o pasillos de la facultad. Acércate a cualquier módulo para identificarlo automáticamente.
                </p>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: '#0033a0',
                    color: 'white',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <Compass size={18} />
                  Abrir mapa del campus
                </button>
              </>
            )}
          </div>
        )}

        {locationState === 'outside' && (
          <div className="status-card warning">
            <MapPin size={50} color="#f5a623" />
            <h3>Estás fuera de la FINOR</h3>
            <p>
              Te encuentras a <strong>{(distance / 1000).toFixed(1)} km</strong> de la facultad en Montero.
            </p>
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

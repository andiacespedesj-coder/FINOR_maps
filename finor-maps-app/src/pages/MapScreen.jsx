import { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { X, Building2, ChevronRight, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MapScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModulo, setSelectedModulo] = useState(location.state?.selectedModulo || null);

  // Estado del filtro (viene de CategoriesScreen)
  const [activeFilterId, setActiveFilterId] = useState(location.state?.filterCategoryId || null);
  const [activeFilterName, setActiveFilterName] = useState(location.state?.filterCategoryName || null);

  useEffect(() => {
    if (location.state?.selectedModulo) {
      setSelectedModulo(location.state.selectedModulo);
    }
    if (location.state?.filterCategoryId !== undefined) {
      setActiveFilterId(location.state?.filterCategoryId || null);
      setActiveFilterName(location.state?.filterCategoryName || null);
    }
  }, [location.state]);

  const handleModuloSelect = (modulo) => {
    setSelectedModulo(modulo);
  };

  const clearFilter = () => {
    setActiveFilterId(null);
    setActiveFilterName(null);
    // Limpiamos el state del router
    navigate('.', { replace: true, state: {} });
  };

  const handleClose = () => {
    setSelectedModulo(null);
  };

  const handleVerDetalles = () => {
    if (selectedModulo) {
      // Navegaremos a la pantalla de detalles (por crear/pulir luego)
      navigate(`/detail/${selectedModulo.id}`);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera Flotante tipo Glassmorphism */}
      <header className="app-header">
        <h1>FINOR Maps</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar aquí"
            className="search-bar"
            onClick={() => navigate('/search')}
            readOnly
          />
          <button className="search-btn" onClick={() => navigate('/search')} title="Buscar">
            <Search size={20} color="#ffffff" strokeWidth={2.2} />
          </button>
        </div>

        {/* Píldora de Filtro Activo integrada limpiamente */}
        {activeFilterName && (
          <div className="active-filter-chip">
            <span className="filter-chip-text">
              Filtro: <strong>{activeFilterName}</strong>
            </span>
            <button onClick={clearFilter} className="filter-chip-close" title="Quitar filtro">
              <X size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Contenedor del Mapa */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <MapView onModuloSelect={handleModuloSelect} activeCategoryId={activeFilterId} />
      </div>

      {/* Bottom Sheet Anclado - Estilo Google Maps */}
      {selectedModulo && (
        <div className="bottom-sheet-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button className="close-btn" onClick={handleClose} style={{ zIndex: 10, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
            <X size={20} />
          </button>

          <div className="sheet-header-image">
            {selectedModulo.properties.fotografia ? (
              <img
                src={selectedModulo.properties.fotografia}
                alt="Modulo"
                style={{ width: '100%', height: '220px', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '220px', background: 'linear-gradient(135deg, #0033a0, #4a90e2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={60} color="#fff" />
              </div>
            )}
          </div>

          <div className="sheet-info-container" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: '#1a1a1a', fontWeight: '800' }}>
              {selectedModulo.properties.nombre}
            </h3>

            {/* Badges de Carreras */}
            {selectedModulo.properties.carreras_nombres && selectedModulo.properties.carreras_nombres.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {selectedModulo.properties.carreras_nombres.map((carrera, idx) => (
                  <span key={idx} style={{
                    backgroundColor: '#eaf2fc', color: '#004aad', fontSize: '0.8rem',
                    padding: '6px 12px', borderRadius: '16px', fontWeight: '600'
                  }}>
                    {carrera}
                  </span>
                ))}
              </div>
            )}

            <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: '#555', lineHeight: '1.5' }}>
              {selectedModulo.properties.descripcion
                ? selectedModulo.properties.descripcion
                : 'Sin descripción disponible.'}
            </p>

            <button
              className="sheet-action-btn"
              onClick={handleVerDetalles}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '14px', justifyContent: 'center' }}
            >
              Ver detalles y pisos <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, X } from 'lucide-react';
import MapView from '../components/MapView';
import finorLogo from '../assets/finor-logo.png';
import './MapScreen.css';

export default function MapScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedBuilding, setSelectedBuilding] = useState(location.state?.selectedModulo || null);
  const activeFilterId = location.state?.filterCategoryId ?? null;
  const activeFilterName = location.state?.filterCategoryName;

  const building = selectedBuilding?.properties;

  return (
    <main className="map-screen">
      <header className="map-top-panel">
        <div className="map-identity">
          <img src={finorLogo} alt="Escudo de FINOR" />
          <div><h1>FINOR Maps</h1><p>Facultad Integral del Norte · Montero</p></div>
        </div>
        <button className="map-search" onClick={() => navigate('/search')} aria-label="Buscar aulas, servicios o carreras">
          <Search size={21} aria-hidden="true" /><span>¿A dónde quieres ir?</span>
        </button>
      </header>

      <div className={`map-canvas${building ? ' has-selection' : ''}`}>
        <MapView
          onBuildingSelect={setSelectedBuilding}
          onPlaceSelect={(place) => navigate(`/detail/${place.properties.edificio_id}`, { state: { floorId: place.properties.piso, placeId: place.id } })}
          selectedBuildingId={selectedBuilding?.id}
          activeCategoryId={activeFilterId}
        />
        {activeFilterId && <button className="map-active-filter" onClick={() => navigate('.', { replace: true, state: null })} aria-label="Quitar filtro de lugares">
          {activeFilterName || 'Filtro activo'} <X size={16} />
        </button>}
        {building && <section className="building-sheet" aria-label={`Edificio ${building.nombre}`}>
          <div className="sheet-grip" aria-hidden="true" />
          <button className="sheet-close" onClick={() => setSelectedBuilding(null)} aria-label="Cerrar ficha"><X size={20} /></button>
          <div className="sheet-summary">
            {building.fotografia
              ? <img className="sheet-thumbnail" src={building.fotografia} alt={`Vista de ${building.nombre}`} />
              : <div className="sheet-thumbnail sheet-placeholder"><Building2 size={32} /></div>}
            <div className="sheet-copy"><span>EDIFICIO · CAMPUS FINOR</span><h2>{building.nombre}</h2>
              <p>{building.pisos?.length || 0} {building.pisos?.length === 1 ? 'piso registrado' : 'pisos registrados'}</p>
            </div>
          </div>
          <button className="sheet-primary" onClick={() => navigate(`/detail/${selectedBuilding.id}`)}>
            Ver pisos y lugares <ChevronRight size={19} />
          </button>
        </section>}
      </div>
    </main>
  );
}

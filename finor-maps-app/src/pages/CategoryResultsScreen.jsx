import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, Clock3, ImageOff, LoaderCircle, MapPin, Route, Search, X } from 'lucide-react';
import { fetchBuildings, fetchCategorias, fetchPlaces } from '../services/catalogApi';
import MapView from '../components/MapView';
import PlaceIcon from '../components/PlaceIcon';
import { SHEET_HEIGHTS, clampSheetHeight, snapSheetHeight } from '../services/sheetGestures';
import './CategoryResultsScreen.css';

const normalize = (value = '') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function PhotoStrip({ photos, title, onOpen }) {
  const [failed, setFailed] = useState([]);
  const visiblePhotos = photos.filter((url) => url && !failed.includes(url));
  if (visiblePhotos.length === 0) return null;

  return <div className="category-result-photos" aria-label={`Fotografías de ${title}`}>
    {visiblePhotos.map((url, index) => <button key={`${url}-${index}`} onClick={() => onOpen({ url, title })} aria-label={`Ampliar fotografía de ${title}`}>
      <img src={url} alt={`${title}, fotografía ${index + 1}`} loading="lazy" onError={() => setFailed((current) => [...current, url])} />
    </button>)}
  </div>;
}

export default function CategoryResultsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [panelHeight, setPanelHeight] = useState(58);
  const [snappedHeight, setSnappedHeight] = useState(58);
  const [dragging, setDragging] = useState(false);
  const screenRef = useRef(null);
  const dragRef = useRef(null);
  const ignoreClick = useRef(false);

  const setPanelSnap = (height) => {
    setPanelHeight(height);
    setSnappedHeight(height);
  };

  const startDrag = (event) => {
    if (event.button !== 0 || !screenRef.current) return;
    dragRef.current = { id: event.pointerId, startY: event.clientY, startHeight: snappedHeight, height: snappedHeight, screenHeight: screenRef.current.clientHeight, startTime: performance.now(), moved: false };
    ignoreClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId || !drag.screenHeight) return;
    const distance = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(distance) < 8) return;
    drag.moved = true;
    drag.height = clampSheetHeight(drag.startHeight + distance / drag.screenHeight * 100);
    setDragging(true);
    setPanelHeight(drag.height);
  };

  const endDrag = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (!drag.moved) return;
    ignoreClick.current = !cancelled;
    setPanelSnap(cancelled ? drag.startHeight : snapSheetHeight(drag.height, drag.startHeight, performance.now() - drag.startTime));
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchCategorias(), fetchBuildings(), fetchPlaces()])
      .then(([categories, buildings, places]) => {
        if (!active) return;
        setCatalog({
          categories: categories.results || categories || [],
          buildings: buildings.features || [],
          places: places.features || [],
        });
      })
      .catch(() => active && setError('No se pudieron cargar los resultados. Revisa tu conexión e inténtalo nuevamente.'));
    return () => { active = false; };
  }, []);

  const category = catalog?.categories.find((item) => String(item.id) === id);
  const buildingsCategory = category?.codigo === 'M1' || (category?.icono === 'Building2' && normalize(category.nombre).includes('modulo'));
  const results = useMemo(() => {
    if (!catalog || !category) return [];
    const source = buildingsCategory
      ? catalog.buildings.filter((item) => item.properties?.publicado)
      : catalog.places.filter((item) => item.properties?.publicado && String(item.properties.categoria) === id);
    const term = normalize(query.trim());
    if (!term) return source;
    return source.filter((item) => {
      const p = item.properties || {};
      return normalize([p.nombre, p.codigo, p.codigo_visible, p.descripcion, p.piso_nombre, p.edificio_nombre].join(' ')).includes(term);
    });
  }, [catalog, category, buildingsCategory, id, query]);

  const openDetails = (item) => {
    if (buildingsCategory) navigate(`/detail/${item.id}`);
    else navigate(`/detail/${item.properties.edificio_id}`, { state: { floorId: item.properties.piso, placeId: item.id } });
  };

  const selectedItem = results.find((item) => item.id === selectedItemId) || results[0];
  const activeSelectedItemId = selectedItem?.id ?? null;
  const selectedBuildingId = buildingsCategory
    ? activeSelectedItemId
    : selectedItem?.properties?.edificio_id;

  const selectResult = (item) => {
    setSelectedItemId(item.id);
    setPanelSnap(58);
    document.getElementById(`category-result-${item.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <main ref={screenRef} className={`category-results-screen${dragging ? ' is-dragging' : ''}`} style={{ '--category-panel-height': `${panelHeight}%` }}>
      <div className="category-results-map" aria-label="Mapa del campus">
        <MapView
          bottomOverlayFraction={snappedHeight / 100}
          activeCategoryId={buildingsCategory ? null : Number(id)}
          selectedBuildingId={selectedBuildingId}
          selectedPlaceId={buildingsCategory ? null : activeSelectedItemId}
          onBuildingSelect={(building) => {
            const match = results.find((item) => buildingsCategory ? item.id === building.id : item.properties?.edificio_id === building.id);
            if (match) selectResult(match);
          }}
          onPlaceSelect={selectResult}
        />
      </div>
      <button className="category-map-back" onClick={() => navigate('/categories')} aria-label="Volver a lugares"><ArrowLeft size={21} /></button>

      <section className="category-results-panel" aria-label={`Resultados de ${category?.nombre || 'la categoría'}`}>
        <button className="category-results-grip-button"
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={(event) => endDrag(event, true)} onLostPointerCapture={(event) => endDrag(event, true)}
          onClick={() => { if (ignoreClick.current) { ignoreClick.current = false; return; } setPanelSnap(snappedHeight === 82 ? 58 : 82); }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            const index = SHEET_HEIGHTS.indexOf(snappedHeight);
            setPanelSnap(SHEET_HEIGHTS[Math.max(0, Math.min(SHEET_HEIGHTS.length - 1, index + (event.key === 'ArrowUp' ? 1 : -1)))]);
          }}
          aria-label={snappedHeight === 82 ? 'Mostrar más mapa. También puedes deslizar el panel.' : 'Mostrar más resultados. También puedes deslizar el panel.'}
          aria-expanded={snappedHeight === 82}><span /></button>
        <header className="category-results-header">
          <div className="category-results-title-row"><div><span>EXPLORA FINOR</span><h1>{category?.nombre || 'Lugares'}</h1></div><small>{results.length} {results.length === 1 ? 'resultado' : 'resultados'}</small></div>
          <label className="category-results-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en esta categoría" aria-label="Buscar en esta categoría" />{query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={17} /></button>}</label>
        </header>
        <div className="category-results-content">
        {!catalog && !error && <p className="category-results-state"><LoaderCircle className="spin" size={22} /> Cargando lugares…</p>}
        {error && <div className="category-results-empty"><ImageOff size={28} /><strong>No pudimos cargar los resultados</strong><p>{error}</p><button onClick={() => window.location.reload()}>Reintentar</button></div>}
        {catalog && !category && <div className="category-results-empty"><strong>Esta categoría ya no está disponible</strong><button onClick={() => navigate('/categories')}>Ver categorías</button></div>}
        {category && <>
          <div className="category-results-list">
            {results.map((item) => {
              const p = item.properties || {};
              const photos = buildingsCategory
                ? [p.fotografia || p.fotografia_principal]
                : [...(p.fotografias || [])].sort((a, b) => a.orden - b.orden).map((photo) => photo.imagen);
              return <article className={`category-result-card${activeSelectedItemId === item.id ? ' is-selected' : ''}`} id={`category-result-${item.id}`} key={item.id}>
                <div className="category-result-heading">
                  <span className="category-result-icon">{buildingsCategory ? <Building2 size={22} /> : <PlaceIcon name={p.categoria_icono} size={22} />}</span>
                  <div><span className="category-result-type">{buildingsCategory ? 'Edificio · Campus FINOR' : p.categoria_nombre || category.nombre}</span><h2>{p.nombre}</h2></div>
                </div>
                <p className="category-result-location">{buildingsCategory
                  ? `${p.pisos?.length || 0} ${p.pisos?.length === 1 ? 'piso registrado' : 'pisos registrados'}`
                  : [p.edificio_nombre, p.piso_nombre, p.codigo_visible && `Código ${p.codigo_visible}`].filter(Boolean).join(' · ')}</p>
                {p.descripcion && <p className="category-result-description">{p.descripcion}</p>}
                {p.horario && <p className="category-result-hours"><Clock3 size={15} />Horario: {p.horario}</p>}
                <PhotoStrip photos={photos} title={p.nombre} onOpen={setSelectedPhoto} />
                {!buildingsCategory && <button className="category-result-locate" onClick={() => selectResult(item)}><MapPin size={16} />Ubicar en el mapa</button>}
                <div className="category-result-actions">
                  <button className="primary" onClick={() => openDetails(item)}>{buildingsCategory ? 'Ver pisos y lugares' : 'Ver detalles'}<ChevronRight size={17} /></button>
                  <button className="secondary" onClick={() => buildingsCategory
                    ? selectResult(item)
                    : navigate(`/route/${item.id}`)}>
                    {buildingsCategory ? <MapPin size={17} /> : <Route size={17} />}{buildingsCategory ? 'Ubicar' : 'Cómo llegar'}
                  </button>
                </div>
              </article>;
            })}
          </div>
          {results.length === 0 && <div className="category-results-empty"><span><ImageOff size={27} /></span><strong>{query ? 'No encontramos coincidencias' : `Aún no hay ${buildingsCategory ? 'edificios' : 'lugares'} publicados aquí`}</strong><p>{query ? 'Prueba con otro nombre o código.' : 'El equipo agregará los datos verificados a esta categoría.'}</p><button onClick={() => navigate('/categories')}>Ver otras categorías</button></div>}
        </>}
        </div>
      </section>

      {selectedPhoto && <div className="category-photo-modal" role="dialog" aria-modal="true" aria-label={`Fotografía de ${selectedPhoto.title}`}>
        <button onClick={() => setSelectedPhoto(null)} aria-label="Cerrar fotografía"><X size={23} /></button>
        <img src={selectedPhoto.url} alt={selectedPhoto.title} />
      </div>}
    </main>
  );
}

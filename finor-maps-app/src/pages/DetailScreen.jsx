import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, ChevronDown, DoorOpen, Expand, LoaderCircle, MapPin, Route, UsersRound, X } from 'lucide-react';
import { loadBuildingDirectory, placeRelations } from '../services/catalogData';
import { groupFloorPlaces, placeRowsForGroup } from '../services/placeGroups';
import PlaceIcon from '../components/PlaceIcon';
import './DetailScreen.css';

const cargoLabels = { DIRECTOR: 'Director(a)', EJECUTIVO: 'Ejecutivo(a)', DECANO: 'Decano(a)', VICEDECANO: 'Vicedecano(a)' };

export function PlaceItem({ place, data, expanded, onToggle, onOpenPhoto, onNavigate, title, floorName, buildingName, alternatives = [], onSelectAlternative }) {
  const [failedPhotos, setFailedPhotos] = useState([]);
  const p = place.properties || {};
  const { aliases, units } = placeRelations(data, place.id);
  const hasFacultyOfficeHours = units.some((unit) => ['DECANATO', 'VICEDECANATO'].includes(unit.tipo) && unit.horario_atencion);
  const photos = [...(p.fotografias || [])]
    .filter((photo) => photo.imagen && !failedPhotos.includes(photo.imagen))
    .sort((a, b) => a.orden - b.orden);

  return <article id={`place-${place.id}`} className={`place-item${expanded ? ' expanded' : ''}`}>
    <button className="place-trigger" aria-expanded={expanded} aria-controls={expanded ? `place-details-${place.id}` : undefined} onClick={onToggle}>
      <span className="place-main"><strong>{title || p.nombre}</strong>{p.codigo_visible && <small>Código {p.codigo_visible}</small>}</span>
      <ChevronDown className="place-chevron" size={19} aria-hidden="true" />
    </button>
    {expanded && <div id={`place-details-${place.id}`} className="place-details">
      {alternatives.length > 1 && <div className="place-alternatives" role="group" aria-label={`Opciones de ${title || p.nombre}`}>
        {alternatives.map((alternative, index) => <button key={alternative.id} type="button" aria-pressed={String(alternative.id) === String(place.id)} onClick={() => onSelectAlternative(alternative.id)}>
          {alternative.properties?.codigo_visible || `Opción ${index + 1}`}
        </button>)}
      </div>}
      {p.descripcion && <p>{p.descripcion}</p>}
      {p.horario && !hasFacultyOfficeHours && <div className="place-meta"><CalendarClock size={16} /><span>Horario: {p.horario}</span></div>}
      {p.publico === false && <span className="place-access">Acceso restringido</span>}
      {photos.length > 0 && <div className="place-photos" aria-label={`Fotografías de ${p.nombre}`}>
        {photos.map((photo, index) => <button key={photo.id || photo.imagen} onClick={() => onOpenPhoto({ url: photo.imagen, label: p.nombre })} aria-label={`Ampliar fotografía ${index + 1} de ${p.nombre}`}>
          <img src={photo.imagen} alt={photo.descripcion || p.nombre} loading="lazy" onError={() => setFailedPhotos((current) => [...current, photo.imagen])} />
        </button>)}
      </div>}
      {photos.length > 1 && <p className="place-photo-hint">Desliza para ver más fotos</p>}
      {photos.length === 0 && <p className="place-no-photo">Aún no hay fotografías disponibles.</p>}
      {aliases.length > 0 && <div className="place-aliases"><UsersRound size={16} /><span>{aliases.map((alias) => `${alias.alias} · ${alias.carrera_nombre}`).join(' · ')}</span></div>}
      {units.map((unit) => <div className="unit-details" key={unit.id}>
        <strong>{unit.nombre}</strong>
        {unit.horario_atencion && <span><CalendarClock size={15} />{unit.horario_atencion}</span>}
        {unit.responsables?.filter((person) => person.activo).map((person) => <span key={`${unit.id}-${person.nombre}`}><UsersRound size={15} />{cargoLabels[person.cargo] || 'Responsable'}: {person.nombre}</span>)}
      </div>)}
      <div className="place-actions">
        {(floorName || buildingName) && <span className="place-location"><MapPin size={18} aria-hidden="true" />{[floorName, buildingName].filter(Boolean).join(' · ')}</span>}
        <button className="place-route" onClick={() => onNavigate(place.id)}><Route size={17} /> Cómo llegar</button>
      </div>
    </div>}
  </article>;
}

export function PlaceGroup({ group, expanded, onToggle, children }) {
  return <section className={`place-group${expanded ? ' expanded' : ''}`}>
    <button className="place-group-trigger" aria-expanded={expanded} onClick={onToggle}>
      <span className="place-icon"><PlaceIcon name={group.icon} size={23} /></span>
      <span className="place-group-copy"><strong>{group.title}</strong></span>
      <ChevronDown className="place-chevron" size={19} aria-hidden="true" />
    </button>
    {expanded && <div className="place-group-content">{children}</div>}
  </section>;
}

function MediaModal({ media, onClose }) {
  const closeButton = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButton.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return <div className="media-modal" role="dialog" aria-modal="true" aria-label={media.label}>
    <button ref={closeButton} className="media-close" onClick={onClose} aria-label="Cerrar imagen"><X size={23} /></button>
    <figure><img src={media.url} alt={media.label} /><figcaption>{media.label}</figcaption></figure>
  </div>;
}

export default function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadResult, setLoadResult] = useState(null);
  const [activeFloor, setActiveFloor] = useState(location.state?.floorId || null);
  const [expandedPlaceId, setExpandedPlaceId] = useState(location.state?.placeId || null);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = JSON.stringify([id, location.state?.floorId, location.state?.placeId, retryCount]);
  const data = loadResult?.key === requestKey ? loadResult.data : null;
  const error = loadResult?.key === requestKey ? loadResult.error : '';

  useEffect(() => {
    let active = true;
    loadBuildingDirectory(id)
      .then((directory) => {
        if (!active) return;
        const floors = directory.building.properties?.pisos || [];
        const initialFloor = location.state?.floorId || floors[0]?.id || null;
        const floorPlaces = directory.places.filter((place) => place.properties?.piso === initialFloor);
        const selectedGroup = groupFloorPlaces(floorPlaces, directory.units)
          .find((group) => group.places.some((place) => String(place.id) === String(location.state?.placeId)));
        setLoadResult({ key: requestKey, data: directory, error: '' });
        setHeroImageFailed(false);
        setActiveFloor(initialFloor);
        setExpandedPlaceId(location.state?.placeId || null);
        setExpandedGroupId(selectedGroup?.id || null);
      })
      .catch(() => active && setLoadResult({ key: requestKey, data: null, error: 'No se pudo abrir este edificio. Revisa tu conexión e inténtalo nuevamente.' }));
    return () => { active = false; };
  }, [id, location.state?.floorId, location.state?.placeId, requestKey]);

  const floors = data?.building.properties?.pisos || [];
  const floor = floors.find((item) => item.id === activeFloor);
  const places = data?.places.filter((place) => place.properties?.piso === activeFloor) || [];
  const placeGroups = groupFloorPlaces(places, data?.units);

  useEffect(() => {
    if (!data || !location.state?.placeId) return undefined;
    const frame = window.requestAnimationFrame(() => document.getElementById(`place-${location.state.placeId}`)?.scrollIntoView({ block: 'center' }));
    return () => window.cancelAnimationFrame(frame);
  }, [data, activeFloor, location.state?.placeId]);

  if (error) return <main className="building-page detail-state"><p role="alert">{error}</p><button onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button><button onClick={() => navigate('/')}>Volver al mapa</button></main>;
  if (!data) return <main className="building-page detail-state"><LoaderCircle className="spin" /><p>Cargando edificio…</p></main>;

  const building = data.building.properties;
  const showHeroImage = Boolean(building.fotografia && !heroImageFailed);

  return (
    <main className="building-page">
      <header className={`building-hero${showHeroImage ? ' has-photo' : ''}`}>
        {showHeroImage
          ? <img src={building.fotografia} alt={`Vista de ${building.nombre}`} onError={() => setHeroImageFailed(true)} />
          : <div className="building-hero-fallback" aria-hidden="true"><Building2 size={42} /></div>}
        <button className="hero-back" onClick={() => navigate(-1)} aria-label="Volver"><ArrowLeft size={22} /></button>
        <div className="building-hero-title"><span>EDIFICIO · CAMPUS FINOR</span><h1>{building.nombre}</h1></div>
      </header>

      <section className="building-directory" aria-label="Pisos y lugares del edificio">
        {building.descripcion && <p className="building-description">{building.descripcion}</p>}
        <div className="directory-heading"><h2>Pisos</h2></div>
        {floors.length > 0
          ? <div className="floor-tabs" role="group" aria-label="Seleccionar piso">{floors.map((item) => <button key={item.id} className={item.id === activeFloor ? 'selected' : ''} aria-pressed={item.id === activeFloor} onClick={() => { setActiveFloor(item.id); setExpandedGroupId(null); setExpandedPlaceId(null); }}>{item.nombre}</button>)}</div>
          : <p className="detail-empty">Este edificio aún no tiene pisos publicados.</p>}

        {floor?.plano && <button className="floor-plan" onClick={() => setSelectedMedia({ url: floor.plano, label: `Plano de ${floor.nombre}` })}>
          <img src={floor.plano} alt="" /><span><strong>Plano de {floor.nombre}</strong><small>Abrir imagen completa</small></span><Expand size={19} />
        </button>}

        {floor && <div className="places-heading"><h3>Lugares</h3></div>}
        <div className="place-list">
          {placeGroups.map((group) => <PlaceGroup key={group.id} group={group} expanded={expandedGroupId === group.id}
            onToggle={() => { setExpandedGroupId(expandedGroupId === group.id ? null : group.id); setExpandedPlaceId(null); }}>
            {placeRowsForGroup(group).map((row) => {
              const selected = row.places.find((place) => String(place.id) === String(expandedPlaceId));
              const place = selected || row.places[0];
              return <PlaceItem key={row.id} place={place} title={row.title} data={data} expanded={Boolean(selected)} floorName={floor.nombre} buildingName={building.nombre}
                alternatives={row.places} onSelectAlternative={setExpandedPlaceId}
                onToggle={() => setExpandedPlaceId(selected ? null : place.id)}
                onOpenPhoto={setSelectedMedia} onNavigate={(placeId) => navigate(`/route/${placeId}`)} />;
            })}
          </PlaceGroup>)}
          {floor && places.length === 0 && <div className="detail-empty"><span className="empty-icon"><DoorOpen size={22} /></span><strong>Este piso aún no tiene ambientes registrados</strong><p>Prueba con otro piso para encontrar un lugar.</p></div>}
        </div>
      </section>

      {selectedMedia && <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />}
    </main>
  );
}

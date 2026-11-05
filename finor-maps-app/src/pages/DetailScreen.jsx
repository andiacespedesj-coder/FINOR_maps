import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, ChevronDown, DoorOpen, Expand, LoaderCircle, Route, UsersRound, X } from 'lucide-react';
import { loadBuildingDirectory, placeRelations } from '../services/catalogData';
import PlaceIcon from '../components/PlaceIcon';
import './DetailScreen.css';

const cargoLabels = { DIRECTOR: 'Director(a)', EJECUTIVO: 'Ejecutivo(a)', DECANO: 'Decano(a)', VICEDECANO: 'Vicedecano(a)' };

export default function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [activeFloor, setActiveFloor] = useState(location.state?.floorId || null);
  const [expandedPlaceId, setExpandedPlaceId] = useState(location.state?.placeId || null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadBuildingDirectory(id)
      .then((directory) => {
        if (!active) return;
        const floors = directory.building.properties?.pisos || [];
        setData(directory);
        setHeroImageFailed(false);
        setActiveFloor(location.state?.floorId || floors[0]?.id || null);
        setExpandedPlaceId(location.state?.placeId || null);
      })
      .catch(() => active && setError('No se pudo abrir este edificio. Revisa tu conexión e inténtalo nuevamente.'));
    return () => { active = false; };
  }, [id, location.state?.floorId, location.state?.placeId]);

  const floors = data?.building.properties?.pisos || [];
  const floor = floors.find((item) => item.id === activeFloor);
  const places = data?.places.filter((place) => place.properties?.piso === activeFloor) || [];

  useEffect(() => {
    if (!data || !location.state?.placeId) return undefined;
    const frame = window.requestAnimationFrame(() => document.getElementById(`place-${location.state.placeId}`)?.scrollIntoView({ block: 'center' }));
    return () => window.cancelAnimationFrame(frame);
  }, [data, activeFloor, location.state?.placeId]);

  if (error) return <main className="building-page detail-state"><p>{error}</p><button onClick={() => navigate('/')}>Volver al mapa</button></main>;
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
          ? <div className="floor-tabs" role="group" aria-label="Seleccionar piso">{floors.map((item) => <button key={item.id} className={item.id === activeFloor ? 'selected' : ''} aria-pressed={item.id === activeFloor} onClick={() => { setActiveFloor(item.id); setExpandedPlaceId(null); }}>{item.nombre}</button>)}</div>
          : <p className="detail-empty">Este edificio aún no tiene pisos publicados.</p>}

        {floor?.plano && <button className="floor-plan" onClick={() => setSelectedMedia({ url: floor.plano, label: `Plano de ${floor.nombre}` })}>
          <img src={floor.plano} alt="" /><span><strong>Plano de {floor.nombre}</strong><small>Abrir imagen completa</small></span><Expand size={19} />
        </button>}

        {floor && <div className="places-heading"><h3>Lugares</h3></div>}
        <div className="place-list">
          {places.map((place) => {
            const p = place.properties || {};
            const { aliases, units } = placeRelations(data, place.id);
            const hasFacultyOfficeHours = units.some((unit) => ['DECANATO', 'VICEDECANATO'].includes(unit.tipo) && unit.horario_atencion);
            const expanded = expandedPlaceId === place.id;
            const photos = [...(p.fotografias || [])].sort((a, b) => a.orden - b.orden);
            return <article id={`place-${place.id}`} key={place.id} className={`place-item${expanded ? ' expanded' : ''}`}>
              <div className="place-summary">
                <div className="place-main"><span>{p.categoria_nombre || 'Lugar'}</span><h4>{p.nombre}</h4>{p.codigo_visible && <small>Código {p.codigo_visible}</small>}</div>
                {photos.length > 0
                  ? <button className="place-cover" onClick={() => setSelectedMedia({ url: photos[0].imagen, label: photos[0].descripcion || `Fotografía de ${p.nombre}` })} aria-label={`Ampliar fotografía de ${p.nombre}`}><img src={photos[0].imagen} alt="" loading="lazy" /></button>
                  : <span className="place-icon"><PlaceIcon name={p.categoria_icono} size={27} /></span>}
              </div>
              <div className="place-actions">
                <button className="place-route" onClick={() => navigate(`/route/${place.id}`)}><Route size={17} /> Cómo llegar</button>
                <button className="place-trigger" aria-expanded={expanded} onClick={() => setExpandedPlaceId(expanded ? null : place.id)}>Información <ChevronDown className="place-chevron" size={17} /></button>
              </div>
              {expanded && <div className="place-details">
                {p.descripcion && <p>{p.descripcion}</p>}
                {p.horario && !hasFacultyOfficeHours && <div className="place-meta"><CalendarClock size={16} /><span>Horario: {p.horario}</span></div>}
                {p.publico === false && <span className="place-access">Acceso restringido</span>}
                {photos.length > 1 && <div className="place-photos" aria-label={`Más fotografías de ${p.nombre}`}>
                  {photos.slice(1).map((photo) => <button key={photo.id} onClick={() => setSelectedMedia({ url: photo.imagen, label: photo.descripcion || `Fotografía de ${p.nombre}` })} aria-label={`Ampliar fotografía de ${p.nombre}`}>
                    <img src={photo.imagen} alt={photo.descripcion || p.nombre} />
                  </button>)}
                </div>}
                {aliases.length > 0 && <div className="place-aliases"><UsersRound size={16} /><span>{aliases.map((alias) => `${alias.alias} · ${alias.carrera_nombre}`).join(' · ')}</span></div>}
                {units.map((unit) => <div className="unit-details" key={unit.id}>
                  <strong>{unit.nombre}</strong>
                  {unit.horario_atencion && <span><CalendarClock size={15} />{unit.horario_atencion}</span>}
                  {unit.responsables?.filter((person) => person.activo).map((person) => <span key={`${unit.id}-${person.nombre}`}><UsersRound size={15} />{cargoLabels[person.cargo] || 'Responsable'}: {person.nombre}</span>)}
                </div>)}
              </div>}
            </article>;
          })}
          {floor && places.length === 0 && <div className="detail-empty"><span className="empty-icon"><DoorOpen size={22} /></span><strong>Este piso aún no tiene ambientes registrados</strong><p>Prueba con otro piso para encontrar un lugar.</p></div>}
        </div>
      </section>

      {selectedMedia && <div className="media-modal" role="dialog" aria-modal="true" aria-label={selectedMedia.label}>
        <button className="media-close" onClick={() => setSelectedMedia(null)} aria-label="Cerrar imagen"><X size={23} /></button>
        <figure><img src={selectedMedia.url} alt={selectedMedia.label} /><figcaption>{selectedMedia.label}</figcaption></figure>
      </div>}
    </main>
  );
}

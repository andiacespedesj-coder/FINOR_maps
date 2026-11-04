import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, LoaderCircle, Route, Search, X } from 'lucide-react';
import { loadPlaceDirectory, placeRelations, searchPlaces } from '../services/catalogData';
import PlaceIcon from '../components/PlaceIcon';
import './SearchScreen.css';

export default function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState({ places: [], aliases: [], units: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadPlaceDirectory()
      .then((directory) => {
        if (!active) return;
        setCatalog(directory);
      })
      .catch(() => active && setError('No se pudo cargar el catálogo. Intenta nuevamente con conexión.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const search = query.trim();
  const results = useMemo(() => searchPlaces(catalog, query), [catalog, query]);

  const openPlace = (place) => navigate(`/detail/${place.properties.edificio_id}`, { state: { floorId: place.properties.piso, placeId: place.id } });

  return (
    <main className="search-screen">
      <header className="search-header-bar">
        <button className="icon-back" onClick={() => navigate('/')} aria-label="Volver al mapa"><ArrowLeft size={21} /></button>
        <label className="search-input-box">
          <Search size={19} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aula, servicio o carrera" aria-label="Buscar aula, servicio o carrera" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={16} /></button>}
        </label>
      </header>

      <section className="search-body">
        {!query && !loading && !error && <div className="search-intro"><Search size={36} /><h1>¿Qué estás buscando?</h1><p>Busca por lugar, aula, código, carrera, dirección o centro interno.</p></div>}
        {loading && <div className="search-intro"><LoaderCircle className="spin" size={30} /><p>Cargando lugares del campus…</p></div>}
        {error && <div className="search-intro search-error"><p>{error}</p></div>}
        {search && !loading && !error && <>
          <p className="result-count">{results.length} {results.length === 1 ? 'resultado' : 'resultados'}</p>
          {results.map((place) => {
            const p = place.properties || {};
            const { aliases, units } = placeRelations(catalog, place.id);
            return <div className="place-result-row" key={place.id}>
              <button className="place-result" onClick={() => openPlace(place)}>
                <span className="place-result-icon"><PlaceIcon name={p.categoria_icono} /></span>
                <span className="place-result-copy"><strong>{p.nombre}</strong><small>{[p.codigo_visible, p.categoria_nombre, p.piso_nombre, p.edificio_nombre].filter(Boolean).join(' · ')}</small>
                  {(aliases.length > 0 || units.length > 0) && <em>{[...aliases.map((a) => `${a.alias} · ${a.carrera_nombre}`), ...units.map((u) => u.nombre)].slice(0, 2).join(' · ')}</em>}
                </span><ChevronRight size={19} />
              </button>
              <button className="place-result-route" onClick={() => navigate(`/route/${place.id}`)} aria-label={`Cómo llegar a ${p.nombre}`}><Route size={19} /><span>Cómo llegar</span></button>
            </div>;
          })}
          {results.length === 0 && <div className="search-intro"><Building2 size={36} /><h1>Sin resultados</h1><p>Prueba con otro nombre o revisa la ortografía.</p></div>}
        </>}
      </section>
    </main>
  );
}

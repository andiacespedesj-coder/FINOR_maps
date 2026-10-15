import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, X, Building2, MapPin, DoorOpen,
  FlaskConical, Library, Mic, Trophy, Info, Utensils,
  Droplets, CreditCard, HeartPulse, MoreHorizontal, ChevronRight,
  GraduationCap, Briefcase, Book, Clock, Trash2
} from 'lucide-react';
import { fetchModulos, fetchAmbientes } from '../services/api';
import './SearchScreen.css';

const IconMap = {
  'Book': <Book size={20} />,
  'Building2': <Building2 size={20} />,
  'GraduationCap': <GraduationCap size={20} />,
  'Briefcase': <Briefcase size={20} />,
  'DoorOpen': <DoorOpen size={20} />,
  'FlaskConical': <FlaskConical size={20} />,
  'Library': <Library size={20} />,
  'Mic': <Mic size={20} />,
  'Trophy': <Trophy size={20} />,
  'Info': <Info size={20} />,
  'Utensils': <Utensils size={20} />,
  'Droplets': <Droplets size={20} />,
  'CreditCard': <CreditCard size={20} />,
  'HeartPulse': <HeartPulse size={20} />,
  'MoreHorizontal': <MoreHorizontal size={20} />
};

const STORAGE_KEY = 'finor_recent_searches';
const MAX_RECENT = 7;

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [modulos, setModulos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  // Cargar búsquedas recientes desde localStorage de forma instantánea
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Foco automático y carga de datos para búsqueda en vivo
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const loadData = async () => {
      try {
        const [modData, ambData] = await Promise.all([
          fetchModulos(),
          fetchAmbientes()
        ]);
        setModulos(modData.features || []);
        setAmbientes(ambData.features || []);
      } catch (err) {
        console.error('Error cargando datos de búsqueda:', err);
      }
    };

    loadData();
  }, []);

  // Guardar término en el historial (máximo 7, sin duplicados)
  const saveSearchTerm = (term) => {
    if (!term || typeof term !== 'string') return;
    const cleaned = term.trim();
    if (!cleaned) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== cleaned.toLowerCase());
      const updated = [cleaned, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
      return updated;
    });
  };

  // Eliminar un solo término del historial
  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== termToRemove);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error actualizando historial:', err);
      }
      return updated;
    });
  };

  // Borrar todo el historial
  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error limpiando historial:', err);
    }
  };

  const trimmed = query.trim().toLowerCase();

  const filteredModulos = useMemo(() => {
    if (!trimmed) return [];
    return modulos.filter(mod => {
      const nombre = (mod.properties?.nombre || '').toLowerCase();
      const codigo = (mod.properties?.codigo || '').toLowerCase();
      const desc = (mod.properties?.descripcion || '').toLowerCase();
      const carreras = (mod.properties?.carreras_nombres || []).join(' ').toLowerCase();
      return nombre.includes(trimmed) || codigo.includes(trimmed) || desc.includes(trimmed) || carreras.includes(trimmed);
    });
  }, [trimmed, modulos]);

  const filteredAmbientes = useMemo(() => {
    if (!trimmed) return [];
    return ambientes.filter(amb => {
      const nombre = (amb.properties?.nombre || '').toLowerCase();
      const codigo = (amb.properties?.codigo || '').toLowerCase();
      const desc = (amb.properties?.descripcion || '').toLowerCase();
      const cat = (amb.properties?.categoria_nombre || '').toLowerCase();
      const modulo = (amb.properties?.modulo_nombre || '').toLowerCase();
      return nombre.includes(trimmed) || codigo.includes(trimmed) || desc.includes(trimmed) || cat.includes(trimmed) || modulo.includes(trimmed);
    });
  }, [trimmed, ambientes]);

  const totalResults = filteredModulos.length + filteredAmbientes.length;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (trimmed) {
      saveSearchTerm(query);
    }
  };

  const handleSelectModulo = (mod) => {
    saveSearchTerm(mod.properties?.nombre || query);
    navigate('/', { state: { selectedModulo: mod } });
  };

  const handleSelectAmbiente = (amb) => {
    saveSearchTerm(amb.properties?.nombre || query);
    if (amb.properties?.modulo_id) {
      navigate('/detail/' + amb.properties.modulo_id);
    } else {
      navigate('/');
    }
  };

  const handleSelectRecent = (term) => {
    setQuery(term);
    saveSearchTerm(term); // Mover al principio
  };

  return (
    <div className="search-screen">
      {/* Barra de cabecera con Input de Búsqueda */}
      <header className="search-header-bar">
        <button className="search-back-btn" onClick={() => navigate(-1)} title="Volver al mapa">
          <ChevronLeft size={26} />
        </button>

        <form onSubmit={handleFormSubmit} className="search-input-box">
          <Search size={18} color="#94a3b8" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar aquí"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input-field"
          />
          {query && (
            <button
              type="button"
              className="search-clear-action"
              onClick={() => setQuery('')}
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </header>

      {/* Cuerpo de la búsqueda */}
      <div className="search-body">
        {/* Estado 1: No hay texto escrito -> Mostrar Historial de Últimas Búsquedas */}
        {!trimmed && (
          <div className="recent-searches-container">
            {recentSearches.length > 0 ? (
              <>
                <div className="recent-header">
                  <div className="recent-header-title">
                    <Clock size={16} color="#0033a0" />
                    <h4>Búsquedas Recientes</h4>
                  </div>
                  <button className="recent-clear-all-btn" onClick={clearAllRecent} title="Borrar historial">
                    <Trash2 size={13} />
                    <span>Borrar</span>
                  </button>
                </div>

                <div className="recent-searches-list">
                  {recentSearches.map((term, idx) => (
                    <div
                      key={idx}
                      className="recent-search-item"
                      onClick={() => handleSelectRecent(term)}
                    >
                      <div className="recent-search-left">
                        <Clock size={15} color="#94a3b8" />
                        <span>{term}</span>
                      </div>
                      <button
                        className="recent-search-delete"
                        onClick={(e) => removeRecentSearch(term, e)}
                        title="Eliminar de recientes"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="recent-empty-prompt">
                <Search size={36} color="#cbd5e1" strokeWidth={1.5} />
                <p>"Escribe para buscar algún lugar"</p>
              </div>
            )}
          </div>
        )}

        {/* Estado 2: Escribiendo y buscando */}
        {trimmed && (
          <>
            {totalResults === 0 ? (
              <div className="search-empty-state">
                <MapPin size={42} strokeWidth={1.5} color="#cbd5e1" />
                <p>No se encontraron resultados para <strong>"{query}"</strong></p>
                <span>Revisa la ortografía o intenta buscar por número de módulo (ej. Modulo 1)</span>
              </div>
            ) : (
              <>
                {/* Sección de Módulos */}
                {filteredModulos.length > 0 && (
                  <div className="results-section">
                    <h4 className="section-label">
                      <Building2 size={16} /> Módulos ({filteredModulos.length})
                    </h4>
                    <div className="results-list">
                      {filteredModulos.map((mod) => (
                        <div
                          key={mod.id}
                          className="search-card-modulo"
                          onClick={() => handleSelectModulo(mod)}
                        >
                          <div className="modulo-thumb">
                            {mod.properties?.fotografia ? (
                              <img src={mod.properties.fotografia} alt={mod.properties.nombre} />
                            ) : (
                              <Building2 size={28} color="#ffffff" />
                            )}
                          </div>
                          <div className="modulo-details">
                            <h4>{mod.properties?.nombre}</h4>
                            {mod.properties?.carreras_nombres && mod.properties.carreras_nombres.length > 0 && (
                              <div className="modulo-carreras-tags">
                                {mod.properties.carreras_nombres.slice(0, 2).map((c, i) => (
                                  <span key={i} className="carrera-tag">{c}</span>
                                ))}
                              </div>
                            )}
                            <p>{mod.properties?.descripcion || 'Toca para ver en el mapa y explorar pisos'}</p>
                          </div>
                          <ChevronRight size={20} color="#94a3b8" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección de Ambientes */}
                {filteredAmbientes.length > 0 && (
                  <div className="results-section">
                    <h4 className="section-label">
                      <DoorOpen size={16} /> Ambientes y Aulas ({filteredAmbientes.length})
                    </h4>
                    <div className="results-list">
                      {filteredAmbientes.map((amb) => {
                        const icon = IconMap[amb.properties?.categoria_icono] || <DoorOpen size={20} />;
                        return (
                          <div
                            key={amb.id}
                            className="search-card-ambiente"
                            onClick={() => handleSelectAmbiente(amb)}
                          >
                            <div className="ambiente-icon-box">
                              {icon}
                            </div>
                            <div className="ambiente-meta">
                              <h4>
                                {amb.properties?.nombre}
                                {amb.properties?.codigo && (
                                  <span className="ambiente-code-pill">{amb.properties.codigo}</span>
                                )}
                              </h4>
                              <p>
                                {amb.properties?.categoria_nombre || 'Ambiente'}
                                {amb.properties?.piso_nombre ? ` • ${amb.properties.piso_nombre}` : ''}
                                {amb.properties?.modulo_nombre ? ` (${amb.properties.modulo_nombre})` : ''}
                              </p>
                            </div>
                            <ChevronRight size={20} color="#94a3b8" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;

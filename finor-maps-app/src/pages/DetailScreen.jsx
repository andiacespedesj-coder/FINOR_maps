import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModuloById, fetchAmbientes } from '../services/api';
import { ChevronLeft, ChevronDown, ChevronUp, Layers, Building2, MapPin } from 'lucide-react';
import './DetailScreen.css';

// Reutilizamos el mapa de iconos que teníamos en CategoriesScreen
import { Book, GraduationCap, Briefcase, DoorOpen, FlaskConical, Library, Mic, Trophy, Info, Utensils, Droplets, CreditCard, HeartPulse, MoreHorizontal } from 'lucide-react';
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

const DetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [modulo, setModulo] = useState(null);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPiso, setExpandedPiso] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // 1. Cargar datos del Módulo
      const modData = await fetchModuloById(id);
      
      // 2. Cargar todos los ambientes
      const ambData = await fetchAmbientes();
      
      if (modData && modData.properties) {
        setModulo(modData);
        // Filtramos solo los ambientes que pertenezcan a los pisos de este módulo
        // Recordamos que modData.properties.pisos es un array de objetos piso
        const pisosIds = modData.properties.pisos.map(p => p.id);
        
        const filteredAmbientes = (ambData.features || []).filter(amb => {
          return pisosIds.includes(amb.properties.piso);
        });
        
        setAmbientes(filteredAmbientes);
      }
      setLoading(false);
    };
    
    loadData();
  }, [id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#0033a0' }}>Cargando información del módulo...</div>;
  }

  if (!modulo) {
    return <div style={{ padding: '20px', paddingTop: '50px' }}>Error: No se encontró el módulo.</div>;
  }

  const props = modulo.properties;

  const togglePiso = (pisoId) => {
    if (expandedPiso === pisoId) {
      setExpandedPiso(null); // Cerrar si ya está abierto
    } else {
      setExpandedPiso(pisoId); // Abrir el nuevo
    }
  };

  return (
    <div className="detail-screen">
      {/* Botón Volver */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={24} />
      </button>

      {/* Imagen de Cabecera */}
      <div className="detail-header-image">
        {props.fotografia ? (
          <img src={props.fotografia} alt={props.nombre} />
        ) : (
          <Building2 size={80} color="#fff" />
        )}
      </div>

      {/* Contenido */}
      <div className="detail-content">
        <h2 className="detail-title">{props.nombre}</h2>
        
        {/* Badges de Carreras */}
        {props.carreras_nombres && props.carreras_nombres.length > 0 && (
          <div className="detail-badges">
            {props.carreras_nombres.map((carrera, idx) => (
              <span key={idx} className="detail-badge">{carrera}</span>
            ))}
          </div>
        )}

        <p className="detail-desc">
          {props.descripcion || 'No hay descripción disponible para este módulo.'}
        </p>

        {/* Sección de Pisos */}
        <div className="pisos-section">
          <h3><Layers size={20} /> Distribución por Pisos</h3>
          
          {props.pisos && props.pisos.length > 0 ? (
            props.pisos.map((piso) => {
              const isExpanded = expandedPiso === piso.id;
              // Filtrar ambientes específicos para este piso
              const ambientesDelPiso = ambientes.filter(a => a.properties.piso === piso.id);

              return (
                <div key={piso.id} className="piso-accordion">
                  <div className="piso-header" onClick={() => togglePiso(piso.id)}>
                    <h4>{piso.nombre}</h4>
                    {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
                  </div>
                  
                  {isExpanded && (
                    <div className="piso-body">
                      {/* Mostrar plano si existe */}
                      {piso.plano && (
                        <img src={piso.plano} alt={`Plano de ${piso.nombre}`} className="piso-plano" />
                      )}

                      {/* Lista de ambientes */}
                      <div className="ambientes-list">
                        {ambientesDelPiso.length > 0 ? (
                          ambientesDelPiso.map(amb => {
                            const iconComponent = IconMap[amb.properties.categoria_icono] || <MapPin size={20} />;
                            return (
                              <div key={amb.id} className="ambiente-item">
                                <div className="ambiente-icon">
                                  {iconComponent}
                                </div>
                                <div className="ambiente-info">
                                  <h5>
                                    {amb.properties.nombre}
                                    {amb.properties.codigo && <span className="ambiente-codigo">{amb.properties.codigo}</span>}
                                  </h5>
                                  <p>{amb.properties.categoria_nombre}</p>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p style={{ color: '#888', fontSize: '0.9rem', fontStyle: 'italic', margin: '10px 0' }}>
                            No hay ambientes registrados en este piso.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p style={{ color: '#666' }}>Este módulo no tiene pisos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailScreen;

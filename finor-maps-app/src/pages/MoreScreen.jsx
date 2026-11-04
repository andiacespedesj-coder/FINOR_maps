import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, ChevronDown, ChevronRight, Info, MessageSquare, RefreshCcw } from 'lucide-react';
import { clearApiCache } from '../services/httpClient';
import './MoreScreen.css';

export default function MoreScreen() {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);

  const refreshCampusData = () => {
    clearApiCache();
    window.location.replace('/');
  };

  return (
    <main className="more-screen">
      <header className="more-header"><h1>Más opciones</h1></header>

      <section className="more-list" aria-label="Información y opciones">
        <button className="more-list-item more-transport" onClick={() => navigate('/transport')}>
          <span className="more-icon-box"><Bus size={22} /></span>
          <span className="more-text"><strong>Rutas de transporte</strong><small>Líneas y paradas cercanas a la FINOR</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>
        <button className="more-list-item more-report" onClick={() => navigate('/report')}>
          <span className="more-icon-box"><MessageSquare size={22} /></span>
          <span className="more-text"><strong>Reportar un problema</strong><small>Avísanos si falta un lugar o hay un error</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>

        <div className="more-list-item more-about">
          <button className="more-about-trigger" aria-expanded={aboutOpen} onClick={() => setAboutOpen(!aboutOpen)}>
            <span className="more-icon-box"><Info size={22} /></span>
            <span className="more-text"><strong>Acerca de FINOR Maps</strong><small>Conoce el proyecto</small></span>
            <ChevronDown className={aboutOpen ? 'more-arrow is-open' : 'more-arrow'} size={20} />
          </button>
          {aboutOpen && <div className="more-about-content">
            FINOR Maps es un proyecto académico de Ingeniería de Sistemas para explorar los edificios, pisos y ambientes de la Facultad Integral del Norte.
          </div>}
        </div>

        <button className="more-list-item more-refresh" onClick={refreshCampusData}>
          <span className="more-icon-box"><RefreshCcw size={22} /></span>
          <span className="more-text"><strong>Actualizar datos del campus</strong><small>Vuelve a cargar la información publicada</small></span>
        </button>
      </section>

      <footer className="more-footer">Desarrollado para la Facultad Integral del Norte · UAGRM</footer>
    </main>
  );
}

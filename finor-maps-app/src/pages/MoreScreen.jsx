import { useNavigate } from 'react-router-dom';
import { Bus, ChevronRight, Info, MessageSquare, RefreshCcw, UsersRound } from 'lucide-react';
import { clearApiCache } from '../services/httpClient';
import './MoreScreen.css';

export default function MoreScreen() {
  const navigate = useNavigate();

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
          <span className="more-text"><strong>Rutas de transporte</strong><small>Recorridos de las líneas cercanas a FINOR</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>
        <button className="more-list-item more-report" onClick={() => navigate('/report')}>
          <span className="more-icon-box"><MessageSquare size={22} /></span>
          <span className="more-text"><strong>Reportar un problema</strong><small>Avísanos si falta un lugar o hay un error</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>

        <button className="more-list-item more-navigation" onClick={() => navigate('/more/authorities')}>
          <span className="more-icon-box"><UsersRound size={22} /></span>
          <span className="more-text"><strong>Autoridades de FINOR</strong><small>Decano y Vicedecano</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>

        <button className="more-list-item more-navigation" onClick={() => navigate('/more/about')}>
          <span className="more-icon-box"><Info size={22} /></span>
          <span className="more-text"><strong>Acerca de FINOR Maps</strong><small>Conoce el proyecto</small></span>
          <ChevronRight className="more-arrow" size={20} />
        </button>

        <button className="more-list-item more-refresh" onClick={refreshCampusData}>
          <span className="more-icon-box"><RefreshCcw size={22} /></span>
          <span className="more-text"><strong>Actualizar datos del campus</strong><small>Vuelve a cargar la información publicada</small></span>
        </button>
      </section>

      <footer className="more-footer">Desarrollado para la Facultad Integral del Norte · UAGRM</footer>
    </main>
  );
}

import { Phone, Bus, MessageSquare, Info, ChevronRight } from 'lucide-react';
import './MoreScreen.css';

const moreOptions = [
  { id: 1, title: 'Directorio de Contactos', subtitle: 'Teléfonos de carreras y emergencias', icon: <Phone />, link: '#' },
  { id: 2, title: 'Rutas de Transporte', subtitle: 'Micros y trufis que llegan a la FINOR', icon: <Bus />, link: '#' },
  { id: 3, title: 'Reportar un Problema', subtitle: '¿Falta algún aula o hay un error?', icon: <MessageSquare />, link: '#' },
  { id: 4, title: 'Acerca de FINOR Maps', subtitle: 'Versión 1.0.0', icon: <Info />, link: '#' },
];

const MoreScreen = () => {
  return (
    <div className="more-screen">
      <header className="more-header">
        <h2>Más opciones</h2>
      </header>

      <div className="more-list">
        {moreOptions.map(option => (
          <div key={option.id} className="more-list-item" onClick={() => console.log('Click en', option.title)}>
            <div className="more-icon-box">
              {option.icon}
            </div>
            <div className="more-text">
              <h4>{option.title}</h4>
              <p>{option.subtitle}</p>
            </div>
            <ChevronRight className="more-arrow" size={20} />
          </div>
        ))}
      </div>
      
      <div className="more-footer">
        <p>Desarrollado para la Facultad Integral del Norte UAGRM</p>
      </div>
    </div>
  );
};

export default MoreScreen;

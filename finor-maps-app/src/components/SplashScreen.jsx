import finorLogo from '../assets/finor-logo.png';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="splash-screen" role="status" aria-live="polite" aria-label="Iniciando FINOR Maps">
      <div className="splash-content">
        <img
          className="splash-finor-logo"
          src={finorLogo}
          alt="Escudo de la Facultad Integral del Norte, FINOR Montero"
        />
        <div className="splash-divider" aria-hidden="true" />
        <h1>FINOR Maps</h1>
        <p>Facultad Integral del Norte</p>
      </div>
      <div className="splash-loading" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

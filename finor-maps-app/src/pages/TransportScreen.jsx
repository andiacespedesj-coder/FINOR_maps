import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { fetchTransportDirectory } from '../services/transportApi';
import { routeForLine } from '../services/transportRoutes';
import './TransportScreen.css';

export default function TransportScreen() {
  const navigate = useNavigate();
  const [directory, setDirectory] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTransportDirectory().then((result) => { if (active) setDirectory(result); });
    return () => { active = false; };
  }, []);

  const lines = directory?.lines || [];

  return (
    <main className="transport-screen">
      <header className="transport-header">
        <button className="transport-back" onClick={() => navigate('/more')} aria-label="Volver a información"><ArrowLeft size={21} /></button>
        <span>FINOR MAPS · INFORMACIÓN</span>
        <h1>Transporte cercano</h1>
        <p>Conoce las líneas que llegan a la zona de la facultad.</p>
      </header>

      <section className="transport-content" aria-label="Líneas de transporte">
        {!directory && <p className="transport-loading">Cargando líneas de transporte…</p>}
        {directory && lines.length === 0 && <p className="transport-empty">Todavía no hay líneas de transporte publicadas.</p>}

        <div className="transport-lines">
          {lines.map((line) => {
            const route = routeForLine(line);
            return <button key={line.id} className="transport-line" disabled={!route} onClick={() => navigate(`/transport/${route.id}`)}>
            <span className="transport-line-number">{line.numero}</span>
            <span className="transport-line-copy"><strong>Línea {line.numero}</strong><small>{line.asociacion}</small>{line.horario && <small>Horario: {line.horario}</small>}<span>{route ? route.detail : 'Recorrido aún no disponible'}</span></span>
            {route && <ChevronRight className="transport-line-arrow" size={20} aria-hidden="true" />}
          </button>})}
        </div>

        {directory?.provisional && <p className="transport-note">Información provisional.</p>}
      </section>
    </main>
  );
}

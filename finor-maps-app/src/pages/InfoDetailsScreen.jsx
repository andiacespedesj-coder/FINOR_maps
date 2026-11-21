import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { fetchFacultyAuthorities } from '../services/catalogApi';
import './InfoDetailsScreen.css';

const creators = [
  'Jose Armando Andia Cespedes',
  'Alexander Mamani Quispe',
  'Joaquin Aguilar Sipe',
  'Richard Eduardo Gonzales Lazarte',
  'Santiago Ramirez Ramos',
];

function InfoPage({ title, children }) {
  const navigate = useNavigate();
  return <main className="info-details-screen">
    <header className="info-details-header">
      <button onClick={() => navigate('/more')} aria-label="Volver a más opciones"><ArrowLeft size={22} /></button>
      <div><span>FINOR MAPS · INFORMACIÓN</span><h1>{title}</h1></div>
    </header>
    <div className="info-details-content">{children}</div>
  </main>;
}

export function AuthoritiesScreen() {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchFacultyAuthorities()
      .then((items) => { if (active) setResult({ attempt, authorities: Array.isArray(items) ? items : items?.results || [] }); })
      .catch(() => { if (active) setResult({ attempt, error: true }); });
    return () => { active = false; };
  }, [attempt]);

  const current = result?.attempt === attempt ? result : null;
  return <InfoPage title="Autoridades de FINOR">
    {!current && <p className="info-details-state" role="status">Cargando autoridades…</p>}
    {current?.error && <div className="info-details-state" role="alert"><p>No se pudo cargar la información.</p><button onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></div>}
    {current?.authorities?.length === 0 && <p className="info-details-state">Aún no hay autoridades registradas.</p>}
    {current?.authorities?.map((authority) => <article className="info-authority-card" key={authority.id}>
      <span className="info-details-icon"><UsersRound size={22} /></span>
      <div><span className="info-authority-role">{authority.cargo === 'DECANO' ? 'Decano(a)' : 'Vicedecano(a)'}</span>
        <h2>{authority.nombre}</h2>
        {authority.horario_atencion && <p>Atención: {authority.horario_atencion}</p>}
      </div>
    </article>)}
  </InfoPage>;
}

export function AboutScreen() {
  return <InfoPage title="Acerca de FINOR Maps">
    <section className="info-about-card">
      <div className="info-about-heading">
        <div><span>PROYECTO ACADÉMICO</span><h2>FINOR Maps</h2></div>
        <span className="info-version">Versión {__ANDROID_VERSION__}</span>
      </div>
      <p>FINOR Maps es un proyecto académico de Ingeniería de Sistemas para explorar los edificios, pisos y ambientes de la Facultad Integral del Norte.</p>
    </section>
    <section className="info-creators-card">
      <h2>Equipo creador</h2>
      <ul>{creators.map((name) => <li key={name}>{name}</li>)}</ul>
    </section>
  </InfoPage>;
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Mail, MessageSquareWarning } from 'lucide-react';
import { buildReport, openReportEmail, REPORT_EMAIL, REPORT_TYPES } from '../services/reporting';
import './ReportScreen.css';

const messages = {
  prepared: 'Revisa el mensaje en tu aplicación de correo y pulsa Enviar. Puedes adjuntar una foto antes de enviarlo.',
  unavailable: 'No se encontró una aplicación de correo. Copia el reporte y envíalo desde tu correo habitual.',
  copied: 'Reporte copiado. Envíalo a la dirección indicada desde tu correo.',
  copyError: 'No se pudo copiar automáticamente. Mantén pulsado el texto para copiarlo manualmente.',
  incomplete: 'Describe el problema con al menos 10 caracteres.',
};

export default function ReportScreen() {
  const navigate = useNavigate();
  const [type, setType] = useState(REPORT_TYPES[0]);
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const report = buildReport({ type, place, description });

  const validate = () => {
    if (description.trim().length >= 10) return true;
    setStatus('incomplete');
    return false;
  };

  const handleEmail = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      const opened = await openReportEmail(report.mailto);
      setStatus(opened ? 'prepared' : 'unavailable');
    } catch {
      setStatus('unavailable');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!validate()) return;
    try {
      await navigator.clipboard.writeText(`Para: ${REPORT_EMAIL}\nAsunto: ${report.subject}\n\n${report.body}`);
      setStatus('copied');
    } catch {
      setStatus('copyError');
    }
  };

  return (
    <main className="report-screen">
      <header className="report-header">
        <button className="report-back" onClick={() => navigate('/more')} aria-label="Volver a información"><ArrowLeft size={21} /></button>
        <span>FINOR MAPS · INFORMACIÓN</span>
        <h1>Reportar un problema</h1>
        <p>Ayúdanos a corregir lugares, datos o rutas del campus.</p>
      </header>

      <form className="report-form" onSubmit={handleEmail}>
        <div className="report-intro"><MessageSquareWarning size={21} /><p>Cuéntanos qué encontraste. Prepararemos un correo para el equipo de FINOR Maps.</p></div>

        <label htmlFor="report-type">Tipo de problema</label>
        <select id="report-type" value={type} onChange={(event) => { setType(event.target.value); setStatus(''); }}>
          {REPORT_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>

        <label htmlFor="report-place">Lugar o referencia <span>(opcional)</span></label>
        <input id="report-place" type="text" value={place} maxLength={100} placeholder="Ej.: Módulo 1, Piso 2, Aula 203" onChange={(event) => { setPlace(event.target.value); setStatus(''); }} />

        <label htmlFor="report-description">¿Qué sucede?</label>
        <textarea id="report-description" value={description} maxLength={800} rows={6} placeholder="Describe el error y cómo podemos identificarlo…" onChange={(event) => { setDescription(event.target.value); setStatus(''); }} required />

        {status && <p className={`report-status${status === 'prepared' || status === 'copied' ? ' success' : ''}`} role="status">{messages[status]}</p>}
        {status === 'copyError' && <pre className="report-preview">{`Para: ${REPORT_EMAIL}\nAsunto: ${report.subject}\n\n${report.body}`}</pre>}

        <button className="report-send" type="submit" disabled={sending}><Mail size={19} />{sending ? 'Abriendo correo…' : 'Preparar correo'}</button>
        <button className="report-copy" type="button" onClick={handleCopy}><Copy size={18} />Copiar reporte</button>
      </form>
    </main>
  );
}

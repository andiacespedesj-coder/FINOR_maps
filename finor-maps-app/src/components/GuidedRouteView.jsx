import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CameraOff, Flag, MapPin } from 'lucide-react';
import { positionOnContainedImage } from '../services/photoArrows';
import './GuidedRouteView.css';

function DirectionIcon({ direction, size = 29 }) {
  if (direction === 'IZQUIERDA') return <ArrowLeft size={size} />;
  if (direction === 'DERECHA') return <ArrowRight size={size} />;
  if (direction === 'ATRAS' || direction === 'BAJAR') return <ArrowDown size={size} />;
  return <ArrowUp size={size} />;
}

function movementLabel(step) {
  if (step.connectionType === 'GRADA') return 'Usa las gradas';
  if (step.connectionType === 'ASCENSOR') return 'Usa el ascensor';
  if (step.direction === 'IZQUIERDA') return 'Gira a la izquierda';
  if (step.direction === 'DERECHA') return 'Gira a la derecha';
  return 'Sigue de frente';
}

export default function GuidedRouteView({ destination, steps, stepIndex, onStepChange, onArrowSelect, onClose }) {
  const [failedPhoto, setFailedPhoto] = useState('');
  const [photoSize, setPhotoSize] = useState(null);
  const [frameSize, setFrameSize] = useState(null);
  const photoFrameRef = useRef(null);
  const step = steps[stepIndex];
  const photo = step?.photo?.imagen && failedPhoto !== step.photo.imagen ? step.photo : null;
  useEffect(() => {
    const frame = photoFrameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [photo?.imagen]);
  if (!step) return null;

  const isLast = stepIndex === steps.length - 1;
  const arrows = (step.arrows || []).map((arrow) => ({
    ...arrow,
    point: photoSize?.url === photo?.imagen
      ? positionOnContainedImage(arrow.posicion_x, arrow.posicion_y, photoSize, frameSize)
      : null,
  })).filter((arrow) => arrow.point);
  const nextPoint = arrows.find((arrow) => arrow.recommended)?.targetName;

  return <main className="guided-route-screen">
    <section className={`guided-route-scene${photo ? ' has-photo' : ''}`} aria-label={`Referencia visual de ${step.reference || step.title}`}>
      {photo
        ? <div className="guided-route-photo-frame" ref={photoFrameRef}><img className="guided-route-photo-backdrop" src={photo.imagen} alt="" aria-hidden="true" /><img className="guided-route-photo-main" src={photo.imagen} alt={`Vista de ${step.reference || step.title}`} onLoad={(event) => setPhotoSize({ url: photo.imagen, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setFailedPhoto(photo.imagen)} /></div>
        : <div className="guided-route-no-photo"><CameraOff size={35} /><strong>Sin fotografía de este punto</strong><span>Usa la indicación escrita y comprueba las señales del campus.</span></div>}
      <div className="guided-route-scene-shade" aria-hidden="true" />
      {photo && arrows.length > 0 && <div className="guided-route-hotspots" aria-label="Flechas para explorar el recorrido">
        {arrows.map((arrow) => <button key={arrow.id} type="button" className={`guided-route-hotspot${arrow.recommended ? ' is-recommended' : ''}`} style={{ left: arrow.point.left, top: arrow.point.top }} onClick={() => onArrowSelect?.(arrow)} aria-label={arrow.etiqueta || `Ir a ${arrow.targetName || 'otro punto'}`} title={arrow.etiqueta || arrow.targetName}><DirectionIcon direction={arrow.direccion} size={25} /></button>)}
      </div>}

      <header className="guided-route-header">
        <button onClick={onClose} aria-label="Cerrar guía y volver al resumen"><ArrowLeft size={22} /></button>
        <div><span>DESTINO</span><strong>{destination}</strong></div>
        <span className="guided-route-counter" aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}>{stepIndex + 1}<small>/{steps.length}</small></span>
      </header>

      <div className="guided-route-scene-bottom">
        <div className="guided-route-location"><MapPin size={16} /><span>{step.reference || step.title}</span></div>
        {!isLast && arrows.length === 0 && <button className="guided-route-photo-arrow" type="button" onClick={() => onStepChange(stepIndex + 1)} aria-label="Ir al siguiente punto"><DirectionIcon direction={step.direction} size={25} /></button>}
      </div>
    </section>

    <footer className="guided-route-footer" aria-live="polite">
      <div className="guided-route-footer-summary">
        <span className={`guided-route-summary-icon${isLast ? ' is-destination' : ''}`}>{isLast ? <Flag size={22} /> : <DirectionIcon direction={step.direction} size={23} />}</span>
        <div><small>{isLast ? 'RECORRIDO COMPLETADO' : arrows.length ? 'SIGUIENTE PUNTO' : `PASO ${stepIndex + 1} DE ${steps.length}`}</small><strong>{isLast ? 'Llegaste a tu destino' : arrows.length ? nextPoint || 'Elige una flecha' : movementLabel(step)}</strong></div>
      </div>
      {!isLast && arrows.length === 0 && <p className="guided-route-fallback">{step.photo?.instruccion?.trim() || step.instruction}</p>}
      {isLast && <button className="guided-route-finish" type="button" onClick={onClose}>Terminar</button>}
    </footer>
  </main>;
}
